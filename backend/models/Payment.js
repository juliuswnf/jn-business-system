import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,  // ✅ Added
      sparse: true  // ✅ Added
    },

    customerName: {
      type: String,
      trim: true,
      sparse: true  // ✅ Added
    },

    customerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true  // ✅ Added
    },

    customerPhone: {
      type: String,
      trim: true,
      sparse: true  // ✅ Added
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
      index: true,  // ✅ Added
      sparse: true  // ✅ Added
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      enum: ['EUR', 'USD', 'GBP', 'CHF'],  // ✅ Added currencies
      default: 'EUR',
      index: true  // ✅ Added
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,  // ✅ Added
      max: 100  // ✅ Added: percentage
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,  // ✅ Added
      max: 100  // ✅ Added: percentage
    },

    finalAmount: {
      type: Number,
      required: true,
      min: 0  // ✅ Added
    },

    paymentMethod: {
      type: String,
      enum: ['card', 'cash', 'transfer', 'paypal', 'apple-pay', 'google-pay'],
      required: true,
      index: true
    },

    stripePaymentIntentId: {
      type: String,
      sparse: true,  // ✅ Added
      index: true
    },

    stripeChargeId: {
      type: String,
      sparse: true,  // ✅ Added
      index: true
    },

    stripeCustomerId: {
      type: String,
      sparse: true,  // ✅ Added
      index: true
    },

    stripeReceiptUrl: {
      type: String,
      sparse: true  // ✅ Added
    },

    cardLast4: {
      type: String,
      sparse: true  // ✅ Added
    },

    cardBrand: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover'],
      sparse: true  // ✅ Added
    },

    cardExpiry: {
      type: String,
      sparse: true  // ✅ Added
    },

    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],  // ✅ FIXED
      default: 'pending',
      index: true
    },

    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    reference: {
      type: String,
      sparse: true,  // ✅ Added
      index: true
    },

    isRefunded: {
      type: Boolean,
      default: false,
      index: true  // ✅ Added
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0  // ✅ Added
    },

    refundReason: {
      type: String,
      sparse: true,  // ✅ Added
      maxlength: 500
    },

    refundedAt: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    refundStripeId: {
      type: String,
      sparse: true,  // ✅ Added
      index: true
    },

    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true
    },

    invoiceUrl: {
      type: String,
      sparse: true  // ✅ Added
    },

    invoiceGenerated: {
      type: Boolean,
      default: false
    },

    invoiceGeneratedAt: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    receiptUrl: {
      type: String,
      sparse: true  // ✅ Added
    },

    receiptSent: {
      type: Boolean,
      default: false,
      index: true  // ✅ Added
    },

    receiptSentAt: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    isInstallment: {
      type: Boolean,
      default: false,
      index: true  // ✅ Added
    },

    installmentPlan: {
      type: String,
      enum: ['full', '2-pay', '3-pay', '4-pay'],
      default: 'full'
    },

    installmentNumber: {
      type: Number,
      default: 1,
      min: 1  // ✅ Added
    },

    totalInstallments: {
      type: Number,
      default: 1,
      min: 1  // ✅ Added
    },

    nextInstallmentDate: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    errorMessage: {
      type: String,
      sparse: true,  // ✅ Added
      maxlength: 500
    },

    errorCode: {
      type: String,
      sparse: true,  // ✅ Added
      index: true
    },

    failureReason: {
      type: String,
      sparse: true,  // ✅ Added
      maxlength: 500
    },

    retryCount: {
      type: Number,
      default: 0,
      min: 0,  // ✅ Added
      max: 5  // ✅ Added: max retries
    },

    lastRetryAt: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    notes: {
      type: String,
      sparse: true,  // ✅ Added
      maxlength: 1000
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,  // ✅ Added
      index: true
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

    processedAt: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    completedAt: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    }
  },
  { timestamps: true }
);


// ==================== INDEXES (OPTIMIZED) ====================

// ✅ Primary queries
paymentSchema.index({ companyId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ companyId: 1, createdAt: -1 });

// ✅ Customer queries
paymentSchema.index({ companyId: 1, customerId: 1, createdAt: -1 }, { sparse: true });

// ✅ Booking queries
paymentSchema.index({ bookingId: 1, status: 1 });

// ✅ Status queries
paymentSchema.index({ status: 1, createdAt: -1 });

// ✅ Transaction tracking
paymentSchema.index({ transactionId: 1 });

// ✅ Revenue queries
paymentSchema.index({ companyId: 1, status: 1, completedAt: -1 });

// ✅ Refund queries
paymentSchema.index({ isRefunded: 1, refundedAt: -1 });

// ✅ Installment queries
paymentSchema.index({ companyId: 1, isInstallment: 1, nextInstallmentDate: 1 });


// ==================== VIRTUALS ====================

paymentSchema.virtual('isPaid').get(function() {
  return this.status === 'completed';
});

paymentSchema.virtual('isPending').get(function() {
  return this.status === 'pending' || this.status === 'processing';
});

paymentSchema.virtual('isFailed').get(function() {
  return this.status === 'failed';
});

paymentSchema.virtual('remainingAmount').get(function() {
  try {
    return Math.max(0, this.finalAmount - (this.refundAmount || 0));
  } catch (err) {
    console.error('❌ Calculate remaining amount error:', err.message);
    return this.finalAmount;
  }
});

paymentSchema.virtual('isPartialRefund').get(function() {
  return this.isRefunded && this.refundAmount < this.finalAmount;
});

paymentSchema.virtual('isFullRefund').get(function() {
  return this.isRefunded && this.refundAmount >= this.finalAmount;
});


// ==================== METHODS ====================

paymentSchema.methods.calculateFinalAmount = function() {
  try {
    const discountAmount = (this.amount * this.discount) / 100;
    const afterDiscount = this.amount - discountAmount;
    const taxAmount = (afterDiscount * this.tax) / 100;
    this.finalAmount = Math.round((afterDiscount + taxAmount) * 100) / 100;  // ✅ Fixed rounding
    return this.finalAmount;
  } catch (err) {
    console.error('❌ Calculate final amount error:', err.message);
    return this.finalAmount;
  }
};

paymentSchema.methods.processPayment = async function() {
  try {
    this.status = 'processing';
    console.log(`⏳ Processing payment: ${this._id}`);
    return await this.save();
  } catch (err) {
    console.error('❌ Process payment error:', err.message);
    throw err;
  }
};

paymentSchema.methods.markAsCompleted = async function() {
  try {
    this.status = 'completed';
    this.processedAt = new Date();
    this.completedAt = new Date();
    console.log(`✅ Payment completed: ${this.transactionId}`);
    return await this.save();
  } catch (err) {
    console.error('❌ Mark as completed error:', err.message);
    throw err;
  }
};

paymentSchema.methods.markAsFailed = async function(errorCode, errorMessage) {
  try {
    this.status = 'failed';
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.retryCount += 1;
    this.lastRetryAt = new Date();
    
    if (this.retryCount >= 5) {
      console.error(`❌ Payment failed (Max retries): ${this._id}`);
    } else {
      console.warn(`⚠️ Payment failed (Retry ${this.retryCount}): ${errorCode}`);
    }
    
    return await this.save();
  } catch (err) {
    console.error('❌ Mark as failed error:', err.message);
    throw err;
  }
};

paymentSchema.methods.refundPayment = async function(amount = null, reason = 'Customer requested') {
  try {
    const refundAmount = amount || this.finalAmount;

    if (refundAmount < 0 || refundAmount > this.finalAmount) {
      throw new Error('Invalid refund amount');
    }

    this.isRefunded = true;
    this.refundAmount = Math.round(refundAmount * 100) / 100;  // ✅ Fixed rounding
    this.refundReason = reason;
    this.refundedAt = new Date();

    if (refundAmount >= this.finalAmount) {
      this.status = 'refunded';
      console.log(`💰 Full refund processed: ${this.transactionId}`);
    } else {
      this.status = 'partially_refunded';
      console.log(`💸 Partial refund processed: ${this.transactionId} (${refundAmount})`);
    }

    return await this.save();
  } catch (err) {
    console.error('❌ Refund payment error:', err.message);
    throw err;
  }
};

paymentSchema.methods.generateInvoiceNumber = function() {
  try {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 10000);
    this.invoiceNumber = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(random).padStart(5, '0')}`;
    return this.invoiceNumber;
  } catch (err) {
    console.error('❌ Generate invoice number error:', err.message);
    throw err;
  }
};

paymentSchema.methods.markInvoiceGenerated = async function(invoiceUrl = null) {
  try {
    this.invoiceGenerated = true;
    this.invoiceGeneratedAt = new Date();
    if (invoiceUrl) this.invoiceUrl = invoiceUrl;
    console.log(`📄 Invoice generated: ${this.invoiceNumber}`);
    return await this.save();
  } catch (err) {
    console.error('❌ Mark invoice generated error:', err.message);
    throw err;
  }
};

paymentSchema.methods.markReceiptSent = async function(receiptUrl = null) {
  try {
    this.receiptSent = true;
    this.receiptSentAt = new Date();
    if (receiptUrl) this.receiptUrl = receiptUrl;
    console.log(`📧 Receipt sent: ${this.transactionId}`);
    return await this.save();
  } catch (err) {
    console.error('❌ Mark receipt sent error:', err.message);
    throw err;
  }
};

paymentSchema.methods.retryPayment = async function() {
  try {
    if (this.retryCount >= 5) {
      throw new Error('Maximum retry attempts (5) reached');
    }

    this.status = 'pending';
    console.log(`🔄 Payment retry scheduled (Attempt ${this.retryCount + 1})`);
    return await this.save();
  } catch (err) {
    console.error('❌ Retry payment error:', err.message);
    throw err;
  }
};

paymentSchema.methods.createInstallmentPlan = async function(planType = '2-pay') {
  try {
    this.isInstallment = true;
    this.installmentPlan = planType;

    const numberOfPayments = parseInt(planType.split('-')[0]);
    this.totalInstallments = numberOfPayments;
    this.installmentNumber = 1;

    // Schedule next installment for 30 days
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    this.nextInstallmentDate = nextDate;

    console.log(`📊 Installment plan created: ${planType} (${numberOfPayments} payments)`);
    return await this.save();
  } catch (err) {
    console.error('❌ Create installment plan error:', err.message);
    throw err;
  }
};

paymentSchema.methods.getSummary = function() {
  try {
    return {
      transactionId: this.transactionId,
      amount: this.amount,
      discount: this.discount,
      tax: this.tax,
      finalAmount: this.finalAmount,
      status: this.status,
      paymentMethod: this.paymentMethod,
      completedAt: this.completedAt,
      refundAmount: this.refundAmount,
      remainingAmount: this.remainingAmount,
      currency: this.currency
    };
  } catch (err) {
    console.error('❌ Get summary error:', err.message);
    return {};
  }
};

paymentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  // ✅ Remove sensitive Stripe data
  delete obj.stripePaymentIntentId;
  delete obj.stripeChargeId;
  delete obj.stripeCustomerId;
  delete obj.cardLast4;
  return obj;
};


// ==================== STATICS ====================

paymentSchema.statics.getByDateRange = async function(companyId, startDate, endDate) {
  try {
    return this.find({
      companyId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 });
  } catch (err) {
    console.error('❌ Get by date range error:', err.message);
    throw err;
  }
};

paymentSchema.statics.getCompleted = function(companyId, limit = 50) {
  try {
    return this.find({
      companyId,
      status: 'completed'
    })
      .sort({ completedAt: -1 })
      .limit(limit);
  } catch (err) {
    console.error('❌ Get completed error:', err.message);
    throw err;
  }
};

paymentSchema.statics.getPending = function(companyId) {
  try {
    return this.find({
      companyId,
      status: { $in: ['pending', 'processing'] }
    }).sort({ createdAt: 1 });
  } catch (err) {
    console.error('❌ Get pending error:', err.message);
    throw err;
  }
};

paymentSchema.statics.getFailed = function(companyId) {
  try {
    return this.find({
      companyId,
      status: 'failed'
    }).sort({ lastRetryAt: -1 });
  } catch (err) {
    console.error('❌ Get failed error:', err.message);
    throw err;
  }
};

paymentSchema.statics.getRefunded = function(companyId) {
  try {
    return this.find({
      companyId,
      isRefunded: true
    }).sort({ refundedAt: -1 });
  } catch (err) {
    console.error('❌ Get refunded error:', err.message);
    throw err;
  }
};

paymentSchema.statics.getByCustomer = function(customerId, limit = 10) {
  try {
    return this.find({ customerId })
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (err) {
    console.error('❌ Get by customer error:', err.message);
    throw err;
  }
};

// ✅ FIXED: Revenue reporting
paymentSchema.statics.getRevenueReport = async function(companyId, startDate, endDate) {
  try {
    const result = await this.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalRefunded: { $sum: '$refundAmount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$finalAmount' }
        }
      }
    ]);

    return result[0] || {
      totalRevenue: 0,
      totalRefunded: 0,
      totalTransactions: 0,
      averageTransaction: 0
    };
  } catch (err) {
    console.error('❌ Get revenue report error:', err.message);
    throw err;
  }
};

paymentSchema.statics.getPaymentMethodStats = async function(companyId) {
  try {
    return this.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$finalAmount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
  } catch (err) {
    console.error('❌ Get payment method stats error:', err.message);
    throw err;
  }
};

paymentSchema.statics.getDailyRevenue = async function(companyId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$finalAmount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  } catch (err) {
    console.error('❌ Get daily revenue error:', err.message);
    throw err;
  }
};

paymentSchema.statics.getInstallmentPayments = function(companyId) {
  try {
    return this.find({
      companyId,
      isInstallment: true,
      status: { $ne: 'completed' }
    }).sort({ nextInstallmentDate: 1 });
  } catch (err) {
    console.error('❌ Get installment payments error:', err.message);
    throw err;
  }
};

// ✅ NEW: Get failed payments for retry
paymentSchema.statics.getFailedForRetry = function(companyId, maxRetries = 5) {
  try {
    return this.find({
      companyId,
      status: 'failed',
      retryCount: { $lt: maxRetries }
    }).sort({ lastRetryAt: 1 });
  } catch (err) {
    console.error('❌ Get failed for retry error:', err.message);
    throw err;
  }
};

// ✅ NEW: Get statistics dashboard
paymentSchema.statics.getPaymentStats = async function(companyId) {
  try {
    return this.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $facet: {
          totalPayments: [{ $count: 'count' }],
          completed: [
            { $match: { status: 'completed' } },
            { $count: 'count' }
          ],
          failed: [
            { $match: { status: 'failed' } },
            { $count: 'count' }
          ],
          refunded: [
            { $match: { status: { $in: ['refunded', 'partially_refunded'] } } },
            { $count: 'count' }
          ],
          totalRevenue: [
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
          ],
          byMethod: [
            { $match: { status: 'completed' } },
            { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
          ]
        }
      }
    ]);
  } catch (err) {
    console.error('❌ Get payment stats error:', err.message);
    throw err;
  }
};


// ==================== PRE-SAVE HOOKS ====================

paymentSchema.pre('save', async function(next) {
  try {
    if (this.isModified('amount') || this.isModified('discount') || this.isModified('tax')) {
      this.calculateFinalAmount();
    }

    this.updatedAt = new Date();
    next();
  } catch (err) {
    console.error('❌ Pre-save hook error:', err.message);
    next(err);
  }
});


// ==================== EXPORT ====================

export default mongoose.model('Payment', paymentSchema);
