import { Request } from 'express';
import { Document } from 'mongoose';

// User Roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  REGIONAL_ADMIN = 'REGIONAL_ADMIN',
  LOCAL_ADMIN = 'LOCAL_ADMIN',
  GROUP_ADMIN = 'GROUP_ADMIN',
  MEMBER = 'MEMBER',
  STUDENT = 'STUDENT',
  SERVICE_ACCOUNT = 'SERVICE_ACCOUNT'
}

// Permissions - Fine-grained access control
export enum Permission {
  // System permissions
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  MANAGE_BILLING = 'MANAGE_BILLING',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',

  // User permissions
  CREATE_USERS = 'CREATE_USERS',
  READ_USERS = 'READ_USERS',
  UPDATE_USERS = 'UPDATE_USERS',
  DELETE_USERS = 'DELETE_USERS',

  // Group permissions
  CREATE_GROUPS = 'CREATE_GROUPS',
  READ_GROUPS = 'READ_GROUPS',
  UPDATE_GROUPS = 'UPDATE_GROUPS',
  DELETE_GROUPS = 'DELETE_GROUPS',
  MANAGE_GROUP_MEMBERS = 'MANAGE_GROUP_MEMBERS',

  // Message permissions
  SEND_MESSAGES = 'SEND_MESSAGES',
  READ_MESSAGES = 'READ_MESSAGES',
  DELETE_MESSAGES = 'DELETE_MESSAGES',
  SEND_BULK_MESSAGES = 'SEND_BULK_MESSAGES',

  // File permissions
  UPLOAD_FILES = 'UPLOAD_FILES',
  READ_FILES = 'READ_FILES',
  DELETE_FILES = 'DELETE_FILES',

  // AI permissions
  SUBMIT_AI_JOBS = 'SUBMIT_AI_JOBS',
  MANAGE_AI_JOBS = 'MANAGE_AI_JOBS',

  // Device permissions
  REGISTER_DEVICES = 'REGISTER_DEVICES',
  MANAGE_DEVICES = 'MANAGE_DEVICES',
  VIEW_DEVICE_DATA = 'VIEW_DEVICE_DATA',

  // Scraper permissions
  CREATE_SCRAPER_JOBS = 'CREATE_SCRAPER_JOBS',
  MANAGE_SCRAPER_JOBS = 'MANAGE_SCRAPER_JOBS',

  // SMS permissions
  SEND_SMS = 'SEND_SMS',
  SEND_BULK_SMS = 'SEND_BULK_SMS'
}

// Role to Permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),

  [UserRole.ADMIN]: [
    Permission.VIEW_ANALYTICS,
    Permission.READ_USERS,
    Permission.UPDATE_USERS,
    Permission.CREATE_GROUPS,
    Permission.READ_GROUPS,
    Permission.UPDATE_GROUPS,
    Permission.DELETE_GROUPS,
    Permission.SEND_MESSAGES,
    Permission.READ_MESSAGES,
    Permission.UPLOAD_FILES,
    Permission.READ_FILES,
    Permission.MANAGE_AI_JOBS,
    Permission.VIEW_DEVICE_DATA
  ],

  [UserRole.REGIONAL_ADMIN]: [
    Permission.VIEW_ANALYTICS,
    Permission.READ_USERS,
    Permission.UPDATE_USERS,
    Permission.READ_GROUPS,
    Permission.UPDATE_GROUPS,
    Permission.MANAGE_GROUP_MEMBERS,
    Permission.SEND_MESSAGES,
    Permission.READ_MESSAGES,
    Permission.UPLOAD_FILES,
    Permission.READ_FILES
  ],

  [UserRole.LOCAL_ADMIN]: [
    Permission.READ_USERS,
    Permission.READ_GROUPS,
    Permission.UPDATE_GROUPS,
    Permission.MANAGE_GROUP_MEMBERS,
    Permission.SEND_MESSAGES,
    Permission.READ_MESSAGES,
    Permission.UPLOAD_FILES,
    Permission.READ_FILES
  ],

  [UserRole.GROUP_ADMIN]: [
    Permission.CREATE_GROUPS,
    Permission.READ_GROUPS,
    Permission.UPDATE_GROUPS,
    Permission.MANAGE_GROUP_MEMBERS,
    Permission.SEND_MESSAGES,
    Permission.READ_MESSAGES,
    Permission.SEND_BULK_MESSAGES,
    Permission.UPLOAD_FILES,
    Permission.READ_FILES
  ],

  [UserRole.MEMBER]: [
    Permission.READ_GROUPS,
    Permission.SEND_MESSAGES,
    Permission.READ_MESSAGES,
    Permission.UPLOAD_FILES,
    Permission.READ_FILES
  ],

  [UserRole.STUDENT]: [
    Permission.READ_GROUPS,
    Permission.SEND_MESSAGES,
    Permission.READ_MESSAGES,
    Permission.UPLOAD_FILES,
    Permission.READ_FILES,
    Permission.SUBMIT_AI_JOBS
  ],

  [UserRole.SERVICE_ACCOUNT]: [
    Permission.REGISTER_DEVICES,
    Permission.VIEW_DEVICE_DATA,
    Permission.CREATE_SCRAPER_JOBS
  ]
};

// User interface
export interface IUser extends Document {
  _id: string;
  email: string;
  passwordHash: string;
  roles: UserRole[];
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    preferences?: Record<string, any>;
  };
  verified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  billingAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: Permission): boolean;
  hasRole(role: UserRole): boolean;
}

// Extended Express Request with authenticated user
export interface AuthRequest extends Request {
  user?: IUser;
}

// Group interface
export interface IGroup extends Document {
  _id: string;
  name: string;
  description?: string;
  parentGroupId?: string;
  ownerId: string;
  admins: string[];
  members: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Message interface
export interface IMessage extends Document {
  _id: string;
  from: string;
  to?: string;
  groupId?: string;
  type: 'text' | 'file' | 'system';
  body: string;
  attachments?: string[];
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

// File interface
export interface IFile extends Document {
  _id: string;
  ownerId: string;
  groupId?: string;
  s3Key: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingResults?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Device interface
export interface IDevice extends Document {
  _id: string;
  ownerId: string;
  deviceType: string;
  name: string;
  credentials?: Record<string, any>;
  lastSeen?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Assignment interface
export interface IAssignment extends Document {
  _id: string;
  ownerId: string;
  groupId: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate?: Date;
  releaseAt?: Date;
  aiConfig?: {
    enabled: boolean;
    criteria?: string;
    autoGrade?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Submission interface
export interface ISubmission extends Document {
  _id: string;
  studentId: string;
  assignmentId: string;
  fileId?: string;
  status: 'pending' | 'submitted' | 'grading' | 'graded';
  score?: number;
  feedback?: string;
  aiScore?: number;
  aiFeedback?: string;
  teacherOverride?: boolean;
  history?: Array<{
    action: string;
    timestamp: Date;
    data?: Record<string, any>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Billing Account interface
export interface IBillingAccount extends Document {
  _id: string;
  userId: string;
  stripeCustomerId?: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled' | 'suspended' | 'grace_period';
  subscriptionPlan?: string;
  membershipPlanId?: string; // Reference to MembershipPlan
  balance: number;
  paymentMethods?: Array<{
    id: string;
    type: string;
    last4?: string;
    default: boolean;
  }>;

  // Subscription timing
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  nextBillingDate?: Date;
  trialEndDate?: Date;

  // Grace period & suspension
  gracePeriodEndDate?: Date;
  suspendedAt?: Date;
  suspensionReason?: string;

  // Admin overrides
  billingEnabled: boolean; // Admin can disable billing for specific users
  freeAccessGranted: boolean; // Admin can grant free access
  freeAccessReason?: string;
  freeAccessGrantedBy?: string; // Admin user ID
  freeAccessGrantedAt?: Date;
  freeAccessExpiresAt?: Date;

  // Usage tracking for current billing period
  currentPeriodUsage?: Map<string, number>; // metric -> amount used

  createdAt: Date;
  updatedAt: Date;
}

// Usage Record interface
export interface IUsageRecord extends Document {
  _id: string;
  userId: string;
  billingAccountId: string;
  type: 'api_call' | 'storage' | 'message' | 'sms' | 'ai_compute' | 'data_transfer' | 'download' | 'file_storage' | 'active_time' | 'ai_message';
  amount: number;
  unit: string;
  cost: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Audit Log interface
export interface IAuditLog extends Document {
  _id: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
