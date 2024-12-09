import { omit, isEmpty, isNumber, isNull, isDate, isUndefined } from 'lodash';
import { pool, dbStats } from '../database';
import { hashPassword, verifyPassword } from '../utilities/securityTools';

export type User = {
  id?: number;
  username: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  password_digest?: string;
  last_login_date?: Date;
};

export class UserStore {
  //
  sanitizeUser(user: User): User {
    return omit(user, ['id', 'password']);
  }
  tokenPayload(user: User): User {
    return omit(user, ['password']);
  }

  async listUsers(): Promise<User[]> {
    const sql = `SELECT * FROM users;`;
    // const conn = await pool.connect();

    try {
      const results = await pool.query(sql);
      //conn.release();
      return results.rows;
    } catch (err) {
      console.error('trying to list all users', err);
      throw err;
    }

    return [{} as User];
  }

  async createUser(user: User): Promise<User> {
    //console.log("create user", user);

    if (isEmpty(user.username) || isNull(user.username)) {
      throw new Error(`username cannot be empty '${user.username}'`);
    }
    if (
      isEmpty(user.password) ||
      isNull(user.password) ||
      (user.password as string).length < 8
    ) {
      throw new Error(
        `password must be at least 8 char in length: [${user.password}]`
      );
    }

    // const conn = await pool.connect();

    const existing = await pool.query(
      `SELECT * FROM users WHERE username=($1);`,
      [user.username]
    );
    if (existing.rows.length > 0) {
      throw new Error(`[${user.username}] username already exists`);
    }

    user.password_digest = hashPassword(user.password as string);
    user.last_login_date = new Date();

    const placeHolders: string[] = [];
    const setList: string[] = [];
    const values: (string | number | Date)[] = [];
    let index = 1;
    Object.entries(user).forEach(([key, value]) => {
      if (
        Object.prototype.hasOwnProperty.call(user, key) &&
        key !== 'id' &&
        key !== 'password'
      ) {
        placeHolders.push('$' + index++);
        setList.push(key);
        values.push(isDate(value) ? value.toLocaleString() : value);
      }
    });

    const sql = `INSERT INTO users (${setList.join(
      ', '
    )}) VALUES (${placeHolders.join(', ')}) RETURNING id, ${setList.join(
      ', '
    )};`;

    //console.log(`create user sql:\n'${sql}\nvalues`, values);

    const result = await pool.query(sql, values);
    const newUser = result.rows[0];

    //conn.release();

    return newUser;
  }

  async getUser(user: User): Promise<User> {
    if (isUndefined(user.id) && isEmpty(user.username)) {
      //console.error('throw error in UserStore.getUser');
      throw new Error('Cannot lookup user without either id or username');
    }
    // const conn = await pool.connect();

    try {
      const sql = `SELECT * FROM users WHERE ${
        isUndefined(user.id) ? 'username' : 'id'
      }=($1)`;
      //console.log("get user:", sql, user);
      const results = await pool.query(
        sql,
        isUndefined(user.id) ? [user.username] : [user.id]
      );
      const locatedUser = results.rows[0];
      //conn.release();
      return locatedUser;
    } catch (err) {
      console.error(
        `db server error during user account lookup:\n`,
        dbStats,
        '\n',
        err
      );
    }

    return null;
  }

  async updateUser(user: User): Promise<User | null> {
    //console.log("updateUser():", user);

    if (isEmpty(user.username)) {
      console.error('missing username');
      throw new Error('invalid username for user update');
    }

    // const conn = await pool.connect();

    const origUserAccount = await this.getUser(user);

    if (origUserAccount && !isEmpty(origUserAccount)) {
      //("updating user from", origUserAccount);

      user.id = origUserAccount.id;

      if (!isEmpty(user.password)) {
        user.password_digest = hashPassword(user.password as string);
      }
      //console.log("to", user);

      const clauses: string[] = [];

      user.last_login_date = new Date();

      Object.entries(user).forEach(([key, value]) => {
        if (
          Object.prototype.hasOwnProperty.call(user, key) &&
          key !== 'id' &&
          key !== 'password'
        ) {
          if (isNumber(value)) {
            clauses.push(`${key}=${value}`);
          } else if (!isEmpty(value)) {
            clauses.push(
              `${key}='${isDate(value) ? value.toLocaleString : value}'`
            );
          }
        }
      });
      const fieldValues = clauses.join(', ');
      const sql = `UPDATE users SET ${fieldValues} WHERE id=($1) RETURNING *;`;

      //console.log("update user sql = ", sql);
      try {
        const results = await pool.query(sql, [user.id]);
        const updatedUser: User = results.rows[0];
        //conn.release();
        return updatedUser;
      } catch (err) {
        console.error(`could not update user account`, err);
      }
    }
    return null;
  }

  async authenticate(username: string, password: string): Promise<User | null> {
    try {
      // const conn = await pool.connect();
      const sql = `SELECT id, password_digest FROM users WHERE username=($1);`;
      const result = await pool.query(sql, [username]);

      if (result.rows.length) {
        const user: User = result.rows[0];
        if (verifyPassword(password, user.password_digest as string)) {
          const updateSql = `UPDATE users SET last_login_date='${new Date().toLocaleString()}' WHERE id=($1);`;
          //console.log("login update sql:", updateSql);
          let response = await pool.query(updateSql, [user.id]);
          //console.log("authenticated user account; rows:", response.rows);
          response = await pool.query('SELECT * FROM users WHERE id=($1);', [
            user.id,
          ]);
          const authenticatedUser = response.rows[0];
          //conn.release();
          return authenticatedUser;
        } else {
          console.error(
            'password failed to authenticate',
            username,
            password,
            user.password_digest
          );
        }
      }
    } catch (err) {
      console.error('unable to authenticate user', err);
    }

    return null;
  }

  async deleteUser(id: number): Promise<void> {
    const sql = `DELETE FROM users WHERE id=($1);`;
    try {
      // const conn = await pool.connect();
      await pool.query(sql, [id]);
      //conn.release();
    } catch (err) {
      console.error('failed to delete user by id:', id);
      throw err;
    }
  }
}
