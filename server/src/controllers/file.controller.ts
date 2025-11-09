import { Response } from 'express';
import { File, Group } from '../models';
import { AppError, asyncHandler } from '../middleware';
import { AuthRequest } from '../types';
import AWS from 'aws-sdk';
import crypto from 'crypto';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'mern-platform-files';

export const getUploadUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { filename, mimeType, groupId } = req.body;

  // Validate group membership if groupId provided
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

  // Generate unique key for S3
  const key = `${req.user!._id}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${filename}`;

  // Generate presigned URL for upload
  const uploadUrl = s3.getSignedUrl('putObject', {
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
    Expires: 300 // 5 minutes
  });

  // Create file record
  const file = await File.create({
    ownerId: req.user!._id,
    groupId: groupId || undefined,
    s3Key: key,
    filename: key.split('/').pop() || filename,
    originalName: filename,
    size: 0, // Will be updated after upload
    mimeType,
    status: 'pending'
  });

  res.json({
    uploadUrl,
    fileId: file._id,
    key
  });
});

export const confirmUpload = asyncHandler(async (req: AuthRequest, res: Response) => {
  const fileId = req.params.id;
  const { size } = req.body;

  const file = await File.findById(fileId);
  if (!file) {
    throw new AppError(404, 'File not found');
  }

  if (file.ownerId !== req.user!._id) {
    throw new AppError(403, 'Not authorized');
  }

  file.size = size;
  file.status = 'completed';
  await file.save();

  res.json({
    message: 'Upload confirmed',
    file
  });
});

export const getDownloadUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
  const fileId = req.params.id;

  const file = await File.findById(fileId);
  if (!file) {
    throw new AppError(404, 'File not found');
  }

  // Check permissions
  const isOwner = file.ownerId === req.user!._id;
  let hasAccess = isOwner;

  if (file.groupId && !isOwner) {
    const group = await Group.findById(file.groupId);
    if (group) {
      hasAccess = group.members.includes(req.user!._id);
    }
  }

  if (!hasAccess) {
    throw new AppError(403, 'Not authorized to access this file');
  }

  // Generate presigned URL for download
  const downloadUrl = s3.getSignedUrl('getObject', {
    Bucket: BUCKET_NAME,
    Key: file.s3Key,
    Expires: 300 // 5 minutes
  });

  res.json({
    downloadUrl,
    filename: file.originalName,
    mimeType: file.mimeType,
    size: file.size
  });
});

export const listFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, groupId } = req.query;

  const query: any = {};

  if (groupId) {
    // Verify group membership
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const isMember = group.members.includes(req.user!._id);
    if (!isMember) {
      throw new AppError(403, 'Not a member of this group');
    }

    query.groupId = groupId;
  } else {
    query.ownerId = req.user!._id;
  }

  const files = await File.find(query)
    .populate('ownerId', 'email profile')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await File.countDocuments(query);

  res.json({
    files,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

export const deleteFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const fileId = req.params.id;

  const file = await File.findById(fileId);
  if (!file) {
    throw new AppError(404, 'File not found');
  }

  if (file.ownerId !== req.user!._id) {
    throw new AppError(403, 'Not authorized');
  }

  // Delete from S3
  try {
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: file.s3Key
    }).promise();
  } catch (error) {
    console.error('Failed to delete file from S3:', error);
  }

  // Delete record
  await File.findByIdAndDelete(fileId);

  res.json({
    message: 'File deleted successfully'
  });
});
