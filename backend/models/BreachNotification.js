import mongoose from 'mongoose';

/**
 * Breach Notification Model
 * Tracks individual notifications sent to patients
 */
const breachNotificationSchema = new mongoose.Schema({
  // Link to incident
  incidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BreachIncident',
    required: true
  },

  // Patient details
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Notification type
  notificationType: {
    type: String,
    enum: ['standard', 'expedited', 'substitute'],
    default: 'standard'
  },

  // Status
  status: {
    type: String,
    enum: [
      'pending_approval',
      'approved',
      'scheduled',
      'sent',
      'delivered',
      'failed',
      'bounced'
    ],
    default: 'pending_approval'
  },

  // Channels
  channels: [{
    type: String,
    enum: ['email', 'sms', 'mail', 'phone']
  }],

  // Scheduling
  scheduledDate: Date,
  sentAt: Date,
  deliveredAt: Date,

  // Content
  subject: String,
  messageBody: String,

  // Delivery tracking
  emailStatus: {
    sent: Boolean,
    deliveryId: String,
    bounced: Boolean,
    opened: Boolean,
    openedAt: Date
  },

  smsStatus: {
    sent: Boolean,
    deliveryId: String,
    delivered: Boolean,
    deliveredAt: Date
  },

  mailStatus: {
    sent: Boolean,
    trackingNumber: String,
    delivered: Boolean,
    deliveredAt: Date
  },

  phoneStatus: {
    called: Boolean,
    answered: Boolean,
    calledAt: Date,
    duration: Number // seconds
  },

  // Response tracking
  patientAcknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: Date,
  patientResponse: String,

  // Retry attempts
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: Date,
  maxRetries: {
    type: Number,
    default: 3
  },

  // Failure details
  failureReason: String,
  failureDetails: mongoose.Schema.Types.Mixed,

  // Compliance
  hipaaCompliant: {
    type: Boolean,
    default: true
  },
  notificationTimeline: {
    within60Days: Boolean,
    daysAfterDetection: Number
  },

  // Approved by
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
breachNotificationSchema.index({ incidentId: 1, patientId: 1 });
breachNotificationSchema.index({ status: 1, scheduledDate: 1 });
breachNotificationSchema.index({ sentAt: -1 });

// Static method: Get pending notifications
breachNotificationSchema.statics.getPendingNotifications = function() {
  return this.find({
    status: 'scheduled',
    scheduledDate: { $lte: new Date() }
  }).populate('incidentId patientId');
};

// Static method: Get failed notifications
breachNotificationSchema.statics.getFailedNotifications = function(incidentId) {
  return this.find({
    incidentId,
    status: { $in: ['failed', 'bounced'] },
    retryCount: { $lt: 3 }
  }).populate('patientId');
};

export default mongoose.model('BreachNotification', breachNotificationSchema);
