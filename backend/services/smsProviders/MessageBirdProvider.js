import { createRequire } from 'module';
import crypto from 'crypto';
import ISMSProvider from './ISMSProvider.js';

// Use require for CommonJS module
const require = createRequire(import.meta.url);
const messagebirdLib = require('messagebird');

/**
 * MessageBird SMS Provider Implementation
 *
 * Docs: https://developers.messagebird.com/api/sms-messaging/
 * Pricing: ~â‚¬0.0675 per SMS (Germany)
 */

export default class MessageBirdProvider extends ISMSProvider {
  constructor() {
    super();
    this.apiKey = process.env.MESSAGEBIRD_API_KEY;
    this.originator = process.env.MESSAGEBIRD_ORIGINATOR || 'JN_Business';
    this.client = null;

    if (this.isAvailable()) {
      this.client = messagebirdLib.initClient(this.apiKey);
    }
  }

  /**
   * Send SMS via MessageBird
   */
  async sendSMS({ phoneNumber, message, from }) {
    if (!this.client) {
      throw new Error('MessageBird client not initialized. Check MESSAGEBIRD_API_KEY');
    }

    try {
      const result = await new Promise((resolve, reject) => {
        this.client.messages.create(
          {
            originator: from || this.originator,
            recipients: [phoneNumber],
            body: message
          },
          (err, response) => {
            if (err) reject(err);
            else resolve(response);
          }
        );
      });

      return {
        success: true,
        messageId: result.id,
        cost: this.calculateCost(message, this.getCountryFromPhone(phoneNumber)),
        status: 'sent',
        provider: 'messagebird'
      };
    } catch (error) {
      console.error('MessageBird SMS send error:', error);
      throw new Error(`MessageBird: ${error.message || error}`);
    }
  }

  /**
   * Get delivery status from MessageBird
   */
  async getStatus(messageId) {
    if (!this.client) {
      throw new Error('MessageBird client not initialized');
    }

    try {
      const message = await new Promise((resolve, reject) => {
        this.client.messages.read(messageId, (err, response) => {
          if (err) reject(err);
          else resolve(response);
        });
      });

      return {
        status: this.normalizeStatus(message.status),
        deliveredAt: message.statusDatetime,
        error: message.errors && message.errors.length > 0 ? {
          code: message.errors[0].code,
          message: message.errors[0].description
        } : null
      };
    } catch (error) {
      console.error('MessageBird status check error:', error);
      throw new Error(`MessageBird: ${error.message}`);
    }
  }

  /**
   * Calculate SMS cost (MessageBird Germany pricing)
   */
  calculateCost(message, country = 'DE') {
    const segments = Math.ceil(message.length / 160);
    const pricePerSegment = country === 'DE' ? 6.75 : 10; // EUR cents
    return Math.round(segments * pricePerSegment);
  }

  /**
   * Validate MessageBird webhook signature
   * https://developers.messagebird.com/docs/verify-http-requests
   */
  validateWebhook(payload, signature, timestamp, secret) {
    if (!signature || !timestamp || !secret) {
      return false;
    }

    try {
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
      console.error('MessageBird webhook validation error:', error);
      return false;
    }
  }

  /**
   * Parse MessageBird webhook payload
   */
  parseWebhook(payload) {
    const { message } = payload;

    return {
      messageId: message?.id,
      status: this.normalizeStatus(message?.status),
      timestamp: message?.statusDatetime ? new Date(message.statusDatetime) : new Date(),
      error: message?.errors && message.errors.length > 0 ? {
        code: message.errors[0].code,
        message: message.errors[0].description
      } : null
    };
  }

  /**
   * Normalize MessageBird status to standard format
   */
  normalizeStatus(mbStatus) {
    const statusMap = {
      'scheduled': 'pending',
      'sent': 'sent',
      'buffered': 'sent',
      'delivered': 'delivered',
      'expired': 'failed',
      'delivery_failed': 'failed',
      'failed': 'failed'
    };

    return statusMap[mbStatus] || mbStatus;
  }

  /**
   * Get country code from phone number
   */
  getCountryFromPhone(phoneNumber) {
    if (phoneNumber.startsWith('+49')) return 'DE';
    if (phoneNumber.startsWith('+1')) return 'US';
    if (phoneNumber.startsWith('+44')) return 'GB';
    return 'DE'; // Default
  }

  getName() {
    return 'messagebird';
  }

  isAvailable() {
    return !!this.apiKey;
  }
}
