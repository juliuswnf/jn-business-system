import express from 'express';
import SMSLog from '../models/SMSLog.js';
import SMSProviderFactory from '../services/smsProviders/SMSProviderFactory.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkFeatureAccess } from '../middleware/checkFeatureAccess.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Unified webhook handler for SMS providers
 */
async function handleProviderWebhook(providerName, req, res) {
  try {
    // Get provider instance
    const provider = SMSProviderFactory.getProviderByName(providerName);

    if (!provider) {
      logger.error(`❌ Unknown SMS provider: ${providerName}`);
      return res.status(404).json({
        success: false,
        message: `Provider ${providerName} not found`
      });
    }

    // Validate webhook signature
    const isValid = provider.validateWebhook(req);

    if (!isValid) {
      logger.error(`❌ Invalid ${providerName} webhook signature`);
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Parse webhook payload (normalized format)
    const webhookData = provider.parseWebhook(req.body, req.headers);

    if (!webhookData.messageId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: missing messageId'
      });
    }

    const { messageId, status, timestamp, errorMessage, errorCode } = webhookData;

    // Find SMS log entry
    const smsLog = await SMSLog.findOne({ messageId });

    if (!smsLog) {
      logger.warn(`⚠️ SMS log not found for ${providerName} message ${messageId}`);
      // Still return 200 to acknowledge webhook
      return res.status(200).json({
        success: true,
        message: 'Webhook received (SMS log not found)'
      });
    }

    // Update SMS log based on normalized status
    switch (status) {
      case 'sent':
        // Already handled when sending, but update timestamp if available
        if (timestamp && !smsLog.sentAt) {
          smsLog.sentAt = new Date(timestamp);
          await smsLog.save();
        }
        logger.info(`📤 SMS ${messageId} confirmed sent (${providerName})`);
        break;

      case 'delivered':
        await smsLog.markAsDelivered();
        logger.info(`✅ SMS ${messageId} delivered successfully (${providerName})`);
        break;

      case 'failed':
        await smsLog.markAsFailed(errorMessage || 'Delivery failed', errorCode || status);
        logger.error(`❌ SMS ${messageId} failed (${providerName}): ${errorMessage}`);
        break;

      case 'pending':
        // Update status but don't change sentAt
        smsLog.status = 'pending';
        await smsLog.save();
        logger.info(`⏳ SMS ${messageId} pending (${providerName})`);
        break;

      default:
        logger.info(`ℹ️ SMS ${messageId} status update (${providerName}): ${status}`);
    }

    // Always return 200 OK (providers expect this)
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      messageId,
      status
    });

  } catch (error) {
    logger.error(`Error processing ${providerName} webhook:`, error);

    // Still return 200 to prevent provider from retrying
    res.status(200).json({
      success: false,
      message: 'Webhook received but processing failed',
      error: error.message
    });
  }
}

/**
 * @route   POST /api/webhooks/twilio
 * @desc    Handle Twilio status updates (delivery confirmations)
 * @access  Public (validated via signature)
 */
router.post('/twilio', async (req, res) => {
  await handleProviderWebhook('twilio', req, res);
});

/**
 * @route   POST /api/webhooks/messagebird
 * @desc    Handle MessageBird status updates (delivery confirmations)
 * @access  Public (validated via signature)
 */
router.post('/messagebird', async (req, res) => {
  await handleProviderWebhook('messagebird', req, res);
});

/**
 * @route   GET /api/webhooks/test
 * @desc    Test endpoint to verify webhook infrastructure is working
 * @access  Protected (Enterprise webhooks feature)
 */
router.get('/test', authMiddleware.protect, checkFeatureAccess('webhooks'), (req, res) => {
  const activeProvider = SMSProviderFactory.getProvider();

  res.status(200).json({
    success: true,
    message: 'SMS webhook infrastructure is operational',
    activeProvider: activeProvider.getName(),
    endpoints: {
      twilio: '/api/webhooks/twilio',
      messagebird: '/api/webhooks/messagebird'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
