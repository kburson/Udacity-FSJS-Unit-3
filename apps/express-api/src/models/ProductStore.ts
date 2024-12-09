import { pool } from '../database';
import { isEmpty, isNull, isNumber, isUndefined, omit } from 'lodash';

export type Product = {
  id?: number;
  name: string;
  price: number;
  category?: string; // TODO - should we constrain this to a lookup table ?
};

export class ProductStore {
  //--

  async createProduct(product: Product): Promise<Product> {
    // first look for any product with the same name
    const productClone: Product = { price: 0, ...omit(product, ['price']) }; // we do not want to filter on price
    const items = await this.filterProducts(productClone);
    if (!isUndefined(items) && !isEmpty(items)) {
      console.log(
        `product already created.  Perhaps you want to update product with `,
        product
      );
      return items[0];
    }

    // make sure any floats or currency formats are converted to integer (pennies);
    if (Math.trunc(product.price) != product.price) {
      product.price = Math.trunc(100 * product.price);
    }

    const keys = Object.keys(product);
    const placeholders: string[] = [];
    const values: (string | number)[] = [];

    keys.forEach((key, index) => {
      const value = product[key as keyof Product];
      if (
        Object.prototype.hasOwnProperty.call(product, key) &&
        !isUndefined(value) &&
        !isNull(value)
      ) {
        values.push(value);
        placeholders.push(`($${index + 1})`);
      }
    });

    const sql = `INSERT INTO products (${keys.join(
      ', '
    )}) VALUES ( ${placeholders.join(',')}) RETURNING *;`;

    //console.log(`createProduct`, sql);
    try {
      // const conn = await pool.connect();
      const results = await pool.query(sql, values);
      // conn.release();
      return results.rows[0];
    } catch (err) {
      console.error('failed to create new product', product, '\n', err);
      throw err;
    }
  }

  async listProducts(): Promise<Product[]> {
    try {
      // const conn = await pool.connect();
      const sql = `SELECT id, name, price FROM products;`;
      const response = await pool.query(sql);
      // conn.release();

      return response.rows;
    } catch (err) {
      console.error('listProducts', err);
      throw new Error(`db connection failed; GET(*): ${err}`);
    }
  }

  async filterProducts(product: Product): Promise<Product[]> {
    const clauses = [];
    if (!isEmpty(product.name)) {
      clauses.push(`name LIKE '%${product.name}%'`);
    }
    if (!isEmpty(product.category)) {
      clauses.push(`category LIKE '%${product.category}%'`);
    }
    if (isNumber(product.price) && product.price > 0) {
      clauses.push(`price=(${product.price})`);
    }

    const sql = `SELECT * FROM products WHERE ${clauses.join(' AND ')};`;
    //console.log("searchProduct", sql);
    try {
      // const conn = await pool.connect();
      const results = await pool.query(sql);
      // conn.release();
      return results.rows;
    } catch (err) {
      console.error('failed when looking up product', product, '\n', err);
      throw err;
    }
  }

  async getProduct(id: number): Promise<Product> {
    const sql = `SELECT * FROM products WHERE id=($1);`;

    try {
      //const conn = await pool.connect();
      const results = await pool.query(sql, [id]);
      //conn.release();
      return results.rows[0];
    } catch (err) {
      console.error('failed when looking up product', id, '\n', err);
      throw err;
    }
  }

  async getMostPopular(
    limit = 0,
    category?: string
  ): Promise<
    { product_id: number; order_count: number; item_count: number }[]
  > {
    //console.log("getMostPopular", limit, category);

    const sql =
      `SELECT product_id, products.name, COUNT(*) as order_count, SUM(quantity) as item_count ` +
      `FROM orders_products INNER JOIN products ON products.id = orders_products.product_id ` +
      (!isEmpty(category) ? `WHERE products.category = '${category}' ` : '') +
      `GROUP BY product_id, products.name ORDER BY order_count DESC` +
      (limit > 0 ? ` LIMIT ${limit}` : '') +
      ';';

    //console.log("fetch popular products with this\n", sql);
    try {
      // create or re-use db client for queries in this method
      //const conn = await pool.connect();
      const results = await pool.query(sql);
      //conn.release();
      return results.rows;
    } catch (err) {
      console.error(`error fetch popular ordered products`);
      throw err;
    }
  }

  async deleteProduct(id: number): Promise<void> {
    // create or re-use db client for queries in this method
    //const conn = await pool.connect();

    const sql = `DELETE FROM products WHERE id=($1);`;
    try {
      await pool.query(sql, [id]);
      // conn.release();
    } catch (err) {
      console.error(`error deleting products ${id}`);
      throw err;
    }
  }
}
