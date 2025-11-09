import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, Permission, ROLE_PERMISSIONS } from '../types';

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.MEMBER]
    },
    profile: {
      firstName: {
        type: String,
        required: true,
        trim: true
      },
      lastName: {
        type: String,
        required: true,
        trim: true
      },
      avatar: {
        type: String
      },
      phone: {
        type: String
      },
      preferences: {
        type: Schema.Types.Mixed
      }
    },
    verified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    billingAccountId: {
      type: String,
      ref: 'BillingAccount'
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to check if user has a specific permission
userSchema.methods.hasPermission = function (permission: Permission): boolean {
  const userPermissions = this.roles.reduce((acc: Permission[], role: UserRole) => {
    return [...acc, ...(ROLE_PERMISSIONS[role] || [])];
  }, []);

  return userPermissions.includes(permission);
};

// Method to check if user has a specific role
userSchema.methods.hasRole = function (role: UserRole): boolean {
  return this.roles.includes(role);
};

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ verified: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
