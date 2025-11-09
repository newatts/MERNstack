import { Response } from 'express';
import { Group, User } from '../models';
import { AppError, asyncHandler } from '../middleware';
import { AuthRequest, Permission } from '../types';
import { sendEmail } from '../utils/email';

export const createGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, parentGroupId } = req.body;

  const group = await Group.create({
    name,
    description,
    parentGroupId: parentGroupId || null,
    ownerId: req.user!._id,
    admins: [req.user!._id],
    members: [req.user!._id]
  });

  res.status(201).json({
    message: 'Group created successfully',
    group
  });
});

export const getGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const groupId = req.params.id;

  const group = await Group.findById(groupId)
    .populate('ownerId', 'email profile')
    .populate('admins', 'email profile')
    .populate('members', 'email profile');

  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  // Check if user is a member or has permission
  const isMember = group.members.some((m: any) => m._id.toString() === req.user!._id);
  if (!isMember && !req.user!.hasPermission(Permission.READ_GROUPS)) {
    throw new AppError(403, 'Not a member of this group');
  }

  res.json({ group });
});

export const updateGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const groupId = req.params.id;
  const { name, description } = req.body;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  // Check if user is admin of group
  const isAdmin = group.admins.includes(req.user!._id);
  if (!isAdmin && !req.user!.hasPermission(Permission.UPDATE_GROUPS)) {
    throw new AppError(403, 'Only group admins can update the group');
  }

  if (name) group.name = name;
  if (description !== undefined) group.description = description;

  await group.save();

  res.json({
    message: 'Group updated successfully',
    group
  });
});

export const deleteGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const groupId = req.params.id;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  // Check if user is owner or has permission
  if (group.ownerId !== req.user!._id && !req.user!.hasPermission(Permission.DELETE_GROUPS)) {
    throw new AppError(403, 'Only the group owner can delete the group');
  }

  await Group.findByIdAndDelete(groupId);

  res.json({
    message: 'Group deleted successfully'
  });
});

export const addMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const groupId = req.params.id;
  const { userId } = req.body;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  // Check if user is admin of group
  const isAdmin = group.admins.includes(req.user!._id);
  if (!isAdmin && !req.user!.hasPermission(Permission.MANAGE_GROUP_MEMBERS)) {
    throw new AppError(403, 'Only group admins can add members');
  }

  const userToAdd = await User.findById(userId);
  if (!userToAdd) {
    throw new AppError(404, 'User not found');
  }

  if (group.members.includes(userId)) {
    throw new AppError(400, 'User is already a member');
  }

  group.members.push(userId);
  await group.save();

  res.json({
    message: 'Member added successfully',
    group
  });
});

export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const groupId = req.params.id;
  const { userId } = req.body;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  // Check if user is admin of group
  const isAdmin = group.admins.includes(req.user!._id);
  if (!isAdmin && !req.user!.hasPermission(Permission.MANAGE_GROUP_MEMBERS)) {
    throw new AppError(403, 'Only group admins can remove members');
  }

  // Don't allow removing the owner
  if (userId === group.ownerId) {
    throw new AppError(400, 'Cannot remove the group owner');
  }

  group.members = group.members.filter(m => m !== userId);
  group.admins = group.admins.filter(a => a !== userId);
  await group.save();

  res.json({
    message: 'Member removed successfully',
    group
  });
});

export const inviteMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const groupId = req.params.id;
  const { emails } = req.body;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  // Check if user is admin of group
  const isAdmin = group.admins.includes(req.user!._id);
  if (!isAdmin && !req.user!.hasPermission(Permission.MANAGE_GROUP_MEMBERS)) {
    throw new AppError(403, 'Only group admins can invite members');
  }

  const inviteUrl = `${process.env.FRONTEND_URL}/groups/${groupId}/join`;

  for (const email of emails) {
    try {
      await sendEmail({
        to: email,
        subject: `You've been invited to join ${group.name}`,
        html: `
          <h1>Group Invitation</h1>
          <p>You've been invited to join the group "${group.name}".</p>
          <a href="${inviteUrl}">Join Group</a>
        `
      });
    } catch (error) {
      console.error(`Failed to send invite to ${email}:`, error);
    }
  }

  res.json({
    message: 'Invitations sent successfully'
  });
});

export const listGroups = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, search } = req.query;

  const query: any = {
    members: req.user!._id
  };

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const groups = await Group.find(query)
    .populate('ownerId', 'email profile')
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await Group.countDocuments(query);

  res.json({
    groups,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

export const getSubgroups = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parentId = req.params.id;

  const subgroups = await Group.find({ parentGroupId: parentId })
    .populate('ownerId', 'email profile')
    .sort({ createdAt: -1 });

  res.json({ subgroups });
});
