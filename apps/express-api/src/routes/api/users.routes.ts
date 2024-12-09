import { Router } from 'express';
import authenticationMiddleware from '../../middleware/authenticate.middleware';
import {
  listUsers,
  createUser,
  loginUser,
  updateUser,
} from '../../handlers/users.handler';

const router = Router();

router.get('/', listUsers);
router.post('/', createUser);

router.put('/', authenticationMiddleware, updateUser);

router.post('/login', loginUser);

// GET and DELETE are special admin api --
// we will not be implementing them at this time.

export default router;
