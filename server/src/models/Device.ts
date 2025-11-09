import mongoose, { Schema } from 'mongoose';
import { IDevice } from '../types';

const deviceSchema = new Schema<IDevice>(
  {
    ownerId: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    deviceType: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    credentials: {
      type: Schema.Types.Mixed
    },
    lastSeen: {
      type: Date
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
deviceSchema.index({ ownerId: 1, createdAt: -1 });
deviceSchema.index({ deviceType: 1 });

export const Device = mongoose.model<IDevice>('Device', deviceSchema);
