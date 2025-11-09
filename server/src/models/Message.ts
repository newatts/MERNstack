import mongoose, { Schema } from 'mongoose';
import { IMessage } from '../types';

const messageSchema = new Schema<IMessage>(
  {
    from: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    to: {
      type: String,
      ref: 'User',
      index: true
    },
    groupId: {
      type: String,
      ref: 'Group',
      index: true
    },
    type: {
      type: String,
      enum: ['text', 'file', 'system'],
      default: 'text',
      required: true
    },
    body: {
      type: String,
      required: true
    },
    attachments: [{
      type: String,
      ref: 'File'
    }],
    readBy: [{
      type: String,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

// Validation: Either 'to' or 'groupId' must be present
messageSchema.pre('validate', function (next) {
  if (!this.to && !this.groupId) {
    next(new Error('Message must have either a recipient (to) or a group (groupId)'));
  } else {
    next();
  }
});

// Indexes for faster queries
messageSchema.index({ from: 1, createdAt: -1 });
messageSchema.index({ to: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
