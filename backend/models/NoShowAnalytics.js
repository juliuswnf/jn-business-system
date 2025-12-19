import mongoose from 'mongoose';

/**
 * NoShowAnalytics Model
 * Aggregated no-show statistics and revenue impact tracking
 */

const noShowAnalyticsSchema = new mongoose.Schema({
  // Reference
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },

  // Time Period
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
    index: true
  },
  periodStart: {
    type: Date,
    required: true,
    index: true
  },
  periodEnd: {
    type: Date,
    required: true
  },

  // Booking Metrics
  totalBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalConfirmed: {
    type: Number,
    default: 0,
    min: 0
  },
  totalNoShows: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCancelled: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCompleted: {
    type: Number,
    default: 0,
    min: 0
  },

  // No-Show Rate
  noShowRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    comment: 'Percentage of bookings that were no-shows'
  },
  noShowRateTrend: {
    type: String,
    enum: ['up', 'down', 'stable', 'unknown'],
    default: 'unknown',
    comment: 'Compared to previous period'
  },

  // Revenue Impact
  revenueAtRisk: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Total € value of unconfirmed bookings'
  },
  revenueSaved: {
    type: Number,
    default: 0,
    min: 0,
    comment: '€ recovered by filling cancelled slots via waitlist'
  },
  revenueLost: {
    type: Number,
    default: 0,
    min: 0,
    comment: '€ lost due to no-shows and unfilled slots'
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Total revenue from completed bookings'
  },

  // Confirmation Stats
  confirmationsSent: {
    type: Number,
    default: 0,
    min: 0
  },
  confirmationsReceived: {
    type: Number,
    default: 0,
    min: 0
  },
  confirmationRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    comment: 'Percentage of sent confirmations that were confirmed'
  },
  avgConfirmationTimeMinutes: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Average time from SMS sent to confirmed'
  },

  // Auto-Cancel Stats
  autoCancellations: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Bookings auto-cancelled due to no confirmation'
  },
  autoCancelRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Waitlist Performance
  waitlistEntries: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Total waitlist entries added this period'
  },
  waitlistMatches: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Slots filled from waitlist'
  },
  waitlistAcceptanceRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    comment: 'Percentage of waitlist notifications that were accepted'
  },
  waitlistRevenue: {
    type: Number,
    default: 0,
    min: 0,
    comment: '€ generated from waitlist bookings'
  },
  avgWaitlistFillTimeHours: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Average hours from slot opening to fill'
  },

  // SMS Stats
  smsSent: {
    type: Number,
    default: 0,
    min: 0
  },
  smsDelivered: {
    type: Number,
    default: 0,
    min: 0
  },
  smsFailed: {
    type: Number,
    default: 0,
    min: 0
  },
  smsDeliveryRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  smsCost: {
    type: Number,
    default: 0,
    min: 0,
    comment: '€ spent on SMS this period'
  },

  // Customer Reliability Tracking
  topReliableCustomers: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    customerName: String,
    reliabilityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    totalBookings: Number,
    noShowCount: Number,
    completedCount: Number,
    totalRevenue: Number
  }],

  bottomUnreliableCustomers: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    customerName: String,
    reliabilityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    totalBookings: Number,
    noShowCount: Number,
    noShowRate: Number
  }],

  // Service-Level Breakdown
  serviceBreakdown: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    serviceName: String,
    totalBookings: Number,
    noShows: Number,
    noShowRate: Number,
    revenueLost: Number
  }],

  // Time-of-Day Breakdown
  timeSlotBreakdown: [{
    hour: {
      type: Number,
      min: 0,
      max: 23
    },
    totalBookings: Number,
    noShows: Number,
    noShowRate: Number
  }],

  // Day-of-Week Breakdown
  dayOfWeekBreakdown: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      comment: '0=Sunday, 6=Saturday'
    },
    totalBookings: Number,
    noShows: Number,
    noShowRate: Number
  }],

  // Comparison to Previous Period
  comparisonToPrevious: {
    noShowRateChange: Number,    // % change
    revenueChange: Number,        // € change
    confirmationRateChange: Number,
    waitlistFillRateChange: Number
  }
}, {
  timestamps: true
});

// Compound indexes
noShowAnalyticsSchema.index({ salonId: 1, period: 1, periodStart: -1 });
noShowAnalyticsSchema.index({ salonId: 1, noShowRate: -1 });

// Virtual: Fill Rate
noShowAnalyticsSchema.virtual('slotFillRate').get(function() {
  if (this.totalBookings === 0) return 0;
  const filled = this.totalCompleted + this.waitlistMatches;
  return (filled / this.totalBookings) * 100;
});

// Virtual: ROI of No-Show Killer
noShowAnalyticsSchema.virtual('systemROI').get(function() {
  if (this.smsCost === 0) return 0;
  const benefit = this.revenueSaved;
  return ((benefit - this.smsCost) / this.smsCost) * 100;
});

// Virtual: Cost Per Saved Booking
noShowAnalyticsSchema.virtual('costPerSavedBooking').get(function() {
  if (this.waitlistMatches === 0) return 0;
  return this.smsCost / this.waitlistMatches;
});

// Static: Generate Analytics for Period
noShowAnalyticsSchema.statics.generateForPeriod = async function(salonId, period, periodStart, periodEnd) {
  const Booking = mongoose.model('Booking');
  const BookingConfirmation = mongoose.model('BookingConfirmation');
  const Waitlist = mongoose.model('Waitlist');

  // Fetch all bookings in period
  const bookings = await Booking.find({
    salonId,
    bookingDate: { $gte: periodStart, $lte: periodEnd }
  }).populate('serviceId');

  // Calculate metrics
  const totalBookings = bookings.length;
  const totalNoShows = bookings.filter(b => b.status === 'no-show').length;
  const totalCompleted = bookings.filter(b => b.status === 'completed').length;
  const totalCancelled = bookings.filter(b => b.status === 'cancelled').length;

  const noShowRate = totalBookings > 0 ? (totalNoShows / totalBookings) * 100 : 0;

  // Revenue calculations
  const revenueLost = bookings
    .filter(b => b.status === 'no-show')
    .reduce((sum, b) => sum + (b.price || 0), 0);

  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.price || 0), 0);

  // Confirmation stats
  const confirmations = await BookingConfirmation.find({
    salonId,
    createdAt: { $gte: periodStart, $lte: periodEnd }
  });

  const confirmationsSent = confirmations.length;
  const confirmationsReceived = confirmations.filter(c => c.confirmedAt).length;
  const confirmationRate = confirmationsSent > 0
    ? (confirmationsReceived / confirmationsSent) * 100
    : 0;

  // Waitlist stats
  const waitlistMatches = await Waitlist.countDocuments({
    salonId,
    status: 'matched',
    matchedAt: { $gte: periodStart, $lte: periodEnd }
  });

  // Create analytics record
  const analytics = new this({
    salonId,
    period,
    periodStart,
    periodEnd,
    totalBookings,
    totalNoShows,
    totalCompleted,
    totalCancelled,
    noShowRate: Math.round(noShowRate * 10) / 10,
    revenueLost: Math.round(revenueLost * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    confirmationsSent,
    confirmationsReceived,
    confirmationRate: Math.round(confirmationRate * 10) / 10,
    waitlistMatches
  });

  await analytics.save();
  return analytics;
};

// Static: Get Dashboard Summary
noShowAnalyticsSchema.statics.getDashboardSummary = async function(salonId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const analytics = await this.find({
    salonId,
    periodStart: { $gte: since }
  }).sort({ periodStart: -1 });

  if (analytics.length === 0) {
    return {
      noShowRate: 0,
      revenueSaved: 0,
      revenueLost: 0,
      confirmationRate: 0,
      waitlistFillRate: 0,
      totalBookings: 0
    };
  }

  // Aggregate across periods
  const summary = analytics.reduce((acc, a) => ({
    totalBookings: acc.totalBookings + a.totalBookings,
    totalNoShows: acc.totalNoShows + a.totalNoShows,
    revenueSaved: acc.revenueSaved + a.revenueSaved,
    revenueLost: acc.revenueLost + a.revenueLost,
    confirmationsSent: acc.confirmationsSent + a.confirmationsSent,
    confirmationsReceived: acc.confirmationsReceived + a.confirmationsReceived,
    waitlistMatches: acc.waitlistMatches + a.waitlistMatches
  }), {
    totalBookings: 0,
    totalNoShows: 0,
    revenueSaved: 0,
    revenueLost: 0,
    confirmationsSent: 0,
    confirmationsReceived: 0,
    waitlistMatches: 0
  });

  return {
    noShowRate: summary.totalBookings > 0
      ? (summary.totalNoShows / summary.totalBookings) * 100
      : 0,
    revenueSaved: Math.round(summary.revenueSaved * 100) / 100,
    revenueLost: Math.round(summary.revenueLost * 100) / 100,
    confirmationRate: summary.confirmationsSent > 0
      ? (summary.confirmationsReceived / summary.confirmationsSent) * 100
      : 0,
    waitlistFillRate: summary.waitlistMatches > 0
      ? (summary.waitlistMatches / summary.totalNoShows) * 100
      : 0,
    totalBookings: summary.totalBookings
  };
};

const NoShowAnalytics = mongoose.model('NoShowAnalytics', noShowAnalyticsSchema);

export default NoShowAnalytics;
