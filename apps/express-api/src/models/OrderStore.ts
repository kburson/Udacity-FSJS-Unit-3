import { pool } from '../database';
import { isUndefined, isEmpty, find } from 'lodash';

export enum OrderStatus {
  open = 'open',
  fulfilled = 'fulfilled',
  cancelled = 'cancelled',
  expired = 'expired',
}

export type OrderItem = {
  order_id?: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id?: number;
  user_id: number;
  status: OrderStatus;
  items: OrderItem[];
};

export class OrderStore {
  // an alias to make the use case more obvious
  async createUserOrder(user_id: number): Promise<Order> {
    const order = await this.getOpenOrder(user_id);
    order.items = [];
    return order;
  }

  // This will either find an active order for the user, or create one,
  // but it will always return an active order for an existing user.
  async getOpenOrder(user_id: number): Promise<Order> {
    //
    // create or re-use db client for queries in this method
    // const conn = await pool.connect();

    // First look for an open order

    const orders: Order[] = await this.filterOrders(user_id, OrderStatus.open);

    if (orders.length > 0) {
      const order = orders[0];
      // This is an existing order, so let's grab any existing order items
      order.items = await this.getOrderItems(order.id as number);
      // conn.release();
      return order;
    }

    // Since we did not find an existing open order we will create a new one
    // try {
    const sql = `INSERT INTO orders (user_id, status) VALUES ($1, $2) RETURNING *;`;
    const results = await pool.query(sql, [user_id, OrderStatus.open]);
    const order: Order = results.rows[0];
    order.items = [];
    return order;
    // } finally {
    //   conn.release();
    // }
  }

  //
  async getOrderItems(order_id: number): Promise<OrderItem[]> {
    // create or re-use db client for queries in this method
    const conn = await pool.connect();
    // try {
    const sql =
      `SELECT order_id, product_id, quantity, name, price ` +
      `FROM orders_products ` +
      `INNER JOIN products ON products.id = orders_products.product_id ` +
      `WHERE order_id=($1);`;
    const response = await conn.query(sql, [order_id]);
    return response.rows;
    // } finally {
    //   conn.release();
    // }
  }

  async filterOrders(user_id: number, status?: string): Promise<Order[]> {
    if (isUndefined(user_id) || user_id <= 0) {
      console.error(
        `cannot look up order status without a logged in user_id`,
        user_id
      );
      throw new Error('missing valid logged in user id');
    }

    const sql = `SELECT * FROM orders WHERE user_id=($1)${
      !isEmpty(status) ? ' AND status=($2)' : ''
    };`;

    const values = isEmpty(status) ? [user_id] : [user_id, status];

    const results = await pool.query(sql, values);

    return results.rows;
  }

  getProductQtyFromOrder(order: Order, product_id: number): number {
    const item = find(order.items, { product_id: product_id });
    return item?.quantity || 0;
  }

  async updateOrderProductQty(
    product_id: number,
    qty: number,
    order: Order
  ): Promise<Order> {
    // first make sure the order is still open.
    const dbOrder = await pool.query(
      `SELECT status FROM orders WHERE id=($1);`,
      [order.id]
    );
    if (dbOrder.rows[0].status !== OrderStatus.open) {
      console.error(
        'cannot update product quantity on a closed or cancelled order'
      );
      throw new Error('invalid order id. Must be an open order');
    }

    let sql = `UPDATE orders_products SET quantity=($3) WHERE order_id=($1) AND product_id=($2);`;
    await pool.query(sql, [order.id, product_id, qty]);

    sql = `SELECT * FROM orders_products WHERE order_id=($1);`;
    const response = await pool.query(sql, [order.id]);
    order.items = response.rows;

    return order;
  }

  async addProductToActiveOrder(
    product_id: number,
    qty: number,
    user_id: number
  ): Promise<Order> {
    // first find or create active order for user.
    const order: Order = await this.getOpenOrder(user_id);

    if (isUndefined(order.items)) {
      order.items = [];
    }

    if (qty <= 0) {
      return order; // cannot add negative qty, try using updateOrderProductQty instead.
    }

    // now check if we already have some of this in our order...
    const quantity = this.getProductQtyFromOrder(order, product_id);

    if (quantity > 0) {
      //console.log(`existing order has ${quantity} of product already`);
      return await this.updateOrderProductQty(
        product_id,
        qty + quantity,
        order
      );
    }

    //console.log(`adding new product row in order for user ${user_id}`);

    // There was no row for this product in the users active order; add product to the active order.
    // try {
    const sql = `INSERT INTO orders_products (order_id, product_id, quantity) VALUES ( $1, $2, $3 ) RETURNING *;`;

    await pool.query(sql, [order.id, product_id, qty]);
    //console.log("order item added:", results.rows[0]);

    order.items = await this.getOrderItems(order.id as number);

    return order;
    // } finally {
    //   conn.release();
    // }
  }

  async deleteOrder(order_id: number): Promise<boolean> {
    // const conn = await pool.connect();
    try {
      const sql = 'DELETE FROM orders WHERE order_id=($1);';
      await pool.query(sql, [order_id]);
    } catch {
      return false;
    }
    return true;
  }

  async deleteOrderItem(
    order_id: number,
    product_id: number
  ): Promise<boolean> {
    try {
      // check if the order is open.
      const orders = await pool.query(
        `SELECT * FROM orders WHERE id=($1) AND status=($2);`,
        [order_id, OrderStatus.open]
      );
      if (orders.rowCount <= 0) {
        return false; // Cannot delete from a closed or fulfilled order.
      }
      const results = await pool.query(
        `DELETE FROM orders_products WHERE order_id=($1) AND product_id=($2) RETURNING *;`,
        [order_id, product_id]
      );
      return results.rowCount === 1;
    } catch (err) {
      console.error(err);
    }
  }
}
