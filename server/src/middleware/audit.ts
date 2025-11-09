import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuditLog } from '../models';

export const auditLog = (action: string, resourceType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        const resourceId = req.params.id || req.body._id || 'unknown';

        await AuditLog.create({
          actorId: req.user._id,
          action,
          resourceType,
          resourceId,
          metadata: {
            method: req.method,
            path: req.path,
            body: req.body,
            params: req.params,
            query: req.query
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          timestamp: new Date()
        });
      }

      next();
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('Audit log error:', error);
      next();
    }
  };
};
