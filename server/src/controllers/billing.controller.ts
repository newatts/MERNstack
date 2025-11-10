import { Response } from 'express';
import { BillingAccount, UsageRecord } from '../models';
import { AppError, asyncHandler } from '../middleware';
import { AuthRequest } from '../types';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia' as any
});

export const getBillingAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const billingAccount = await BillingAccount.findOne({ userId: req.user!._id });

  if (!billingAccount) {
    // Create billing account if it doesn't exist
    const newAccount = await BillingAccount.create({
      userId: req.user!._id,
      subscriptionStatus: 'inactive',
      balance: 0
    });

    res.json({ billingAccount: newAccount });
    return;
  }

  res.json({ billingAccount });
});

export const createStripeCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const billingAccount = await BillingAccount.findOne({ userId: req.user!._id });

  if (!billingAccount) {
    throw new AppError(404, 'Billing account not found');
  }

  if (billingAccount.stripeCustomerId) {
    res.json({
      message: 'Stripe customer already exists',
      customerId: billingAccount.stripeCustomerId
    });
    return;
  }

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: req.user!.email,
    name: `${req.user!.profile.firstName} ${req.user!.profile.lastName}`,
    metadata: {
      userId: req.user!._id
    }
  });

  billingAccount.stripeCustomerId = customer.id;
  await billingAccount.save();

  res.json({
    message: 'Stripe customer created successfully',
    customerId: customer.id
  });
});

export const addPaymentMethod = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentMethodId } = req.body;

  const billingAccount = await BillingAccount.findOne({ userId: req.user!._id });

  if (!billingAccount || !billingAccount.stripeCustomerId) {
    throw new AppError(400, 'Please create a Stripe customer first');
  }

  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: billingAccount.stripeCustomerId
  });

  // Set as default if it's the first payment method
  const isFirst = !billingAccount.paymentMethods || billingAccount.paymentMethods.length === 0;

  if (isFirst) {
    await stripe.customers.update(billingAccount.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
  }

  // Get payment method details
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  billingAccount.paymentMethods = billingAccount.paymentMethods || [];
  billingAccount.paymentMethods.push({
    id: paymentMethodId,
    type: paymentMethod.type,
    last4: (paymentMethod as any).card?.last4,
    default: isFirst
  });

  await billingAccount.save();

  res.json({
    message: 'Payment method added successfully',
    billingAccount
  });
});

export const getUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, type, page = 1, limit = 50 } = req.query;

  const billingAccount = await BillingAccount.findOne({ userId: req.user!._id });

  if (!billingAccount) {
    throw new AppError(404, 'Billing account not found');
  }

  const query: any = {
    billingAccountId: billingAccount._id
  };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate as string);
    if (endDate) query.timestamp.$lte = new Date(endDate as string);
  }

  if (type) {
    query.type = type;
  }

  const records = await UsageRecord.find(query)
    .sort({ timestamp: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await UsageRecord.countDocuments(query);

  // Calculate totals by type
  const summary = await UsageRecord.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        totalCost: { $sum: '$cost' }
      }
    }
  ]);

  res.json({
    records,
    summary,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

export const recordUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, amount, unit, cost, metadata } = req.body;

  const billingAccount = await BillingAccount.findOne({ userId: req.user!._id });

  if (!billingAccount) {
    throw new AppError(404, 'Billing account not found');
  }

  const record = await UsageRecord.create({
    userId: req.user!._id,
    billingAccountId: billingAccount._id,
    type,
    amount,
    unit,
    cost,
    metadata,
    timestamp: new Date()
  });

  // Update account balance
  billingAccount.balance -= cost;
  await billingAccount.save();

  res.status(201).json({
    message: 'Usage recorded successfully',
    record
  });
});

export const createSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { priceId } = req.body;

  const billingAccount = await BillingAccount.findOne({ userId: req.user!._id });

  if (!billingAccount || !billingAccount.stripeCustomerId) {
    throw new AppError(400, 'Please create a Stripe customer and add a payment method first');
  }

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: billingAccount.stripeCustomerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });

  billingAccount.subscriptionStatus = 'active';
  billingAccount.subscriptionPlan = priceId;
  await billingAccount.save();

  res.json({
    message: 'Subscription created successfully',
    subscription
  });
});
