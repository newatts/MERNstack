import express from 'express';
import { body } from 'express-validator';
import {
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  inviteMembers,
  listGroups,
  getSubgroups
} from '../controllers/group.controller';
import { authenticate, requirePermission, validateRequest } from '../middleware';
import { Permission } from '../types';

const router = express.Router();

router.post(
  '/',
  authenticate,
  requirePermission(Permission.CREATE_GROUPS),
  [body('name').trim().notEmpty(), validateRequest],
  createGroup
);

router.get('/', authenticate, listGroups);
router.get('/:id', authenticate, getGroup);
router.get('/:id/subgroups', authenticate, getSubgroups);

router.patch(
  '/:id',
  authenticate,
  [body('name').optional().trim().notEmpty(), validateRequest],
  updateGroup
);

router.delete('/:id', authenticate, deleteGroup);

router.post(
  '/:id/members',
  authenticate,
  [body('userId').notEmpty(), validateRequest],
  addMember
);

router.delete(
  '/:id/members',
  authenticate,
  [body('userId').notEmpty(), validateRequest],
  removeMember
);

router.post(
  '/:id/invite',
  authenticate,
  [body('emails').isArray().notEmpty(), validateRequest],
  inviteMembers
);

export default router;
