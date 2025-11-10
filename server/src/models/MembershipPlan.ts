import { Schema, model, Document } from 'mongoose';

// Plan types
export enum PlanType {
  TIME_BASED = 'time_based',
  USAGE_BASED = 'usage_based',
  HYBRID = 'hybrid',
  FREE = 'free',
}

// Billing intervals for time-based plans
export enum BillingInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  YEARLY = 'yearly',
}

// Usage metrics that can be tracked
export enum UsageMetric {
  DOWNLOADS = 'downloads',
  FILE_STORAGE = 'file_storage', // in GB
  ACTIVE_TIME = 'active_time', // in minutes
  AI_MESSAGES = 'ai_messages',
  AI_COMPUTE = 'ai_compute', // in compute units
  API_CALLS = 'api_calls',
  SMS_SENT = 'sms_sent',
  DATA_TRANSFER = 'data_transfer', // in GB
}

export interface IUsageLimit {
  metric: UsageMetric;
  limit: number; // Base allowance included in plan
  overageRate?: number; // Cost per unit over the limit (if applicable)
  unit: string; // e.g., 'GB', 'messages', 'minutes'
  hardLimit?: boolean; // If true, block usage after limit; if false, allow overage billing
}

export interface IPlanFeature {
  name: string;
  description?: string;
  enabled: boolean;
}

export interface IMembershipPlan extends Document {
  // Basic Info
  name: string;
  description?: string;
  planType: PlanType;
  active: boolean;
  displayOrder: number; // For sorting in UI

  // Time-based Settings
  billingInterval?: BillingInterval;
  intervalCount?: number; // e.g., 2 for "every 2 months"
  price: number; // Price in cents
  currency: string;

  // Usage-based Settings
  usageLimits: IUsageLimit[];

  // Features
  features: IPlanFeature[];

  // Trial Settings
  trialEnabled: boolean;
  trialDays?: number;

  // Renewal & Grace Period
  autoRenew: boolean;
  gracePeriodDays: number;

  // Stripe Integration
  stripePriceId?: string;
  stripeProductId?: string;

  // Metadata
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const usageLimitSchema = new Schema<IUsageLimit>(
  {
    metric: {
      type: String,
      enum: Object.values(UsageMetric),
      required: true,
    },
    limit: {
      type: Number,
      required: true,
      min: 0,
    },
    overageRate: {
      type: Number,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
    },
    hardLimit: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const planFeatureSchema = new Schema<IPlanFeature>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const membershipPlanSchema = new Schema<IMembershipPlan>(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    planType: {
      type: String,
      enum: Object.values(PlanType),
      required: true,
      default: PlanType.TIME_BASED,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },

    // Time-based Settings
    billingInterval: {
      type: String,
      enum: Object.values(BillingInterval),
    },
    intervalCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },

    // Usage-based Settings
    usageLimits: {
      type: [usageLimitSchema],
      default: [],
    },

    // Features
    features: {
      type: [planFeatureSchema],
      default: [],
    },

    // Trial Settings
    trialEnabled: {
      type: Boolean,
      default: false,
    },
    trialDays: {
      type: Number,
      min: 0,
    },

    // Renewal & Grace Period
    autoRenew: {
      type: Boolean,
      default: true,
    },
    gracePeriodDays: {
      type: Number,
      default: 7,
      min: 0,
    },

    // Stripe Integration
    stripePriceId: {
      type: String,
      sparse: true,
    },
    stripeProductId: {
      type: String,
      sparse: true,
    },

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
membershipPlanSchema.index({ planType: 1, active: 1 });
membershipPlanSchema.index({ displayOrder: 1 });

// Validation: Ensure time-based plans have billing interval
membershipPlanSchema.pre('save', function (next) {
  if (
    (this.planType === PlanType.TIME_BASED || this.planType === PlanType.HYBRID) &&
    !this.billingInterval
  ) {
    return next(new Error('Time-based or hybrid plans must have a billing interval'));
  }

  if (
    (this.planType === PlanType.USAGE_BASED || this.planType === PlanType.HYBRID) &&
    this.usageLimits.length === 0
  ) {
    return next(new Error('Usage-based or hybrid plans must have at least one usage limit'));
  }

  next();
});

const MembershipPlan = model<IMembershipPlan>('MembershipPlan', membershipPlanSchema);

export default MembershipPlan;
