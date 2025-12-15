import express from 'express';
import crypto from 'crypto';
import SMSLog from '../models/SMSLog.js';

const router = express.Router();

/**
 * @route   POST /api/webhooks/messagebird
 * @desc    Handle MessageBird status updates (delivery confirmations)
 * @access  Public (validated via signature)
 */
router.post('/messagebird', async (req, res) => {
  try {
    // MessageBird webhook payload
    const payload = req.body;

    // Validate webhook signature (security)
    const signature = req.headers['messagebird-signature'];
    const timestamp = req.headers['messagebird-request-timestamp'];

    if (process.env.MESSAGEBIRD_WEBHOOK_SECRET) {
      const isValid = validateMessageBirdSignature(
        payload,
        signature,
        timestamp,
        process.env.MESSAGEBIRD_WEBHOOK_SECRET
      );

      if (!isValid) {
        console.error('❌ Invalid MessageBird webhook signature');
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }
    }

    // Parse payload
    const { message } = payload;

    if (!message || !message.id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: missing message.id'
      });
    }

    const { id: messageId, status, statusDatetime, errors } = message;

    // Find SMS log entry
    const smsLog = await SMSLog.findOne({ messageId });

    if (!smsLog) {
      console.warn(`⚠️ SMS log not found for MessageBird message ${messageId}`);
      // Still return 200 to acknowledge webhook
      return res.status(200).json({
        success: true,
        message: 'Webhook received (SMS log not found)'
      });
    }

    // Update SMS log based on status
    switch (status) {
      case 'sent':
        // Already handled when sending, but update timestamp
        if (statusDatetime && !smsLog.sentAt) {
          smsLog.sentAt = new Date(statusDatetime);
          await smsLog.save();
        }
        console.log(`📤 SMS ${messageId} confirmed sent`);
        break;

      case 'delivered':
        await smsLog.markAsDelivered();
        console.log(`✅ SMS ${messageId} delivered successfully`);
        break;

      case 'delivery_failed':
      case 'expired':
      case 'failed': {
        const errorMessage = errors && errors.length > 0
          ? errors[0].description
          : `Delivery failed with status: ${status}`;
        
        const errorCode = errors && errors.length > 0
          ? errors[0].code.toString()
          : status;

        await smsLog.markAsFailed(errorMessage, errorCode);
        console.error(`❌ SMS ${messageId} failed: ${errorMessage}`);
        break;
      }

      default:
        console.log(`ℹ️ SMS ${messageId} status update: ${status}`);
    }

    // Always return 200 OK (MessageBird expects this)
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      messageId,
      status
    });

  } catch (error) {
    console.error('Error processing MessageBird webhook:', error);
    
    // Still return 200 to prevent MessageBird from retrying
    res.status(200).json({
      success: false,
      message: 'Webhook received but processing failed',
      error: error.message
    });
  }
});

/**
 * Validate MessageBird webhook signature
 * https://developers.messagebird.com/docs/verify-http-requests
 */
function validateMessageBirdSignature(payload, signature, timestamp, secret) {
  if (!signature || !timestamp || !secret) {
    return false;
  }

  try {
    // MessageBird uses HMAC-SHA256
    const payloadString = JSON.stringify(payload);
    const signaturePayload = `${timestamp}${payloadString}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signaturePayload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error validating MessageBird signature:', error);
    return false;
  }
}

/**
 * @route   GET /api/webhooks/messagebird/test
 * @desc    Test endpoint to verify webhook is reachable
 * @access  Public
 */
router.get('/messagebird/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MessageBird webhook endpoint is reachable',
    timestamp: new Date().toISOString()
  });
});

export default router;
