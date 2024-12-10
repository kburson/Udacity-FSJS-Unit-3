import { Request, Response } from 'express';
import {
  UserOrder,
  Dashboard,
  FlatOrdersByUser,
} from '../services/dashboard.service';
import { isEmpty, isString } from 'lodash';

const store = new Dashboard();

export async function userOrders(_req: Request, res: Response) {
  try {
    const flat = _req.query.flat === 'true' || false;
    const list: UserOrder[] | FlatOrdersByUser[] = await store.usersWithOrders(
      flat
    );
    //console.log('received these orders from handler', list);
    res.status(200);
    res.json(list);
  } catch (err) {
    res.status(400);
    res.json({ message: 'failed to fetch records', err });
  }
}

export async function productOrders(req: Request, res: Response) {
  try {
    const sortCol: string = req.query.sort_col as string;
    const sortVal: string = req.query.sort_dir as string;
    const limit =
      isEmpty(req.query.limit) || !isString(req.query.limit)
        ? 0
        : parseInt(req.query.limit as string);

    const sortDirection: string | null = sortVal?.match(
      new RegExp('\\b(ASC|DESC)\\b', 'gi')
    )
      ? sortVal.toUpperCase()
      : null;

    const list: {
      product_id: number;
      name: string;
      order_count: number;
      order_qty: number;
    }[] = await store.productOrders(sortCol, sortDirection, limit);
    //console.log('received these orders from handler', list);
    res.status(200);
    res.json(list);
  } catch (err) {
    res.status(400);
    res.json({ message: 'failed to fetch records', err });
  }
}
