import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      default: '',
      maxlength: 5000,  // ✅ Added
      trim: true
    },

    shortDescription: {
      type: String,
      default: '',
      maxlength: 150,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      index: true  // ✅ Added
    },

    currency: {
      type: String,
      enum: ['EUR', 'USD', 'GBP', 'CHF'],  // ✅ Improved
      default: 'EUR',
      index: true  // ✅ Added
    },

    duration: {
      type: Number,
      required: true,
      min: 5
    },

    category: {
      type: String,
      required: true,
      index: true
    },

    subcategory: {
      type: String,
      sparse: true,  // ✅ Added
      index: true
    },

    image: {
      type: String,
      sparse: true  // ✅ Added
    },

    images: {
      type: [String],
      default: [],
      sparse: true  // ✅ Added
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },

    availableFrom: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    availableUntil: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    assignedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        index: true  // ✅ Added
      }
    ],

    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100  // ✅ Added
    },

    discountValidUntil: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    requirements: {
      type: [String],
      default: [],
      sparse: true  // ✅ Added
    },

    maxCapacity: {
      type: Number,
      default: 1,
      min: 1  // ✅ Added
    },

    minCapacity: {
      type: Number,
      default: 1,
      min: 1  // ✅ Added
    },

    onlineAvailable: {
      type: Boolean,
      default: false,
      index: true  // ✅ Added
    },

    tags: {
      type: [String],
      default: [],
      sparse: true,  // ✅ Added
      index: true
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true  // ✅ Added
    },

    metaDescription: {
      type: String,
      maxlength: 160,  // ✅ Added - SEO best practice
      sparse: true  // ✅ Added
    },

    keywords: {
      type: [String],
      default: [],
      sparse: true,  // ✅ Added
      index: true
    },

    variations: [
      {
        name: { type: String, required: true },
        priceModifier: { type: Number, default: 0 },
        durationModifier: { type: Number, default: 0 }
      }
    ],

    addOns: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        duration: { type: Number, required: true, min: 0 }
      }
    ],

    ageRestriction: {
      minAge: { type: Number, min: 0, sparse: true },
      maxAge: { type: Number, min: 0, sparse: true }
    },

    frequency: {
      type: String,
      enum: ['one-time', 'weekly', 'bi-weekly', 'monthly'],
      default: 'one-time',
      index: true  // ✅ Added
    },

    preparationTime: {
      type: Number,
      default: 0,
      min: 0  // ✅ Added
    },

    cleanupTime: {
      type: Number,
      default: 0,
      min: 0  // ✅ Added
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true  // ✅ Added
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0  // ✅ Added
    },

    totalBookings: {
      type: Number,
      default: 0,
      min: 0  // ✅ Added
    },

    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,  // ✅ Added
      index: true
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0,  // ✅ Added
      index: true
    },

    searchRank: {
      type: Number,
      default: 0,
      min: 0  // ✅ Added
    },

    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true }
      }
    ],

    cancellationPolicy: {
      type: String,
      sparse: true,  // ✅ Added
      maxlength: 1000
    },

    terms: {
      type: String,
      sparse: true,  // ✅ Added
      maxlength: 2000
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
      index: true
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },

    featuredUntil: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    isBestseller: {
      type: Boolean,
      default: false,
      index: true  // ✅ Added
    },

    isNew: {
      type: Boolean,
      default: true,
      index: true  // ✅ Added
    },

    newUntil: {
      type: Date,
      sparse: true,  // ✅ Added
      index: true
    },

    customFields: {
      type: Map,
      of: String,
      default: {},
      sparse: true  // ✅ Added
    },

    urlSlug: {
      type: String,
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,  // ✅ Added
      index: true
    }
  },
  { timestamps: true }
);


// ==================== INDEXES (OPTIMIZED) ====================

serviceSchema.index({ companyId: 1, category: 1, status: 1 });
serviceSchema.index({ companyId: 1, status: 1, createdAt: -1 });
serviceSchema.index({ slug: 1 });
serviceSchema.index({ category: 1, isAvailable: 1, rating: -1 });
serviceSchema.index({ isFeatured: 1, rating: -1, createdAt: -1 });
serviceSchema.index({ companyId: 1, price: 1 });
serviceSchema.index({ isBestseller: 1, totalBookings: -1 });
serviceSchema.index({ isNew: 1, newUntil: -1 });


// ==================== VIRTUALS ====================

serviceSchema.virtual('finalPrice').get(function() {
  try {
    if (!this.discount || this.discount === 0) return this.price;
    const discountAmount = (this.price * this.discount) / 100;
    return Math.round((this.price - discountAmount) * 100) / 100;  // ✅ Fixed rounding
  } catch (err) {
    console.error('❌ Calculate final price error:', err.message);
    return this.price;
  }
});

serviceSchema.virtual('durationHours').get(function() {
  try {
    return (this.duration / 60).toFixed(1);
  } catch (err) {
    console.error('❌ Calculate duration hours error:', err.message);
    return 0;
  }
});

serviceSchema.virtual('totalDuration').get(function() {
  try {
    return this.preparationTime + this.duration + this.cleanupTime;
  } catch (err) {
    console.error('❌ Calculate total duration error:', err.message);
    return this.duration;
  }
});

serviceSchema.virtual('pricePerMinute').get(function() {
  try {
    return (this.price / this.duration).toFixed(2);
  } catch (err) {
    console.error('❌ Calculate price per minute error:', err.message);
    return 0;
  }
});

serviceSchema.virtual('hasDiscount').get(function() {
  try {
    return this.discount > 0 && (!this.discountValidUntil || this.discountValidUntil > new Date());
  } catch (err) {
    console.error('❌ Check has discount error:', err.message);
    return false;
  }
});

serviceSchema.virtual('isOnSale').get(function() {
  try {
    if (!this.discountValidUntil) return false;
    return this.discountValidUntil > new Date();
  } catch (err) {
    console.error('❌ Check is on sale error:', err.message);
    return false;
  }
});

serviceSchema.virtual('revenuePotential').get(function() {
  try {
    return this.totalRevenue / Math.max(this.totalBookings, 1);
  } catch (err) {
    console.error('❌ Calculate revenue potential error:', err.message);
    return 0;
  }
});


// ==================== METHODS ====================

serviceSchema.methods.generateSlug = function() {
  try {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return this.slug;
  } catch (err) {
    console.error('❌ Generate slug error:', err.message);
    throw err;
  }
};

serviceSchema.methods.isCurrentlyAvailable = function() {
  try {
    if (!this.isAvailable || this.status !== 'active') return false;
    if (this.availableFrom && new Date() < this.availableFrom) return false;
    if (this.availableUntil && new Date() > this.availableUntil) return false;
    return true;
  } catch (err) {
    console.error('❌ Check is currently available error:', err.message);
    return false;
  }
};

serviceSchema.methods.applyDiscount = async function(discountPercent, validUntil) {
  try {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error('Discount must be between 0 and 100');
    }
    this.discount = discountPercent;
    this.discountValidUntil = validUntil;
    console.log(`💰 Discount applied: ${discountPercent}% until ${validUntil}`);
    return await this.save();
  } catch (err) {
    console.error('❌ Apply discount error:', err.message);
    throw err;
  }
};

serviceSchema.methods.removeDiscount = async function() {
  try {
    this.discount = 0;
    this.discountValidUntil = null;
    console.log(`✅ Discount removed: ${this._id}`);
    return await this.save();
  } catch (err) {
    console.error('❌ Remove discount error:', err.message);
    throw err;
  }
};

serviceSchema.methods.incrementViewCount = async function() {
  try {
    this.viewCount += 1;
    return await this.save();
  } catch (err) {
    console.error('❌ Increment view count error:', err.message);
    throw err;
  }
};

serviceSchema.methods.markAsFeatured = async function(daysValid = 30) {
  try {
    this.isFeatured = true;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysValid);
    this.featuredUntil = futureDate;
    console.log(`⭐ Service marked as featured: ${this.name}`);
    return await this.save();
  } catch (err) {
    console.error('❌ Mark as featured error:', err.message);
    throw err;
  }
};

serviceSchema.methods.markAsBestseller = async function() {
  try {
    this.isBestseller = true;
    console.log(`🏆 Service marked as bestseller: ${this.name}`);
    return await this.save();
  } catch (err) {
    console.error('❌ Mark as bestseller error:', err.message);
    throw err;
  }
};

serviceSchema.methods.markAsNew = async function(daysValid = 30) {
  try {
    this.isNew = true;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysValid);
    this.newUntil = futureDate;
    console.log(`🆕 Service marked as new: ${this.name}`);
    return await this.save();
  } catch (err) {
    console.error('❌ Mark as new error:', err.message);
    throw err;
  }
};

serviceSchema.methods.getPriceWithVariation = function(variationName) {
  try {
    const variation = this.variations?.find(v => v.name === variationName);
    if (!variation) return this.finalPrice;
    const modifiedPrice = this.finalPrice + (variation.priceModifier || 0);
    return Math.max(0, modifiedPrice);
  } catch (err) {
    console.error('❌ Get price with variation error:', err.message);
    return this.finalPrice;
  }
};

serviceSchema.methods.getDurationWithVariation = function(variationName) {
  try {
    const variation = this.variations?.find(v => v.name === variationName);
    if (!variation) return this.duration;
    return this.duration + (variation.durationModifier || 0);
  } catch (err) {
    console.error('❌ Get duration with variation error:', err.message);
    return this.duration;
  }
};

serviceSchema.methods.addBooking = async function(amount) {
  try {
    this.totalBookings += 1;
    this.totalRevenue += amount;
    console.log(`📊 Booking added - Total: ${this.totalBookings}, Revenue: ${this.totalRevenue}`);
    return await this.save();
  } catch (err) {
    console.error('❌ Add booking error:', err.message);
    throw err;
  }
};

serviceSchema.methods.updateRating = async function(newRating, reviewCount) {
  try {
    this.rating = newRating;
    this.reviewCount = reviewCount;
    this.averageRating = newRating;
    console.log(`⭐ Rating updated: ${newRating} (${reviewCount} reviews)`);
    return await this.save();
  } catch (err) {
    console.error('❌ Update rating error:', err.message);
    throw err;
  }
};

serviceSchema.methods.getAddOns = function() {
  try {
    return this.addOns || [];
  } catch (err) {
    console.error('❌ Get add-ons error:', err.message);
    return [];
  }
};

serviceSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};


// ==================== STATICS ====================

serviceSchema.statics.getFeaturedServices = function(companyId, limit = 5) {
  try {
    return this.find({
      companyId,
      isFeatured: true,
      status: 'active',
      isAvailable: true
    })
      .sort({ rating: -1, totalBookings: -1 })
      .limit(limit);
  } catch (err) {
    console.error('❌ Get featured services error:', err.message);
    throw err;
  }
};

serviceSchema.statics.getBestsellers = function(companyId, limit = 10) {
  try {
    return this.find({
      companyId,
      isBestseller: true,
      status: 'active'
    })
      .sort({ totalBookings: -1, rating: -1 })
      .limit(limit);
  } catch (err) {
    console.error('❌ Get bestsellers error:', err.message);
    throw err;
  }
};

serviceSchema.statics.getByCategory = function(companyId, category, limit = 20) {
  try {
    return this.find({
      companyId,
      category,
      status: 'active',
      isAvailable: true
    })
      .sort({ rating: -1, totalBookings: -1 })
      .limit(limit);
  } catch (err) {
    console.error('❌ Get by category error:', err.message);
    throw err;
  }
};

serviceSchema.statics.searchServices = function(companyId, query) {
  try {
    return this.find({
      companyId,
      status: 'active',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    }).sort({ rating: -1, totalBookings: -1 });
  } catch (err) {
    console.error('❌ Search services error:', err.message);
    throw err;
  }
};

serviceSchema.statics.getServiceStats = async function(companyId) {
  try {
    const result = await this.aggregate([
      {
        $match: { companyId: new mongoose.Types.ObjectId(companyId) }
      },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          activeServices: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalRevenue: { $sum: '$totalRevenue' },
          totalBookings: { $sum: '$totalBookings' },
          averagePrice: { $avg: '$price' },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    return result[0] || {
      totalServices: 0,
      activeServices: 0,
      totalRevenue: 0,
      totalBookings: 0,
      averagePrice: 0,
      averageRating: 0
    };
  } catch (err) {
    console.error('❌ Get service stats error:', err.message);
    throw err;
  }
};

serviceSchema.statics.getOnSaleServices = function(companyId, limit = 10) {
  try {
    return this.find({
      companyId,
      status: 'active',
      isAvailable: true,
      discount: { $gt: 0 },
      discountValidUntil: { $gte: new Date() }
    })
      .sort({ discount: -1, rating: -1 })
      .limit(limit);
  } catch (err) {
    console.error('❌ Get on sale services error:', err.message);
    throw err;
  }
};

serviceSchema.statics.getRecentlyAdded = function(companyId, limit = 5) {
  try {
    return this.find({
      companyId,
      status: 'active',
      isNew: true,
      newUntil: { $gte: new Date() }
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (err) {
    console.error('❌ Get recently added error:', err.message);
    throw err;
  }
};

serviceSchema.statics.getByEmployee = function(employeeId) {
  try {
    return this.find({
      assignedEmployees: employeeId,
      status: 'active'
    }).sort({ rating: -1 });
  } catch (err) {
    console.error('❌ Get by employee error:', err.message);
    throw err;
  }
};

serviceSchema.statics.getTopRated = function(companyId, limit = 5) {
  try {
    return this.find({
      companyId,
      status: 'active'
    })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(limit);
  } catch (err) {
    console.error('❌ Get top rated error:', err.message);
    throw err;
  }
};

serviceSchema.statics.getPriceRange = async function(companyId, category = null) {
  try {
    const match = { companyId: new mongoose.Types.ObjectId(companyId), status: 'active' };
    if (category) match.category = category;

    const result = await this.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    return result[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 };
  } catch (err) {
    console.error('❌ Get price range error:', err.message);
    throw err;
  }
};

serviceSchema.statics.getByCompany = function(companyId) {
  try {
    return this.find({ companyId, status: 'active' }).sort({ name: 1 });
  } catch (err) {
    console.error('❌ Get by company error:', err.message);
    throw err;
  }
};

serviceSchema.statics.searchByTag = function(companyId, tag) {
  try {
    return this.find({
      companyId,
      tags: tag,
      status: 'active'
    }).sort({ rating: -1, totalBookings: -1 });
  } catch (err) {
    console.error('❌ Search by tag error:', err.message);
    throw err;
  }
};

// ✅ NEW: Get trending services
serviceSchema.statics.getTrendingServices = function(companyId, limit = 5) {
  try {
    return this.find({
      companyId,
      status: 'active'
    })
      .sort({ viewCount: -1, totalBookings: -1, rating: -1 })
      .limit(limit);
  } catch (err) {
    console.error('❌ Get trending services error:', err.message);
    throw err;
  }
};


// ==================== PRE-SAVE HOOKS ====================

serviceSchema.pre('save', async function(next) {
  try {
    this.updatedAt = new Date();

    // Auto-generate slug
    if (!this.slug || this.isModified('name')) {
      this.generateSlug();
    }

    // Auto-unfeature if expired
    if (this.featuredUntil && this.featuredUntil < new Date()) {
      this.isFeatured = false;
    }

    // Auto-mark as not new if expired
    if (this.newUntil && this.newUntil < new Date()) {
      this.isNew = false;
    }

    // Auto-remove discount if expired
    if (this.discountValidUntil && this.discountValidUntil < new Date()) {
      this.discount = 0;
      this.discountValidUntil = null;
    }

    // Auto-mark unavailable if date passed
    if (this.availableUntil && this.availableUntil < new Date()) {
      this.isAvailable = false;
    }

    next();
  } catch (err) {
    console.error('❌ Pre-save hook error:', err.message);
    next(err);
  }
});


// ==================== EXPORT ====================

export default mongoose.model('Service', serviceSchema);
