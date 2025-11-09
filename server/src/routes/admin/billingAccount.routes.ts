import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { Permission } from '../../types';
import {
  getAllBillingAccounts,
  getBillingAccount,
  grantFreeAccess,
  revokeFreeAccess,
  toggleBilling,
  overrideSubscriptionStatus,
  assignMembershipPlan,
  adminCancelSubscription,
  adminRenewSubscription,
  getUsageStatistics
} from '../../controllers/admin/billingAccount.controller';

const router = Router();

// All endpoints require admin permissions
router.use(authenticate);
router.use(requirePermission(Permission.MANAGE_BILLING));

// Billing account management
router.get('/', getAllBillingAccounts);
router.get('/:id', getBillingAccount);
router.get('/:id/usage', getUsageStatistics);

// Admin overrides
router.post('/:id/free-access', grantFreeAccess);
router.delete('/:id/free-access', revokeFreeAccess);
router.put('/:id/billing-enabled', toggleBilling);
router.put('/:id/status', overrideSubscriptionStatus);

// Subscription management
router.post('/:id/assign-plan', assignMembershipPlan);
router.post('/:id/cancel', adminCancelSubscription);
router.post('/:id/renew', adminRenewSubscription);

export default router;
