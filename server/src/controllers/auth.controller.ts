import { Request, Response } from 'express';
import crypto from 'crypto';
import { User, BillingAccount } from '../models';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { AppError, asyncHandler } from '../middleware';
import { AuthRequest, UserRole } from '../types';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(409, 'Email already registered');
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  const user = await User.create({
    email,
    passwordHash: password,
    roles: role ? [role] : [UserRole.MEMBER],
    profile: {
      firstName,
      lastName
    },
    verified: false,
    verificationToken,
    verificationTokenExpires
  });

  // Create billing account
  const billingAccount = await BillingAccount.create({
    userId: user._id,
    subscriptionStatus: 'trial',
    balance: 0
  });

  user.billingAccountId = billingAccount._id;
  await user.save();

  // Send verification email
  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  res.status(201).json({
    message: 'Registration successful. Please check your email to verify your account.',
    user: {
      id: user._id,
      email: user.email,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName
    }
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError(400, 'Invalid or expired verification token');
  }

  user.verified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({
    message: 'Email verified successfully. You can now log in.'
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  if (!user.verified) {
    throw new AppError(403, 'Please verify your email before logging in');
  }

  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email
  });

  const refreshToken = generateRefreshToken({
    userId: user._id,
    email: user.email
  });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      roles: user.roles,
      avatar: user.profile.avatar
    }
  });
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(400, 'Refresh token required');
  }

  const payload = verifyRefreshToken(refreshToken);

  const user = await User.findById(payload.userId);
  if (!user || !user.verified) {
    throw new AppError(401, 'Invalid refresh token');
  }

  const newAccessToken = generateAccessToken({
    userId: user._id,
    email: user.email
  });

  res.json({
    accessToken: newAccessToken
  });
});

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    res.json({
      message: 'If the email exists, a password reset link has been sent.'
    });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetTokenExpires;
  await user.save();

  try {
    await sendPasswordResetEmail(email, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }

  res.json({
    message: 'If the email exists, a password reset link has been sent.'
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError(400, 'Invalid or expired reset token');
  }

  user.passwordHash = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({
    message: 'Password reset successful. You can now log in with your new password.'
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated');
  }

  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.profile.firstName,
      lastName: req.user.profile.lastName,
      roles: req.user.roles,
      avatar: req.user.profile.avatar,
      phone: req.user.profile.phone,
      verified: req.user.verified,
      billingAccountId: req.user.billingAccountId
    }
  });
});
