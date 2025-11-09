import express from 'express';
import { body } from 'express-validator';
import {
  createAssignment,
  getAssignment,
  listAssignments,
  submitAssignment,
  getSubmission,
  gradeSubmission
} from '../controllers/assignment.controller';
import { authenticate, validateRequest } from '../middleware';

const router = express.Router();

router.post(
  '/',
  authenticate,
  [
    body('groupId').notEmpty(),
    body('title').trim().notEmpty(),
    body('description').notEmpty(),
    validateRequest
  ],
  createAssignment
);

router.get('/', authenticate, listAssignments);
router.get('/:id', authenticate, getAssignment);

router.post(
  '/:id/submit',
  authenticate,
  [body('fileId').optional(), validateRequest],
  submitAssignment
);

router.get('/submissions/:id', authenticate, getSubmission);

router.post(
  '/submissions/:id/grade',
  authenticate,
  [
    body('score').isNumeric().isFloat({ min: 0, max: 100 }),
    body('feedback').optional(),
    validateRequest
  ],
  gradeSubmission
);

export default router;
