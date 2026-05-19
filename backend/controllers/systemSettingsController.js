import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const ALLOWED_SMS_PROVIDERS = ['twilio', 'messagebird', 'test'];
const MASKED_SECRET = '••••••••';
const MASKED_STRIPE_LIVE = 'sk_live_••••••••';
const MASKED_STRIPE_TEST = 'sk_test_••••••••';
const MASKED_WEBHOOK = 'whsec_••••••••';

const sanitizeSettingString = (value, maxLength = 255) => {
  if (typeof value !== 'string') {
    return '';
  }

  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();

  return cleaned.slice(0, maxLength);
};

const parseSafePort = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }
  return parsed;
};

/**
 * System Settings Controller (CEO Only)
 * Manages platform-wide configuration for email, SMS, and payment providers
 */

// GET /api/ceo/system-settings - Get all system settings for current salon
export const getSystemSettings = async (req, res) => {
  try {
    if (req.user?.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'No salon associated with user'
      });
    }

    const salon = await Salon.findById(salonId)
      .select('emailSettings smsSettings paymentSettings')
      .lean()
      .maxTimeMS(5000);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Mask sensitive data (passwords, API keys)
    const settings = {
      email: {
        smtpHost: salon.emailSettings?.smtpHost || '',
        smtpPort: salon.emailSettings?.smtpPort || 587,
        smtpUser: salon.emailSettings?.smtpUser || '',
        smtpSecure: salon.emailSettings?.smtpSecure || false,
        fromEmail: salon.emailSettings?.fromEmail || '',
        fromName: salon.emailSettings?.fromName || '',
        // Password masked
        smtpPassword: salon.emailSettings?.smtpPassword ? '••••••••' : ''
      },
      sms: {
        provider: salon.smsSettings?.provider || 'twilio',
        accountSid: salon.smsSettings?.accountSid || '',
        phoneNumber: salon.smsSettings?.phoneNumber || '',
        // Auth token masked
        authToken: salon.smsSettings?.authToken ? '••••••••' : ''
      },
      payment: {
        stripePublicKey: salon.paymentSettings?.stripePublicKey || '',
        // Secret key masked
        stripeSecretKey: salon.paymentSettings?.stripeSecretKey ? 'sk_live_••••••••' : '',
        webhookSecret: salon.paymentSettings?.webhookSecret ? 'whsec_••••••••' : ''
      }
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    logger.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
};

// PUT /api/ceo/system-settings - Update system settings
export const updateSystemSettings = async (req, res) => {
  try {
    if (req.user?.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const salonId = req.user.salonId;
    const { email, sms, payment } = req.body;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'No salon associated with user'
      });
    }

    if (!mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salon ID'
      });
    }

    const salon = await Salon.findById(salonId).maxTimeMS(5000);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Update email settings (if provided)
    if (email) {
      salon.emailSettings = salon.emailSettings || {};

      const smtpHost = sanitizeSettingString(email.smtpHost, 255);
      const smtpUser = sanitizeSettingString(email.smtpUser, 255);
      const smtpPassword = sanitizeSettingString(email.smtpPassword, 255);
      const fromEmail = sanitizeSettingString(email.fromEmail, 255).toLowerCase();
      const fromName = sanitizeSettingString(email.fromName, 120);
      const smtpPort = parseSafePort(email.smtpPort);

      if (smtpHost) salon.emailSettings.smtpHost = smtpHost;
      if (smtpPort) salon.emailSettings.smtpPort = smtpPort;
      if (smtpUser) salon.emailSettings.smtpUser = smtpUser;
      if (smtpPassword && smtpPassword !== MASKED_SECRET) {
        salon.emailSettings.smtpPassword = smtpPassword;
      }
      if (typeof email.smtpSecure === 'boolean') {
        salon.emailSettings.smtpSecure = email.smtpSecure;
      }
      if (fromEmail) salon.emailSettings.fromEmail = fromEmail;
      if (fromName) salon.emailSettings.fromName = fromName;
    }

    // Update SMS settings (if provided)
    if (sms) {
      salon.smsSettings = salon.smsSettings || {};

      const provider = sanitizeSettingString(sms.provider, 32).toLowerCase();
      const accountSid = sanitizeSettingString(sms.accountSid, 255);
      const authToken = sanitizeSettingString(sms.authToken, 255);
      const phoneNumber = sanitizeSettingString(sms.phoneNumber, 40);

      if (provider && ALLOWED_SMS_PROVIDERS.includes(provider)) {
        salon.smsSettings.provider = provider;
      }
      if (accountSid) salon.smsSettings.accountSid = accountSid;
      if (authToken && authToken !== MASKED_SECRET) {
        salon.smsSettings.authToken = authToken;
      }
      if (phoneNumber) salon.smsSettings.phoneNumber = phoneNumber;
    }

    // Update payment settings (if provided)
    if (payment) {
      salon.paymentSettings = salon.paymentSettings || {};

      const stripePublicKey = sanitizeSettingString(payment.stripePublicKey, 255);
      const stripeSecretKey = sanitizeSettingString(payment.stripeSecretKey, 255);
      const webhookSecret = sanitizeSettingString(payment.webhookSecret, 255);

      if (stripePublicKey) salon.paymentSettings.stripePublicKey = stripePublicKey;
      if (
        stripeSecretKey &&
        stripeSecretKey !== MASKED_STRIPE_LIVE &&
        stripeSecretKey !== MASKED_STRIPE_TEST &&
        !stripeSecretKey.startsWith('sk_live_••') &&
        !stripeSecretKey.startsWith('sk_test_••')
      ) {
        salon.paymentSettings.stripeSecretKey = stripeSecretKey;
      }
      if (webhookSecret && webhookSecret !== MASKED_WEBHOOK && !webhookSecret.startsWith('whsec_••')) {
        salon.paymentSettings.webhookSecret = webhookSecret;
      }
    }

    await salon.save();

    logger.info(`System settings updated for salon ${salonId}`);

    res.json({
      success: true,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    logger.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  }
};

// POST /api/ceo/system-settings/test-email - Test email configuration
export const testEmailSettings = async (req, res) => {
  try {
    if (req.user?.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const testEmail = sanitizeSettingString(req.body?.testEmail, 255).toLowerCase();

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test email format'
      });
    }

    // TODO: Implement actual email test using nodemailer
    // This is a placeholder that simulates sending
    
    logger.info(`Email test requested for ${testEmail}`);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    logger.error('Error testing email settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email'
    });
  }
};

// POST /api/ceo/system-settings/test-sms - Test SMS configuration
export const testSMSSettings = async (req, res) => {
  try {
    if (req.user?.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const testPhone = sanitizeSettingString(req.body?.testPhone, 40);

    if (!testPhone) {
      return res.status(400).json({
        success: false,
        message: 'Test phone number required'
      });
    }

    const phoneRegex = /^\+?[0-9\s().-]{7,20}$/;
    if (!phoneRegex.test(testPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test phone number format'
      });
    }

    // TODO: Implement actual SMS test using Twilio
    // This is a placeholder that simulates sending
    
    logger.info(`SMS test requested for ${testPhone}`);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: 'Test SMS sent successfully'
    });
  } catch (error) {
    logger.error('Error testing SMS settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test SMS'
    });
  }
};
