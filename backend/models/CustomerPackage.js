import mongoose from 'mongoose';
import { multiTenantPlugin } from '../middleware/multiTenantPlugin.js';

/**
 * Customer Package Model
 * Tracks purchased packages and remaining sessions
 */
const customerPackageSchema = new mongoose.Schema(
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

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
      index: true
    },

    // ==================== Purchase Details ====================
    purchasedAt: {
      type: Date,
      required: true,
      default: Date.now
    },

    purchasePrice: {
      type: Number,
      required: true,
      comment: 'Price paid (may differ from current package price)'
    },

    paymentId: {
      type: String,
      comment: 'Stripe payment ID'
    },

    // ==================== Session Tracking ====================
    totalSessions: {
      type: Number,
      required: true,
      comment: 'Total sessions in package'
    },

    usedSessions: {
      type: Number,
      default: 0,
      min: 0,
      comment: 'Sessions already used'
    },

    remainingSessions: {
      type: Number,
      required: true,
      comment: 'Sessions left to book'
    },

    // ==================== Validity ====================
    validFrom: {
      type: Date,
      required: true,
      default: Date.now
    },

    validUntil: {
      type: Date,
      required: true,
      index: true,
      comment: 'Package expiration date'
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // ==================== Bookings Made with Package ====================
    bookings: [{
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
      },
      bookedAt: {
        type: Date,
        default: Date.now
      },
      sessionsUsed: {
        type: Number,
        default: 1
      }
    }],

    // ==================== Status ====================
    status: {
      type: String,
      enum: ['active', 'expired', 'completed', 'cancelled', 'refunded'],
      default: 'active',
      index: true
    },

    // ==================== Cancellation ====================
    cancelledAt: {
      type: Date,
      default: null
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    cancellationReason: {
      type: String,
      maxlength: 500
    },

    refundAmount: {
      type: Number,
      default: 0,
      comment: 'Partial refund if cancelled mid-package'
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
    collection: 'customer_packages'
  }
);

// ==================== INDEXES ====================
customerPackageSchema.index({ customerId: 1, isActive: 1 });
customerPackageSchema.index({ salonId: 1, status: 1 });
customerPackageSchema.index({ validUntil: 1 });

// ==================== VIRTUALS ====================
customerPackageSchema.virtual('isExpired').get(function() {
  return this.validUntil < new Date();
});

customerPackageSchema.virtual('isFullyUsed').get(function() {
  return this.remainingSessions <= 0;
});

// ==================== METHODS ====================

/**
 * Use a session from package
 */
customerPackageSchema.methods.useSession = function(bookingId) {
  if (this.remainingSessions <= 0) {
    throw new Error('No sessions remaining in package');
  }
  if (this.isExpired) {
    throw new Error('Package has expired');
  }
  if (this.status !== 'active') {
    throw new Error('Package is not active');
  }

  this.usedSessions += 1;
  this.remainingSessions -= 1;
  
  this.bookings.push({
    bookingId,
    bookedAt: new Date(),
    sessionsUsed: 1
  });

  // Auto-complete if all sessions used
  if (this.remainingSessions === 0) {
    this.status = 'completed';
    this.isActive = false;
  }

  return this.save();
};

/**
 * Cancel package and calculate refund
 */
customerPackageSchema.methods.cancelPackage = function(userId, reason) {
  const refundPerSession = this.purchasePrice / this.totalSessions;
  this.refundAmount = Math.round(refundPerSession * this.remainingSessions * 100) / 100;
  
  this.status = 'cancelled';
  this.isActive = false;
  this.cancelledAt = new Date();
  this.cancelledBy = userId;
  this.cancellationReason = reason;
  
  return this.save();
};

// ==================== MIDDLEWARE ====================

// Auto-expire packages
customerPackageSchema.pre('save', function(next) {
  if (this.validUntil < new Date() && this.status === 'active') {
    this.status = 'expired';
    this.isActive = false;
  }
  next();
});

// Query middleware
customerPackageSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ==================== MULTI-TENANT PLUGIN ====================
customerPackageSchema.plugin(multiTenantPlugin);

const CustomerPackage = mongoose.model('CustomerPackage', customerPackageSchema);

export default CustomerPackage;
