import { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { UserStore, User } from '../models/UserStore';
import { isEmpty, isNull } from 'lodash';
import {
  generateToken,
  getJwtFromAuthHeader,
  verifyToken,
} from '../utilities/securityTools';

const store = new UserStore();

export async function listUsers(_req: Request, res: Response) {
  try {
    const users: User[] = await store.listUsers();
    res.status(200);
    res.json(users);
  } catch (err) {
    res.status(400);
    res.json(err);
  }
}

export async function createUser(req: Request, res: Response) {
  const user: User = req.body;
  if (
    isEmpty(user) ||
    isEmpty(user.username) ||
    isNull(user.username) ||
    isEmpty(user.password) ||
    isNull(user.password)
  ) {
    console.error('new user must have both username and password', user);
    res.status(400);
    res.json({ error: 'new user must have both username and password' });
    return;
  }

  try {
    const newUser = await store.createUser(user);
    const sanitizedUser = store.tokenPayload(newUser);

    //console.log("newly created user", newUser);
    const token = generateToken(sanitizedUser);

    res.setHeader('Authorization', `Bearer ${token}`);
    res.status(200);
    res.json(sanitizedUser);
  } catch (err) {
    console.log('failed to create user\n', err);
    res.status(400);
    res.json(err);
  }
}

export async function loginUser(req: Request, res: Response) {
  const { username, password } = req.body;
  if (
    isEmpty(username) ||
    isNull(username) ||
    isEmpty(password) ||
    isNull(password)
  ) {
    res.status(400);
    res.json({
      error: 'authenticated user must have both username and password',
    });
    return;
  }

  try {
    // read user record from db to get password_digest
    const user = await store.authenticate(username, password);

    if (isNull(user)) {
      console.error('user not found');
      throw new Error('not authorized');
    }
    //console.log("logged in user", user);
    const sanitizedUser = store.tokenPayload(user);
    const token = generateToken(sanitizedUser);

    res.setHeader('Authorization', `Bearer ${token}`);
    res.status(200);
    res.json(sanitizedUser);
  } catch {
    res.status(401);
    res.send('not authorized user');
  }
}

export async function updateUser(req: Request, res: Response) {
  // grab username from auth header and verify it is same as username in req.body

  try {
    const token = getJwtFromAuthHeader(req.headers.authorization);
    try {
      const jsonToken = verifyToken(token as string) as JwtPayload;

      //console.log('jsonToken', jsonToken);

      if (isEmpty(jsonToken) || isEmpty(jsonToken.username)) {
        console.error("jwt payload does not contain 'username' claim");
        res.status(400);
        res.send('appears you are not logged in.');
        return;
      }
      const reqUser: User = req.body;
      if (reqUser.username !== jsonToken.username) {
        console.error(
          'user is not same user as logged in user.  Not allowed to modify user profile',
          reqUser.username,
          jsonToken
        );
        res.status(400);
        res.send(
          'logged in user not same account as requested to update. Can only update your own account'
        );
        return;
      }
    } catch (err) {
      console.error('failed to update user in handler:', err);
      res.status(500);
      res.send('failed to update user account');
    }

    const user = await store.updateUser(req.body);
    //console.log("handler: updated User:", user);

    if (user) {
      res.status(200);
      res.json(store.sanitizeUser(user));
    } else {
      throw new Error('failed to return updated user');
    }
  } catch (err) {
    res.status(401);
    res.json({ msg: 'failed to update user account.', err });
  }
}
