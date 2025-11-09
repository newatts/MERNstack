import mongoose, { Schema } from 'mongoose';
import { IFile } from '../types';

const fileSchema = new Schema<IFile>(
  {
    ownerId: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    groupId: {
      type: String,
      ref: 'Group',
      index: true
    },
    s3Key: {
      type: String,
      required: true,
      unique: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    processingResults: {
      type: Schema.Types.Mixed
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
fileSchema.index({ ownerId: 1, createdAt: -1 });
fileSchema.index({ groupId: 1, createdAt: -1 });
fileSchema.index({ status: 1 });

export const File = mongoose.model<IFile>('File', fileSchema);
