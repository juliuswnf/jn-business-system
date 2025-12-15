import mongoose from 'mongoose';

/**
 * SlotSuggestion Model
 * AI/Rule-based suggestions for filling cancelled slots from waitlist
 */

const slotSuggestionSchema = new mongoose.Schema({
  // Slot Info
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  slotStartTime: {
    type: Date,
    required: true,
    index: true
  },
  slotEndTime: {
    type: Date,
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  
  // Original Booking (that was cancelled)
  originalBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    comment: 'The booking that created this slot'
  },
  cancelledReason: {
    type: String,
    enum: ['no_confirmation', 'customer_cancelled', 'salon_cancelled', 'no_show'],
    comment: 'Why slot became available'
  },

  // Ranked Customer Suggestions
  suggestedCustomers: [{
    waitlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Waitlist',
      required: true
    },
    customerId: mongoose.Schema.Types.ObjectId,
    customerName: String,
    customerPhone: String,
    customerEmail: String,
    
    // Match Scoring
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      comment: 'Overall match score (0-100)'
    },
    scoreBreakdown: {
      timeMatch: Number,        // 0-30 points
      reliability: Number,      // 0-25 points
      serviceHistory: Number,   // 0-20 points
      recency: Number,          // 0-15 points
      responseSpeed: Number     // 0-10 points
    },
    
    // Why This Customer?
    reasonCode: {
      type: String,
      enum: [
        'perfect_time_match',
        'high_reliability',
        'previous_service',
        'vip_customer',
        'long_wait',
        'fast_responder',
        'high_spender'
      ]
    },
    reasonText: {
      type: String,
      comment: 'Human-readable reason'
    },
    
    // Notification Tracking
    notifiedAt: Date,
    messageId: String,
    deliveredAt: Date,
    response: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired', 'no_response'],
      default: 'pending'
    },
    respondedAt: Date,
    
    // Ranking
    rank: {
      type: Number,
      required: true,
      min: 1,
      comment: '1 = top suggestion'
    }
  }],

  // Slot Value Analysis
  estimatedRevenue: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Expected revenue from service'
  },
  urgencyScore: {
    type: Number,
    min: 0,
    max: 100,
    comment: 'How urgent to fill (based on time remaining)'
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'notifying', 'filled', 'expired', 'cancelled'],
    default: 'pending',
    index: true
  },
  notificationsSent: {
    type: Number,
    default: 0,
    comment: 'How many customers were notified'
  },
  firstNotifiedAt: Date,
  lastNotifiedAt: Date,
  
  // Resolution
  filledAt: Date,
  filledByWaitlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waitlist',
    comment: 'Which waitlist entry filled the slot'
  },
  filledByCustomerId: mongoose.Schema.Types.ObjectId,
  newBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    comment: 'New booking created from waitlist'
  },
  
  // Expiry
  expiresAt: {
    type: Date,
    required: true,
    index: true,
    comment: 'Suggestion expires when slot time passes'
  },
  
  // Metadata
  algorithm: {
    type: String,
    enum: ['rule_based_v1', 'ml_v1', 'manual'],
    default: 'rule_based_v1',
    comment: 'Which algorithm generated suggestions'
  },
  processingTimeMs: {
    type: Number,
    comment: 'Time taken to generate suggestions'
  }
}, {
  timestamps: true
});

// Indexes
slotSuggestionSchema.index({ salonId: 1, status: 1, urgencyScore: -1 });
slotSuggestionSchema.index({ expiresAt: 1, status: 1 });
slotSuggestionSchema.index({ 'suggestedCustomers.waitlistId': 1 });

// Virtual: Hours Until Slot
slotSuggestionSchema.virtual('hoursUntilSlot').get(function() {
  const diff = this.slotStartTime - new Date();
  return Math.max(0, diff / (1000 * 60 * 60));
});

// Virtual: Top Suggestion
slotSuggestionSchema.virtual('topSuggestion').get(function() {
  return this.suggestedCustomers.find(c => c.rank === 1);
});

// Method: Mark as Filled
slotSuggestionSchema.methods.markFilled = function(waitlistId, customerId, newBookingId) {
  this.status = 'filled';
  this.filledAt = new Date();
  this.filledByWaitlistId = waitlistId;
  this.filledByCustomerId = customerId;
  this.newBookingId = newBookingId;
  return this.save();
};

// Method: Mark Customer Response
slotSuggestionSchema.methods.markCustomerResponse = function(waitlistId, response) {
  const customer = this.suggestedCustomers.find(
    c => c.waitlistId.toString() === waitlistId.toString()
  );
  
  if (customer) {
    customer.response = response;
    customer.respondedAt = new Date();
    
    // If accepted, mark slot as filled
    if (response === 'accepted') {
      this.status = 'filled';
      this.filledAt = new Date();
      this.filledByWaitlistId = waitlistId;
      this.filledByCustomerId = customer.customerId;
    }
  }
  
  return this.save();
};

// Method: Notify Next Customer (waterfall approach)
slotSuggestionSchema.methods.notifyNextCustomer = async function() {
  // Find first customer not yet notified
  const nextCustomer = this.suggestedCustomers.find(c => !c.notifiedAt);
  
  if (!nextCustomer) {
    this.status = 'expired';
    return { success: false, message: 'All customers already notified' };
  }
  
  nextCustomer.notifiedAt = new Date();
  nextCustomer.response = 'pending';
  
  this.notificationsSent += 1;
  this.lastNotifiedAt = new Date();
  if (!this.firstNotifiedAt) {
    this.firstNotifiedAt = new Date();
  }
  
  await this.save();
  
  return {
    success: true,
    customer: {
      waitlistId: nextCustomer.waitlistId,
      customerName: nextCustomer.customerName,
      customerPhone: nextCustomer.customerPhone,
      matchScore: nextCustomer.matchScore
    }
  };
};

// Static: Find Urgent Slots (need filling ASAP)
slotSuggestionSchema.statics.findUrgent = function(salonId, hoursThreshold = 24) {
  const cutoff = new Date(Date.now() + hoursThreshold * 60 * 60 * 1000);
  return this.find({
    salonId,
    status: 'pending',
    slotStartTime: { $lte: cutoff, $gt: new Date() }
  }).sort({ urgencyScore: -1, slotStartTime: 1 });
};

// Static: Expire Old Suggestions
slotSuggestionSchema.statics.expireOld = async function() {
  const result = await this.updateMany(
    {
      status: { $in: ['pending', 'notifying'] },
      expiresAt: { $lte: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  return result.modifiedCount;
};

// Static: Get Fill Rate Statistics
slotSuggestionSchema.statics.getFillRateStats = async function(salonId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const total = await this.countDocuments({
    salonId,
    createdAt: { $gte: since }
  });
  
  const filled = await this.countDocuments({
    salonId,
    status: 'filled',
    createdAt: { $gte: since }
  });
  
  const fillRate = total > 0 ? (filled / total) * 100 : 0;
  
  return {
    total,
    filled,
    unfilled: total - filled,
    fillRate: Math.round(fillRate * 10) / 10
  };
};

const SlotSuggestion = mongoose.model('SlotSuggestion', slotSuggestionSchema);

export default SlotSuggestion;
