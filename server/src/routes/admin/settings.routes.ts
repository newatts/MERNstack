import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { Permission } from '../../types';
import {
  getSystemSettings,
  updateSystemSettings,
  getCaptchaConfig,
  updateCaptchaSettings
} from '../../controllers/admin/settings.controller';

const router = Router();

// Public endpoint for getting CAPTCHA config (needed by client)
router.get('/captcha-config', getCaptchaConfig);

// Protected admin endpoints
router.get('/', authenticate, requirePermission(Permission.MANAGE_SYSTEM), getSystemSettings);
router.put('/', authenticate, requirePermission(Permission.MANAGE_SYSTEM), updateSystemSettings);
router.put('/captcha', authenticate, requirePermission(Permission.MANAGE_SYSTEM), updateCaptchaSettings);

export default router;
