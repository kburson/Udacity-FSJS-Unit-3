import { Router } from 'express';
import { userOrders, productOrders } from '../../handlers/dashboard.handler';

const router = Router();

router.get('/userOrders', userOrders);
router.get('/productOrders', productOrders);

export default router;
