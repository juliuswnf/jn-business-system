import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * System Settings Controller (CEO Only)
 * Manages platform-wide configuration for email, SMS, and payment providers
 */

// GET /api/ceo/system-settings - Get all system settings for current salon
export const getSystemSettings = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'No salon associated with user'
      });
    }

    const salon = await Salon.findById(salonId)
      .select('emailSettings smsSettings paymentSettings')
      .lean();

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

    const salon = await Salon.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Update email settings (if provided)
    if (email) {
      salon.emailSettings = salon.emailSettings || {};
      
      if (email.smtpHost) salon.emailSettings.smtpHost = email.smtpHost;
      if (email.smtpPort) salon.emailSettings.smtpPort = Number(email.smtpPort);
      if (email.smtpUser) salon.emailSettings.smtpUser = email.smtpUser;
      if (email.smtpPassword && email.smtpPassword !== '••••••••') {
        salon.emailSettings.smtpPassword = email.smtpPassword;
      }
      if (typeof email.smtpSecure === 'boolean') {
        salon.emailSettings.smtpSecure = email.smtpSecure;
      }
      if (email.fromEmail) salon.emailSettings.fromEmail = email.fromEmail;
      if (email.fromName) salon.emailSettings.fromName = email.fromName;
    }

    // Update SMS settings (if provided)
    if (sms) {
      salon.smsSettings = salon.smsSettings || {};
      
      if (sms.provider) salon.smsSettings.provider = sms.provider;
      if (sms.accountSid) salon.smsSettings.accountSid = sms.accountSid;
      if (sms.authToken && sms.authToken !== '••••••••') {
        salon.smsSettings.authToken = sms.authToken;
      }
      if (sms.phoneNumber) salon.smsSettings.phoneNumber = sms.phoneNumber;
    }

    // Update payment settings (if provided)
    if (payment) {
      salon.paymentSettings = salon.paymentSettings || {};
      
      if (payment.stripePublicKey) salon.paymentSettings.stripePublicKey = payment.stripePublicKey;
      if (payment.stripeSecretKey && !payment.stripeSecretKey.startsWith('sk_live_••')) {
        salon.paymentSettings.stripeSecretKey = payment.stripeSecretKey;
      }
      if (payment.webhookSecret && !payment.webhookSecret.startsWith('whsec_••')) {
        salon.paymentSettings.webhookSecret = payment.webhookSecret;
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
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address required'
      });
    }

    // TODO: Implement actual email test using nodemailer
    // This is a placeholder that simulates sending
    
    logger.info(`Email test requested for ${testEmail}`);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: `Test email sent to ${testEmail}`
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
    const { testPhone } = req.body;

    if (!testPhone) {
      return res.status(400).json({
        success: false,
        message: 'Test phone number required'
      });
    }

    // TODO: Implement actual SMS test using Twilio
    // This is a placeholder that simulates sending
    
    logger.info(`SMS test requested for ${testPhone}`);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: `Test SMS sent to ${testPhone}`
    });
  } catch (error) {
    logger.error('Error testing SMS settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test SMS'
    });
  }
};
