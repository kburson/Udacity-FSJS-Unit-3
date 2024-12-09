import { User, UserStore } from '../models/UserStore';
import { Product, ProductStore } from '../models/ProductStore';
import { Order, OrderStore, OrderStatus } from '../models/OrderStore';
import { dbStats, pool } from '../database';
import { filter, find, map, reduce } from 'lodash';

export enum productNames {
  shovel = 'shovel',
  saw = 'saw',
  hammer = 'hammer',
  Light_Switch = 'Light Switch',
  Romex = '12/3 NMB Romex',
  compost = 'compost',
  bark = 'decorative bark',
  weed_killer = 'weed killer',
  paint = 'Glidden paint, 1 gal',
  paint_brush = 'paint brush',
}

export enum productCategories {
  tools = 'tools',
  garden = 'garden',
  hardware = 'hardware',
  electric = 'electric',
  plumbing = 'plumbing',
  paint = 'paint',
  decoration = 'decoration',
  appliances = 'appliances',
  lumber = 'lumber',
  flooring = 'flooring',
}

const top10Products = [
  {
    name: productNames.shovel,
    price: 1595,
    category: productCategories.garden,
  },
  {
    name: productNames.saw,
    price: 1999,
    category: productCategories.tools,
  },
  {
    name: productNames.hammer,
    price: 2195,
    category: productCategories.tools,
  },
  {
    name: productNames.Light_Switch,
    price: 2995,
    category: productCategories.electric,
  },
  {
    name: productNames.Romex,
    price: 5895,
    category: productCategories.electric,
  },
  {
    name: productNames.compost,
    price: 1295,
    category: productCategories.garden,
  },
  {
    name: productNames.bark,
    price: 995,
    category: productCategories.garden,
  },
  {
    name: productNames.weed_killer,
    price: 2195,
    category: productCategories.garden,
  },
  {
    name: productNames.paint,
    price: 3595,
    category: productCategories.paint,
  },
  {
    name: productNames.paint_brush,
    price: 1195,
    category: productCategories.paint,
  },
];

export class TestDataService {
  private static _instance: TestDataService;

  private _productStore: ProductStore;
  private _orderStore: OrderStore;
  private _userStore: UserStore;

  private _dataGeneratorCycles = 0;

  private _expectedRowCounts = {
    users: 10,
    products: 10,
    orders: {
      open: 6,
      fulfilled: 10,
      total: 16,
    },
    orderItems: 29,
  };

  private _testData: {
    users: User[];
    products: Product[];
    orders: Order[];
  } = {
    users: [],
    products: [],
    orders: [],
  };

  private constructor() {
    this._productStore = new ProductStore();
    this._orderStore = new OrderStore();
    this._userStore = new UserStore();
  }

  public static get Instance(): TestDataService {
    if (!TestDataService._instance) {
      TestDataService._instance = new TestDataService();
    }
    return TestDataService._instance;
  }

  public get testData() {
    return { ...this._testData };
  }

  generateRandomString(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const result = [];
    for (let i = 0; i < length; i++) {
      result.push(chars.charAt(Math.floor(Math.random() * chars.length)));
    }
    return result.join('');
  }

  generateRandomIntInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getRandomCategory() {
    switch (this.generateRandomIntInRange(0, 10)) {
      case 0:
        return productCategories.appliances;
        break;
      case 1:
        return productCategories.decoration;
        break;
      case 2:
        return productCategories.electric;
        break;
      case 3:
        return productCategories.flooring;
        break;
      case 4:
        return productCategories.garden;
        break;
      case 5:
        return productCategories.hardware;
        break;
      case 6:
        return productCategories.lumber;
        break;
      case 7:
        return productCategories.paint;
        break;
      case 8:
        return productCategories.plumbing;
        break;
      default:
        return productCategories.tools;
        break;
    }
  }
  async generateRandomProduct(): Promise<Product> {
    //
    const product: Product = {
      name: this.generateRandomString(this.generateRandomIntInRange(6, 24)),
      price: this.generateRandomIntInRange(500, 100000),
      category: this.getRandomCategory(),
    };

    //const conn = await pool.connect();
    //console.log("generate test product", product);
    const newProduct: Product = await this._productStore.createProduct(product);
    //console.log("current product list", products);
    //conn.release();

    this._testData.products.push(newProduct);

    return newProduct;
  }

  async generateRandomUserAccount(): Promise<User> {
    const user: User = {
      username: this.generateRandomString(this.generateRandomIntInRange(6, 12)),
      password: this.generateRandomString(this.generateRandomIntInRange(8, 12)),
      first_name: this.generateRandomString(
        this.generateRandomIntInRange(4, 12)
      ),
      last_name: this.generateRandomString(
        this.generateRandomIntInRange(6, 16)
      ),
      last_login_date: new Date(),
    };

    //console.debug('generate user\n', user);
    const newUser: User = await this._userStore.createUser(user);

    // we do not save the password on creation, only the password digest,
    // but we need the original password in our tests to login with.
    newUser.password = user.password;

    // console.debug('@@@ Adding user to testData:', newUser.id);
    this._testData.users.push(newUser);

    return newUser;
  }

  async generateStaticProducts() {
    const productClauses: string[] = [];

    this._expectedRowCounts.products = top10Products.length;

    top10Products.forEach((p) =>
      productClauses.push(`('${p.name}',${p.price},'${p.category}')`)
    );

    const sql = `INSERT INTO products (name, price, category) VALUES ${productClauses.join(
      ','
    )} RETURNING *;`;
    //console.debug('### Create products:\n', sql);
    try {
      //const conn = await pool.connect();
      this._testData.products = (await pool.query(sql)).rows;
      //conn.release();

      if (this._testData.products.length !== this._expectedRowCounts.products) {
        throw new Error('Failed to generate test product records');
      }
    } catch (err) {
      console.error('failed to generate test product records:\n', err);
      throw err;
    }

    // console.debug(
    //   `### ${this._testData.products.length} added Products:\n`,
    //   this._testData.products.map((product) => product.id)
    // );
  }

  async generateStaticUsersWithOrders(): Promise<void> {
    //const conn = await pool.connect();

    const orderList = [];
    // Now generate 10 user accounts
    for (let i = 0; i < 10; i++) {
      const user = await this.generateRandomUserAccount();
      // only the first 6 users have active orders, everyone has a fulfilled order.
      if (i <= 5) {
        orderList.push(`(${user.id}, '${OrderStatus.open}')`);
      }
      orderList.push(`(${user.id}, '${OrderStatus.fulfilled}')`);
    }

    // console.debug(
    //   `### ${this._testData.users.length} added users:\n`,
    //   this._testData.users.map((user) => user.id)
    // );

    // now add orders for each user
    const sql = `INSERT INTO orders (user_id, status) VALUES ${orderList.join(
      ','
    )} RETURNING *;`;

    try {
      //console.debug('### Add orders:\n', sql);
      this._testData.orders = (await pool.query(sql)).rows;

      if (this._testData.orders.length !== 16) {
        throw new Error(
          'failed to save the expected number of user account orders.'
        );
      }
      // console.debug(
      //   `### ${this._testData.orders.length} added Orders:\n`,
      //   this._testData.orders
      // );
    } catch (err) {
      console.error('failed to add orders\n', err);
      throw err;
    }
  }

  getProduct(name: string) {
    return find(this._testData.products, { name: name });
  }

  async generateStaticOrderItems(): Promise<void> {
    const activeOrders = filter(this._testData.orders, {
      status: OrderStatus.open,
    });
    const fulfilledOrders = filter(this._testData.orders, {
      status: OrderStatus.fulfilled,
    });

    const orderItemClauses: string[] = [];
    /*
     The resulting popular products array will be:
     product   order_count   item_count

      hammer        6         8
      Light_Switch  5         7
      Romex         4         7
      saw           4         5
      shovel        4         1
      compost       3         10
      paint_brush   3         6
      weed_killer   3         4
      bark          1         1
      paint         1         1

   */
    fulfilledOrders.forEach((order, index) => {
      switch (index) {
        case 0:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.saw).id}, 1)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.hammer).id}, 1)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.Light_Switch).id}, 1)`
          );
          break;
        case 1:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.saw).id}, 1)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.Light_Switch).id}, 1)`
          );
          break;
        case 2:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.paint_brush).id}, 3)`
          );
          break;
        case 3:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.saw).id}, 1)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.hammer).id}, 3)`
          );
          break;
        case 4:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.saw).id}, 1)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.hammer).id}, 1)`
          );
          break;
        case 5:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.Light_Switch).id}, 2)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.Romex).id}, 1)`
          );
          break;
        case 6:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.Light_Switch).id}, 1)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.compost).id}, 6)`
          );
          break;
        case 7:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.Romex).id}, 2)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.compost).id}, 2)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.weed_killer).id}, 2)`
          );
          break;
        case 8:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.weed_killer).id}, 1)`
          ); // weed killer
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.paint_brush).id}, 1)`
          ); // paint brush
          break;
        case 9:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.bark).id}, 1)`
          ); // decorative bark
          break;
        case 10:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.paint).id}, 1)`
          ); // Glidden paint, 1 gal
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.paint_brush).id}, 2)`
          ); // paint brush
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.shovel).id}, 1)`
          ); // shovel
          break;
        default:
          // user 6 did not buy anything
          // user 7 did not buy anything
          // user 8 did not buy anything
          // user 9 did not buy anything
          break;
      }
    });

    activeOrders.forEach((order, index) => {
      switch (index) {
        case 0:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.saw).id}, 1)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.hammer).id}, 1)`
          );
          break;
        case 1:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.hammer).id}, 1)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.compost).id}, 2)`
          );
          break;
        case 2:
          // user 2 has opened a new order but added nothing to it.
          break;
        case 3:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.Light_Switch).id}, 2)`
          );
          break;
        case 4:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.hammer).id}, 1)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.Romex).id}, 2)`
          );
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.weed_killer).id}, 1)`
          );
          break;
        case 5:
          orderItemClauses.push(
            `(${order.id}, ${this.getProduct(productNames.Romex).id}, 2)`
          );
          break;
        default:
          break;
      }
    });

    try {
      const sql = `INSERT INTO orders_products (order_id, product_id, quantity) VALUES ${orderItemClauses.join(
        ','
      )} RETURNING *;`;
      //const conn = await pool.connect();

      //console.log('### Add order products:\n', sql);
      const orderItems = (await pool.query(sql)).rows;
      // console.log(`### ${orderItems.length} added Order items:\n`, orderItems);

      this._testData.orders.forEach(async (order) => {
        order.items = filter(orderItems, { order_id: order.id });
      });
    } catch (err) {
      console.error('failed to add order items', err);
    }
  }

  validateStaticTestData() {
    // testData generated for the Static Test Suite should contain:
    // 10 products
    // 10 users with 16 total orders
    //    - users 0-5 have 2 orders, 1 open, 1 fulfilled
    //    - users 5-9 have 1 order each [ fulfilled ]
    // 15 orders:
    //    user[0]: 3 products ordered
    //    user[1]: 3 products ordered
    //    user[2]: 0 products ordered
    //    user[3]: 3 products ordered
    //    user[4]: 4 products ordered
    //    user[5]: 3 products ordered

    if (this._testData.products.length !== this._expectedRowCounts.products) {
      throw new Error(
        `failed to generate and store test data for ${this._expectedRowCounts.products} products: found ${this._testData.products.length}`
      );
    }
    if (this._testData.users.length !== this._expectedRowCounts.users) {
      throw new Error(
        `failed to generate and store test data for ${this._expectedRowCounts.users} users: found ${this._testData.users.length}`
      );
    }

    if (this._testData.orders.length !== this._expectedRowCounts.orders.total) {
      throw new Error(
        `failed to generate and store test data for ${this._expectedRowCounts.orders.total} user orders: found ${this._testData.orders.length}`
      );
    }

    const activeOrders = filter(this._testData.orders, {
      status: OrderStatus.open,
    });
    if (activeOrders.length !== this._expectedRowCounts.orders.open) {
      throw new Error(
        'failed to generate and store test data for ${this._expectedRowCounts.orders.open} active orders'
      );
    }
    const fulfilledOrders = filter(this._testData.orders, {
      status: OrderStatus.fulfilled,
    });
    if (fulfilledOrders.length !== this._expectedRowCounts.orders.fulfilled) {
      throw new Error(
        'failed to generate and store test data for ${this._expectedRowCounts.orders.fulfilled} fulfilled orders'
      );
    }
  }

  async verifyDbProducts(): Promise<boolean> {
    //const conn = await pool.connect();

    if (this._testData.products.length !== this._expectedRowCounts.products) {
      try {
        const sql = `SELECT * FROM products;`;
        const products = (await pool.query(sql)).rows;
        //conn.release();
        if (products.length === this._expectedRowCounts.products) {
          this._testData.products = products;
          return true;
        }
        return false;
      } catch (err) {
        console.log(
          'Error reloading test product records:',
          dbStats,
          '\n',
          err
        );
        //conn.release();
        return false;
      }
    }

    try {
      const sql = `SELECT COUNT(*) FROM products;`;
      const recordCount = (await pool.query(sql)).rows[0].count;
      //conn.release();

      if (this._testData.products.length === recordCount) {
        return true;
      }
      console.error(
        `********  Test Data has been corrupted  ********\nexpected ${this._expectedRowCounts.products} products, found ${recordCount.length} products in DB.\nDeleting all known test data and recreate from scratch`
      );
    } catch (err) {
      console.log('Error validating test product records', err);
      //conn.release();
    }
    return false;
  }

  async verifyDbUsers(): Promise<boolean> {
    //const conn = await pool.connect();

    if (this._testData.users.length !== this._expectedRowCounts.users) {
      try {
        const sql = `SELECT * FROM users;`;
        const users = (await pool.query(sql)).rows;
        //conn.release();
        if (users.length === this._expectedRowCounts.products) {
          this._testData.users = users;
          return true;
        }
        return false;
      } catch (err) {
        console.log('Error reloading test user records', err);
        //conn.release();
        return false;
      }
    }

    try {
      const sql = `SELECT COUNT(*) FROM users;`;
      const recordCount = (await pool.query(sql)).rows[0].count;
      //conn.release();
      if (this._testData.users.length === recordCount) {
        return true;
      }
      console.error(
        `********  Test Data has been corrupted  ********\n` +
          `Only found ${recordCount} users of ${this._testData.users.length} in DB.\n` +
          `Deleting all known test data and recreate from scratch`
      );
    } catch (err) {
      console.log('Error validating test user records', err);
      //conn.release();
    }

    return false;
  }

  async verifyDbUserOrders(): Promise<boolean> {
    //const conn = await pool.connect();

    if (this._testData.orders.length !== this._expectedRowCounts.orders.total) {
      try {
        const sql = `SELECT * FROM orders;`;
        const orders = (await pool.query(sql)).rows;
        //conn.release();
        if (orders.length === this._expectedRowCounts.products) {
          this._testData.orders = orders;
          return true;
        }
        return false;
      } catch (err) {
        console.log('Error reloading test user order records', err);
        //conn.release();
        return false;
      }
    }

    try {
      const sql = `SELECT status FROM orders;`;
      const rows = (await pool.query(sql)).rows;
      //conn.release();
      if (rows.length !== this._testData.orders.length) {
        return false; // need to generate test data
      }
      const openOrders = filter(rows, OrderStatus.open).length;
      const fulfilledOrders = filter(rows, OrderStatus.fulfilled).length;

      if (
        openOrders === this._expectedRowCounts.orders.open &&
        fulfilledOrders === this._expectedRowCounts.orders.fulfilled
      ) {
        return true;
      }
    } catch (err) {
      console.log('Error validating test user records', err);
      //conn.release();
    }

    return false;
  }

  async reloadUserOrderItemsFromDb(): Promise<number> {
    //const conn = await pool.connect();

    try {
      const sql = `SELECT * FROM orders_products;`;
      const orderItems = (await pool.query(sql)).rows;

      this._testData.orders.forEach((order) => {
        order.items = filter(orderItems, { order_id: order.id });
      });
    } catch (err) {
      console.log('Error validating test user order item records', err);
    }
    //conn.release();

    const orderItemTotal = reduce(
      this._testData.orders,
      (sum, order) => {
        return sum + order.items.length;
      },
      0
    );

    return orderItemTotal;
  }

  async verifyDbOrderItems(): Promise<boolean> {
    const orderItemTotal = reduce(
      this._testData.orders,
      (sum, order) => {
        return sum + order.items.length;
      },
      0
    );

    if (orderItemTotal !== this._expectedRowCounts.orderItems) {
      const orderItemCount = await this.reloadUserOrderItemsFromDb();
      return orderItemCount === this._expectedRowCounts.orderItems;
    }

    //const conn = await pool.connect();
    try {
      const sql = `SELECT COUNT(*) FROM orders_products;`;
      const recordCount = (await pool.query(sql)).rows[0].count;
      //conn.release();

      if (recordCount === orderItemTotal) {
        return true;
      }
      console.error(
        `******** ******** Test Data has been corrupted  ********\nOnly found ${recordCount} orders_products of ${this._expectedRowCounts.orderItems} in DB.\nDeleting all known test data and recreate from scratch`
      );
    } catch (err) {
      //conn.release();
      console.error('Error validating test user records', err);
    }
    return false;
  }

  async verifyTestData(): Promise<boolean> {
    // Verify that all the products have been properly loaded and accounted for.
    try {
      if ((await this.verifyDbProducts()) === false) {
        return false;
      }

      if ((await this.verifyDbUsers()) === false) {
        return false;
      }

      if ((await this.verifyDbUserOrders()) === false) {
        return false;
      }

      if ((await this.verifyDbOrderItems()) === false) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  async generateStaticTestData(): Promise<void> {
    // create or re-use db client for queries in this method

    // first test if there is any data already created
    try {
      if (await this.verifyTestData()) {
        return;
      }
    } catch {
      console.debug('failed to verify test data.');
    }

    await this.deleteTestData();

    await this.generateStaticProducts();
    this._expectedRowCounts.products = this._testData.products.length;

    await this.generateStaticUsersWithOrders();
    this._expectedRowCounts.orders.total = this._testData.orders.length;
    this._expectedRowCounts.orders.open = filter(
      this._testData.orders,
      (order) => order.status === OrderStatus.open
    ).length;
    this._expectedRowCounts.orders.fulfilled = filter(
      this._testData.orders,
      (order) => order.status === OrderStatus.fulfilled
    ).length;

    await this.generateStaticOrderItems();
    this._expectedRowCounts.orderItems = this._testData.orders.reduce(
      (sum, order) => {
        return sum + order.items.length;
      },
      0
    );

    try {
      this.validateStaticTestData();
      this._dataGeneratorCycles++;
      console.debug(
        'generateTestData completed:',
        this._dataGeneratorCycles,
        `\n{\n`,
        `users: ${this._testData.users.length},\n`,
        `products: ${this._testData.products.length},\n`,
        `orders: ${this._testData.orders.length},\n`,
        `orderItems: ${reduce(
          this._testData.orders,
          (sum, order) => {
            return sum + order.items.length;
          },
          0
        )}\n}`
      );
    } catch (err) {
      console.error(
        'failed to generate expected test data suite:\n',
        `{ products: ${this._testData.products.length}, users: ${this._testData.users.length}, orders: ${this._testData.orders.length} }\n`,
        err
      );
      throw err;
    }
  }

  async deleteProducts(list: Product[]): Promise<number> {
    const ids = map(list, 'id');
    const sql = `DELETE FROM products WHERE id IN (${ids.join(',')});`;

    //console.log(`delete list of products\nsql:"${sql}"`);
    try {
      // create or re-use db client for queries in this method
      //const conn = await pool.connect();
      const results = await pool.query(sql);
      //conn.release();
      const deleted = results.rowCount as number;
      return deleted;
    } catch (err) {
      console.error(`error deleting products ${list}`);
      throw err;
    }
  }

  async deleteUsers(list: User[]): Promise<number> {
    let sql;
    //const conn = await pool.connect();

    const userIds = map(list, 'id');
    const orderIds = this._testData.orders.map((order) => {
      if (userIds.includes(order.user_id)) return order.id;
    });

    if (orderIds.length === 0) {
      console.debug('no matching user-orders', userIds, this._testData.orders);
    } else {
      // first delete all user orders_products
      sql = `DELETE FROM orders_products WHERE order_id IN (${orderIds.join(
        ','
      )});`;
      try {
        await pool.query(sql);
      } catch (err) {
        console.error('error deleting product orders', sql, err);
        throw err;
      }
    }

    sql = `DELETE FROM orders WHERE id IN (${orderIds.join(',')});`;
    try {
      await pool.query(sql);
      this._testData.orders = [];
    } catch (err) {
      console.error(`error deleting user orders`, sql, err);
      throw err;
    }

    sql = `DELETE FROM users WHERE id IN (${userIds.join(',')});`;
    try {
      //console.log(`delete list of users\nsql:"${sql}"`);
      const results = await pool.query(sql);
      //conn.release();
      this._testData.users = [];
      return results.rowCount as number;
    } catch (err) {
      console.error(`error deleting users`, sql, err);
      throw err;
    }
  }

  async deleteTestData(): Promise<void> {
    const deletedItems = {
      total: 0,
      products: 0,
      users: 0,
      orders: 0,
      orderItems: 0,
    };

    try {
      const sql = 'DELETE FROM orders_products RETURNING order_id;';
      const rows = (await pool.query(sql)).rows;
      deletedItems.orderItems = rows.length;
      deletedItems.total += deletedItems.orderItems;
    } catch (err) {
      console.debug('error deleting user order items:\n', dbStats, '\n', err);
      throw err;
    }

    try {
      const sql = `DELETE FROM orders RETURNING id;`;
      const deletedOrders = (await pool.query(sql)).rows;
      deletedItems.orders = deletedOrders.length;
      deletedItems.total += deletedItems.orders;
      this._testData.orders = [];
    } catch (err) {
      console.debug('deleteTestData:deleteOrders', err);
      throw err;
    }

    try {
      const sql = `DELETE FROM users RETURNING id;`;
      const deletedRows = (await pool.query(sql)).rows;
      deletedItems.users = deletedRows.length;
      deletedItems.total += deletedItems.users;
      this._testData.users = [];
    } catch (err) {
      console.debug('deleteTestData:deleteUsers', err);
      throw err;
    }

    try {
      const sql = `DELETE FROM products RETURNING id;`;
      const deletedRows = (await pool.query(sql)).rows;
      deletedItems.products = deletedRows.length;
      deletedItems.total += deletedItems.products;
      this._testData.products = [];
    } catch (err) {
      console.debug('deleteTestData:deleteProducts', err);
      throw err;
    }

    if (deletedItems.total > 0) {
      console.log('Test Data Deletion Complete\n', deletedItems);
    }
    return;
  }
}
