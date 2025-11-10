import express from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import groupRoutes from './group.routes';
import messageRoutes from './message.routes';
import fileRoutes from './file.routes';
import assignmentRoutes from './assignment.routes';
import billingRoutes from './billing.routes';
import adminSettingsRoutes from './admin/settings.routes';
import adminMembershipPlanRoutes from './admin/membershipPlan.routes';
import adminBillingAccountRoutes from './admin/billingAccount.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/messages', messageRoutes);
router.use('/files', fileRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/billing', billingRoutes);

// Admin routes
router.use('/admin/settings', adminSettingsRoutes);
router.use('/admin/membership-plans', adminMembershipPlanRoutes);
router.use('/admin/billing-accounts', adminBillingAccountRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
