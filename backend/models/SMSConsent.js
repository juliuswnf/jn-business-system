import mongoose from 'mongoose';

/**
 * SMSConsent Model
 * GDPR-compliant SMS consent tracking
 */

const smsConsentSchema = new mongoose.Schema({
  // Customer Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    comment: 'If registered user'
  },
  customerId: {
    type: String,
    comment: 'For guest bookings (email or phone as ID)'
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^\+[1-9]\d{1,14}$/, // E.164 format
    index: true
  },

  // Salon Reference (consent is salon-specific)
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },

  // Consent Status
  opted: {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  optedAt: {
    type: Date,
    comment: 'When customer opted in'
  },
  optedOutAt: {
    type: Date,
    comment: 'When customer opted out'
  },

  // Consent Source (GDPR audit requirement)
  source: {
    type: String,
    enum: [
      'booking_form',      // Checkbox during booking
      'settings',          // User settings page
      'sms_reply',         // Replied "YES" to opt-in SMS
      'phone_call',        // Verbal consent (logged by staff)
      'manual',            // Manually added by admin
      'import'             // Imported from old system
    ],
    required: true,
    comment: 'How consent was obtained'
  },

  // Audit Trail (GDPR proof)
  ipAddress: {
    type: String,
    comment: 'IP address when consent given (for web forms)'
  },
  userAgent: {
    type: String,
    comment: 'Browser/device info when consent given'
  },
  consentText: {
    type: String,
    comment: 'Exact text customer agreed to (for legal proof)'
  },

  // Consent Types (granular)
  consentTypes: {
    transactional: {
      type: Boolean,
      default: true,
      comment: 'Booking confirmations, reminders (usually required)'
    },
    marketing: {
      type: Boolean,
      default: false,
      comment: 'Promotional offers, waitlist opportunities'
    },
    serviceUpdates: {
      type: Boolean,
      default: false,
      comment: 'Updates about services, pricing'
    }
  },

  // Communication Preferences
  preferredLanguage: {
    type: String,
    enum: ['de', 'en', 'fr', 'es', 'it'],
    default: 'de'
  },
  doNotDisturbHours: {
    startTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      default: '22:00',
      comment: 'No SMS after this time'
    },
    endTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      default: '08:00',
      comment: 'No SMS before this time'
    }
  },

  // Opt-Out Tracking
  optOutReason: {
    type: String,
    enum: [
      'too_frequent',
      'not_interested',
      'changed_phone',
      'privacy_concerns',
      'other',
      'spam_complaint'
    ],
    comment: 'Why customer opted out (for analytics)'
  },
  optOutMethod: {
    type: String,
    enum: ['sms_stop', 'web_form', 'phone_call', 'email_request', 'manual'],
    comment: 'How customer opted out'
  },

  // Message History (last 10 for quick reference)
  recentMessages: [{
    sentAt: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['transactional', 'marketing', 'service_update'],
      required: true
    },
    messageId: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'undelivered']
    }
  }],

  // Compliance Flags
  gdprExportRequestedAt: {
    type: Date,
    comment: 'When customer requested data export'
  },
  dataDeleteRequestedAt: {
    type: Date,
    comment: 'When customer requested deletion (GDPR right to be forgotten)'
  },
  deletionScheduledAt: {
    type: Date,
    comment: 'When record will be auto-deleted (30 days after request)'
  }
}, {
  timestamps: true
});

// Compound indexes
smsConsentSchema.index({ salonId: 1, opted: 1 });
smsConsentSchema.index({ customerPhone: 1, salonId: 1 }, { unique: true });

// Virtual: Can Send Transactional SMS?
smsConsentSchema.virtual('canSendTransactional').get(function() {
  return this.opted && this.consentTypes.transactional;
});

// Virtual: Can Send Marketing SMS?
smsConsentSchema.virtual('canSendMarketing').get(function() {
  return this.opted && this.consentTypes.marketing;
});

// Virtual: Is In Do-Not-Disturb Hours?
smsConsentSchema.virtual('isInDndHours').get(function() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  const { startTime, endTime } = this.doNotDisturbHours;

  // If DND spans midnight (e.g., 22:00 - 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }
  // Normal range (e.g., 12:00 - 14:00)
  return currentTime >= startTime && currentTime < endTime;
});

// Method: Opt In
smsConsentSchema.methods.optIn = function(source, ipAddress = null, userAgent = null, consentText = null) {
  this.opted = true;
  this.optedAt = new Date();
  this.optedOutAt = null;
  this.source = source;
  this.ipAddress = ipAddress;
  this.userAgent = userAgent;
  this.consentText = consentText;
  return this.save();
};

// Method: Opt Out
smsConsentSchema.methods.optOut = function(reason = 'not_interested', method = 'web_form') {
  this.opted = false;
  this.optedOutAt = new Date();
  this.optOutReason = reason;
  this.optOutMethod = method;
  return this.save();
};

// Method: Add Message to History
smsConsentSchema.methods.addMessageToHistory = function(type, messageId, status = 'sent') {
  this.recentMessages.push({
    sentAt: new Date(),
    type,
    messageId,
    status
  });

  // Keep only last 10 messages
  if (this.recentMessages.length > 10) {
    this.recentMessages = this.recentMessages.slice(-10);
  }

  return this.save();
};

// Method: Request Data Deletion (GDPR)
smsConsentSchema.methods.requestDeletion = function() {
  this.dataDeleteRequestedAt = new Date();
  this.deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return this.save();
};

// Static: Find Opted-In Customers for Salon
smsConsentSchema.statics.findOptedInForSalon = function(salonId, type = 'transactional') {
  const query = {
    salonId,
    opted: true
  };

  if (type === 'transactional') {
    query['consentTypes.transactional'] = true;
  } else if (type === 'marketing') {
    query['consentTypes.marketing'] = true;
  }

  return this.find(query);
};

// Static: Handle "STOP" Reply
smsConsentSchema.statics.handleStopReply = async function(customerPhone, salonId) {
  const consent = await this.findOne({ customerPhone, salonId });
  if (consent) {
    await consent.optOut('spam_complaint', 'sms_stop');
    return { success: true, message: 'Opted out successfully' };
  }
  return { success: false, message: 'Consent record not found' };
};

// Static: Process Scheduled Deletions (Cron Job)
smsConsentSchema.statics.processScheduledDeletions = async function() {
  const now = new Date();
  const toDelete = await this.find({
    deletionScheduledAt: { $lte: now }
  });

  const deletedIds = [];
  for (const consent of toDelete) {
    deletedIds.push(consent._id);
    await consent.deleteOne();
  }

  return { count: deletedIds.length, ids: deletedIds };
};

const SMSConsent = mongoose.model('SMSConsent', smsConsentSchema);

export default SMSConsent;
