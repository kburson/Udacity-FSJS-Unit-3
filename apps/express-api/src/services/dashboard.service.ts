import { pool } from '../database';
import { filter, find, includes } from 'lodash';

// used as an output format for query results
type OrderItem = {
  product_id: number;
  name: string;
  quantity: number;
};
type Order = {
  order_id: number;
  status: string;
  items: OrderItem[];
};
export type UserOrder = {
  user_id: number;
  username: string;
  orders: [Order];
};

export type FlatOrdersByUser = {
  user_id: number;
  username: string;
  order_id: number;
  status: string;
};

export class Dashboard {
  // Get all users that have made orders
  async usersWithOrders(
    flat = false
  ): Promise<UserOrder[] | FlatOrdersByUser[]> {
    const userOrders: UserOrder[] = [];

    let flatOrderList: FlatOrdersByUser[];

    try {
      const sql =
        `SELECT users.id as user_id, username, orders.id as order_id, orders.status  ` +
        `FROM users  INNER JOIN orders  ON  orders.user_id = users.id;`;

      flatOrderList = (await pool.query(sql)).rows;
    } catch (err) {
      console.error('cannot read user orders from db\n', err);
      return [];
    }

    if (flat) {
      return flatOrderList;
    }

    try {
      flatOrderList.forEach(async (row) => {
        // console.log('processing row: ', row);

        const order: Order = {
          order_id: row.order_id as number,
          status: row.status as string,
          items: [] as OrderItem[],
        };

        console.log('userOrders', userOrders);
        const foundUser = find(userOrders, { user_id: row.user_id });
        // console.log(`found user ${row.user_id},`, foundUser);

        if (foundUser) {
          foundUser.orders.push(order);
        } else {
          const userOrder: UserOrder = {
            user_id: row.user_id,
            username: row.username,
            orders: [order],
          };
          userOrders.push(userOrder);
        }
      });

      // load order items into the order.items array
      const items = (await pool.query(`SELECT * FROM orders_products;`)).rows;

      userOrders.forEach((user) => {
        user.orders.forEach((order) => {
          order.items = filter(items, { order_id: order.order_id });
        });
      });

      console.log(
        '------------------------- collated user orders:\n',
        userOrders
      );

      return userOrders;
    } catch (err) {
      console.error('Dashboard.usersWithOrders:\n', err);
      throw err;
    }

    // Now map this to
  }

  // Get all products that have been selected by users
  async productOrders(
    sortCol: string | null = null,
    sortDir: string | null = null,
    limit = 0
  ): Promise<
    {
      product_id: number;
      name: string;
      order_count: number;
      order_qty: number;
    }[]
  > {
    let sql =
      `SELECT product_id, products.name, COUNT(*) as order_count, SUM(quantity) as order_qty ` +
      `FROM orders_products ` +
      `INNER JOIN products ON products.id = orders_products.product_id ` +
      `GROUP BY product_id, products.name `;

    if (
      includes(
        ['product_id', 'products_name', 'order_count', 'order_qty'],
        sortCol?.toLowerCase()
      ) &&
      includes(['DESC', 'ASC'], sortDir?.toUpperCase())
    ) {
      sql += ` ORDER BY ${sortCol} ${sortDir?.toUpperCase()}`;
    }
    if (limit > 0) {
      sql += ` LIMIT ${limit}`;
    }
    sql += ';';

    //console.log('productOrders: sql; ', sql);

    try {
      // const conn = await pool.connect();
      const results = await pool.query(sql);
      // conn.release();
      const productSalesMetrics: {
        product_id: number;
        name: string;
        order_count: number;
        order_qty: number;
      }[] = results.rows;
      return productSalesMetrics;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
