import { Response } from 'express';
import { Assignment, Submission, Group } from '../models';
import { AppError, asyncHandler } from '../middleware';
import { AuthRequest } from '../types';

export const createAssignment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId, title, description, instructions, dueDate, releaseAt, aiConfig } = req.body;

  // Verify group exists and user is admin
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  const isAdmin = group.admins.includes(req.user!._id);
  if (!isAdmin) {
    throw new AppError(403, 'Only group admins can create assignments');
  }

  const assignment = await Assignment.create({
    ownerId: req.user!._id,
    groupId,
    title,
    description,
    instructions,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    releaseAt: releaseAt ? new Date(releaseAt) : undefined,
    aiConfig: aiConfig || { enabled: false }
  });

  res.status(201).json({
    message: 'Assignment created successfully',
    assignment
  });
});

export const getAssignment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const assignmentId = req.params.id;

  const assignment = await Assignment.findById(assignmentId)
    .populate('ownerId', 'email profile')
    .populate('groupId', 'name description');

  if (!assignment) {
    throw new AppError(404, 'Assignment not found');
  }

  // Verify user is a member of the group
  const group = await Group.findById(assignment.groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  const isMember = group.members.includes(req.user!._id);
  if (!isMember) {
    throw new AppError(403, 'Not a member of this group');
  }

  res.json({ assignment });
});

export const listAssignments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { groupId, page = 1, limit = 20 } = req.query;

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
  }

  const assignments = await Assignment.find(query)
    .populate('ownerId', 'email profile')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Assignment.countDocuments(query);

  res.json({
    assignments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

export const submitAssignment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const assignmentId = req.params.id;
  const { fileId } = req.body;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new AppError(404, 'Assignment not found');
  }

  // Check if already submitted
  const existingSubmission = await Submission.findOne({
    studentId: req.user!._id,
    assignmentId
  });

  if (existingSubmission) {
    // Update existing submission
    existingSubmission.fileId = fileId;
    existingSubmission.status = 'submitted';
    existingSubmission.history?.push({
      action: 'resubmitted',
      timestamp: new Date(),
      data: { fileId }
    });
    await existingSubmission.save();

    res.json({
      message: 'Assignment resubmitted successfully',
      submission: existingSubmission
    });
    return;
  }

  // Create new submission
  const submission = await Submission.create({
    studentId: req.user!._id,
    assignmentId,
    fileId,
    status: 'submitted',
    history: [{
      action: 'submitted',
      timestamp: new Date(),
      data: { fileId }
    }]
  });

  // If AI grading is enabled, queue for grading
  if (assignment.aiConfig?.enabled && assignment.aiConfig?.autoGrade) {
    submission.status = 'grading';
    await submission.save();
    // TODO: Queue AI grading job
  }

  res.status(201).json({
    message: 'Assignment submitted successfully',
    submission
  });
});

export const getSubmission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const submissionId = req.params.id;

  const submission = await Submission.findById(submissionId)
    .populate('studentId', 'email profile')
    .populate('assignmentId')
    .populate('fileId');

  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }

  const assignment: any = submission.assignmentId;

  // Check if user is the student or an admin of the group
  const studentId: any = submission.studentId;
  const isStudent = studentId._id.toString() === req.user!._id;
  const group = await Group.findById(assignment.groupId);
  const isAdmin = group?.admins.includes(req.user!._id);

  if (!isStudent && !isAdmin) {
    throw new AppError(403, 'Not authorized');
  }

  // If grades are not released yet, hide them from student
  if (isStudent && assignment.releaseAt && new Date() < assignment.releaseAt) {
    submission.score = undefined;
    submission.feedback = undefined;
    submission.aiScore = undefined;
    submission.aiFeedback = undefined;
  }

  res.json({ submission });
});

export const gradeSubmission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const submissionId = req.params.id;
  const { score, feedback } = req.body;

  const submission = await Submission.findById(submissionId).populate('assignmentId');
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }

  const assignment: any = submission.assignmentId;

  // Verify user is admin of the group
  const group = await Group.findById(assignment.groupId);
  if (!group) {
    throw new AppError(404, 'Group not found');
  }

  const isAdmin = group.admins.includes(req.user!._id);
  if (!isAdmin) {
    throw new AppError(403, 'Only group admins can grade submissions');
  }

  submission.score = score;
  submission.feedback = feedback;
  submission.teacherOverride = true;
  submission.status = 'graded';
  submission.history?.push({
    action: 'graded',
    timestamp: new Date(),
    data: { score, feedback, gradedBy: req.user!._id }
  });

  await submission.save();

  res.json({
    message: 'Submission graded successfully',
    submission
  });
});
