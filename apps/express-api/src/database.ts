import dotenv from 'dotenv';
import { Pool, types } from 'pg';
import { isEmpty, omit } from 'lodash';

// load the local `.env` file
dotenv.config();

const {
  POSTGRES_DEFAULT_ENV,
  POSTGRES_HOST,
  POSTGRES_USER,
  POSTGRES_DB,
  POSTGRES_TEST_DB,
  POSTGRES_PASSWORD,
  NODE_ENV,
} = process.env;

const options = {
  host: POSTGRES_HOST,
  database: POSTGRES_DB,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  //max: 32, // max pool size
  //maxuses: 200, // max # times a connection can be used before it is replaced.
};

if (POSTGRES_DEFAULT_ENV === 'test' || NODE_ENV === 'test') {
  options.database = POSTGRES_TEST_DB;
}

if (
  isEmpty(options.host) ||
  isEmpty(options.database) ||
  isEmpty(options.user) ||
  isEmpty(options.password)
) {
  throw new Error('DB Connection not properly setup in `.env`');
}

console.debug('db connection:', omit(options, ['password']));

// This assures that sql queries interpret BigInt id columns as integer and not string
types.setTypeParser(types.builtins.INT8, parseInt);

export const pool = new Pool(options);

export const dbStats = {
  acquired: 0,
  released: 0,
  clientsCheckedOut: 0,
  connectionCount: 0,
  removed: 0,
};

pool.on('acquire', (/*client*/) => {
  dbStats.clientsCheckedOut++;
  dbStats.acquired++;
  if (dbStats.clientsCheckedOut > 10) {
    console.debug('db clients checked out+:', dbStats.clientsCheckedOut);
  }
});

pool.on('release', (/*err, client*/) => {
  dbStats.clientsCheckedOut--;
  dbStats.released++;
  if (dbStats.clientsCheckedOut > 10) {
    console.debug('db clients checked out-:', dbStats.clientsCheckedOut);
  }
});

pool.on('connect', () => {
  dbStats.connectionCount++;
  if (dbStats.connectionCount > 10) {
    console.debug('db new client connected+:', dbStats.connectionCount);
  }
});

pool.on('remove', (/*client*/) => {
  dbStats.removed++;

  //console.debug('db client removed from pool-:', dbStats.removed);
});

// pool.on('end', () => {
//   console.log('Pool has been shut down');
// });

pool.on('error', (error /*,client*/) => {
  console.error('######## Postgres Pool error:\n', error);
});
