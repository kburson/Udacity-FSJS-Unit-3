import authenticate from './authenticate.middleware';
import { generateToken } from '../utilities/securityTools';
import { User } from '../models/UserStore';
import httpMocks from 'node-mocks-http';
import color from 'colors/safe';
// import { color } from 'console-log-colors';
//import { bgRed, white, bold } from 'colorette';

describe('Middleware: authenticate', () => {
  it("should call 'next' for a validated authorization token", () => {
    const user: User = {
      id: 1,
      username: 'test',
      last_login_date: new Date(),
    };
    const token = generateToken(user);
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/user/42',
      headers: { authorization: `Bearer ${token}` },
    });
    const res = httpMocks.createResponse();

    let success = false;
    authenticate(req, res, () => (success = true));

    expect(success).toBeTruthy();
  });

  it('should return status = 401 for invalid authorization token', () => {
    console.info(
      color.bgYellow(
        color.bold(
          ' ### CRASH TEST DUMMY: Expecting an error here: jwt malformed '
        )
      )
    );
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/some/authenticated/path',
      headers: { authorization: `Bearer abcdefghijklmnopqrstuvwxyz` },
    });
    const res = httpMocks.createResponse();

    const mockNextFn = jest.fn();

    authenticate(req, res, mockNextFn);

    expect(res.statusCode).toBe(401);
    expect(mockNextFn).not.toHaveBeenCalled();
  });
});
