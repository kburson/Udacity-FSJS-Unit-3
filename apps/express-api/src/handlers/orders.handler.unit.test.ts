import * as ordersHandlers from './orders.handler';
import {
  Order,
  OrderStore,
  OrderStatus,
  OrderItem,
} from '../models/OrderStore';
import { User } from '../models/UserStore';
import * as securityTools from '../utilities/securityTools';
import httpMocks from 'node-mocks-http';
import { TOKEN_SECRET } from '../utilities/constants';
import jwt from 'jsonwebtoken';

describe('API Handler: orders', () => {
  let mockedResponse;
  let mockedRequest;

  describe('filterOrdersByStatus', () => {
    beforeEach(() => {
      mockedRequest = httpMocks.createRequest();
      mockedResponse = httpMocks.createResponse();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should TBD', () => {
      expect(true).toBeTruthy();
    });
  });

  describe('createOrder', () => {
    beforeEach(() => {
      mockedRequest = httpMocks.createRequest();
      mockedResponse = httpMocks.createResponse();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return an open order if logged in user is valid', async () => {
      const newOrder: Order = {
        user_id: 1,
        status: OrderStatus.open,
        items: [],
      };

      jest
        .spyOn(OrderStore.prototype, 'getOpenOrder')
        .mockImplementationOnce(() => Promise.resolve(newOrder));
      jest
        .spyOn(securityTools, 'getJwtFromAuthHeader')
        .mockImplementationOnce(() => 'abc');
      jest
        .spyOn(securityTools, 'getTokenPayload')
        .mockImplementationOnce(() => {
          return { id: 1 };
        });

      await ordersHandlers.createOrder(mockedRequest, mockedResponse);

      expect(mockedResponse._getJSONData()).toEqual(newOrder);
    });

    it('should return 401 if no logged in user token', async () => {
      //
      await ordersHandlers.createOrder(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toEqual(401);
    });

    it('should return 401 if logged in user token is not valid', async () => {
      mockedRequest.headers.Authorization = 'abcdefg'; // invalid jwt

      await ordersHandlers.createOrder(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toEqual(401);
    });
  });

  describe('addProductToOrder', () => {
    beforeEach(() => {
      mockedRequest = httpMocks.createRequest();
      mockedResponse = httpMocks.createResponse();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return 400 if missing auth token header', async () => {
      await ordersHandlers.addProductToOrder(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toEqual(400);
    });

    it('should return 401 if invalid auth token header', async () => {
      mockedRequest.headers.authorization = 'Bearer invalid-auth-token';
      await ordersHandlers.addProductToOrder(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toEqual(401);
    });

    it('should return 401 if expired auth token header', async () => {
      const user: User = {
        id: 1,
        username: 'test',
        last_login_date: new Date(),
      };
      const token = jwt.sign(user, TOKEN_SECRET, { expiresIn: '1s' });
      mockedRequest.headers.authorization = `Bearer ${token}`;

      // need to pause 1 second to make sure token has expired.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await ordersHandlers.addProductToOrder(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toEqual(401);
    });

    it('should should return 200 and updated order on success', async () => {
      const openOrder: Order = {
        user_id: 1,
        status: OrderStatus.open,
        items: [],
      };
      const item = { product_id: 4, name: 'shovel', quantity: 2, price: 1500 };
      const updatedOrderItems: OrderItem[] = [item];
      const updatedOrder: Order = {
        ...openOrder,
        items: updatedOrderItems,
      };

      jest
        .spyOn(securityTools, 'getJwtFromAuthHeader')
        .mockImplementationOnce(() => 'abc');
      jest
        .spyOn(securityTools, 'getTokenPayload')
        .mockImplementationOnce(() => {
          return { id: 1 };
        });
      jest
        .spyOn(OrderStore.prototype, 'addProductToActiveOrder')
        .mockImplementationOnce(() => Promise.resolve(updatedOrder));

      mockedRequest.body = {
        product_id: item.product_id,
        quantity: item.quantity,
      };

      await ordersHandlers.addProductToOrder(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toEqual(200);

      const order = mockedResponse._getJSONData();
      expect(order).toEqual(updatedOrder);
    });
  });
});
