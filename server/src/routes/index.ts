import express from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import groupRoutes from './group.routes';
import messageRoutes from './message.routes';
import fileRoutes from './file.routes';
import assignmentRoutes from './assignment.routes';
import billingRoutes from './billing.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/messages', messageRoutes);
router.use('/files', fileRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/billing', billingRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
