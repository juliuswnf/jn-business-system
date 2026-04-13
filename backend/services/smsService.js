import { createClient } from 'redis';
import SMSLog from '../models/SMSLog.js';
import SMSConsent from '../models/SMSConsent.js';
import SMSProviderFactory from './smsProviders/SMSProviderFactory.js';
import logger from '../utils/logger.js';

// Get SMS Provider lazily (only when needed)
let smsProvider = null;
const getSmsProvider = () => {
  if (!smsProvider) {
    smsProvider = SMSProviderFactory.getProvider();
  }
  return smsProvider;
};

const RATE_LIMIT = parseInt(process.env.SMS_RATE_LIMIT_PER_SECOND || '10');

// Redis client for rate limiting
let redisClient = null;
let redisAvailable = false;

// Initialize Redis (if available)
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      // Stop retrying after 3 failed attempts — fall back to in-memory
      reconnectStrategy: (retries) => retries > 3 ? false : Math.min(retries * 1000, 5000)
    }
  });

  let redisErrorLogged = false;
  redisClient.on('error', (err) => {
    if (!redisErrorLogged) {
      logger.warn('⚠️ Redis unavailable, falling back to in-memory rate limiting:', err.message);
      redisErrorLogged = true;
    }
    redisAvailable = false;
  });

  redisClient.on('connect', () => {
    redisErrorLogged = false;
    logger.info('✅ Redis connected for SMS rate limiting');
    redisAvailable = true;
  });

  redisClient.connect().catch(() => {
    redisAvailable = false;
  });
} else {
  logger.warn('⚠️ REDIS_URL not configured, using in-memory rate limiting (not production-safe)');
}

// Rate Limiting Queue
let smsQueue = [];
let isProcessingQueue = false;
let lastSentTime = 0;

// In-memory rate limit fallback (per salon per minute)
const inMemoryRateLimits = new Map();

/**
 * Add SMS to queue and process
 */
async function queueSMS(phoneNumber, message, salonId, template, bookingId = null, customerId = null) {
  return new Promise((resolve, reject) => {
    smsQueue.push({
      phoneNumber,
      message,
      salonId,
      template,
      bookingId,
      customerId,
      resolve,
      reject
    });

    if (!isProcessingQueue) {
      processQueue();
    }
  });
}

/**
 * Check rate limit for salon (Redis-based with in-memory fallback)
 */
async function checkRateLimit(salonId) {
  const currentMinute = Math.floor(Date.now() / 60000); // Current minute timestamp
  const key = `sms:ratelimit:${salonId}:${currentMinute}`;

  if (redisAvailable && redisClient) {
    try {
      // Redis-based rate limiting (production-safe)
      const count = await redisClient.incr(key);

      // Set TTL on first increment
      if (count === 1) {
        await redisClient.expire(key, 60); // Expire after 60 seconds
      }

      if (count > RATE_LIMIT * 60) { // 10 SMS/sec * 60 sec = 600/min
        logger.warn(`⚠️ Rate limit exceeded for salon ${salonId}: ${count} SMS/min`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Redis rate limit check failed, falling back to in-memory:', error);
      // Fall through to in-memory fallback
    }
  }

  // In-memory fallback (not production-safe, resets on server restart)
  if (!inMemoryRateLimits.has(key)) {
    inMemoryRateLimits.set(key, { count: 0, expiresAt: Date.now() + 60000 });
  }

  const limit = inMemoryRateLimits.get(key);

  // Clean up expired entries
  if (limit.expiresAt < Date.now()) {
    inMemoryRateLimits.delete(key);
    inMemoryRateLimits.set(key, { count: 1, expiresAt: Date.now() + 60000 });
    return true;
  }

  limit.count++;

  if (limit.count > RATE_LIMIT * 60) {
    logger.warn(`⚠️ Rate limit exceeded for salon ${salonId} (in-memory): ${limit.count} SMS/min`);
    return false;
  }

  return true;
}

/**
 * Process SMS queue with rate limiting
 */
async function processQueue() {
  if (isProcessingQueue || smsQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (smsQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastSent = now - lastSentTime;
    const minInterval = 1000 / RATE_LIMIT; // milliseconds between sends

    if (timeSinceLastSent < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastSent));
    }

    const sms = smsQueue.shift();

    // Check rate limit before sending
    const canSend = await checkRateLimit(sms.salonId);
    if (!canSend) {
      sms.reject(new Error('Rate limit exceeded. Please try again in 1 minute.'));
      continue;
    }

    try {
      const result = await sendSMSImmediate(
        sms.phoneNumber,
        sms.message,
        sms.salonId,
        sms.template,
        sms.bookingId,
        sms.customerId
      );
      lastSentTime = Date.now();
      sms.resolve(result);
    } catch (error) {
      sms.reject(error);
    }
  }

  isProcessingQueue = false;
}

/**
 * Send SMS immediately (internal function)
 */
async function sendSMSImmediate(phoneNumber, message, salonId, template, bookingId = null, customerId = null, retryCount = 0) {
  // Create SMS Log entry
  const smsLog = new SMSLog({
    salonId,
    bookingId,
    customerId,
    phoneNumber,
    message,
    template,
    status: 'pending'
  });

  try {
    // Consent was already verified in sendSMS() before queuing.
    // No redundant check here — trust the gate at the public entry point.

    // Check Do-Not-Disturb hours (consent DnD applies even after gate)
    const dnDConsent = await SMSConsent.findOne({ customerPhone: phoneNumber, salonId }).maxTimeMS(3000).catch(() => null);
    if (dnDConsent && !dnDConsent.canSendNow()) {
      throw new Error('Cannot send SMS during Do-Not-Disturb hours (22:00-08:00)');
    }

    // Send via configured SMS provider
    const provider = getSmsProvider();
    const result = await provider.sendSMS({
      phoneNumber,
      message,
      from: process.env.SMS_ORIGINATOR || process.env.TWILIO_PHONE_NUMBER
    });

    if (!result.success) {
      throw new Error(result.error || 'SMS provider returned failure');
    }

    // Mark as sent with actual cost from provider
    await smsLog.markAsSent(result.messageId, result.cost);

    logger.info(`✅ SMS sent successfully via ${result.provider}:`, {
      messageId: result.messageId,
      phoneNumber,
      template,
      salonId,
      cost: result.cost,
      status: result.status
    });

    return {
      success: true,
      messageId: result.messageId,
      smsLogId: smsLog._id
    };

  } catch (error) {
    logger.error(`❌ SMS failed:`, {
      phoneNumber,
      template,
      error: error.message,
      retryCount
    });

    // Mark as failed
    await smsLog.markAsFailed(error.message, error.code);

    // Retry logic (max 3 attempts with exponential backoff)
    if (retryCount < 3) {
      const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      logger.info(`🔄 Retrying SMS in ${backoffDelay}ms (attempt ${retryCount + 1}/3)`);

      await new Promise(resolve => setTimeout(resolve, backoffDelay));

      return sendSMSImmediate(
        phoneNumber,
        message,
        salonId,
        template,
        bookingId,
        customerId,
        retryCount + 1
      );
    }

    throw error;
  }
}

/**
 * Main SMS Send Function (with GDPR consent gate + rate limiting)
 *
 * The consent check runs BEFORE the message enters the queue so it is enforced
 * regardless of which caller invokes sendSMS. Consent failure is fail-safe:
 * if the DB query itself throws we block the SMS (never fail open).
 */
export async function sendSMS(phoneNumber, message, salonId, template, bookingId = null, customerId = null) {
  // GDPR consent gate — must pass before queuing
  try {
    const consent = await SMSConsent.findOne({
      customerPhone: phoneNumber,
      salonId,
      opted: true
    }).maxTimeMS(3000);

    if (!consent) {
      logger.warn(`[SMS] Blocked — no consent for phone ${phoneNumber} salonId ${salonId}`);
      return { sent: false, reason: 'no_consent' };
    }
  } catch (consentErr) {
    // Fail safe: a broken consent check must NOT allow the SMS through
    logger.error('[SMS] Consent check failed, blocking SMS (fail safe):', consentErr.message);
    return { sent: false, reason: 'consent_check_error' };
  }

  return queueSMS(phoneNumber, message, salonId, template, bookingId, customerId);
}

/**
 * Template 1: Booking Confirmation SMS (48h before)
 */
export async function sendBookingConfirmation(booking, confirmationToken) {
  const { customer, salon, service, startTime } = booking;

  // Format date/time
  const date = new Date(startTime).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
  const time = new Date(startTime).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Build confirmation URL
  const confirmUrl = `${process.env.FRONTEND_URL}/confirm/${confirmationToken}`;

  // Message template
  const message = `Hallo ${customer.firstName}! 👋

Ihr Termin bei ${salon.businessName}:
📅 ${date} um ${time}
✂️ ${service.name}

⚠️ WICHTIG: Bitte bestätigen Sie Ihren Termin innerhalb von 48h:
${confirmUrl}

Ohne Bestätigung wird der Termin automatisch storniert.

Bei Fragen: ${salon.phone || salon.email}

Abmelden: Antworten Sie mit STOP`;

  return sendSMS(
    customer.phone,
    message,
    salon._id,
    'confirmation',
    booking._id,
    customer._id
  );
}

/**
 * Template 2: Waitlist Offer SMS (when slot becomes available)
 */
export async function sendWaitlistOffer(waitlistEntry, slotSuggestion) {
  const { customer, salon, preferredService } = waitlistEntry;
  const { suggestedSlot } = slotSuggestion;

  // Format suggested slot
  const date = new Date(suggestedSlot).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
  const time = new Date(suggestedSlot).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Build accept URL
  const acceptUrl = `${process.env.FRONTEND_URL}/waitlist/accept/${slotSuggestion._id}`;

  // Message template
  const message = `Gute Nachricht, ${customer.firstName}! 🎉

Ein Termin ist frei geworden bei ${salon.businessName}:
📅 ${date} um ${time}
✂️ ${preferredService.name}

⏰ Schnell sein lohnt sich! Jetzt buchen:
${acceptUrl}

Angebot gültig für 2 Stunden.

Abmelden: Antworten Sie mit STOP`;

  return sendSMS(
    customer.phone,
    message,
    salon._id,
    'waitlist',
    null,
    customer._id
  );
}

/**
 * Template 3: Reminder SMS (24h before)
 */
export async function sendReminderSMS(booking) {
  const { customer, salon, service, startTime } = booking;

  // Format date/time
  const date = new Date(startTime).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
  const time = new Date(startTime).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Message template
  const message = `Erinnerung: Ihr Termin ist morgen! ⏰

${salon.businessName}
📅 ${date} um ${time}
✂️ ${service.name}

Adresse: ${salon.address || 'siehe Buchungsbestätigung'}

Wir freuen uns auf Sie! 😊

Bei Änderungen: ${salon.phone || salon.email}

Abmelden: Antworten Sie mit STOP`;

  return sendSMS(
    customer.phone,
    message,
    salon._id,
    'reminder',
    booking._id,
    customer._id
  );
}

/**
 * Template 4: No-Show Follow-up SMS
 */
export async function sendNoShowFollowup(booking) {
  const { customer, salon } = booking;

  // Message template
  const message = `Hallo ${customer.firstName},

Wir haben Sie heute vermisst bei ${salon.businessName}. 😔

Falls etwas dazwischen kam - kein Problem! Bitte sagen Sie beim nächsten Mal rechtzeitig ab, damit andere Kunden den Termin nutzen können.

Neuen Termin buchen:
${process.env.FRONTEND_URL}/booking/${salon._id}

Ihr ${salon.businessName} Team

Abmelden: Antworten Sie mit STOP`;

  return sendSMS(
    customer.phone,
    message,
    salon._id,
    'followup',
    booking._id,
    customer._id
  );
}

/**
 * Handle STOP replies (GDPR opt-out)
 */
export async function handleStopReply(phoneNumber, salonId) {
  const consent = await SMSConsent.findOne({
    phoneNumber,
    salonId
  });

  if (consent) {
    await consent.handleStopReply();
    logger.info(`📵 Customer opted out: ${phoneNumber}`);
  }
}

/**
 * Get SMS Statistics for Salon
 */
export async function getSMSStats(salonId, days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const endDate = new Date();

  const costReport = await SMSLog.getCostReport(salonId, startDate, endDate);
  const deliveryRate = await SMSLog.getDeliveryRate(salonId, days);

  return {
    ...costReport,
    ...deliveryRate
  };
}

export default {
  sendSMS,
  sendBookingConfirmation,
  sendWaitlistOffer,
  sendReminderSMS,
  sendNoShowFollowup,
  handleStopReply,
  getSMSStats
};
