import express from 'express';
import {
  getProfile,
  updateProfile,
  listUsers,
  deleteUser
} from '../controllers/user.controller';
import { authenticate, requirePermission } from '../middleware';
import { Permission } from '../types';

const router = express.Router();

router.get('/', authenticate, requirePermission(Permission.READ_USERS), listUsers);
router.get('/:id', authenticate, getProfile);
router.patch('/:id', authenticate, updateProfile);
router.delete('/:id', authenticate, requirePermission(Permission.DELETE_USERS), deleteUser);

export default router;
