import { OrderStore, Order, OrderStatus } from './OrderStore';
import { User } from './UserStore';
import { Product } from './ProductStore';
import { filter, find, isUndefined, map, omit } from 'lodash';
import { TestDataService } from '../_test-helpers/testDataService';
import { pool } from '../database';

const store = new OrderStore();
const testDataService = TestDataService.Instance;

let testData: {
  users: User[];
  products: Product[];
  orders: Order[];
};

async function verifyNoOpenOrders(user_id: number): Promise<boolean> {
  const orders = await pool.query(
    'SELECT * FROM orders WHERE user_id=($1) AND status=($2);',
    [user_id, OrderStatus.open]
  );
  return orders.rows.length === 0;
}

beforeAll(async () => {
  console.debug('-- OrderStore: generate test data');
  await testDataService.generateStaticTestData();
  testData = testDataService.testData;
  jest.resetAllMocks();
});

afterAll(async () => {
  console.debug('-- OrderStore: delete test data');
  await testDataService.deleteTestData();
  jest.resetAllMocks();
  // jest seems to instantiate an entirely new connection pool for every test suite.
  console.debug('-- Ending the DB connection pool');
  pool.end();
});

describe('Model: OrderStore', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createUserOrder', () => {
    it('should create a new open order for the given user', async () => {
      const user = testData.users[9];

      expect(await verifyNoOpenOrders(user.id)).toBeTruthy();

      let newOrder;
      try {
        newOrder = await store.createUserOrder(user.id);

        expect(newOrder.id).toBeGreaterThan(testData.orders.length);
        expect(newOrder.status).toEqual(OrderStatus.open);
        expect(newOrder.items).toHaveLength(0);
      } finally {
        if (newOrder) {
          store.deleteOrder(newOrder.id);
        }
      }
    });
  });

  describe('getOpenOrder', () => {
    it('should get an open order that was previously created', async () => {
      const user = testData.users[1];

      const fetchedOrder = await store.getOpenOrder(user.id);

      expect(fetchedOrder.status).toEqual(OrderStatus.open);
      expect(fetchedOrder.items).toHaveLength(2);
    });

    it('should create a new open order when none are found', async () => {
      const user = testData.users[8];

      expect(await verifyNoOpenOrders(user.id)).toBeTruthy();

      let newOrder;
      try {
        newOrder = await store.getOpenOrder(user.id);

        expect(newOrder.id).toBeGreaterThan(testData.orders.length);
        expect(newOrder.status).toEqual(OrderStatus.open);
        expect(newOrder.items).toHaveLength(0);
      } finally {
        if (newOrder) {
          store.deleteOrder(newOrder.id);
        }
      }
    });
  });

  describe('filterOrders', () => {
    it('should return all orders for given user', async () => {
      const user = testData.users[0];
      const expectedOrders = filter(testData.orders, { user_id: user.id });

      const orders = await store.filterOrders(user.id);

      expect(orders).toHaveLength(2);
      expect(orders[0].id).toEqual(expectedOrders[0].id);
      expect(orders[1].id).toEqual(expectedOrders[1].id);
    });

    it('should return all open orders for given user when status=open is passed in', async () => {
      const user = testData.users[0];
      const expectedOrders = filter(testData.orders, {
        user_id: user.id,
        status: OrderStatus.open,
      });

      const orders = await store.filterOrders(user.id, OrderStatus.open);

      expect(orders).toHaveLength(1);
      expect(orders[0].id).toEqual(expectedOrders[0].id);
      expect(orders[0].status).toEqual(OrderStatus.open);
    });

    it('should return all fulfilled orders for given user  when status=fulfilled is passed in', async () => {
      const user = testData.users[0];
      const expectedOrders = filter(testData.orders, {
        user_id: user.id,
        status: OrderStatus.fulfilled,
      });

      const orders = await store.filterOrders(user.id, OrderStatus.fulfilled);

      expect(orders).toHaveLength(1);
      expect(orders[0].id).toEqual(expectedOrders[0].id);
      expect(orders[0].status).toEqual(OrderStatus.fulfilled);
    });
  });

  describe('getOrderItems', () => {
    it('should return all order items for given order id', async () => {
      const user = testData.users[0];
      const expectedOrder = find(testData.orders, {
        user_id: user.id,
        status: OrderStatus.open,
      });
      expect(expectedOrder.status).toEqual(OrderStatus.open);

      const items = await store.getOrderItems(expectedOrder.id);

      expect(items).toHaveLength(2);
      expect(omit(items[0], ['name', 'price'])).toEqual(expectedOrder.items[0]);
      expect(omit(items[1], ['name', 'price'])).toEqual(expectedOrder.items[1]);
    });
  });

  describe('updateOrderProductQty', () => {
    it('should throw error if order is not open', async () => {
      const user = testData.users[0];
      const order = find(testData.orders, {
        user_id: user.id,
        status: OrderStatus.fulfilled,
      });
      const item = order.items[0];

      let hasThrown = false;
      try {
        await store.updateOrderProductQty(
          item.product_id,
          item.quantity + 1,
          order
        );
      } catch {
        hasThrown = true;
      }

      expect(hasThrown).toBeTruthy();
    });
    it('should update the order item quantity for an open order', async () => {
      const user = testData.users[0];
      const order = find(testData.orders, {
        user_id: user.id,
        status: OrderStatus.open,
      });
      const item = order.items[0];

      try {
        const results = await store.updateOrderProductQty(
          item.product_id,
          item.quantity + 1,
          order
        );

        expect(results.items[0].product_id).toEqual(item.product_id);
        expect(results.items[0].quantity).toEqual(item.quantity + 1);
      } finally {
        const updatedOrder = await store.updateOrderProductQty(
          item.product_id,
          item.quantity,
          order
        );
        expect(updatedOrder.items[0].quantity).toEqual(item.quantity);
      }
    });
  });

  describe('addProductToActiveOrder', () => {
    it('should add a new product to the users open order', async () => {
      const user = testData.users[0];
      const order = find(testData.orders, {
        user_id: user.id,
        status: OrderStatus.open,
      });
      const orderProductIds = map(order.items, (item) => item.product_id);
      const product = find(
        testData.products,
        (p) => orderProductIds.includes(p.id) === false
      );
      const purchasedQty = 2;

      try {
        // METHOD UNDER TEST
        const updatedOrder = await store.addProductToActiveOrder(
          product.id,
          purchasedQty,
          user.id
        );
        expect(updatedOrder.id).toEqual(order.id);
        expect(updatedOrder.items).toHaveLength(order.items.length + 1);
      } finally {
        // CLEANUP
        const results = await pool.query(
          `DELETE FROM orders_products WHERE order_id=($1) AND product_id=($2) RETURNING *;`,
          [order.id, product.id]
        );
        expect(results.rowCount).toEqual(1);
      }
    });

    it('should update quantity for users open order that already has item in cart', async () => {
      const user = testData.users[0];
      const order = find(testData.orders, {
        user_id: user.id,
        status: OrderStatus.open,
      });

      const orderItem = order.items[0];
      const addedQty = 2;

      try {
        // METHOD UNDER TEST
        const updatedOrder = await store.addProductToActiveOrder(
          orderItem.product_id,
          addedQty,
          user.id
        );
        expect(updatedOrder.id).toEqual(order.id);
        expect(updatedOrder.items).toHaveLength(order.items.length);

        const updatedItem = find(updatedOrder.items, {
          product_id: orderItem.product_id,
        });
        expect(updatedItem.quantity).toEqual(orderItem.quantity + addedQty);
      } finally {
        // CLEANUP
        const results = await pool.query(
          `UPDATE orders_products SET quantity=($3) WHERE order_id=($1) AND product_id=($2) RETURNING *;`,
          [order.id, orderItem.product_id, orderItem.quantity]
        );
        console.log('results', results);
        expect(results.rowCount).toEqual(1);
      }
    });
  });

  describe('deleteOrder', () => {
    it('Should delete a user order by id', async () => {
      const user = testData.users[7];
      const orders = filter(testData.orders, { user_id: user.id });

      expect(orders).toHaveLength(1);
      expect(orders[0].status).toEqual(OrderStatus.fulfilled);

      let newOrder: Order;
      let trash;

      try {
        // create and verify new user open order
        const results = await pool.query(
          `INSERT INTO orders (user_id,status) VALUES ($1, $2)  RETURNING *;`,
          [user.id, OrderStatus.open]
        );
        expect(results.rowCount).toEqual(1);
        newOrder = results.rows[0];

        // Now delete the order
        // --- Method Under Test
        await store.deleteOrder(newOrder.id);

        // We should not be able to find this row anymore.
        trash = await pool.query(
          'SELECT * FROM orders WHERE id=($1) AND status=($2);',
          [user.id, OrderStatus.open]
        );
        expect(trash.rowCount).toEqual(0);
      } finally {
        if (isUndefined(trash) && newOrder) {
          // MUST delete the generated order
          const results = await pool.query(
            `DELETE FROM orders WHERE user_id=($1) AND status=($2) RETURNING *;`,
            [user.id, OrderStatus.open]
          );
          expect(results.rowCount).toEqual(1);
          expect(results.rows[0].id).toEqual(newOrder.id);
        }
      }
    });
  });

  describe('deleteOrderItem', () => {
    it('should delete a product from the open order', async () => {
      const user = testData.users[1];

      const orders = filter(testData.orders, {
        user_id: user.id,
        status: OrderStatus.open,
      });
      expect(orders.length).toEqual(1);
      const order = orders[0];
      expect(order.status).toEqual(OrderStatus.open);

      console.log('######  LOOKING FOR A MISSING PRODUCT');

      // add a new order item for us to delete.
      const productIds = map(order.items, (o) => o.product_id);
      const product = find(testData.products, (p) => {
        const has = productIds.includes(p.id);
        console.log(p.id, has);
        return !has;
      });

      await pool.query(
        `INSERT INTO orders_products (order_id, product_id, quantity) VALUES ($1, $2, $3);`,
        [order.id, product.id, 3]
      );

      // now delete the product from the order, same as reducing quantity to 0
      await store.deleteOrderItem(order.id, product.id);

      // and check that the order no longer has that product listed.
      const results = await pool.query(
        'SELECT * FROM orders_products WHERE order_id=($1) and product_id=($2)',
        [order.id, product.id]
      );

      expect(results.rowCount).toEqual(0);
    });

    it('should return false when a given order does not exist', async () => {
      const order_id = 99999;
      const product_id = 99999;

      const results = await store.deleteOrderItem(order_id, product_id);

      expect(results).toBeFalsy();
    });

    it('should return false when a given order is not open', async () => {
      const user = testData.users[1];
      const product_id = 99999;

      const orders = filter(testData.orders, {
        user_id: user.id,
        status: OrderStatus.fulfilled,
      });
      expect(orders.length).toEqual(1);
      const order = orders[0];

      const results = await store.deleteOrderItem(order.id, product_id);

      expect(results).toBeFalsy();
    });
  });
});
