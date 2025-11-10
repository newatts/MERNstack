import { Request, Response, NextFunction } from 'express';
import { verifyRecaptcha, isCaptchaRequired } from '../utils/captcha';
import LoginAttempt from '../models/LoginAttempt';
import SystemSettings from '../models/SystemSettings';

/**
 * Middleware to verify reCAPTCHA token for signup
 */
export async function verifyCaptchaSignup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const captchaRequired = await isCaptchaRequired('signup');

    // If CAPTCHA is not required, skip verification
    if (!captchaRequired) {
      return next();
    }

    const { captchaToken } = req.body;

    if (!captchaToken) {
      res.status(400).json({ error: 'CAPTCHA token is required' });
      return;
    }

    const result = await verifyRecaptcha(captchaToken, 'signup');

    if (!result.success) {
      res.status(400).json({
        error: 'CAPTCHA verification failed',
        details: result.error
      });
      return;
    }

    // CAPTCHA verified successfully
    next();
  } catch (error) {
    console.error('Error in CAPTCHA signup middleware:', error);
    res.status(500).json({ error: 'Error verifying CAPTCHA' });
  }
}

/**
 * Middleware to verify reCAPTCHA token for login
 * Also checks if CAPTCHA should be auto-enabled based on failed login attempts
 */
export async function verifyCaptchaLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, captchaToken } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    // Check system settings
    const settings = await SystemSettings.findOne();
    const captchaOnLogin = settings?.captchaOnLogin || false;
    const captchaAutoEnableThreshold = settings?.captchaAutoEnableThreshold || 5;
    const loginFailureWindowMinutes = settings?.loginFailureWindowMinutes || 15;

    // Check recent failed login attempts for this email or IP
    const windowStart = new Date(Date.now() - loginFailureWindowMinutes * 60 * 1000);

    const failedAttempts = await LoginAttempt.countDocuments({
      $or: [{ email: email?.toLowerCase() }, { ipAddress }],
      success: false,
      timestamp: { $gte: windowStart }
    });

    // Determine if CAPTCHA should be required
    const captchaRequired = captchaOnLogin || failedAttempts >= captchaAutoEnableThreshold;

    // If CAPTCHA is not required, skip verification
    if (!captchaRequired) {
      return next();
    }

    // CAPTCHA is required
    if (!captchaToken) {
      res.status(400).json({
        error: 'CAPTCHA verification is required',
        captchaRequired: true,
        reason: failedAttempts >= captchaAutoEnableThreshold
          ? 'Multiple failed login attempts detected'
          : 'CAPTCHA enabled by administrator'
      });
      return;
    }

    const result = await verifyRecaptcha(captchaToken, 'login');

    if (!result.success) {
      // Log the failed CAPTCHA attempt
      await LoginAttempt.create({
        email: email?.toLowerCase() || 'unknown',
        ipAddress,
        userAgent: req.headers['user-agent'],
        success: false,
        failureReason: 'captcha_failed',
        captchaUsed: true,
        timestamp: new Date()
      });

      res.status(400).json({
        error: 'CAPTCHA verification failed',
        details: result.error
      });
      return;
    }

    // Store that CAPTCHA was used for this attempt
    req.body._captchaVerified = true;

    // CAPTCHA verified successfully
    next();
  } catch (error) {
    console.error('Error in CAPTCHA login middleware:', error);
    res.status(500).json({ error: 'Error verifying CAPTCHA' });
  }
}

/**
 * Check if account is locked due to too many failed login attempts
 */
export async function checkAccountLockout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;
    const _ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email) {
      return next();
    }

    const settings = await SystemSettings.findOne();
    const maxLoginAttempts = settings?.maxLoginAttempts || 10;
    const loginFailureWindowMinutes = settings?.loginFailureWindowMinutes || 15;
    const lockoutDurationMinutes = settings?.lockoutDurationMinutes || 30;

    // Check recent failed login attempts
    const windowStart = new Date(Date.now() - loginFailureWindowMinutes * 60 * 1000);

    const failedAttempts = await LoginAttempt.countDocuments({
      email: email.toLowerCase(),
      success: false,
      timestamp: { $gte: windowStart }
    });

    // Check if account should be locked
    if (failedAttempts >= maxLoginAttempts) {
      // Get the most recent failed attempt
      const recentAttempt = await LoginAttempt.findOne({
        email: email.toLowerCase(),
        success: false
      }).sort({ timestamp: -1 });

      if (recentAttempt) {
        const lockoutEnd = new Date(
          recentAttempt.timestamp.getTime() + lockoutDurationMinutes * 60 * 1000
        );

        if (new Date() < lockoutEnd) {
          const minutesRemaining = Math.ceil(
            (lockoutEnd.getTime() - Date.now()) / (60 * 1000)
          );

          res.status(429).json({
            error: 'Account temporarily locked due to too many failed login attempts',
            lockedUntil: lockoutEnd,
            minutesRemaining
          });
          return;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Error in account lockout middleware:', error);
    res.status(500).json({ error: 'Error checking account status' });
  }
}
