import express from 'express';
import { body } from 'express-validator';
import {
  getBillingAccount,
  createStripeCustomer,
  addPaymentMethod,
  getUsage,
  recordUsage,
  createSubscription
} from '../controllers/billing.controller';
import { authenticate, validateRequest } from '../middleware';

const router = express.Router();

router.get('/account', authenticate, getBillingAccount);
router.post('/stripe-customer', authenticate, createStripeCustomer);

router.post(
  '/payment-method',
  authenticate,
  [body('paymentMethodId').notEmpty(), validateRequest],
  addPaymentMethod
);

router.get('/usage', authenticate, getUsage);

router.post(
  '/usage',
  authenticate,
  [
    body('type').notEmpty(),
    body('amount').isNumeric(),
    body('unit').notEmpty(),
    body('cost').isNumeric(),
    validateRequest
  ],
  recordUsage
);

router.post(
  '/subscription',
  authenticate,
  [body('priceId').notEmpty(), validateRequest],
  createSubscription
);

export default router;
