import express from 'express';
import { body } from 'express-validator';
import {
  getUploadUrl,
  confirmUpload,
  getDownloadUrl,
  listFiles,
  deleteFile
} from '../controllers/file.controller';
import { authenticate, requirePermission, validateRequest } from '../middleware';
import { Permission } from '../types';

const router = express.Router();

router.post(
  '/upload-url',
  authenticate,
  requirePermission(Permission.UPLOAD_FILES),
  [
    body('filename').notEmpty(),
    body('mimeType').notEmpty(),
    validateRequest
  ],
  getUploadUrl
);

router.post('/:id/confirm', authenticate, confirmUpload);
router.get('/:id/download', authenticate, getDownloadUrl);
router.get('/', authenticate, listFiles);
router.delete('/:id', authenticate, deleteFile);

export default router;
