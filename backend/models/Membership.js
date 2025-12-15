import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'vip', 'custom'],
    default: 'basic'
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  priceMonthly: {
    type: Number,
    required: true
  },
  benefits: [{
    type: {
      type: String,
      enum: [
        'unlimited_access',
        'monthly_credits',
        'discount',
        'priority_booking',
        'free_service',
        'exclusive_hours',
        'custom'
      ]
    },
    value: mongoose.Schema.Types.Mixed,
    description: String
  }],
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  nextBillingDate: Date,
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  cancelledAt: Date,
  cancellationReason: String,
  pausedAt: Date,
  pauseReason: String,
  creditsMonthly: {
    type: Number,
    default: 0
  },
  creditsUsedThisMonth: {
    type: Number,
    default: 0
  },
  lastCreditReset: Date,
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  autoRenew: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
membershipSchema.index({ salonId: 1, status: 1 });
membershipSchema.index({ customerId: 1 });
membershipSchema.index({ nextBillingDate: 1 });
membershipSchema.index({ salonId: 1, nextBillingDate: 1 });
membershipSchema.index({ stripeSubscriptionId: 1 });

// Virtuals
membershipSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

membershipSchema.virtual('daysUntilBilling').get(function() {
  if (!this.nextBillingDate) return null;
  const diff = this.nextBillingDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

membershipSchema.virtual('creditsRemaining').get(function() {
  return this.creditsMonthly - this.creditsUsedThisMonth;
});

// Methods
membershipSchema.methods.cancel = async function(reason = null) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.autoRenew = false;

  if (reason) {
    this.cancellationReason = reason;
  }

  await this.save();
  return this;
};

membershipSchema.methods.pause = async function(reason = null) {
  this.status = 'paused';
  this.pausedAt = new Date();

  if (reason) {
    this.pauseReason = reason;
  }

  await this.save();
  return this;
};

membershipSchema.methods.resume = async function() {
  if (this.status === 'paused') {
    this.status = 'active';
    this.pausedAt = null;
    this.pauseReason = null;
    await this.save();
  }
  return this;
};

membershipSchema.methods.useCredit = async function(bookingId = null) {
  if (this.status !== 'active') {
    throw new Error('Membership is not active');
  }

  if (this.creditsUsedThisMonth >= this.creditsMonthly) {
    throw new Error('Monthly credits exhausted');
  }

  this.creditsUsedThisMonth += 1;

  if (bookingId) {
    this.bookings.push(bookingId);
  }

  await this.save();
  return this;
};

membershipSchema.methods.resetMonthlyCredits = async function() {
  this.creditsUsedThisMonth = 0;
  this.lastCreditReset = new Date();
  await this.save();
  return this;
};

membershipSchema.methods.updateBilling = async function() {
  if (!this.nextBillingDate) {
    this.nextBillingDate = new Date(this.startDate);
  }

  switch (this.billingCycle) {
    case 'monthly':
      this.nextBillingDate.setMonth(this.nextBillingDate.getMonth() + 1);
      break;
    case 'quarterly':
      this.nextBillingDate.setMonth(this.nextBillingDate.getMonth() + 3);
      break;
    case 'yearly':
      this.nextBillingDate.setFullYear(this.nextBillingDate.getFullYear() + 1);
      break;
  }

  await this.save();
  return this;
};

membershipSchema.methods.addBenefit = async function(benefit) {
  this.benefits.push(benefit);
  await this.save();
  return this;
};

membershipSchema.methods.removeBenefit = async function(benefitId) {
  this.benefits = this.benefits.filter(b => b._id.toString() !== benefitId);
  await this.save();
  return this;
};

membershipSchema.methods.hasBenefit = function(benefitType) {
  return this.benefits.some(b => b.type === benefitType);
};

membershipSchema.methods.getBenefitValue = function(benefitType) {
  const benefit = this.benefits.find(b => b.type === benefitType);
  return benefit ? benefit.value : null;
};

// Statics
membershipSchema.statics.getCustomerMembership = async function(customerId) {
  return this.findOne({
    customerId,
    status: { $in: ['active', 'paused'] }
  })
  .populate('salonId', 'name');
};

membershipSchema.statics.getSalonMemberships = async function(salonId, filters = {}) {
  const query = { salonId };

  if (filters.status) query.status = filters.status;
  if (filters.plan) query.plan = filters.plan;
  if (filters.customerId) query.customerId = filters.customerId;

  return this.find(query)
    .populate('customerId', 'firstName lastName email phone')
    .sort({ createdAt: -1 });
};

membershipSchema.statics.getUpcomingBillings = async function(salonId, daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return this.find({
    salonId,
    status: 'active',
    nextBillingDate: {
      $lte: futureDate,
      $gte: new Date()
    }
  })
  .populate('customerId', 'firstName lastName email phone');
};

membershipSchema.statics.getDashboardStats = async function(salonId) {
  const memberships = await this.find({ salonId });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

  return {
    total: memberships.length,
    active: memberships.filter(m => m.status === 'active').length,
    paused: memberships.filter(m => m.status === 'paused').length,
    cancelled: memberships.filter(m => m.status === 'cancelled').length,
    monthlyRevenue: memberships
      .filter(m => m.status === 'active')
      .reduce((sum, m) => sum + m.priceMonthly, 0),
    churnRate: memberships.length > 0
      ? Math.round((memberships.filter(m => m.cancelledAt && m.cancelledAt > thirtyDaysAgo).length / memberships.length) * 100)
      : 0,
    averageCreditsUsage: memberships
      .filter(m => m.creditsMonthly > 0)
      .reduce((sum, m) => sum + ((m.creditsUsedThisMonth / m.creditsMonthly) * 100), 0) /
      (memberships.filter(m => m.creditsMonthly > 0).length || 1)
  };
};

membershipSchema.statics.resetAllMonthlyCredits = async function(salonId) {
  const memberships = await this.find({
    salonId,
    status: 'active',
    creditsMonthly: { $gt: 0 }
  });

  for (const membership of memberships) {
    await membership.resetMonthlyCredits();
  }

  return memberships.length;
};

const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;
