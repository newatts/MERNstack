import express from 'express';
import { body, CustomValidator } from 'express-validator';
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
import { validatePassword } from '../utils/passwordValidator';

const router = express.Router();

// Custom password validator
const isStrongPassword: CustomValidator = (value: string) => {
  const result = validatePassword(value);
  if (!result.isValid) {
    throw new Error(result.errors[0]);
  }
  return true;
};

router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').custom(isStrongPassword),
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
    body('newPassword').custom(isStrongPassword),
    validateRequest
  ],
  resetPassword
);

router.get('/me', authenticate, getMe);

export default router;
