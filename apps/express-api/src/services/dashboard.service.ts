import { pool } from '../database';
import { includes } from 'lodash';

// used as an output format for query results
export type UserOrder = {
  order_id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  status?: string;
};

export class Dashboard {
  // Get all users that have made orders
  async usersWithOrders(): Promise<UserOrder[]> {
    const sql =
      `SELECT   orders.id as order_id, users.id as user_id, username, first_name, last_name, orders.status  ` +
      `FROM users  INNER JOIN orders  ON  orders.user_id = users.id;`;
    try {
      // const conn = await pool.connect();
      const results = await pool.query(sql);
      // conn.release();
      return results.rows as UserOrder[];
    } catch (err) {
      console.error('Dashboard.usersWithOrders:\n', err);
      throw err;
    }
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
