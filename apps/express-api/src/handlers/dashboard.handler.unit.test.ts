import * as dashboardHandlers from './dashboard.handler';
import { UserOrder, Dashboard } from '../services/dashboard.service';
import httpMocks from 'node-mocks-http';

describe('API Handler: dashboard', () => {
  let mockedResponse;
  let mockedRequest;

  describe('userOrders', () => {
    beforeEach(() => {
      mockedRequest = httpMocks.createRequest();
      mockedResponse = httpMocks.createResponse();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return list of all user orders, along with user identity', async () => {
      const userOrders: UserOrder[] = [
        {
          user_id: 1,
          order_id: 1,
          username: 'test1',
          first_name: 'test',
          last_name: 'test',
        },
        {
          user_id: 2,
          order_id: 2,
          username: 'test2',
          first_name: 'test',
          last_name: 'test',
        },
        {
          user_id: 3,
          order_id: 3,
          username: 'test3',
          first_name: 'test',
          last_name: 'test',
        },
      ];
      jest
        .spyOn(Dashboard.prototype, 'usersWithOrders')
        .mockResolvedValue(userOrders);

      await dashboardHandlers.userOrders(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toEqual(200);
      const data = mockedResponse._getJSONData();
      expect(data).toEqual(userOrders);
    });
  });

  describe('productOrders', () => {
    beforeEach(() => {
      mockedRequest = httpMocks.createRequest();
      mockedResponse = httpMocks.createResponse();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return list of products with order counts and total product counts', async () => {
      const orders: {
        product_id: number;
        name: string;
        order_count: number;
        order_qty: number;
      }[] = [
        { product_id: 1, name: 'shovel', order_count: 2, order_qty: 5 },
        { product_id: 2, name: 'compost', order_count: 4, order_qty: 25 },
        { product_id: 3, name: 'bench', order_count: 1, order_qty: 1 },
      ];
      jest
        .spyOn(Dashboard.prototype, 'productOrders')
        .mockResolvedValue(orders);

      await dashboardHandlers.productOrders(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toEqual(200);

      const data = mockedResponse._getJSONData();
      expect(data).toEqual(orders);
    });
  });
});
