import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { Permission } from '../../types';
import {
  getAllPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  getPublicPlans
} from '../../controllers/admin/membershipPlan.controller';

const router = Router();

// Public endpoint for getting active membership plans
router.get('/public', getPublicPlans);

// Protected admin endpoints
router.get('/', authenticate, requirePermission(Permission.MANAGE_BILLING), getAllPlans);
router.get('/:id', authenticate, requirePermission(Permission.MANAGE_BILLING), getPlan);
router.post('/', authenticate, requirePermission(Permission.MANAGE_BILLING), createPlan);
router.put('/:id', authenticate, requirePermission(Permission.MANAGE_BILLING), updatePlan);
router.delete('/:id', authenticate, requirePermission(Permission.MANAGE_BILLING), deletePlan);

export default router;
