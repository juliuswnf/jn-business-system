import mongoose from 'mongoose';

/**
 * BookingConfirmation Model
 * Tracks 48h confirmation requirement and auto-cancel logic
 */

const bookingConfirmationSchema = new mongoose.Schema({
  // References
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
    index: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    match: /^\+[1-9]\d{1,14}$/, // E.164 format
    comment: 'International format: +49...'
  },

  // Confirmation Status
  confirmationRequired: {
    type: Boolean,
    default: true
  },
  confirmationSentAt: {
    type: Date,
    comment: '48h before appointment'
  },
  confirmedAt: {
    type: Date,
    comment: 'When customer clicked confirmation link'
  },
  confirmationMethod: {
    type: String,
    enum: ['sms', 'whatsapp', 'email', 'manual'],
    default: 'sms'
  },
  confirmationToken: {
    type: String,
    unique: true,
    sparse: true,
    comment: 'Unique token for public confirmation link'
  },
  confirmationUrl: {
    type: String,
    comment: 'Full URL sent in SMS'
  },

  // SMS Tracking
  smsMessageId: {
    type: String,
    comment: 'MessageBird/Twilio message ID'
  },
  smsStatus: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'failed', 'undelivered'],
    default: 'queued'
  },
  smsDeliveredAt: {
    type: Date
  },
  smsFailureReason: {
    type: String
  },
  smsProvider: {
    type: String,
    enum: ['messagebird', 'twilio'],
    default: 'messagebird'
  },

  // Auto-Cancel Logic
  autoCancelScheduledAt: {
    type: Date,
    index: true,
    comment: '48h - 2h grace period = 46h before appointment'
  },
  autoCancelled: {
    type: Boolean,
    default: false,
    index: true
  },
  autoCancelledAt: {
    type: Date
  },
  autoCancelReason: {
    type: String,
    enum: ['no_confirmation', 'expired', 'manual'],
    comment: 'Why booking was cancelled'
  },

  // Reminders (Follow-ups)
  remindersSent: [{
    sentAt: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['first', 'second', 'final'],
      required: true
    },
    messageId: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    },
    deliveredAt: Date
  }],

  // Metadata
  ipAddress: {
    type: String,
    comment: 'IP of customer when confirmed (GDPR audit)'
  },
  userAgent: {
    type: String,
    comment: 'Browser/device when confirmed'
  }
}, {
  timestamps: true
});

// Indexes for performance
bookingConfirmationSchema.index({ salonId: 1, confirmedAt: 1 });
bookingConfirmationSchema.index({ autoCancelScheduledAt: 1, autoCancelled: 1 });
bookingConfirmationSchema.index({ smsStatus: 1, createdAt: -1 });

// Virtual: Is Confirmed?
bookingConfirmationSchema.virtual('isConfirmed').get(function() {
  return !!this.confirmedAt;
});

// Virtual: Time Remaining Until Auto-Cancel
bookingConfirmationSchema.virtual('hoursUntilAutoCancel').get(function() {
  if (!this.autoCancelScheduledAt || this.confirmedAt) return null;
  const now = new Date();
  const diff = this.autoCancelScheduledAt - now;
  return Math.max(0, diff / (1000 * 60 * 60));
});

// Method: Mark as Confirmed
bookingConfirmationSchema.methods.markConfirmed = function(ipAddress, userAgent) {
  this.confirmedAt = new Date();
  this.ipAddress = ipAddress;
  this.userAgent = userAgent;
  return this.save();
};

// Method: Mark as Auto-Cancelled
bookingConfirmationSchema.methods.markAutoCancelled = function(reason = 'no_confirmation') {
  this.autoCancelled = true;
  this.autoCancelledAt = new Date();
  this.autoCancelReason = reason;
  return this.save();
};

// Static: Find Pending Confirmations Expiring Soon
bookingConfirmationSchema.statics.findExpiringSoon = function(hoursThreshold = 24) {
  const cutoff = new Date(Date.now() + hoursThreshold * 60 * 60 * 1000);
  return this.find({
    confirmedAt: null,
    autoCancelled: false,
    autoCancelScheduledAt: { $lte: cutoff }
  });
};

// Static: Find Ready for Auto-Cancel
bookingConfirmationSchema.statics.findReadyForAutoCancel = function() {
  return this.find({
    confirmedAt: null,
    autoCancelled: false,
    autoCancelScheduledAt: { $lte: new Date() }
  });
};

const BookingConfirmation = mongoose.model('BookingConfirmation', bookingConfirmationSchema);

export default BookingConfirmation;
