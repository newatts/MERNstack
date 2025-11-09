import mongoose, { Schema } from 'mongoose';
import { IAssignment } from '../types';

const assignmentSchema = new Schema<IAssignment>(
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
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    instructions: {
      type: String
    },
    dueDate: {
      type: Date
    },
    releaseAt: {
      type: Date
    },
    aiConfig: {
      enabled: {
        type: Boolean,
        default: false
      },
      criteria: {
        type: String
      },
      autoGrade: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
assignmentSchema.index({ ownerId: 1, createdAt: -1 });
assignmentSchema.index({ groupId: 1, dueDate: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);
