import mongoose from 'mongoose';

/**
 * Waitlist Model
 * Customers waiting for available slots
 */

const waitlistSchema = new mongoose.Schema({
  // Customer Info
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    comment: 'If registered user, otherwise null'
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    match: /^\+[1-9]\d{1,14}$/, // E.164 format
    index: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Salon & Service
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },

  // Preferred Slots
  preferredDates: [{
    type: Date,
    comment: 'Specific dates customer is available'
  }],
  preferredTimeRanges: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      comment: '0=Sunday, 1=Monday, ..., 6=Saturday'
    },
    startTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      comment: 'HH:MM format, e.g., "09:00"'
    },
    endTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      comment: 'HH:MM format, e.g., "18:00"'
    }
  }],

  // Constraints
  maxDistanceKm: {
    type: Number,
    min: 0,
    comment: 'Optional: geographic constraint'
  },
  minAdvanceNoticeHours: {
    type: Number,
    default: 24,
    min: 0,
    comment: 'Minimum hours before appointment'
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'matched', 'expired', 'cancelled', 'declined'],
    default: 'active',
    index: true
  },
  matchedBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    comment: 'Set when slot found and booking created'
  },
  matchedAt: {
    type: Date
  },

  // Notification Tracking
  notificationsSent: [{
    sentAt: {
      type: Date,
      required: true
    },
    slotStartTime: {
      type: Date,
      required: true
    },
    messageId: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'expired']
    },
    response: {
      type: String,
      enum: ['accepted', 'declined', 'no_response'],
      default: 'no_response'
    },
    respondedAt: Date
  }],

  // Expiry
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: true,
    comment: 'Auto-expire waitlist entries after 30 days'
  },

  // Priority Scoring (Rule-Based)
  priorityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true,
    comment: 'Calculated by matching algorithm'
  },
  reliabilityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
    comment: 'Based on past booking history (0=unreliable, 100=perfect)'
  },

  // Customer History (denormalized for performance)
  customerStats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalNoShows: {
      type: Number,
      default: 0
    },
    avgSpending: {
      type: Number,
      default: 0
    },
    lastBookingDate: Date,
    avgResponseTimeMinutes: {
      type: Number,
      comment: 'How fast customer responds to notifications'
    }
  },

  // Notes
  notes: {
    type: String,
    maxlength: 500,
    comment: 'Internal notes or customer special requests'
  }
}, {
  timestamps: true
});

// Compound indexes for performance
waitlistSchema.index({ salonId: 1, status: 1, priorityScore: -1 });
waitlistSchema.index({ salonId: 1, serviceId: 1, status: 1 });
waitlistSchema.index({ expiresAt: 1, status: 1 });

// Virtual: Days Until Expiry
waitlistSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diff = this.expiresAt - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual: Total Notifications Sent
waitlistSchema.virtual('totalNotificationsSent').get(function() {
  return this.notificationsSent.length;
});

// Virtual: Acceptance Rate
waitlistSchema.virtual('acceptanceRate').get(function() {
  const total = this.notificationsSent.length;
  if (total === 0) return 0;
  const accepted = this.notificationsSent.filter(n => n.response === 'accepted').length;
  return (accepted / total) * 100;
});

// Method: Calculate Priority Score (Rule-Based, not ML)
waitlistSchema.methods.calculatePriorityScore = function() {
  let score = 0;

  // 1. Loyalty: More bookings = higher priority
  score += Math.min(this.customerStats.totalBookings * 2, 30);

  // 2. Spending: Higher spenders get priority
  if (this.customerStats.avgSpending) {
    score += Math.min(this.customerStats.avgSpending / 10, 20);
  }

  // 3. Recency: Recent customers get bonus
  if (this.customerStats.lastBookingDate) {
    const daysSince = (Date.now() - this.customerStats.lastBookingDate) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) score += 15;
    else if (daysSince < 90) score += 10;
  }

  // 4. Reliability: No-show rate penalty
  if (this.customerStats.totalBookings > 0) {
    const noShowRate = this.customerStats.totalNoShows / this.customerStats.totalBookings;
    score -= noShowRate * 20; // Penalty for unreliable customers
  }

  // 5. Response speed: Fast responders get priority
  if (this.customerStats.avgResponseTimeMinutes) {
    if (this.customerStats.avgResponseTimeMinutes < 60) score += 10;
    else if (this.customerStats.avgResponseTimeMinutes < 180) score += 5;
  }

  // 6. Waitlist age: Longer wait = higher priority
  const daysOnWaitlist = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
  score += Math.min(daysOnWaitlist, 15);

  this.priorityScore = Math.max(0, Math.min(score, 100));
  return this.priorityScore;
};

// Method: Add Notification
waitlistSchema.methods.addNotification = function(slotStartTime, messageId, status = 'sent') {
  this.notificationsSent.push({
    sentAt: new Date(),
    slotStartTime,
    messageId,
    status
  });
  return this.save();
};

// Method: Mark as Matched
waitlistSchema.methods.markMatched = function(bookingId) {
  this.status = 'matched';
  this.matchedBookingId = bookingId;
  this.matchedAt = new Date();
  return this.save();
};

// Static: Find Active Waitlist for Salon
waitlistSchema.statics.findActiveForSalon = function(salonId, serviceId = null) {
  const query = {
    salonId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  };
  if (serviceId) query.serviceId = serviceId;
  return this.find(query).sort({ priorityScore: -1, createdAt: 1 });
};

// Static: Expire Old Entries (Cron Job)
waitlistSchema.statics.expireOldEntries = async function() {
  const result = await this.updateMany(
    {
      status: 'active',
      expiresAt: { $lte: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  return result.modifiedCount;
};

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

export default Waitlist;
