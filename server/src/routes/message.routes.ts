import express from 'express';
import { body } from 'express-validator';
import {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  getConversations
} from '../controllers/message.controller';
import { authenticate, validateRequest } from '../middleware';

const router = express.Router();

router.post(
  '/',
  authenticate,
  [body('body').notEmpty(), validateRequest],
  sendMessage
);

router.get('/', authenticate, getMessages);
router.get('/conversations', authenticate, getConversations);
router.patch('/:id/read', authenticate, markAsRead);
router.delete('/:id', authenticate, deleteMessage);

export default router;
