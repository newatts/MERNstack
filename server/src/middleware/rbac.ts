import { Response, NextFunction } from 'express';
import { AuthRequest, Permission, UserRole } from '../types';

export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.user.hasPermission(permission)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: permission
      });
      return;
    }

    next();
  };
};

export const requireRole = (role: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.user.hasRole(role)) {
      res.status(403).json({
        error: 'Insufficient role',
        required: role
      });
      return;
    }

    next();
  };
};

export const requireAnyRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasRole = roles.some(role => req.user!.hasRole(role));

    if (!hasRole) {
      res.status(403).json({
        error: 'Insufficient role',
        required: roles
      });
      return;
    }

    next();
  };
};

export const requirePermissions = (permissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasAllPermissions = permissions.every(permission =>
      req.user!.hasPermission(permission)
    );

    if (!hasAllPermissions) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: permissions
      });
      return;
    }

    next();
  };
};
