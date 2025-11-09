import { Response } from 'express';
import { Message, Group } from '../models';
import { AppError, asyncHandler } from '../middleware';
import { AuthRequest } from '../types';

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { to, groupId, body, type = 'text', attachments } = req.body;

  // Validate that either 'to' or 'groupId' is provided
  if (!to && !groupId) {
    throw new AppError(400, 'Either recipient or group must be specified');
  }

  // If sending to group, verify user is a member
  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const isMember = group.members.includes(req.user!._id);
    if (!isMember) {
      throw new AppError(403, 'Not a member of this group');
    }
  }

  const message = await Message.create({
    from: req.user!._id,
    to,
    groupId,
    type,
    body,
    attachments: attachments || [],
    readBy: [req.user!._id]
  });

  await message.populate('from', 'email profile');

  res.status(201).json({
    message: 'Message sent successfully',
    data: message
  });
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chatId, groupId, page = 1, limit = 50 } = req.query;

  let query: any = {};

  if (groupId) {
    // Get group messages
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const isMember = group.members.includes(req.user!._id);
    if (!isMember) {
      throw new AppError(403, 'Not a member of this group');
    }

    query.groupId = groupId;
  } else if (chatId) {
    // Get direct messages between two users
    query.$or = [
      { from: req.user!._id, to: chatId },
      { from: chatId, to: req.user!._id }
    ];
  } else {
    throw new AppError(400, 'Either chatId or groupId must be specified');
  }

  const messages = await Message.find(query)
    .populate('from', 'email profile')
    .populate('to', 'email profile')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Message.countDocuments(query);

  res.json({
    messages: messages.reverse(), // Reverse to show oldest first
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const messageId = req.params.id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError(404, 'Message not found');
  }

  if (!message.readBy.includes(req.user!._id)) {
    message.readBy.push(req.user!._id);
    await message.save();
  }

  res.json({
    message: 'Message marked as read'
  });
});

export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const messageId = req.params.id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError(404, 'Message not found');
  }

  // Only sender can delete
  if (message.from !== req.user!._id) {
    throw new AppError(403, 'Only the sender can delete this message');
  }

  await Message.findByIdAndDelete(messageId);

  res.json({
    message: 'Message deleted successfully'
  });
});

export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Get list of users the current user has chatted with
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { from: req.user!._id, groupId: null },
          { to: req.user!._id, groupId: null }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$from', req.user!._id] },
            '$to',
            '$from'
          ]
        },
        lastMessage: { $first: '$$ROOT' }
      }
    }
  ]);

  await Message.populate(messages, {
    path: 'lastMessage.from lastMessage.to',
    select: 'email profile'
  });

  res.json({ conversations: messages });
});
