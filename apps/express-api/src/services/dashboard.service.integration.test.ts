import { Dashboard } from './dashboard.service';
import {
  TestDataService,
  productNames,
} from '../_test-helpers/testDataService';
import { OrderStatus } from '../models/OrderStore';
import { filter } from 'lodash';
import { pool } from '../database';

const testDataService = TestDataService.Instance;

beforeAll(async () => {
  console.debug('-- dashboard: generate test data');
  await testDataService.generateStaticTestData();
});

afterAll(async () => {
  console.debug('-- dashboard: delete test data');
  await testDataService.deleteTestData();
  // jest seems to instantiate an entirely new connection pool for every test suite.
  console.debug('-- Ending the DB connection pool');
  pool.end();
});

describe('Services: dashboard', () => {
  const dashBoard = new Dashboard();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('usersWithOrders', () => {
    it('should return 10 users with 6 open orders and 10 fulfilled orders', async () => {
      // The test data has 10 users, only 5 have orders,
      // each has one open and one fulfilled order (total of 10 orders across all users)
      const results = await dashBoard.usersWithOrders(true);

      //console.log('usersWithOrders: results', results);
      expect(results.length).toEqual(testDataService.testData.orders.length);

      const activeOrders = filter(results, { status: OrderStatus.open });
      expect(activeOrders.length).toEqual(6);

      const fulfilledOrders = filter(results, {
        status: OrderStatus.fulfilled,
      });
      expect(fulfilledOrders.length).toEqual(10);
    });
  });

  describe('productOrders', () => {
    it('should return list of products that have been ordered at least once', async () => {
      const results = await dashBoard.productOrders();

      expect(results.length).toEqual(8);
    });

    it('should return sorted list of popular items limited to top 3', async () => {
      const sortCol = 'order_qty';
      const sortOrder = 'DESC';
      const limit = 3;

      expect(testDataService.testData.products.length).toEqual(10);

      const results = await dashBoard.productOrders(sortCol, sortOrder, limit);

      //console.log(results);
      expect(results.length).toBe(3);

      /*
      name            order_count   order_qty
      --------------- -----------   ---------
      compost           3             10
      hammer            6              8
      12/3 NMB Romex    4              7
      */

      const topProduct: {
        product_id: number;
        name: string;
        order_count: number;
        order_qty: number;
      } = results[0];

      expect(topProduct.order_count).toEqual(3);
      expect(topProduct.order_qty).toEqual(10);
      expect(topProduct.name).toEqual(productNames.compost);
    });
  });
});
