import mongoose from 'mongoose';
import { multiTenantPlugin } from '../middleware/multiTenantPlugin.js';

/**
 * Package Model
 * For Personal Trainers / Fitness Studios
 * Package deals (e.g., "10 Sessions for €300")
 */
const packageSchema = new mongoose.Schema(
  {
    // ==================== References ====================
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // ==================== Package Details ====================
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      comment: 'e.g., "10 Training Sessions"'
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500
    },

    // ==================== Pricing ====================
    price: {
      type: Number,
      required: true,
      min: 0,
      comment: 'Total package price'
    },

    currency: {
      type: String,
      default: 'EUR',
      enum: ['EUR', 'USD', 'GBP', 'CHF']
    },

    // ==================== Sessions ====================
    totalSessions: {
      type: Number,
      required: true,
      min: 1,
      comment: 'Number of sessions included'
    },

    sessionDuration: {
      type: Number,
      required: true,
      min: 15,
      comment: 'Minutes per session'
    },

    // ==================== Validity ====================
    validityPeriod: {
      type: Number,
      required: true,
      min: 1,
      comment: 'Days until package expires (e.g., 90 days)'
    },

    // ==================== Services Included ====================
    serviceIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      comment: 'Which services can be booked with this package'
    }],

    // ==================== Restrictions ====================
    trainerSpecific: {
      type: Boolean,
      default: false,
      comment: 'Can only be used with specific trainer?'
    },

    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      comment: 'If trainerSpecific = true'
    },

    // ==================== Active Status ====================
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // ==================== Statistics ====================
    soldCount: {
      type: Number,
      default: 0,
      comment: 'How many times this package was purchased'
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
    collection: 'packages'
  }
);

// ==================== INDEXES ====================
packageSchema.index({ salonId: 1, isActive: 1 });
packageSchema.index({ salonId: 1, soldCount: -1 });

// ==================== METHODS ====================

/**
 * Calculate price per session
 */
packageSchema.methods.pricePerSession = function() {
  return (this.price / this.totalSessions).toFixed(2);
};

/**
 * Check if package is available for booking
 */
packageSchema.methods.isAvailable = function() {
  return this.isActive && !this.deletedAt;
};

// ==================== QUERY MIDDLEWARE ====================
packageSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ==================== MULTI-TENANT PLUGIN ====================
packageSchema.plugin(multiTenantPlugin);

const Package = mongoose.model('Package', packageSchema);

export default Package;
