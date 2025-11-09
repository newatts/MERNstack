import mongoose, { Schema } from 'mongoose';
import { ISubmission } from '../types';

const submissionSchema = new Schema<ISubmission>(
  {
    studentId: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    assignmentId: {
      type: String,
      ref: 'Assignment',
      required: true,
      index: true
    },
    fileId: {
      type: String,
      ref: 'File'
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'grading', 'graded'],
      default: 'pending'
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    feedback: {
      type: String
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100
    },
    aiFeedback: {
      type: String
    },
    teacherOverride: {
      type: Boolean,
      default: false
    },
    history: [{
      action: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      data: {
        type: Schema.Types.Mixed
      }
    }]
  },
  {
    timestamps: true
  }
);

// Ensure unique submission per student per assignment
submissionSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true });
submissionSchema.index({ status: 1 });

export const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
