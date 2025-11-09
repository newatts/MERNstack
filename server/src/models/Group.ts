import mongoose, { Schema } from 'mongoose';
import { IGroup } from '../types';

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    parentGroupId: {
      type: String,
      ref: 'Group',
      default: null,
      index: true
    },
    ownerId: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    admins: [{
      type: String,
      ref: 'User'
    }],
    members: [{
      type: String,
      ref: 'User'
    }],
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Ensure owner is also an admin
groupSchema.pre('save', function (next) {
  if (!this.admins.includes(this.ownerId)) {
    this.admins.push(this.ownerId);
  }
  next();
});

// Indexes for faster queries
groupSchema.index({ ownerId: 1 });
groupSchema.index({ parentGroupId: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ admins: 1 });

export const Group = mongoose.model<IGroup>('Group', groupSchema);
