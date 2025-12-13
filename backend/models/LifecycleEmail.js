import mongoose from 'mongoose';

/**
 * Lifecycle Email Model
 * Tracks which lifecycle emails have been sent to each salon
 * for automated trial nurturing and conversion
 */

const lifecycleEmailSchema = new mongoose.Schema({
  // Reference to salon
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },

  // Reference to owner user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Email type (day of trial)
  emailType: {
    type: String,
    enum: [
      'welcome_day1',      // Day 1: Welcome + Setup Guide
      'engagement_day3',   // Day 3: "Created your first appointment?"
      'midtrial_day7',     // Day 7: "3 weeks trial left - need help?"
      'urgency_day23',     // Day 23: "Only 7 days left"
      'expiry_day30',      // Day 30: "Trial ends today - upgrade now"
      'expired_day31',     // Day 31: "Your trial expired - get 20% off"
      'winback_day45'      // Day 45: Win-back campaign
    ],
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'skipped'],
    default: 'pending'
  },

  // Scheduled send time
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },

  // When actually sent
  sentAt: {
    type: Date
  },

  // Email content (for logging)
  subject: String,

  // Error message if failed
  error: String,

  // Retry count
  retries: {
    type: Number,
    default: 0
  },

  // Was email opened? (future tracking)
  opened: {
    type: Boolean,
    default: false
  },

  // Was CTA clicked? (future tracking)
  clicked: {
    type: Boolean,
    default: false
  },

  // Did user convert after this email?
  convertedAfter: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for finding pending emails
lifecycleEmailSchema.index({ status: 1, scheduledFor: 1 });

// Prevent duplicate emails
lifecycleEmailSchema.index({ salonId: 1, emailType: 1 }, { unique: true });

/**
 * Static: Schedule all lifecycle emails for a new salon
 */
lifecycleEmailSchema.statics.scheduleForNewSalon = async function(salon, user) {
  const now = new Date();
  const trialStart = salon.createdAt || now;

  const emailSchedule = [
    { type: 'welcome_day1', days: 0 },      // Immediately (or within 1 hour)
    { type: 'engagement_day3', days: 3 },
    { type: 'midtrial_day7', days: 7 },
    { type: 'urgency_day23', days: 23 },
    { type: 'expiry_day30', days: 30 },
    { type: 'expired_day31', days: 31 },
    { type: 'winback_day45', days: 45 }
  ];

  const emails = [];

  for (const schedule of emailSchedule) {
    const scheduledFor = new Date(trialStart);
    scheduledFor.setDate(scheduledFor.getDate() + schedule.days);

    // For day 1, schedule within 1 hour
    if (schedule.type === 'welcome_day1') {
      scheduledFor.setTime(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    } else {
      // Schedule for 10:00 AM on the target day
      scheduledFor.setHours(10, 0, 0, 0);
    }

    try {
      const email = await this.create({
        salonId: salon._id,
        userId: user._id,
        emailType: schedule.type,
        scheduledFor,
        status: 'pending'
      });
      emails.push(email);
    } catch (error) {
      // Ignore duplicate key errors (email already scheduled)
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  return emails;
};

/**
 * Static: Get pending emails due for sending
 */
lifecycleEmailSchema.statics.getPendingEmails = function(limit = 50) {
  return this.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() },
    retries: { $lt: 3 }
  })
    .populate('salonId')
    .populate('userId')
    .limit(limit);
};

/**
 * Static: Cancel all pending emails for a salon (e.g., when they convert)
 */
lifecycleEmailSchema.statics.cancelForSalon = async function(salonId, reason = 'converted') {
  return this.updateMany(
    { salonId, status: 'pending' },
    {
      status: 'skipped',
      error: reason
    }
  );
};

/**
 * Static: Mark conversion after specific email
 */
lifecycleEmailSchema.statics.markConversion = async function(salonId) {
  // Find the last sent email
  const lastSent = await this.findOne({
    salonId,
    status: 'sent'
  }).sort({ sentAt: -1 });

  if (lastSent) {
    lastSent.convertedAfter = true;
    await lastSent.save();
  }

  // Cancel remaining emails
  await this.cancelForSalon(salonId, 'converted');
};

const LifecycleEmail = mongoose.model('LifecycleEmail', lifecycleEmailSchema);

export default LifecycleEmail;
