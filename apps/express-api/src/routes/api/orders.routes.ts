import { Router } from 'express';
import authenticationMiddleware from '../../middleware/authenticate.middleware';
import {
  createOrder,
  addProductToOrder,
  filterOrdersByStatus,
} from '../../handlers/orders.handler';

const router = Router();

router.get('/', authenticationMiddleware, filterOrdersByStatus);
router.post('/', authenticationMiddleware, createOrder);
router.post('/product', authenticationMiddleware, addProductToOrder);

export default router;
