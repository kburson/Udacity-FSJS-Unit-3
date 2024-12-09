import { omit } from 'lodash';
import { User, UserStore } from './UserStore';
import { TestDataService } from '../_test-helpers/testDataService';
import { pool } from '../database';
import color from 'colors/safe';

const data = TestDataService.Instance;
const userStore = new UserStore();

beforeAll(async () => {
  console.debug('-- UserStore: generate test data');
  jest.resetAllMocks();
  await data.generateStaticTestData();
  expect(data.testData.products).toHaveLength(10);
  expect(data.testData.users).toHaveLength(10);
  expect(data.testData.orders).toHaveLength(16);
});

afterAll(async () => {
  console.debug('-- UserStore: delete test data');
  await data.deleteTestData();
  jest.resetAllMocks();
  // jest seems to instantiate an entirely new connection pool for every test suite.
  console.debug('-- Ending the DB connection pool');
  pool.end();
});

describe('Model: UserStore', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listUsers', () => {
    it('should return list of user accounts', async () => {
      const receivedUserList = await userStore.listUsers();

      expect(receivedUserList.length).toEqual(data.testData.users.length);
    });
  });

  describe('createUser', () => {
    it('should return user data for newly created account', async () => {
      const testUser: User = {
        username: 'test-user-100',
        password: 'password123',
      };

      const receivedUser = await userStore.createUser(testUser);

      expect(receivedUser.username).toEqual(testUser.username);

      await userStore.deleteUser(receivedUser.id);
    });
  });

  describe('getUser', () => {
    let user: User;

    beforeAll(() => {
      user = data.testData.users[0];
    });

    it('should return user that matches user id', async () => {
      const res = await userStore.getUser({ id: user.id } as User);

      expect(res.id).toEqual(user.id);
    });

    it('should return user that matches username', async () => {
      const res = await userStore.getUser({
        username: user.username,
      } as User);

      expect(res.username).toEqual(user.username);
    });

    it('should throw error if input is missing both id and username', async () => {
      console.info(
        color.bgYellow(
          color.bold(
            ' ### CRASH TEST DUMMY: Expecting an authentication error to be thrown ###### '
          )
        )
      );
      let thrown = false;
      try {
        await userStore.getUser({ first_name: 'test_01' } as User);
      } catch {
        thrown = true;
      }
      expect(thrown).toBeTruthy();

      // expect(
      //   async () => await userStore.getUser({ first_name: 'test_01' } as User)
      // ).toThrow();
    });
  });

  describe.skip('updateUser', () => {
    it('should TBD', () => {
      expect(true).toBeTruthy();
    });
  });

  describe('authenticate', () => {
    it('should return account with matching username/password', async () => {
      const user = data.testData.users[0];

      const authUser = await userStore.authenticate(
        user.username,
        user.password
      );

      expect(authUser).toBeDefined();
    });

    it('should return null for authentication failure.', async () => {
      const user = data.testData.users[0];

      const results = await userStore.authenticate(
        user.username,
        'invalid-password'
      );

      expect(results).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete user account', async () => {
      const user = { username: 'test-user-101', password: 'password1234' };

      const createdUser = await userStore.createUser(user);
      expect(createdUser.username).toEqual(user.username);

      const retrievedUser = await userStore.getUser(omit(user, ['password']));
      expect(omit(retrievedUser, ['first_name', 'last_name'])).toEqual(
        createdUser
      );

      await userStore.deleteUser(retrievedUser.id);
      const missingUser = await userStore.getUser(user);

      expect(missingUser).toBeUndefined();
    });
  });
});
