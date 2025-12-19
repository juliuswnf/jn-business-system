import mongoose from 'mongoose';

const MarketingCampaignSchema = new mongoose.Schema(
  {
    // Salon reference
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      index: true
    },

    // Campaign info
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    type: {
      type: String,
      required: true,
      enum: ['inactive_customers', 'birthday', 'last_minute', 'upsell', 'loyalty', 'referral'],
      index: true
    },

    status: {
      type: String,
      required: true,
      enum: ['draft', 'active', 'paused'],
      default: 'draft',
      index: true
    },

    tier: {
      type: String,
      required: true,
      enum: ['starter', 'professional', 'enterprise'],
      index: true
    },

    // Targeting rules
    rules: {
      // For inactive_customers
      inactiveDays: {
        type: Number,
        min: 30,
        max: 365
      },

      // For birthday
      birthdayDaysBefore: {
        type: Number,
        min: 0,
        max: 30
      },

      // For loyalty
      minBookings: {
        type: Number,
        min: 1,
        max: 100
      },

      // For last_minute (target specific customer segments)
      targetSegment: {
        type: String,
        enum: ['all', 'vip', 'regular', 'new']
      },

      // General filters
      minSpent: {
        type: Number,
        min: 0
      },

      maxRecipients: {
        type: Number,
        min: 1,
        max: 10000
      }
    },

    // Message content
    message: {
      template: {
        type: String,
        required: true,
        maxlength: 320 // SMS limit
      },

      discountType: {
        type: String,
        enum: ['percentage', 'fixed_amount', 'none'],
        default: 'percentage'
      },

      discountValue: {
        type: Number,
        min: 0
      },

      validDays: {
        type: Number,
        min: 1,
        max: 90,
        default: 30
      }
    },

    // Scheduling
    schedule: {
      type: {
        type: String,
        enum: ['manual', 'daily', 'weekly'],
        default: 'manual'
      },

      time: {
        type: String, // HH:MM format
        default: '10:00'
      },

      dayOfWeek: {
        type: Number, // 0-6 (Sunday-Saturday)
        min: 0,
        max: 6
      }
    },

    // Statistics
    stats: {
      totalSent: {
        type: Number,
        default: 0
      },

      totalDelivered: {
        type: Number,
        default: 0
      },

      totalClicked: {
        type: Number,
        default: 0
      },

      totalBooked: {
        type: Number,
        default: 0
      },

      totalRevenue: {
        type: Number,
        default: 0
      },

      lastRunAt: {
        type: Date
      },

      nextRunAt: {
        type: Date,
        index: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
MarketingCampaignSchema.index({ salonId: 1, status: 1 });
MarketingCampaignSchema.index({ status: 1, 'stats.nextRunAt': 1 });

// Virtual for ROI calculation
MarketingCampaignSchema.virtual('roi').get(function() {
  if (!this.stats.totalSent || this.stats.totalSent === 0) {
    return 0;
  }
  const cost = this.stats.totalSent * 0.077; // €0.077 per SMS (Twilio cost)
  if (cost === 0) return 0;
  return ((this.stats.totalRevenue - cost) / cost * 100).toFixed(2);
});

// Virtual for conversion rate
MarketingCampaignSchema.virtual('conversionRate').get(function() {
  if (!this.stats.totalSent || this.stats.totalSent === 0) {
    return 0;
  }
  return ((this.stats.totalBooked / this.stats.totalSent) * 100).toFixed(2);
});

// Instance method: Check if campaign should run now
MarketingCampaignSchema.methods.shouldRunNow = function() {
  if (this.status !== 'active') return false;
  if (this.schedule.type === 'manual') return false;
  if (!this.stats.nextRunAt) return true;

  return new Date() >= this.stats.nextRunAt;
};

// Instance method: Calculate next run time
MarketingCampaignSchema.methods.calculateNextRun = function() {
  if (this.schedule.type === 'manual') {
    return null;
  }

  const now = new Date();
  const [hours, minutes] = this.schedule.time.split(':').map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  if (this.schedule.type === 'daily') {
    // If time has passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  } else if (this.schedule.type === 'weekly') {
    // Find next occurrence of the scheduled day
    const targetDay = this.schedule.dayOfWeek;
    const currentDay = nextRun.getDay();
    let daysUntilTarget = targetDay - currentDay;

    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
      daysUntilTarget += 7;
    }

    nextRun.setDate(nextRun.getDate() + daysUntilTarget);
  }

  return nextRun;
};

// Static method: Get active campaigns ready to run
MarketingCampaignSchema.statics.getReadyToRun = async function() {
  const now = new Date();
  return this.find({
    status: 'active',
    'schedule.type': { $ne: 'manual' },
    $or: [
      { 'stats.nextRunAt': { $lte: now } },
      { 'stats.nextRunAt': null }
    ]
  }).populate('salonId', 'name email subscription');
};

// Pre-save hook: Set initial nextRunAt
MarketingCampaignSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'active' && !this.stats.nextRunAt) {
    this.stats.nextRunAt = this.calculateNextRun();
  }
  next();
});

// Ensure virtuals are included in JSON
MarketingCampaignSchema.set('toJSON', { virtuals: true });
MarketingCampaignSchema.set('toObject', { virtuals: true });

export default mongoose.model('MarketingCampaign', MarketingCampaignSchema);
