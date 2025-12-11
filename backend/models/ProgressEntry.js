import mongoose from 'mongoose';
import { multiTenantPlugin } from '../middleware/multiTenantPlugin.js';

/**
 * Progress Entry Model
 * For Personal Trainers - Track client progress
 */
const progressEntrySchema = new mongoose.Schema(
  {
    // ==================== References ====================
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },

    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      comment: 'Link to training session'
    },

    // ==================== Date ====================
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },

    // ==================== Body Metrics ====================
    weight: {
      value: {
        type: Number,
        min: 0
      },
      unit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg'
      }
    },

    bodyFatPercentage: {
      type: Number,
      min: 0,
      max: 100
    },

    muscleMass: {
      value: {
        type: Number,
        min: 0
      },
      unit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg'
      }
    },

    // ==================== Measurements (cm) ====================
    measurements: {
      chest: Number,
      waist: Number,
      hips: Number,
      biceps: {
        left: Number,
        right: Number
      },
      thighs: {
        left: Number,
        right: Number
      },
      calves: {
        left: Number,
        right: Number
      }
    },

    // ==================== Performance Metrics ====================
    performance: {
      benchPress: {
        weight: Number,
        reps: Number,
        unit: {
          type: String,
          enum: ['kg', 'lbs'],
          default: 'kg'
        }
      },
      squat: {
        weight: Number,
        reps: Number,
        unit: {
          type: String,
          enum: ['kg', 'lbs'],
          default: 'kg'
        }
      },
      deadlift: {
        weight: Number,
        reps: Number,
        unit: {
          type: String,
          enum: ['kg', 'lbs'],
          default: 'kg'
        }
      },
      pullups: {
        reps: Number
      },
      plank: {
        duration: Number,
        comment: 'Seconds'
      }
    },

    // ==================== Cardio ====================
    cardio: {
      type: {
        type: String,
        enum: ['running', 'cycling', 'rowing', 'swimming', 'other']
      },
      distance: {
        value: Number,
        unit: {
          type: String,
          enum: ['km', 'miles'],
          default: 'km'
        }
      },
      duration: {
        type: Number,
        comment: 'Minutes'
      },
      avgHeartRate: Number
    },

    // ==================== Photos ====================
    photos: [{
      type: {
        type: String,
        enum: ['front', 'back', 'side', 'other']
      },
      url: {
        type: String,
        required: true
      },
      thumbnailUrl: String,
      capturedAt: {
        type: Date,
        default: Date.now
      }
    }],

    // ==================== Notes ====================
    notes: {
      type: String,
      maxlength: 1000,
      comment: 'Trainer observations'
    },

    clientFeedback: {
      type: String,
      maxlength: 500,
      comment: 'How client is feeling'
    },

    // ==================== Goals ====================
    currentGoals: {
      type: [String],
      default: []
    },

    goalsAchieved: {
      type: [String],
      default: []
    },

    // ==================== Custom Metrics ====================
    customMetrics: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
      comment: 'Trainer-specific tracking fields'
    },

    // ==================== Privacy ====================
    isPrivate: {
      type: Boolean,
      default: false,
      comment: 'Hide from client view?'
    },

    // ==================== SOFT DELETE ====================
    deletedAt: {
      type: Date,
      default: null,
      index: true
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { 
    timestamps: true,
    collection: 'progress_entries'
  }
);

// ==================== INDEXES ====================
progressEntrySchema.index({ customerId: 1, recordedAt: -1 });
progressEntrySchema.index({ trainerId: 1, recordedAt: -1 });
progressEntrySchema.index({ salonId: 1, recordedAt: -1 });

// ==================== METHODS ====================

/**
 * Calculate weight change from previous entry
 */
progressEntrySchema.methods.getWeightChange = async function() {
  const previousEntry = await this.constructor.findOne({
    customerId: this.customerId,
    recordedAt: { $lt: this.recordedAt },
    'weight.value': { $exists: true }
  }).sort({ recordedAt: -1 });

  if (!previousEntry || !previousEntry.weight?.value || !this.weight?.value) {
    return null;
  }

  return this.weight.value - previousEntry.weight.value;
};

/**
 * Get progress summary for date range
 */
progressEntrySchema.statics.getProgressSummary = async function(customerId, startDate, endDate) {
  const entries = await this.find({
    customerId,
    recordedAt: { $gte: startDate, $lte: endDate },
    deletedAt: null
  }).sort({ recordedAt: 1 });

  if (entries.length === 0) return null;

  const first = entries[0];
  const last = entries[entries.length - 1];

  return {
    totalEntries: entries.length,
    dateRange: {
      start: first.recordedAt,
      end: last.recordedAt
    },
    weightChange: last.weight?.value && first.weight?.value 
      ? last.weight.value - first.weight.value 
      : null,
    bodyFatChange: last.bodyFatPercentage && first.bodyFatPercentage
      ? last.bodyFatPercentage - first.bodyFatPercentage
      : null,
    goalsAchieved: last.goalsAchieved || []
  };
};

// ==================== QUERY MIDDLEWARE ====================
progressEntrySchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ==================== MULTI-TENANT PLUGIN ====================
progressEntrySchema.plugin(multiTenantPlugin);

const ProgressEntry = mongoose.model('ProgressEntry', progressEntrySchema);

export default ProgressEntry;
