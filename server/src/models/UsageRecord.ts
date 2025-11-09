import mongoose, { Schema } from 'mongoose';
import { IUsageRecord } from '../types';

const usageRecordSchema = new Schema<IUsageRecord>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    billingAccountId: {
      type: String,
      ref: 'BillingAccount',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['api_call', 'storage', 'message', 'sms', 'ai_compute', 'data_transfer'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    cost: {
      type: Number,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  }
);

// Indexes for faster queries
usageRecordSchema.index({ userId: 1, timestamp: -1 });
usageRecordSchema.index({ billingAccountId: 1, timestamp: -1 });
usageRecordSchema.index({ type: 1, timestamp: -1 });

export const UsageRecord = mongoose.model<IUsageRecord>('UsageRecord', usageRecordSchema);
