import { Schema, model, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  // CAPTCHA Settings
  captchaEnabled: boolean;
  captchaOnSignup: boolean;
  captchaOnLogin: boolean;
  captchaAutoEnableThreshold: number; // Number of failed login attempts before auto-enabling CAPTCHA
  recaptchaSecretKey?: string;
  recaptchaSiteKey?: string;

  // Failed Login Tracking
  loginFailureWindowMinutes: number; // Time window for tracking failed attempts
  maxLoginAttempts: number; // Max attempts before account lockout
  lockoutDurationMinutes: number; // How long to lock account after max attempts

  // Email Settings
  emailVerificationRequired: boolean;
  emailVerificationTokenExpiryHours: number;

  // Session Settings
  accessTokenExpiryMinutes: number;
  refreshTokenExpiryDays: number;

  // Billing Settings
  trialPeriodDays: number;
  gracePeriodDays: number; // Days after subscription expires before suspension

  // Metadata
  updatedBy?: string; // User ID who last updated settings
  updatedAt: Date;
  createdAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    // CAPTCHA Settings
    captchaEnabled: {
      type: Boolean,
      default: false,
    },
    captchaOnSignup: {
      type: Boolean,
      default: false,
    },
    captchaOnLogin: {
      type: Boolean,
      default: false,
    },
    captchaAutoEnableThreshold: {
      type: Number,
      default: 5, // Auto-enable CAPTCHA after 5 failed attempts
    },
    recaptchaSecretKey: {
      type: String,
      default: '',
    },
    recaptchaSiteKey: {
      type: String,
      default: '',
    },

    // Failed Login Tracking
    loginFailureWindowMinutes: {
      type: Number,
      default: 15, // Track failures within 15-minute window
    },
    maxLoginAttempts: {
      type: Number,
      default: 10, // Lock account after 10 failed attempts
    },
    lockoutDurationMinutes: {
      type: Number,
      default: 30, // Lock for 30 minutes
    },

    // Email Settings
    emailVerificationRequired: {
      type: Boolean,
      default: true,
    },
    emailVerificationTokenExpiryHours: {
      type: Number,
      default: 24,
    },

    // Session Settings
    accessTokenExpiryMinutes: {
      type: Number,
      default: 15,
    },
    refreshTokenExpiryDays: {
      type: Number,
      default: 7,
    },

    // Billing Settings
    trialPeriodDays: {
      type: Number,
      default: 14,
    },
    gracePeriodDays: {
      type: Number,
      default: 7,
    },

    // Metadata
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
systemSettingsSchema.index({}, { unique: true });

const SystemSettings = model<ISystemSettings>('SystemSettings', systemSettingsSchema);

export default SystemSettings;
