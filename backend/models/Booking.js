import mongoose from 'mongoose';
import { multiTenantPlugin } from '../middleware/multiTenantPlugin.js';

const PHONE_REGEX = /^\+?[0-9\s().-]{7,20}$/;

const bookingSchema = new mongoose.Schema(
  {
    // ==================== Salon Reference ====================
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      index: true
    },

    // ==================== Service ====================
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true
    },

    // ==================== MULTI-INDUSTRY: Multi-Service Bookings ====================
    services: [{
      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      },
      duration: Number,
      price: Number
    }],

    // ==================== TATTOO STUDIO: Custom Design Request ====================
    customDesignRequest: {
      hasRequest: {
        type: Boolean,
        default: false
      },
      description: {
        type: String,
        maxlength: 2000,
        comment: 'Customer describes desired tattoo/design'
      },
      referenceImages: [{
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }],
      placement: {
        type: String,
        comment: 'Where on body (e.g., "left arm", "back")'
      },
      size: {
        type: String,
        enum: ['small', 'medium', 'large', 'sleeve', 'full-back'],
        comment: 'Approximate size'
      },
      designApproved: {
        type: Boolean,
        default: false
      },
      approvedDesignUrl: String
    },

    // ==================== MULTI-SESSION BOOKINGS (Tattoos, PT) ====================
    isMultiSession: {
      type: Boolean,
      default: false,
      comment: 'Part of a series of sessions'
    },

    multiSessionGroup: {
      groupId: {
        type: String,
        index: true,
        comment: 'Links multiple bookings together'
      },
      sessionNumber: {
        type: Number,
        min: 1
      },
      totalSessions: {
        type: Number,
        min: 1
      }
    },

    // ==================== PACKAGE BOOKING (Personal Training) ====================
    packageUsage: {
      packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerPackage'
      },
      sessionsUsed: {
        type: Number,
        default: 0,
        min: 0
      }
    },

    // ==================== RECURRING APPOINTMENTS ====================
    isRecurring: {
      type: Boolean,
      default: false
    },

    recurringPattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        comment: 'e.g., "weekly" for 3x/week training'
      },
      daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6,
        comment: '0=Sunday, 1=Monday, etc.'
      }],
      endDate: Date,
      occurrences: Number
    },

    recurringGroupId: {
      type: String,
      index: true,
      comment: 'Links all recurring appointments'
    },

    // ==================== RESOURCE ASSIGNMENT (Spa/Wellness) ====================
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      comment: 'Assigned room/table/equipment'
    },

    // ==================== VIDEO SESSION (Online Training) ====================
    isVideoSession: {
      type: Boolean,
      default: false
    },

    videoSession: {
      platform: {
        type: String,
        enum: ['zoom', 'google-meet', 'teams', 'other']
      },
      meetingLink: String,
      meetingId: String,
      password: String
    },

    // ==================== Employee (Optional) ====================
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },

    // ==================== Customer Info (NO LOGIN REQUIRED) ====================
    customerName: {
      type: String,
      required: true,
      trim: true
    },

    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Valid email required']
    },

    customerPhone: {
      type: String,
      trim: true,
      default: null,
      match: [PHONE_REGEX, 'Valid phone number required']
    },

    // Optional: Link to Customer account if they create one later
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },

    // ==================== WORKFLOW INTEGRATION ====================
    workflowProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowProject',
      default: null,
      index: true
    },

    workflowSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowSession',
      default: null,
      index: true
    },

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      default: null,
      index: true
    },

    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Membership',
      default: null,
      index: true
    },

    isWorkflowSession: {
      type: Boolean,
      default: false,
      index: true
    },

    sessionNumber: {
      type: Number,
      default: null
    },

    // ==================== Booking Date & Time ====================
    bookingDate: {
      type: Date,
      required: true,
      index: true
    },

    // ==================== Idempotency Key (? SRE FIX #30) ====================
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true, // Allow null for legacy bookings
      index: true,
      comment: 'Prevents duplicate bookings from double-clicks'
    },

    duration: {
      type: Number, // minutes
      required: true,
      min: 15
    },

    // ==================== Status ====================
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true // ? Performance optimization
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },

    // ==================== Payment ====================
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true
    },

    paymentId: {
      type: String,
      default: null
    },

    // ==================== NO-SHOW-KILLER: Stripe Payment Method ====================
    stripeCustomerId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
      comment: 'Stripe Customer ID for No-Show-Fee charging'
    },
    paymentMethodId: {
      type: String,
      default: null,
      sparse: true,
      comment: 'Stripe Payment Method ID (saved card)'
    },

    // ==================== NO-SHOW-KILLER: Fee Tracking ====================
    noShowFee: {
      charged: {
        type: Boolean,
        default: false
      },
      amount: {
        type: Number,
        default: null,
        comment: 'Fee amount in cents'
      },
      chargeId: {
        type: String,
        default: null,
        comment: 'Stripe Payment Intent ID'
      },
      transferId: {
        type: String,
        default: null,
        comment: 'Stripe Transfer ID (to salon via Connect)'
      },
      chargedAt: {
        type: Date,
        default: null
      },
      error: {
        type: String,
        default: null,
        comment: 'Error message if charge failed'
      },
      attemptedAt: {
        type: Date,
        default: null
      },
      refunded: {
        type: Boolean,
        default: false
      },
      refundedAt: {
        type: Date,
        default: null
      },
      refundId: {
        type: String,
        default: null,
        comment: 'Stripe Refund ID'
      },
      // ✅ NEW: Fee breakdown (Stripe Connect)
      breakdown: {
        totalCharged: {
          type: Number,
          default: null,
          comment: 'Total amount charged (€15.00)'
        },
        stripeFee: {
          type: Number,
          default: null,
          comment: 'Stripe fee (€0.46)'
        },
        salonReceives: {
          type: Number,
          default: null,
          comment: 'Amount salon receives (€14.54)'
        },
        platformCommission: {
          type: Number,
          default: 0,
          comment: 'Platform commission (€0.00)'
        }
      }
    },

    // ==================== NO-SHOW-KILLER: Legal Compliance ====================
    noShowFeeAcceptance: {
      accepted: {
        type: Boolean,
        default: false,
        comment: 'Customer accepted No-Show-Fee policy'
      },
      acceptedAt: {
        type: Date,
        default: null
      },
      ipAddress: {
        type: String,
        default: null,
        comment: 'IP address when policy was accepted'
      },
      userAgent: {
        type: String,
        default: null,
        comment: 'User agent when policy was accepted'
      },
      terms: {
        type: String,
        default: null,
        comment: 'Full terms text that was accepted'
      },
      checkboxText: {
        type: String,
        default: null,
        comment: 'Checkbox text shown to user'
      }
    },

    // ==================== NO-SHOW-KILLER: Dispute Evidence ====================
    disputeEvidence: {
      bookingCreatedAt: {
        type: Date,
        default: null
      },
      remindersSent: [{
        type: {
          type: String,
          enum: ['sms', 'email'],
          default: 'email'
        },
        sentAt: {
          type: Date,
          default: null
        },
        deliveryStatus: {
          type: String,
          default: 'sent'
        }
      }],
      customerCommunication: {
        type: String,
        default: null,
        comment: 'Email/SMS logs for dispute evidence'
      },
      cancellationDeadline: {
        type: Date,
        default: null,
        comment: 'Deadline for free cancellation (24h before)'
      },
      serviceDescription: {
        type: String,
        default: null,
        comment: 'Service description for dispute evidence'
      }
    },

    noShowMarkedAt: {
      type: Date,
      default: null
    },
    noShowMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // ==================== Email Tracking ====================
    emailsSent: {
      confirmation: { type: Boolean, default: false },
      reminder: { type: Boolean, default: false },
      review: { type: Boolean, default: false }
    },

    // ==================== Marketing Attribution ====================
    discountCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      sparse: true,
      comment: 'Marketing campaign discount code (e.g., SALON-ABC123)'
    },

    marketingCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketingCampaign',
      index: true,
      comment: 'Source marketing campaign (if booked via marketing SMS)'
    },

    // ==================== Language ====================
    language: {
      type: String,
      enum: ['de', 'en'],
      default: 'de'
    },

    // ==================== Timestamps ====================
    confirmedAt: {
      type: Date,
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    },

    cancelledAt: {
      type: Date,
      default: null
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    updatedAt: {
      type: Date,
      default: Date.now
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
  { timestamps: true }
);

// ==================== INDEXES ====================

bookingSchema.index({ salonId: 1, bookingDate: 1 });
bookingSchema.index({ salonId: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ customerEmail: 1, salonId: 1 });
bookingSchema.index({ status: 1, bookingDate: 1 });
bookingSchema.index({ bookingDate: 1, status: 1 });
bookingSchema.index({ employeeId: 1, bookingDate: 1 });
bookingSchema.index({ deletedAt: 1 }); // For soft delete queries
bookingSchema.index({ customerId: 1, bookingDate: -1 }); // ? Customer booking history (descending)
bookingSchema.index({ salonId: 1, createdAt: -1 }); // ? Recent bookings per salon
bookingSchema.index({ paymentStatus: 1, bookingDate: 1 }); // ? Payment tracking
bookingSchema.index({ salonId: 1, customerId: 1, bookingDate: -1 });

// ==================== QUERY MIDDLEWARE - EXCLUDE DELETED ====================

// Automatically exclude soft-deleted documents from queries
bookingSchema.pre(/^find/, function(next) {
  // Allow explicit inclusion of deleted documents
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// Also handle countDocuments
bookingSchema.pre('countDocuments', function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ==================== VIRTUALS ====================

bookingSchema.virtual('isPast').get(function() {
  return this.bookingDate < new Date();
});

bookingSchema.virtual('isToday').get(function() {
  const today = new Date();
  const bookingDay = new Date(this.bookingDate);
  return (
    bookingDay.getDate() === today.getDate() &&
    bookingDay.getMonth() === today.getMonth() &&
    bookingDay.getFullYear() === today.getFullYear()
  );
});

bookingSchema.virtual('canCancel').get(function() {
  // Can cancel if not completed/cancelled and booking is in future
  return (
    !['completed', 'cancelled', 'no_show'].includes(this.status) &&
    this.bookingDate > new Date()
  );
});

// ==================== METHODS ====================

bookingSchema.methods.confirm = async function() {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  return await this.save();
};

bookingSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  return await this.save();
};

bookingSchema.methods.markNoShow = async function() {
  this.status = 'no_show';
  return await this.save();
};

bookingSchema.methods.markEmailSent = async function(type) {
  if (['confirmation', 'reminder', 'review'].includes(type)) {
    this.emailsSent[type] = true;
    return await this.save();
  }
};

// Soft delete method
// Soft delete method
bookingSchema.methods.softDelete = async function(userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = 'cancelled'; // Also mark as cancelled
  return await this.save();
};

// Restore soft-deleted booking
bookingSchema.methods.restore = async function() {
  this.deletedAt = null;
  this.deletedBy = null;
  return await this.save();
};

// Check if soft-deleted
bookingSchema.methods.isDeleted = function() {
  return this.deletedAt !== null;
};

// ==================== STATICS ====================

bookingSchema.statics.findBySalon = function(salonId, filters = {}) {
  const query = { salonId, ...filters };
  return this.find(query).sort({ bookingDate: -1 });
};

bookingSchema.statics.findByEmail = function(email, salonId = null) {
  const query = { customerEmail: email.toLowerCase() };
  if (salonId) {query.salonId = salonId;}
  return this.find(query).sort({ bookingDate: -1 });
};

bookingSchema.statics.findUpcoming = function(salonId = null) {
  const query = {
    bookingDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  };
  if (salonId) {query.salonId = salonId;}
  return this.find(query).sort({ bookingDate: 1 });
};

bookingSchema.statics.findByDateRange = function(salonId, startDate, endDate) {
  return this.find({
    salonId,
    bookingDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ bookingDate: 1 });
};

bookingSchema.statics.checkAvailability = async function(salonId, bookingDate, duration) {
  const startTime = new Date(bookingDate);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  const conflictingBooking = await this.findOne({
    salonId,
    status: { $nin: ['cancelled', 'no_show'] },
    bookingDate: {
      $gte: new Date(startTime.getTime() - duration * 60000),
      $lte: endTime
    }
  });

  return !conflictingBooking;
};

// Get bookings that need reminder email (24h before)
bookingSchema.statics.getNeedingReminder = function(hoursBeforeDefault = 24) {
  const now = new Date();
  const targetTime = new Date(now.getTime() + hoursBeforeDefault * 60 * 60 * 1000);
  const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000); // 30 min window
  const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);

  return this.find({
    status: { $in: ['pending', 'confirmed'] },
    bookingDate: { $gte: windowStart, $lte: windowEnd },
    'emailsSent.reminder': false
  });
};

// Get bookings that need review email (2h after completion)
bookingSchema.statics.getNeedingReviewEmail = function(hoursAfterDefault = 2) {
  const now = new Date();
  const targetTime = new Date(now.getTime() - hoursAfterDefault * 60 * 60 * 1000);
  const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);

  return this.find({
    status: 'completed',
    completedAt: { $gte: windowStart, $lte: windowEnd },
    'emailsSent.review': false
  });
};

// Get statistics for salon
bookingSchema.statics.getStats = async function(salonId, startDate = null, endDate = null) {
  const query = { salonId };

  if (startDate && endDate) {
    query.bookingDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const [total, confirmed, completed, cancelled] = await Promise.all([
    this.countDocuments(query),
    this.countDocuments({ ...query, status: 'confirmed' }),
    this.countDocuments({ ...query, status: 'completed' }),
    this.countDocuments({ ...query, status: 'cancelled' })
  ]);

  return {
    total,
    confirmed,
    completed,
    cancelled,
    pending: total - confirmed - completed - cancelled
  };
};

// ==================== PRE-SAVE HOOKS ====================

bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ==================== INDEXES ====================

// Compound indexes for common queries
bookingSchema.index({ salonId: 1, bookingDate: -1 }); // Get bookings by date for salon
bookingSchema.index({ salonId: 1, status: 1, bookingDate: -1 }); // Filter by status
bookingSchema.index({ salonId: 1, employeeId: 1, bookingDate: 1 }); // Employee schedule
bookingSchema.index({ customerEmail: 1, salonId: 1 }); // Customer lookup
bookingSchema.index({ salonId: 1, createdAt: -1 }); // Recent bookings

// ? AUDIT FIX: Multi-tenant plugin for automatic salonId filtering
bookingSchema.plugin(multiTenantPlugin);

// ==================== EXPORT ====================

export default mongoose.model('Booking', bookingSchema);
