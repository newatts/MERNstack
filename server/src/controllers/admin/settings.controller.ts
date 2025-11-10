import { Response } from 'express';
import { AuthRequest } from '../../types';
import SystemSettings from '../../models/SystemSettings';

/**
 * Get system settings
 */
export async function getSystemSettings(_req: AuthRequest, res: Response): Promise<void> {
  try {
    let settings = await SystemSettings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    // Don't expose sensitive keys in response
    const settingsObj = settings.toObject();
    if (settingsObj.recaptchaSecretKey) {
      settingsObj.recaptchaSecretKey = '***HIDDEN***';
    }

    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Error getting system settings:', error);
    res.status(500).json({ error: 'Failed to get system settings' });
  }
}

/**
 * Update system settings
 */
export async function updateSystemSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({
        ...req.body,
        updatedBy: userId
      });
    } else {
      Object.assign(settings, req.body);
      settings.updatedBy = userId;
      await settings.save();
    }

    // Don't expose sensitive keys in response
    const settingsObj = settings.toObject();
    if (settingsObj.recaptchaSecretKey) {
      settingsObj.recaptchaSecretKey = '***HIDDEN***';
    }

    res.json({
      message: 'System settings updated successfully',
      settings: settingsObj
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
}

/**
 * Get CAPTCHA configuration (public endpoint for client)
 */
export async function getCaptchaConfig(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const settings = await SystemSettings.findOne();

    const config = {
      enabled: settings?.captchaEnabled || false,
      onSignup: settings?.captchaOnSignup || false,
      onLogin: settings?.captchaOnLogin || false,
      siteKey: settings?.recaptchaSiteKey || null
    };

    res.json(config);
  } catch (error) {
    console.error('Error getting CAPTCHA config:', error);
    res.status(500).json({ error: 'Failed to get CAPTCHA configuration' });
  }
}

/**
 * Update CAPTCHA settings
 */
export async function updateCaptchaSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    const {
      captchaEnabled,
      captchaOnSignup,
      captchaOnLogin,
      captchaAutoEnableThreshold,
      recaptchaSecretKey,
      recaptchaSiteKey
    } = req.body;

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({
        captchaEnabled,
        captchaOnSignup,
        captchaOnLogin,
        captchaAutoEnableThreshold,
        recaptchaSecretKey,
        recaptchaSiteKey,
        updatedBy: userId
      });
    } else {
      if (captchaEnabled !== undefined) settings.captchaEnabled = captchaEnabled;
      if (captchaOnSignup !== undefined) settings.captchaOnSignup = captchaOnSignup;
      if (captchaOnLogin !== undefined) settings.captchaOnLogin = captchaOnLogin;
      if (captchaAutoEnableThreshold !== undefined) {
        settings.captchaAutoEnableThreshold = captchaAutoEnableThreshold;
      }
      if (recaptchaSecretKey !== undefined) settings.recaptchaSecretKey = recaptchaSecretKey;
      if (recaptchaSiteKey !== undefined) settings.recaptchaSiteKey = recaptchaSiteKey;

      settings.updatedBy = userId;
      await settings.save();
    }

    res.json({
      message: 'CAPTCHA settings updated successfully',
      settings: {
        captchaEnabled: settings.captchaEnabled,
        captchaOnSignup: settings.captchaOnSignup,
        captchaOnLogin: settings.captchaOnLogin,
        captchaAutoEnableThreshold: settings.captchaAutoEnableThreshold,
        recaptchaSiteKey: settings.recaptchaSiteKey
      }
    });
  } catch (error) {
    console.error('Error updating CAPTCHA settings:', error);
    res.status(500).json({ error: 'Failed to update CAPTCHA settings' });
  }
}
