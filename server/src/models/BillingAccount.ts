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
      enum: ['active', 'inactive', 'trial', 'cancelled'],
      default: 'inactive'
    },
    subscriptionPlan: {
      type: String
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
    }]
  },
  {
    timestamps: true
  }
);

// Index for faster queries
billingAccountSchema.index({ userId: 1 });
billingAccountSchema.index({ stripeCustomerId: 1 });

export const BillingAccount = mongoose.model<IBillingAccount>('BillingAccount', billingAccountSchema);
