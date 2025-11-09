import mongoose, { Schema } from 'mongoose';
import { IBillingAccount } from '../types';

const billingAccountSchema = new Schema<IBillingAccount>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    stripeCustomerId: {
      type: String,
      unique: true,
      sparse: true
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'trial', 'cancelled', 'suspended', 'grace_period'],
      default: 'inactive',
      index: true
    },
    subscriptionPlan: {
      type: String
    },
    membershipPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'MembershipPlan'
    },
    balance: {
      type: Number,
      default: 0
    },
    paymentMethods: [{
      id: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      },
      last4: {
        type: String
      },
      default: {
        type: Boolean,
        default: false
      }
    }],

    // Subscription timing
    subscriptionStartDate: {
      type: Date
    },
    subscriptionEndDate: {
      type: Date,
      index: true
    },
    nextBillingDate: {
      type: Date
    },
    trialEndDate: {
      type: Date
    },

    // Grace period & suspension
    gracePeriodEndDate: {
      type: Date
    },
    suspendedAt: {
      type: Date
    },
    suspensionReason: {
      type: String
    },

    // Admin overrides
    billingEnabled: {
      type: Boolean,
      default: true,
      index: true
    },
    freeAccessGranted: {
      type: Boolean,
      default: false,
      index: true
    },
    freeAccessReason: {
      type: String
    },
    freeAccessGrantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    freeAccessGrantedAt: {
      type: Date
    },
    freeAccessExpiresAt: {
      type: Date
    },

    // Usage tracking for current billing period
    currentPeriodUsage: {
      type: Map,
      of: Number,
      default: new Map()
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
billingAccountSchema.index({ userId: 1 });
billingAccountSchema.index({ stripeCustomerId: 1 });
billingAccountSchema.index({ subscriptionStatus: 1, subscriptionEndDate: 1 });
billingAccountSchema.index({ billingEnabled: 1 });
billingAccountSchema.index({ freeAccessGranted: 1, freeAccessExpiresAt: 1 });

export const BillingAccount = mongoose.model<IBillingAccount>('BillingAccount', billingAccountSchema);
