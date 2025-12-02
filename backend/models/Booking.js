import mongoose from 'mongoose';

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
      default: null
    },

    // Optional: Link to Customer account if they create one later
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },

    // ==================== Booking Details ====================
    bookingDate: {
      type: Date,
      required: true,
      index: true
    },

    duration: {
      type: Number, // minutes
      required: true,
      min: 15
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },

    // ==================== Status ====================
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true
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

    // ==================== Email Tracking ====================
    emailsSent: {
      confirmation: { type: Boolean, default: false },
      reminder: { type: Boolean, default: false },
      review: { type: Boolean, default: false }
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

bookingSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
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

// ==================== EXPORT ====================

export default mongoose.model('Booking', bookingSchema);
