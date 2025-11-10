import LoginAttempt from '../models/LoginAttempt';
import SystemSettings from '../models/SystemSettings';

export interface LoginAttemptData {
  email: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: 'invalid_credentials' | 'account_locked' | 'email_not_verified' | 'captcha_failed' | 'other';
  captchaUsed?: boolean;
}

/**
 * Record a login attempt (success or failure)
 */
export async function recordLoginAttempt(data: LoginAttemptData): Promise<void> {
  try {
    await LoginAttempt.create({
      email: data.email.toLowerCase(),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success: data.success,
      failureReason: data.failureReason,
      captchaUsed: data.captchaUsed || false,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error recording login attempt:', error);
    // Don't throw - we don't want to fail the login/signup process if logging fails
  }
}

/**
 * Get recent failed login attempts for an email or IP
 */
export async function getRecentFailedAttempts(
  email?: string,
  ipAddress?: string
): Promise<number> {
  try {
    const settings = await SystemSettings.findOne();
    const loginFailureWindowMinutes = settings?.loginFailureWindowMinutes || 15;

    const windowStart = new Date(Date.now() - loginFailureWindowMinutes * 60 * 1000);

    const query: any = {
      success: false,
      timestamp: { $gte: windowStart }
    };

    if (email && ipAddress) {
      query.$or = [
        { email: email.toLowerCase() },
        { ipAddress }
      ];
    } else if (email) {
      query.email = email.toLowerCase();
    } else if (ipAddress) {
      query.ipAddress = ipAddress;
    } else {
      return 0;
    }

    return await LoginAttempt.countDocuments(query);
  } catch (error) {
    console.error('Error getting recent failed attempts:', error);
    return 0;
  }
}

/**
 * Check if CAPTCHA should be required based on failed attempts
 */
export async function shouldRequireCaptcha(
  email?: string,
  ipAddress?: string
): Promise<boolean> {
  try {
    const settings = await SystemSettings.findOne();
    const captchaAutoEnableThreshold = settings?.captchaAutoEnableThreshold || 5;

    const failedAttempts = await getRecentFailedAttempts(email, ipAddress);

    return failedAttempts >= captchaAutoEnableThreshold;
  } catch (error) {
    console.error('Error checking CAPTCHA requirement:', error);
    return false;
  }
}

/**
 * Check if account is currently locked
 */
export async function isAccountLocked(email: string): Promise<{
  locked: boolean;
  lockoutEnd?: Date;
  minutesRemaining?: number;
}> {
  try {
    const settings = await SystemSettings.findOne();
    const maxLoginAttempts = settings?.maxLoginAttempts || 10;
    const loginFailureWindowMinutes = settings?.loginFailureWindowMinutes || 15;
    const lockoutDurationMinutes = settings?.lockoutDurationMinutes || 30;

    const windowStart = new Date(Date.now() - loginFailureWindowMinutes * 60 * 1000);

    const failedAttempts = await LoginAttempt.countDocuments({
      email: email.toLowerCase(),
      success: false,
      timestamp: { $gte: windowStart }
    });

    if (failedAttempts >= maxLoginAttempts) {
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

          return {
            locked: true,
            lockoutEnd,
            minutesRemaining
          };
        }
      }
    }

    return { locked: false };
  } catch (error) {
    console.error('Error checking account lockout:', error);
    return { locked: false };
  }
}

/**
 * Clear failed login attempts for a user (after successful login)
 */
export async function clearFailedAttempts(_email: string): Promise<void> {
  try {
    // We don't actually delete them (for audit purposes), but we could mark them as cleared
    // For now, the time-based window handles this naturally
  } catch (error) {
    console.error('Error clearing failed attempts:', error);
  }
}
