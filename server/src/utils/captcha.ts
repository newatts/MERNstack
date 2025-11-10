import axios from 'axios';
import SystemSettings from '../models/SystemSettings';

export interface RecaptchaVerificationResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify a reCAPTCHA token with Google's API
 * @param token - The reCAPTCHA token from the client
 * @param expectedAction - Optional expected action name for reCAPTCHA v3
 * @returns true if verification succeeds, false otherwise
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  try {
    // Get system settings to retrieve the secret key
    const settings = await SystemSettings.findOne();

    if (!settings || !settings.recaptchaSecretKey) {
      console.error('reCAPTCHA secret key not configured in system settings');
      return { success: false, error: 'reCAPTCHA not configured' };
    }

    const secretKey = settings.recaptchaSecretKey;

    // Make request to Google's reCAPTCHA API
    const response = await axios.post<RecaptchaVerificationResponse>(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: token,
        },
      }
    );

    const data = response.data;

    // Check if verification failed
    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return {
        success: false,
        error: `Verification failed: ${data['error-codes']?.join(', ')}`
      };
    }

    // For reCAPTCHA v3, check the score and action
    if (data.score !== undefined) {
      // Score ranges from 0.0 to 1.0
      // 1.0 is very likely a good interaction, 0.0 is very likely a bot
      // Typically, you want to accept scores above 0.5
      const minimumScore = 0.5;

      if (data.score < minimumScore) {
        return {
          success: false,
          score: data.score,
          error: `Score too low: ${data.score}`
        };
      }

      // Verify the action matches if provided
      if (expectedAction && data.action !== expectedAction) {
        return {
          success: false,
          score: data.score,
          error: `Action mismatch: expected ${expectedAction}, got ${data.action}`
        };
      }

      return { success: true, score: data.score };
    }

    // For reCAPTCHA v2, just return success
    return { success: true };

  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return {
      success: false,
      error: 'Error verifying CAPTCHA'
    };
  }
}

/**
 * Check if CAPTCHA should be required based on system settings
 * @param context - 'signup' or 'login'
 * @returns true if CAPTCHA is required, false otherwise
 */
export async function isCaptchaRequired(context: 'signup' | 'login'): Promise<boolean> {
  try {
    const settings = await SystemSettings.findOne();

    if (!settings || !settings.captchaEnabled) {
      return false;
    }

    if (context === 'signup') {
      return settings.captchaOnSignup;
    } else if (context === 'login') {
      return settings.captchaOnLogin;
    }

    return false;
  } catch (error) {
    console.error('Error checking CAPTCHA requirement:', error);
    return false;
  }
}

/**
 * Get reCAPTCHA site key for client-side integration
 */
export async function getRecaptchaSiteKey(): Promise<string | null> {
  try {
    const settings = await SystemSettings.findOne();
    return settings?.recaptchaSiteKey || null;
  } catch (error) {
    console.error('Error getting reCAPTCHA site key:', error);
    return null;
  }
}
