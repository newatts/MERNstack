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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  avatar?: string;
  phone?: string;
  verified: boolean;
  billingAccountId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  parentGroupId?: string;
  ownerId: string | User;
  admins: string[] | User[];
  members: string[] | User[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  from: string | User;
  to?: string | User;
  groupId?: string;
  type: 'text' | 'file' | 'system';
  body: string;
  attachments?: string[];
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  _id: string;
  ownerId: string;
  groupId?: string;
  s3Key: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  _id: string;
  ownerId: string | User;
  groupId: string | Group;
  title: string;
  description: string;
  instructions?: string;
  dueDate?: string;
  releaseAt?: string;
  aiConfig?: {
    enabled: boolean;
    criteria?: string;
    autoGrade?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  studentId: string | User;
  assignmentId: string | Assignment;
  fileId?: string;
  status: 'pending' | 'submitted' | 'grading' | 'graded';
  score?: number;
  feedback?: string;
  aiScore?: number;
  aiFeedback?: string;
  teacherOverride?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingAccount {
  _id: string;
  userId: string;
  stripeCustomerId?: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';
  subscriptionPlan?: string;
  balance: number;
  paymentMethods?: Array<{
    id: string;
    type: string;
    last4?: string;
    default: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  users?: T[];
  groups?: T[];
  messages?: T[];
  files?: T[];
  assignments?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
