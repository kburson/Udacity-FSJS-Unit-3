import httpMocks from 'node-mocks-http';
import { UserStore, User } from '../models/UserStore';
import * as userHandlers from './users.handler';
import * as securityTools from '../utilities/securityTools';

import { omit } from 'lodash';
// --
const users: User[] = [
  {
    id: 1,
    username: 'user1',
    last_login_date: new Date(),
    password_digest: 'abcdef',
    password: 'password123',
  },
  {
    id: 2,
    username: 'user2',
    last_login_date: new Date(),
    password_digest: 'abcdef',
    password: 'password123',
  },
  {
    id: 3,
    username: 'user3',
    last_login_date: new Date(),
    password_digest: 'abcdef',
    password: 'password123',
  },
  {
    id: 4,
    username: 'user4',
    last_login_date: new Date(),
    password_digest: 'abcdef',
    password: 'password123',
  },
];

describe('API Handler: users', () => {
  let mockRequest;
  let mockResponse;

  describe('listUsers', () => {
    beforeEach(() => {
      mockRequest = httpMocks.createRequest();
      mockResponse = httpMocks.createResponse();
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should return status 200 with a list of user accounts', async () => {
      jest.spyOn(UserStore.prototype, 'listUsers').mockResolvedValue(users);

      mockResponse.json = jest.fn();

      // API Handler users::listUsers will call the UserStore.listUsers()
      // method which has been mocked to return an array of users.
      await userHandlers.listUsers(mockRequest, mockResponse);

      expect(mockResponse.statusCode).toBe(200);
      expect(mockResponse.json).toHaveBeenCalledWith(users);
    });
  });

  describe('createUser', () => {
    beforeEach(() => {
      mockRequest = httpMocks.createRequest();
      mockResponse = httpMocks.createResponse({ req: mockRequest });
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return a newly created user without a password or password_digest property', async () => {
      const mockedJwtString = 'MyMockedJwt';
      jest
        .spyOn(securityTools, 'generateToken')
        .mockReturnValue(mockedJwtString);

      // mock internal dependency to simply return a user account as if it had been created.
      const testUser = users[0];
      jest.spyOn(UserStore.prototype, 'createUser').mockResolvedValue(testUser);

      mockRequest.body = {
        username: testUser.username,
        password: testUser.password,
      } as User;

      await userHandlers.createUser(mockRequest, mockResponse);

      expect(mockResponse.statusCode).toEqual(200);

      expect(mockResponse._headers.authorization).toEqual(
        `Bearer ${mockedJwtString}`,
      );

      const expectedResponseBody = omit(testUser, ['password']);

      const receivedData = mockResponse._getJSONData();
      receivedData.last_login_date = new Date(receivedData.last_login_date);

      expect(receivedData).toEqual(expectedResponseBody);
    });
  });

  describe('loginUser', () => {
    beforeEach(() => {
      mockRequest = httpMocks.createRequest();
      mockResponse = httpMocks.createResponse();
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should return 400 if username is missing', async () => {
      mockRequest.body = { /*username:'BigD',*/ password: 'abcd' };

      await userHandlers.loginUser(mockRequest, mockResponse);

      expect(mockResponse.statusCode).toEqual(400);
    });

    it('should return 400 if password is missing', async () => {
      mockRequest.body = { username: 'BigD' /*, password:'abcd'*/ };

      await userHandlers.loginUser(mockRequest, mockResponse);

      expect(mockResponse.statusCode).toEqual(400);
    });

    it('should authenticate user and add auth token to response header', async () => {
      // mock authenticate -- don't require the db to load user account
      jest
        .spyOn(UserStore.prototype, 'authenticate')
        .mockResolvedValue(users[0]);

      mockRequest.body = { username: users[1].username, password: 'abc12345' };

      mockResponse.json = jest.fn();
      mockResponse.setHeader = jest.fn();

      await userHandlers.loginUser(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenLastCalledWith(
        omit(users[0], ['password']),
      );
      expect(mockResponse.setHeader).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      mockRequest = httpMocks.createRequest();
      mockResponse = httpMocks.createResponse();
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('Should call userStore to update user if updating same account as logged in user.', async () => {
      const userUpdates = {
        username: users[0].username,
        first_name: 'Thomas',
        last_name: 'Sowell',
      };

      jest
        .spyOn(securityTools, 'getJwtFromAuthHeader')
        .mockImplementationOnce(() => 'abc');
      jest.spyOn(securityTools, 'verifyToken').mockImplementationOnce(() => {
        return users[0];
      });

      const mockedUpdateUser = jest.spyOn(UserStore.prototype, 'updateUser');
      mockRequest.body = userUpdates;

      await userHandlers.updateUser(mockRequest, mockResponse);

      expect(mockedUpdateUser).toHaveBeenCalled();
    });
  });
});
