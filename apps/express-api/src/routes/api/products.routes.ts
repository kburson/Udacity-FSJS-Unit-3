import { Router } from 'express';
import authenticationMiddleware from '../../middleware/authenticate.middleware';
import {
  listProducts,
  getProduct,
  lookupProducts,
  getMostPopular,
  createProduct,
  //deleteProduct,
  //updateProduct,
} from '../../handlers/products.handler';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);
// id, name, price, category
router.get('/filter', lookupProducts);
// limit, category
router.get('/filter/popular', getMostPopular);

router.post('/', authenticationMiddleware, createProduct);
//router.put("/:id", authenticationMiddleware, updateProduct);
//router.delete("/:id", authenticationMiddleware, deleteProduct);

export default router;
