import mongoose from 'mongoose';

/**
 * SMSLog Model
 * Tracks all sent SMS for cost reporting and audit trail
 */

const smsLogSchema = new mongoose.Schema({
  // References
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    comment: 'Optional: If SMS related to booking'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    comment: 'Optional: Customer who received SMS'
  },

  // SMS Content
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    match: /^\+[1-9]\d{1,14}$/, // E.164 format
    comment: 'International format: +49...'
  },
  message: {
    type: String,
    required: true,
    maxlength: 1600,
    comment: 'Full SMS text sent'
  },
  template: {
    type: String,
    enum: ['confirmation', 'reminder', 'waitlist', 'followup', 'custom'],
    required: true,
    index: true
  },

  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending',
    index: true,
    required: true
  },
  provider: {
    type: String,
    default: 'messagebird',
    enum: ['messagebird', 'twilio', 'test']
  },
  messageId: {
    type: String,
    unique: true,
    sparse: true,
    comment: 'Provider message ID (MessageBird/Twilio)'
  },

  // Cost Tracking
  cost: {
    type: Number,
    min: 0,
    comment: 'Cost in EUR cents (e.g., 7 = €0.07)'
  },

  // Error Handling
  errorMessage: {
    type: String,
    comment: 'Error message if SMS failed'
  },
  errorCode: {
    type: String,
    comment: 'Provider error code'
  },
  retries: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },

  // Timestamps
  sentAt: {
    type: Date,
    comment: 'When SMS was sent to provider'
  },
  deliveredAt: {
    type: Date,
    comment: 'When provider confirmed delivery'
  }
}, {
  timestamps: true
});

// Indexes for performance
smsLogSchema.index({ salonId: 1, createdAt: -1 }); // Cost reports
smsLogSchema.index({ status: 1, retries: 1 }); // Retry worker
smsLogSchema.index({ messageId: 1 }, { unique: true, sparse: true });
smsLogSchema.index({ template: 1, status: 1 }); // Analytics

// Method: Mark as Sent
smsLogSchema.methods.markAsSent = function(messageId, cost = 7) {
  this.status = 'sent';
  this.messageId = messageId;
  this.cost = cost;
  this.sentAt = new Date();
  return this.save();
};

// Method: Mark as Delivered
smsLogSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Method: Mark as Failed
smsLogSchema.methods.markAsFailed = function(errorMessage, errorCode = null) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.errorCode = errorCode;
  this.retries += 1;
  return this.save();
};

// Method: Can Retry?
smsLogSchema.methods.canRetry = function() {
  return this.retries < 3 && this.status === 'failed';
};

// Static: Get Cost Report for Salon
smsLogSchema.statics.getCostReport = async function(salonId, startDate, endDate) {
  const logs = await this.find({
    salonId,
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $in: ['sent', 'delivered'] }
  });

  const totalSMS = logs.length;
  const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const avgCostPerSMS = totalSMS > 0 ? totalCost / totalSMS : 0;

  const byTemplate = {};
  logs.forEach(log => {
    if (!byTemplate[log.template]) {
      byTemplate[log.template] = { count: 0, cost: 0 };
    }
    byTemplate[log.template].count += 1;
    byTemplate[log.template].cost += log.cost || 0;
  });

  return {
    totalSMS,
    totalCost: totalCost / 100, // Convert cents to EUR
    avgCostPerSMS: avgCostPerSMS / 100,
    byTemplate,
    period: { start: startDate, end: endDate }
  };
};

// Static: Get Failed SMS Needing Retry
smsLogSchema.statics.getFailedNeedingRetry = function() {
  return this.find({
    status: 'failed',
    retries: { $lt: 3 }
  }).sort({ createdAt: 1 }).limit(100);
};

// Static: Get Delivery Rate
smsLogSchema.statics.getDeliveryRate = async function(salonId, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const total = await this.countDocuments({
    salonId,
    createdAt: { $gte: since },
    status: { $in: ['sent', 'delivered', 'failed'] }
  });

  const delivered = await this.countDocuments({
    salonId,
    createdAt: { $gte: since },
    status: 'delivered'
  });

  const rate = total > 0 ? (delivered / total) * 100 : 0;

  return {
    total,
    delivered,
    failed: total - delivered,
    deliveryRate: Math.round(rate * 10) / 10
  };
};

const SMSLog = mongoose.model('SMSLog', smsLogSchema);

export default SMSLog;
