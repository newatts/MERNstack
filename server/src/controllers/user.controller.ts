import { Response } from 'express';
import { User } from '../models';
import { AppError, asyncHandler } from '../middleware';
import { AuthRequest, Permission } from '../types';

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;

  const user = await User.findById(userId).select('-passwordHash -verificationToken -resetPasswordToken');

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Check permissions
  if (userId !== req.user!._id && !req.user!.hasPermission(Permission.READ_USERS)) {
    throw new AppError(403, 'Insufficient permissions');
  }

  res.json({ user });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;

  // Check permissions
  if (userId !== req.user!._id && !req.user!.hasPermission(Permission.UPDATE_USERS)) {
    throw new AppError(403, 'Insufficient permissions');
  }

  const { firstName, lastName, avatar, phone, preferences } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (firstName !== undefined) user.profile.firstName = firstName;
  if (lastName !== undefined) user.profile.lastName = lastName;
  if (avatar !== undefined) user.profile.avatar = avatar;
  if (phone !== undefined) user.profile.phone = phone;
  if (preferences !== undefined) user.profile.preferences = preferences;

  await user.save();

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      email: user.email,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      avatar: user.profile.avatar,
      phone: user.profile.phone,
      preferences: user.profile.preferences
    }
  });
});

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, search, role } = req.query;

  const query: any = {};

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { 'profile.firstName': { $regex: search, $options: 'i' } },
      { 'profile.lastName': { $regex: search, $options: 'i' } }
    ];
  }

  if (role) {
    query.roles = role;
  }

  const users = await User.find(query)
    .select('-passwordHash -verificationToken -resetPasswordToken')
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  await User.findByIdAndDelete(userId);

  res.json({
    message: 'User deleted successfully'
  });
});
