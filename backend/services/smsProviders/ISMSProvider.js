/**
 * SMS Provider Interface
 *
 * All SMS providers must implement this interface
 */

export default class ISMSProvider {
  /**
   * Send SMS
   * @param {Object} _params - SMS parameters
   * @param {string} _params.phoneNumber - Recipient phone number (E.164 format)
   * @param {string} _params.message - SMS message content
   * @param {string} _params.from - Sender ID or phone number
   * @returns {Promise<Object>} - { success, messageId, cost }
   */
  async sendSMS(_params) {
    throw new Error('Method sendSMS() must be implemented');
  }

  /**
   * Get delivery status
   * @param {string} _messageId - Provider message ID
   * @returns {Promise<Object>} - { status, deliveredAt, error }
   */
  async getStatus(_messageId) {
    throw new Error('Method getStatus() must be implemented');
  }

  /**
   * Calculate SMS cost
   * @param {string} _message - SMS message content
   * @param {string} _country - Destination country code (e.g., 'DE')
   * @returns {number} - Cost in EUR cents
   */
  calculateCost(_message, _country = 'DE') {
    throw new Error('Method calculateCost() must be implemented');
  }

  /**
   * Validate webhook signature
   * @param {Object} _payload - Webhook payload
   * @param {string} _signature - Webhook signature
   * @param {string} _timestamp - Webhook timestamp
   * @param {string} _secret - Webhook secret
   * @returns {boolean} - true if valid
   */
  validateWebhook(_payload, _signature, _timestamp, _secret) {
    throw new Error('Method validateWebhook() must be implemented');
  }

  /**
   * Parse webhook payload to standard format
   * @param {Object} _payload - Provider-specific webhook payload
   * @returns {Object} - { messageId, status, timestamp, error }
   */
  parseWebhook(_payload) {
    throw new Error('Method parseWebhook() must be implemented');
  }

  /**
   * Get provider name
   * @returns {string} - Provider name ('twilio', 'messagebird', etc.)
   */
  getName() {
    throw new Error('Method getName() must be implemented');
  }

  /**
   * Check if provider is available
   * @returns {boolean} - true if credentials are configured
   */
  isAvailable() {
    throw new Error('Method isAvailable() must be implemented');
  }
}
