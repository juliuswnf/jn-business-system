import mongoose from 'mongoose';

const emailQueueSchema = new mongoose.Schema({
  // Email Details
  to: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  html: {
    type: String
  },

  // Email Type
  type: {
    type: String,
    enum: ['confirmation', 'reminder', 'review', 'notification', 'custom'],
    required: true
  },

  // Scheduling
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  sentAt: {
    type: Date
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'sending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  lastAttemptAt: {
    type: Date
  },
  error: {
    message: String,
    stack: String,
    code: String
  },

  // Related Documents
  salon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },

  // Metadata
  priority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  metadata: {
    type: Map,
    of: String
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
emailQueueSchema.index({ status: 1, scheduledFor: 1 });
emailQueueSchema.index({ salon: 1, status: 1 });
emailQueueSchema.index({ booking: 1 });
emailQueueSchema.index({ type: 1, status: 1 });

// Methods

// Mark email as sent
emailQueueSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Mark email as failed
emailQueueSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.attempts += 1;
  this.lastAttemptAt = new Date();
  this.error = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    code: error.code
  };
  return this.save();
};

// Retry sending
emailQueueSchema.methods.retry = function() {
  if (this.attempts >= this.maxAttempts) {
    return Promise.reject(new Error('Max attempts reached'));
  }

  this.status = 'pending';
  this.attempts += 1;
  this.lastAttemptAt = new Date();
  return this.save();
};

// Cancel email
emailQueueSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Check if email is ready to send
emailQueueSchema.methods.isReadyToSend = function() {
  const now = new Date();
  return this.status === 'pending' &&
         this.scheduledFor <= now &&
         this.attempts < this.maxAttempts;
};

// Statics

// Get all emails ready to send
emailQueueSchema.statics.getReadyToSend = function(limit = 100) {
  const now = new Date();
  return this.find({
    status: 'pending',
    scheduledFor: { $lte: now },
    attempts: { $lt: 3 }
  })
    .sort({ priority: -1, scheduledFor: 1 })
    .limit(limit)
    .populate('salon', 'name email')
    .populate('booking', 'serviceId date startTime');
};

// Schedule a new email
emailQueueSchema.statics.scheduleEmail = function(emailData) {
  return this.create(emailData);
};

// Cancel all pending emails for a booking
emailQueueSchema.statics.cancelBookingEmails = function(bookingId) {
  return this.updateMany(
    {
      booking: bookingId,
      status: 'pending'
    },
    {
      status: 'cancelled'
    }
  );
};

// Get pending count by salon
emailQueueSchema.statics.getPendingCountBySalon = function(salonId) {
  return this.countDocuments({
    salon: salonId,
    status: 'pending'
  });
};

// Clean up old emails (older than 30 days)
emailQueueSchema.statics.cleanup = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    $or: [
      { status: 'sent', sentAt: { $lt: cutoffDate } },
      { status: 'failed', createdAt: { $lt: cutoffDate } },
      { status: 'cancelled', createdAt: { $lt: cutoffDate } }
    ]
  });
};

// Pre-save hook
emailQueueSchema.pre('save', function(next) {
  // Ensure scheduledFor is not in the past for new emails
  if (this.isNew && this.scheduledFor < new Date()) {
    this.scheduledFor = new Date();
  }
  next();
});

// ES6 Export
export default mongoose.model('EmailQueue', emailQueueSchema);
