import mongoose from 'mongoose';

/**
 * Deletion Request Model
 * GDPR Right to Erasure (Article 17)
 */
const deletionRequestSchema = new mongoose.Schema({
  // Request details
  requestId: {
    type: String,
    unique: true,
    default: () => `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Customer
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerEmail: String,
  customerName: String,

  // Request
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    required: true
  },
  additionalDetails: String,

  // Status
  status: {
    type: String,
    enum: [
      'pending_review',
      'approved',
      'rejected',
      'in_progress',
      'completed',
      'cancelled'
    ],
    default: 'pending_review'
  },

  // Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,

  // Approval/Rejection
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,

  // Deletion scope
  dataTypes: [{
    type: String,
    enum: [
      'bookings',
      'progress_entries',
      'clinical_notes',
      'packages',
      'consent_forms',
      'portfolio',
      'payment_history',
      'communications',
      'all'
    ]
  }],

  // Legal requirements
  retentionRequired: {
    type: Boolean,
    default: false
  },
  retentionReason: String,
  retentionDataTypes: [String],
  retentionUntil: Date,

  // Execution
  executedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  executedAt: Date,
  executionNotes: String,

  // Deletion results
  deletionResults: {
    bookings: {
      deleted: Number,
      retained: Number
    },
    progressEntries: {
      deleted: Number,
      retained: Number
    },
    clinicalNotes: {
      deleted: Number,
      retained: Number
    },
    packages: {
      deleted: Number,
      retained: Number
    },
    consentForms: {
      deleted: Number,
      retained: Number
    },
    portfolio: {
      deleted: Number,
      retained: Number
    },
    other: {
      deleted: Number,
      retained: Number
    }
  },

  // Verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,

  // Notification
  customerNotified: {
    type: Boolean,
    default: false
  },
  customerNotifiedAt: Date,
  notificationMethod: {
    type: String,
    enum: ['email', 'sms', 'mail', 'phone']
  },

  // Compliance
  gdprCompliant: {
    type: Boolean,
    default: true
  },
  hipaaReviewed: {
    type: Boolean,
    default: false
  },
  legalReview: {
    required: Boolean,
    completed: Boolean,
    reviewedBy: String,
    reviewedAt: Date,
    notes: String
  },

  // Timeline
  requestDeadline: Date, // GDPR: 30 days
  completedWithinDeadline: Boolean,

  // Salon association
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon'
  },

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
deletionRequestSchema.index({ customerId: 1, status: 1 });
deletionRequestSchema.index({ requestedAt: -1 });
deletionRequestSchema.index({ status: 1, requestDeadline: 1 });
deletionRequestSchema.index({ requestId: 1 });

// Set deadline on creation (GDPR: 30 days)
deletionRequestSchema.pre('save', function(next) {
  if (this.isNew && !this.requestDeadline) {
    const deadline = new Date(this.requestedAt);
    deadline.setDate(deadline.getDate() + 30);
    this.requestDeadline = deadline;
  }
  next();
});

// Virtual: Days until deadline
deletionRequestSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.requestDeadline) return null;
  
  const now = new Date();
  const deadline = new Date(this.requestDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual: Is overdue
deletionRequestSchema.virtual('isOverdue').get(function() {
  if (!this.requestDeadline || this.status === 'completed') return false;
  return new Date() > new Date(this.requestDeadline);
});

// Static method: Get overdue requests
deletionRequestSchema.statics.getOverdueRequests = function(salonId) {
  return this.find({
    salonId,
    status: { $nin: ['completed', 'rejected', 'cancelled'] },
    requestDeadline: { $lt: new Date() }
  }).sort({ requestDeadline: 1 });
};

// Static method: Get pending review requests
deletionRequestSchema.statics.getPendingReview = function(salonId) {
  return this.find({
    salonId,
    status: 'pending_review'
  }).sort({ requestedAt: 1 });
};

export default mongoose.model('DeletionRequest', deletionRequestSchema);
