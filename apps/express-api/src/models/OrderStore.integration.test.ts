import { OrderStore, Order, OrderStatus } from './OrderStore';
import { UserStore, User } from './UserStore';
import { filter, isUndefined } from 'lodash';
import { TestDataService } from '../_test-helpers/testDataService';
import { pool } from '../database';

const store = new OrderStore();
const data = TestDataService.Instance;

beforeAll(async () => {
  console.debug('-- OrderStore: generate test data');
  await data.generateStaticTestData();
  jest.resetAllMocks();
});

afterAll(async () => {
  console.debug('-- OrderStore: delete test data');
  await data.deleteTestData();
  jest.resetAllMocks();
  // jest seems to instantiate an entirely new connection pool for every test suite.
  console.debug('-- Ending the DB connection pool');
  pool.end();
});

describe('Model: OrderStore', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe.only('createUserOrder', () => {
    it('should create a new open order for the given user', async () => {
      const user = data.testData.users[9];

      let order;
      try {
        order = await store.createUserOrder(user.id);

        expect(order.id).toBeGreaterThan(data.testData.orders.length);
        expect(order.status).toEqual(OrderStatus.open);
        expect(order.items).toHaveLength(0);
      } finally {
        if (order) {
          store.deleteOrder(order.id);
        }
      }
    });
  });

  describe('getOpenOrder', () => {
    it('should TBD', () => {
      expect(true).toBeTruthy();
    });
  });

  describe('getOrderItems', () => {
    it('should TBD', () => {
      expect(true).toBeTruthy();
    });
  });

  describe('getOrder', () => {
    it('should TBD', () => {
      expect(true).toBeTruthy();
    });
  });

  describe('authenticate', () => {
    it('should TBD', () => {
      expect(true).toBeTruthy();
    });
  });
});
