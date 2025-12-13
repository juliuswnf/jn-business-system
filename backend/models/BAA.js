import mongoose from 'mongoose';

/**
 * Business Associate Agreement Model
 * HIPAA requires tracking of all BAAs with vendors handling PHI
 */
const baaSchema = new mongoose.Schema({
  // Association details
  associateName: {
    type: String,
    required: true
  },
  associateType: {
    type: String,
    enum: [
      'cloud_storage',
      'payment_processor',
      'email_provider',
      'analytics',
      'crm',
      'telehealth',
      'billing',
      'other'
    ],
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: String,

  // Agreement details
  signedDate: {
    type: Date,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  renewalNoticeDays: {
    type: Number,
    default: 30
  },

  // Document
  documentUrl: {
    type: String,
    required: true
  },
  documentHash: String, // SHA-256 hash for integrity

  // Status
  status: {
    type: String,
    enum: ['active', 'expiring_soon', 'expired', 'terminated', 'pending'],
    default: 'active'
  },

  // Compliance tracking
  hipaaCompliant: {
    type: Boolean,
    default: true
  },
  gdprCompliant: {
    type: Boolean,
    default: false
  },
  complianceNotes: String,

  // Services covered
  servicesCovered: [{
    type: String
  }],
  phiAccessLevel: {
    type: String,
    enum: ['full', 'limited', 'none'],
    default: 'limited'
  },

  // Salon association
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastReviewedDate: Date,
  lastReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Notifications
  notificationsSent: [{
    type: {
      type: String,
      enum: ['expiration_warning', 'expired', 'renewal_reminder']
    },
    sentAt: Date,
    sentTo: [String]
  }],

  // Termination
  terminatedDate: Date,
  terminationReason: String,

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
baaSchema.index({ salonId: 1, status: 1 });
baaSchema.index({ expirationDate: 1 });
baaSchema.index({ associateName: 1 });

// Virtual: Days until expiration
baaSchema.virtual('daysUntilExpiration').get(function() {
  const now = new Date();
  const expiration = new Date(this.expirationDate);
  const diffTime = expiration - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Update status based on expiration
baaSchema.pre('save', function(next) {
  const daysUntilExpiration = this.daysUntilExpiration;
  
  if (daysUntilExpiration < 0) {
    this.status = 'expired';
  } else if (daysUntilExpiration <= 30) {
    this.status = 'expiring_soon';
  } else {
    this.status = 'active';
  }
  
  next();
});

// Static method: Get expiring BAAs
baaSchema.statics.getExpiringBAAs = function(salonId, days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    salonId,
    status: { $in: ['active', 'expiring_soon'] },
    expirationDate: { $lte: futureDate }
  }).sort({ expirationDate: 1 });
};

export default mongoose.model('BAA', baaSchema);
