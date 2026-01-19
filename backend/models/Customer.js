import mongoose from 'mongoose';

/**
 * Customer Model
 * Represents customers/clients of salons
 * Linked to User model but with customer-specific fields
 */

const customerSchema = new mongoose.Schema(
  {
    // ==================== Reference ====================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },

    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      index: true
    },

    // ==================== Personal Information ====================
    firstName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Valid email required']
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    dateOfBirth: {
      type: Date
    },

    address: {
      street: String,
      city: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Deutschland'
      }
    },

    // ==================== Preferences ====================
    preferredLanguage: {
      type: String,
      enum: ['de', 'en'],
      default: 'de'
    },

    marketingConsent: {
      type: Boolean,
      default: false
    },

    smsConsent: {
      type: Boolean,
      default: false
    },

    // ==================== Customer Details ====================
    notes: {
      type: String
    },

    tags: [
      {
        type: String,
        trim: true
      }
    ],

    // ==================== Booking History ====================
    totalBookings: {
      type: Number,
      default: 0
    },

    completedBookings: {
      type: Number,
      default: 0
    },

    canceledBookings: {
      type: Number,
      default: 0
    },

    noShowCount: {
      type: Number,
      default: 0
    },

    // ==================== Financial ====================
    totalSpent: {
      type: Number,
      default: 0
    },

    outstandingBalance: {
      type: Number,
      default: 0
    },

    // ==================== NO-SHOW-KILLER: Stripe Integration ====================
    stripeCustomerId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
      comment: 'Stripe Customer ID for payment method storage'
    },

    // ==================== NO-SHOW-KILLER: Payment Methods ====================
    paymentMethods: [{
      paymentMethodId: {
        type: String,
        required: true
      },
      last4: {
        type: String,
        required: true
      },
      brand: {
        type: String,
        enum: ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay', 'unknown'],
        required: true
      },
      expiryMonth: {
        type: Number,
        required: true
      },
      expiryYear: {
        type: Number,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      // ✅ NEW: DSGVO auto-delete
      scheduledDeletionAt: {
        type: Date,
        default: null,
        comment: '90 days after last booking - auto-delete date'
      },
      deletedAt: {
        type: Date,
        default: null,
        comment: 'When payment method was deleted'
      }
    }],

    // ==================== NO-SHOW-KILLER: DSGVO Consent ====================
    gdprConsent: {
      paymentDataStorage: {
        accepted: {
          type: Boolean,
          default: false
        },
        acceptedAt: {
          type: Date,
          default: null
        },
        ipAddress: {
          type: String,
          default: null
        }
      }
    },

    // ==================== Status ====================
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active'
    },

    vipStatus: {
      type: Boolean,
      default: false
    },

    // ==================== Metadata ====================
    lastVisit: {
      type: Date
    },

    source: {
      type: String,
      enum: ['walk-in', 'referral', 'online', 'social-media', 'advertisement', 'other'],
      default: 'walk-in'
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================

customerSchema.index({ salonId: 1, email: 1 }, { unique: true });
customerSchema.index({ salonId: 1, phone: 1 });
customerSchema.index({ salonId: 1, lastName: 1, firstName: 1 });
customerSchema.index({ salonId: 1, status: 1 });
customerSchema.index({ salonId: 1, vipStatus: 1 });

// ==================== VIRTUALS ====================

customerSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

customerSchema.virtual('completionRate').get(function () {
  if (this.totalBookings === 0) return 0;
  return Math.round((this.completedBookings / this.totalBookings) * 100);
});

customerSchema.virtual('noShowRate').get(function () {
  if (this.totalBookings === 0) return 0;
  return Math.round((this.noShowCount / this.totalBookings) * 100);
});

// ==================== METHODS ====================

/**
 * Update booking statistics
 */
customerSchema.methods.updateBookingStats = async function (type) {
  this.totalBookings += 1;

  switch (type) {
    case 'completed':
      this.completedBookings += 1;
      this.lastVisit = new Date();
      break;
    case 'canceled':
      this.canceledBookings += 1;
      break;
    case 'no-show':
      this.noShowCount += 1;
      break;
  }

  await this.save();
};

/**
 * Add payment
 */
customerSchema.methods.addPayment = async function (amount) {
  this.totalSpent += amount;
  await this.save();
};

/**
 * Update outstanding balance
 */
customerSchema.methods.updateBalance = async function (amount) {
  this.outstandingBalance += amount;
  await this.save();
};

// ==================== STATICS ====================

/**
 * Find customer by phone number
 */
customerSchema.statics.findByPhone = function (salonId, phone) {
  return this.findOne({ salonId, phone });
};

/**
 * Find customer by email
 */
customerSchema.statics.findByEmail = function (salonId, email) {
  return this.findOne({ salonId, email: email.toLowerCase() });
};

/**
 * Get VIP customers
 */
customerSchema.statics.getVIPCustomers = function (salonId) {
  return this.find({ salonId, vipStatus: true, status: 'active' }).sort({ totalSpent: -1 });
};

/**
 * Get high-risk no-show customers
 */
customerSchema.statics.getHighRiskCustomers = function (salonId, threshold = 30) {
  return this.aggregate([
    {
      $match: {
        salonId: new mongoose.Types.ObjectId(salonId),
        totalBookings: { $gte: 3 },
        status: 'active'
      }
    },
    {
      $addFields: {
        noShowRate: {
          $cond: [
            { $eq: ['$totalBookings', 0] },
            0,
            { $multiply: [{ $divide: ['$noShowCount', '$totalBookings'] }, 100] }
          ]
        }
      }
    },
    {
      $match: {
        noShowRate: { $gte: threshold }
      }
    },
    {
      $sort: { noShowRate: -1 }
    }
  ]);
};

/**
 * Get customer statistics
 */
customerSchema.statics.getStatistics = async function (salonId) {
  const stats = await this.aggregate([
    {
      $match: {
        salonId: new mongoose.Types.ObjectId(salonId)
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalSpent' },
        avgBookings: { $avg: '$totalBookings' }
      }
    }
  ]);

  const vipCount = await this.countDocuments({ salonId, vipStatus: true });
  const totalCustomers = await this.countDocuments({ salonId });

  return {
    stats,
    vipCount,
    totalCustomers
  };
};

// ==================== EXPORT ====================

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
