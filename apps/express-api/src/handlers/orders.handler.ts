import { Request, Response } from 'express';

import {
  getTokenPayload,
  getJwtFromAuthHeader,
} from '../utilities/securityTools';
import { Order, OrderStore } from '../models/OrderStore';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

const store = new OrderStore();

export async function createOrder(req: Request, res: Response) {
  let loggedInUserId: number;

  try {
    const header = getJwtFromAuthHeader(req.headers.authorization as string);
    const authToken = getTokenPayload(header);
    loggedInUserId = authToken.id;
  } catch {
    res.status(401);
    res.send('missing or invalid auth token');
    return;
  }

  try {
    const newOrder: Order = await store.getOpenOrder(loggedInUserId);
    res.status(200);
    res.json(newOrder);
  } catch (err) {
    //console.error(err instanceof Error ? err.message : String(err));
    res.status(400);
    res.json(err);
  }
}

export async function filterOrdersByStatus(req: Request, res: Response) {
  const tokenData = getTokenPayload(
    getJwtFromAuthHeader(req.headers.authorization as string)
  );
  const user_id = tokenData.id;
  const status: string = req.query.status as string;

  try {
    const orders = await store.filterOrders(user_id, status);

    res.status(200);
    res.json(orders);
  } catch (err) {
    //console.error(err instanceof Error ? err.message : String(err));
    res.status(400);
    res.json({ error: err });
  }
}

export async function addProductToOrder(req: Request, res: Response) {
  let user_id;
  try {
    const tokenData = getTokenPayload(
      getJwtFromAuthHeader(req.headers.authorization as string)
    );
    user_id = tokenData.id;
  } catch (err) {
    if (err instanceof JsonWebTokenError) {
      res.status(401);
      res.json({ error: 'invalid auth token' });
    } else if (err instanceof TokenExpiredError) {
      res.status(401);
      res.json({ error: 'expired auth token' });
    } else {
      res.status(400);
      res.json('unknown error in adding product to user order');
    }
    return;
  }
  const { product_id, quantity } = req.body;

  try {
    const order = await store.addProductToActiveOrder(
      user_id,
      product_id,
      quantity
    );
    //console.log('The new order contents', order);
    res.status(200);
    res.json(order);
  } catch (err) {
    //console.error(err instanceof Error ? err.message : String(err));
    res.status(400);
    res.json(err);
  }
}
