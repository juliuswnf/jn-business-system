import messagebird from 'messagebird';
import SMSLog from '../models/SMSLog.js';
import SMSConsent from '../models/SMSConsent.js';

// Initialize MessageBird client
const messagebirdClient = messagebird(process.env.MESSAGEBIRD_API_KEY);
const ORIGINATOR = process.env.MESSAGEBIRD_ORIGINATOR || 'JN_Business';
const RATE_LIMIT = parseInt(process.env.MESSAGEBIRD_RATE_LIMIT_PER_SECOND || '10');

// Rate Limiting Queue
let smsQueue = [];
let isProcessingQueue = false;
let lastSentTime = 0;

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
    // Check SMS Consent (GDPR)
    const consent = await SMSConsent.findOne({ customerId, salonId });
    if (!consent || !consent.active) {
      throw new Error('Customer has not opted in for SMS notifications');
    }

    // Check Do-Not-Disturb hours
    if (!consent.canSendNow()) {
      throw new Error('Cannot send SMS during Do-Not-Disturb hours (22:00-08:00)');
    }

    // Send via MessageBird
    const result = await new Promise((resolve, reject) => {
      messagebirdClient.messages.create(
        {
          originator: ORIGINATOR,
          recipients: [phoneNumber],
          body: message
        },
        (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        }
      );
    });

    // Mark as sent
    await smsLog.markAsSent(result.id, 7); // 7 cents = €0.07

    console.log(`✅ SMS sent successfully:`, {
      messageId: result.id,
      phoneNumber,
      template,
      salonId
    });

    return {
      success: true,
      messageId: result.id,
      smsLogId: smsLog._id
    };

  } catch (error) {
    console.error(`❌ SMS failed:`, {
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
      console.log(`🔄 Retrying SMS in ${backoffDelay}ms (attempt ${retryCount + 1}/3)`);
      
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
 * Main SMS Send Function (with rate limiting)
 */
export async function sendSMS(phoneNumber, message, salonId, template, bookingId = null, customerId = null) {
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
  const { customer, salon, preferredService, preferredDate, preferredTime } = waitlistEntry;
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
    console.log(`📵 Customer opted out: ${phoneNumber}`);
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
