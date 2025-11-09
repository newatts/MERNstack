import { Schema, model, Document } from 'mongoose';

export interface ILoginAttempt extends Document {
  email: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  captchaUsed: boolean;
  timestamp: Date;
}

const loginAttemptSchema = new Schema<ILoginAttempt>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
    success: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    failureReason: {
      type: String,
      enum: ['invalid_credentials', 'account_locked', 'email_not_verified', 'captcha_failed', 'other'],
    },
    captchaUsed: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient querying
loginAttemptSchema.index({ email: 1, timestamp: -1 });
loginAttemptSchema.index({ ipAddress: 1, timestamp: -1 });

// TTL index to auto-delete old login attempts after 30 days
loginAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const LoginAttempt = model<ILoginAttempt>('LoginAttempt', loginAttemptSchema);

export default LoginAttempt;
