import express from 'express';
import { body } from 'express-validator';
import {
  signup,
  verifyEmail,
  login,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
  getMe
} from '../controllers/auth.controller';
import { authenticate, validateRequest } from '../middleware';
import { verifyCaptchaSignup, verifyCaptchaLogin, checkAccountLockout } from '../middleware/captcha';

const router = express.Router();

router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    validateRequest
  ],
  verifyCaptchaSignup,
  signup
);

router.post(
  '/verify-email',
  [body('token').notEmpty(), validateRequest],
  verifyEmail
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validateRequest
  ],
  checkAccountLockout,
  verifyCaptchaLogin,
  login
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty(), validateRequest],
  refreshAccessToken
);

router.post(
  '/request-password-reset',
  [body('email').isEmail().normalizeEmail(), validateRequest],
  requestPasswordReset
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
    validateRequest
  ],
  resetPassword
);

router.get('/me', authenticate, getMe);

export default router;
