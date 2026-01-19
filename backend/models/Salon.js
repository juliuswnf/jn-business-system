import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['de', 'en'],
    default: 'de'
  }
});

const salonSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // ? Performance optimization for owner queries
  },

  // ==================== MULTI-INDUSTRY SUPPORT ====================
  businessType: {
    type: String,
    required: true,
    enum: [
      'hair-salon',
      'beauty-salon',
      'spa-wellness',
      'tattoo-piercing',
      'medical-aesthetics',
      'personal-training',
      'physiotherapy',
      'barbershop',
      'nail-salon',
      'massage-therapy',
      'yoga-studio',
      'pilates-studio',
      'other'
    ],
    default: 'hair-salon',
    index: true,
    comment: 'Defines terminology and available features'
  },

  terminology: {
    service: {
      type: String,
      default: 'Service',
      comment: 'e.g., "Treatment", "Session", "Tattoo"'
    },
    staff: {
      type: String,
      default: 'Stylist',
      comment: 'e.g., "Artist", "Practitioner", "Trainer"'
    },
    appointment: {
      type: String,
      default: 'Appointment',
      comment: 'e.g., "Session", "Consultation", "Visit"'
    }
  },

  // ==================== COMPLIANCE FLAGS ====================
  compliance: {
    hipaaEnabled: {
      type: Boolean,
      default: false,
      comment: 'Enable HIPAA compliance features (USA medical)'
    },
    gdprEnhanced: {
      type: Boolean,
      default: true,
      comment: 'Enhanced GDPR for medical data'
    },
    requiresConsent: {
      type: Boolean,
      default: false,
      comment: 'Requires consent forms before treatment'
    },
    baaRequired: {
      type: Boolean,
      default: false,
      comment: 'Business Associate Agreement required'
    }
  },

  // Contact & Location
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: String
  },

  // Business Hours
  businessHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: true } }
  },

  // Google Review Integration
  googleReviewUrl: {
    type: String,
    trim: true
  },

  // Email Templates (Multi-language support)
  emailTemplates: {
    confirmation: {
      de: emailTemplateSchema,
      en: emailTemplateSchema
    },
    reminder: {
      de: emailTemplateSchema,
      en: emailTemplateSchema
    },
    review: {
      de: emailTemplateSchema,
      en: emailTemplateSchema
    }
  },

  // Settings
  defaultLanguage: {
    type: String,
    enum: ['de', 'en'],
    default: 'de'
  },
  timezone: {
    type: String,
    default: 'Europe/Berlin'
  },
  bookingBuffer: {
    type: Number,
    default: 15, // minutes between bookings
    min: 0
  },
  advanceBookingDays: {
    type: Number,
    default: 30, // how many days in advance customers can book
    min: 1
  },
  reminderHoursBefore: {
    type: Number,
    default: 24, // send reminder X hours before appointment
    min: 1
  },
  reviewHoursAfter: {
    type: Number,
    default: 2, // send review request X hours after appointment
    min: 0
  },

  // ? HIGH FIX #8: Capacity Management
  capacity: {
    type: Number,
    default: 5, // Default: 5 concurrent bookings
    min: 1,
    max: 50
  },
  settings: {
    maxConcurrentBookings: {
      type: Number,
      default: 5,
      min: 1,
      max: 50
    },
    employeeCount: {
      type: Number,
      default: 1,
      min: 1
    },
    workstationCount: {
      type: Number,
      default: 2,
      min: 1
    }
  },

  // ==================== NO-SHOW-KILLER ====================
  noShowKiller: {
    enabled: {
      type: Boolean,
      default: false,
      comment: 'Enable automatic No-Show-Fee charging'
    },
    feeAmount: {
      type: Number,
      default: 1500, // €15.00 in cents
      min: 500, // Minimum €5.00
      max: 3000, // Maximum €30.00
      comment: 'No-Show-Fee in cents (e.g., 1500 = €15.00)'
    },
    currency: {
      type: String,
      default: 'eur',
      enum: ['eur', 'usd', 'gbp', 'chf'],
      comment: 'Currency for No-Show-Fee'
    },
    requireCardForBooking: {
      type: Boolean,
      default: true,
      comment: 'Require credit card at booking time when No-Show-Killer is enabled'
    },
    // ✅ NEW: Fee split configuration (Stripe Connect)
    platformCommission: {
      type: Number,
      default: 0,
      comment: 'Platform commission in cents (0% - salon keeps all, pays Stripe fees)'
    },
    salonReceives: {
      type: Number,
      default: 1454, // €14.54 (€15.00 - €0.46 Stripe fee)
      comment: 'Amount salon receives after Stripe fees'
    }
  },

  // ==================== STRIPE CONNECT ====================
  stripe: {
    // Existing subscription fields
    connectedAccountId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
      comment: 'Stripe Connect Account ID'
    },
    accountStatus: {
      type: String,
      enum: ['not_created', 'pending', 'active', 'restricted', 'rejected'],
      default: 'not_created',
      comment: 'Stripe Connect account status'
    },
    chargesEnabled: {
      type: Boolean,
      default: false,
      comment: 'Can accept charges'
    },
    payoutsEnabled: {
      type: Boolean,
      default: false,
      comment: 'Can receive payouts'
    },
    onboardingCompletedAt: {
      type: Date,
      default: null,
      comment: 'When Stripe Connect onboarding was completed'
    },
    accountType: {
      type: String,
      enum: ['standard', 'express'],
      default: 'express',
      comment: 'Stripe Connect account type'
    },
    country: {
      type: String,
      default: 'DE',
      comment: 'Stripe Connect account country'
    },
    currency: {
      type: String,
      default: 'eur',
      comment: 'Stripe Connect account currency'
    }
  },

  // Subscription & Billing
  subscription: {
    status: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'canceled', 'inactive'],
      default: 'trial'
    },
    // Pricing Tier (starter/professional/enterprise)
    tier: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'starter'
    },
    // Billing Cycle (monthly/yearly)
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    // Payment Method (stripe/sepa/invoice)
    paymentMethod: {
      type: String,
      enum: ['stripe', 'sepa', 'invoice'],
      default: 'stripe'
    },
    // SMS Usage Tracking (Enterprise tier only)
    smsUsedThisMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    smsResetDate: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date;
      }
    },
    // Grandfathered customers (keep old pricing)
    grandfathered: {
      type: Boolean,
      default: false
    },
    oldPlanId: String, // For reference if grandfathered
    // Stripe Integration
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    planId: String,
    // Trial & Billing Periods
    trialEndsAt: Date,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true // ? Performance optimization for active salon queries
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },

  // ==================== BRANDING / CUSTOM STYLING ====================
  branding: {
    logo: {
      type: String,
      default: null,
      comment: 'URL to salon logo'
    },
    favicon: {
      type: String,
      default: null,
      comment: 'URL to salon favicon'
    },
    primaryColor: {
      type: String,
      default: '#EF4444',
      match: /^#[0-9A-Fa-f]{6}$/
    },
    secondaryColor: {
      type: String,
      default: '#1F2937',
      match: /^#[0-9A-Fa-f]{6}$/
    },
    accentColor: {
      type: String,
      default: '#10B981',
      match: /^#[0-9A-Fa-f]{6}$/
    },
    fontFamily: {
      type: String,
      enum: ['inter', 'roboto', 'open-sans', 'lato', 'montserrat', 'poppins'],
      default: 'inter'
    },
    buttonStyle: {
      type: String,
      enum: ['rounded', 'square', 'pill'],
      default: 'rounded'
    },
    showPoweredBy: {
      type: Boolean,
      default: true,
      comment: 'Show "Powered by JN Business System" (false for Enterprise white-label)'
    }
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
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
}, {
  timestamps: true
});

// Indexes
salonSchema.index({ slug: 1 });
salonSchema.index({ owner: 1 });
salonSchema.index({ 'subscription.status': 1 });
salonSchema.index({ isActive: 1 });
salonSchema.index({ deletedAt: 1 }); // For soft delete queries
salonSchema.index({ owner: 1, isActive: 1 }); // ? Compound index for owner's active salons
salonSchema.index({ owner: 1, deletedAt: 1 }); // ? Compound index for owner's non-deleted salons

// ==================== QUERY MIDDLEWARE - EXCLUDE DELETED ====================

// Automatically exclude soft-deleted documents from queries
salonSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

salonSchema.pre('countDocuments', function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ==================== CASCADE DELETE PREVENTION ====================

salonSchema.pre('findOneAndDelete', async function(next) {
  const salon = await this.model.findOne(this.getFilter());
  if (!salon) return next();

  const error = new Error('Direct deletion not allowed. Use softDelete method instead.');
  error.name = 'CascadeDeleteError';
  return next(error);
});

salonSchema.pre('deleteOne', async function(next) {
  const error = new Error('Direct deletion not allowed. Use softDelete method instead.');
  error.name = 'CascadeDeleteError';
  return next(error);
});

// Virtual for public booking URL
salonSchema.virtual('bookingUrl').get(function() {
  return `/s/${this.slug}`;
});

// Check if subscription is valid
salonSchema.methods.hasActiveSubscription = function() {
  const now = new Date();

  // Treat missing subscription data as inactive
  if (!this.subscription || !this.subscription.status) {
    return false;
  }

  // Trial is valid if not expired
  if (this.subscription.status === 'trial') {
    return !this.subscription.trialEndsAt || this.subscription.trialEndsAt > now;
  }

  // Active subscription
  return this.subscription.status === 'active';
};

// ==================== PRICING TIER HELPERS ====================

// Check if salon has access to a specific feature
salonSchema.methods.hasFeature = function(featureName) {
  // Import pricing config
  const { tierHasFeature } = require('../config/pricing.js');

  // Check if subscription is active
  if (!this.hasActiveSubscription()) {
    return false;
  }

  // Check if tier has feature
  return tierHasFeature(this.subscription.tier || 'starter', featureName);
};

// Check if salon can send SMS (Enterprise only)
salonSchema.methods.canSendSMS = function() {
  const { tierHasFeature, calculateSMSLimit } = require('../config/pricing.js');

  // Check if subscription is active
  if (!this.hasActiveSubscription()) {
    return false;
  }

  // Check if tier has SMS feature (Enterprise only)
  if (!tierHasFeature(this.subscription.tier || 'starter', 'smsNotifications')) {
    return false;
  }

  // Calculate SMS limit based on tier and staff count
  const staffCount = this.staff?.length || 0;
  const smsLimit = calculateSMSLimit(this.subscription.tier, staffCount);

  // Check if under limit
  return (this.subscription.smsUsedThisMonth || 0) < smsLimit;
};

// Get remaining SMS for this month (Enterprise only)
salonSchema.methods.getRemainingSMS = function() {
  const { tierHasFeature, calculateSMSLimit } = require('../config/pricing.js');

  // If no SMS feature, return 0
  if (!tierHasFeature(this.subscription.tier || 'starter', 'smsNotifications')) {
    return 0;
  }

  const staffCount = this.staff?.length || 0;
  const smsLimit = calculateSMSLimit(this.subscription.tier, staffCount);
  const used = this.subscription.smsUsedThisMonth || 0;

  return Math.max(0, smsLimit - used);
};

// Get SMS limit for this month (Enterprise only)
salonSchema.methods.getSMSLimit = function() {
  const { calculateSMSLimit } = require('../config/pricing.js');
  const staffCount = this.staff?.length || 0;
  return calculateSMSLimit(this.subscription.tier || 'starter', staffCount);
};

// Increment SMS usage counter
salonSchema.methods.incrementSMSUsage = async function() {
  // Reset counter if reset date passed
  const now = new Date();
  if (this.subscription.smsResetDate && now >= this.subscription.smsResetDate) {
    await this.resetMonthlySMS();
  }

  // Increment counter
  this.subscription.smsUsedThisMonth = (this.subscription.smsUsedThisMonth || 0) + 1;
  await this.save();
};

// Reset monthly SMS counter (runs on 1st of each month)
salonSchema.methods.resetMonthlySMS = async function() {
  this.subscription.smsUsedThisMonth = 0;

  // Set next reset date to 1st of next month
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  this.subscription.smsResetDate = nextMonth;

  await this.save();
};

// Get remaining bookings for this month (for Starter/Professional tiers)
salonSchema.methods.getRemainingBookings = function() {
  const { PRICING_TIERS } = require('../config/pricing.js');

  const tier = this.subscription.tier || 'starter';
  const tierConfig = PRICING_TIERS[tier];

  // Enterprise has unlimited bookings
  if (!tierConfig?.limits?.bookingsPerMonth) {
    return Infinity;
  }

  // Calculate bookings this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Note: This would need to query Booking model to get actual count
  // For now, return the limit (implement booking tracking separately)
  return tierConfig.limits.bookingsPerMonth;
};

// Get current tier name (user-friendly)
salonSchema.methods.getTierName = function() {
  const tierNames = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise'
  };
  return tierNames[this.subscription.tier || 'starter'] || 'Starter';
};

// Check if salon needs to upgrade for a feature
salonSchema.methods.getRequiredTierForFeature = function(featureName) {
  const { getRequiredTierForFeature } = require('../config/pricing.js');
  return getRequiredTierForFeature(featureName);
};

// ==================== END PRICING TIER HELPERS ====================


// Get email template with fallback
salonSchema.methods.getEmailTemplate = function(type, language) {
  const lang = language || this.defaultLanguage;

  // Try to get template for requested language
  if (this.emailTemplates[type] && this.emailTemplates[type][lang]) {
    return this.emailTemplates[type][lang];
  }

  // Fallback to default language
  if (this.emailTemplates[type] && this.emailTemplates[type][this.defaultLanguage]) {
    return this.emailTemplates[type][this.defaultLanguage];
  }

  // Return null if no template found
  return null;
};

// Initialize default email templates
salonSchema.methods.initializeDefaultTemplates = function() {
  // German templates
  this.emailTemplates = {
    confirmation: {
      de: {
        subject: 'Buchungsbestätigung - {{salon_name}}',
        body: `Hallo {{customer_name}},

Ihre Buchung wurde erfolgreich bestätigt!

Details:
- Service: {{service_name}}
- Datum: {{booking_date}}
- Uhrzeit: {{booking_time}}
- Mitarbeiter: {{employee_name}}

Adresse:
{{salon_address}}

Bei Fragen erreichen Sie uns unter:
E-Mail: {{salon_email}}
Telefon: {{salon_phone}}

Wir freuen uns auf Ihren Besuch!

Mit freundlichen Grüßen,
{{salon_name}}`,
        language: 'de'
      },
      en: {
        subject: 'Booking Confirmation - {{salon_name}}',
        body: `Hello {{customer_name}},

Your booking has been successfully confirmed!

Details:
- Service: {{service_name}}
- Date: {{booking_date}}
- Time: {{booking_time}}
- Staff: {{employee_name}}

Address:
{{salon_address}}

If you have any questions, reach us at:
Email: {{salon_email}}
Phone: {{salon_phone}}

We look forward to seeing you!

Best regards,
{{salon_name}}`,
        language: 'en'
      }
    },
    reminder: {
      de: {
        subject: 'Erinnerung: Ihr Termin bei {{salon_name}}',
        body: `Hallo {{customer_name}},

Dies ist eine freundliche Erinnerung an Ihren Termin:

- Service: {{service_name}}
- Datum: {{booking_date}}
- Uhrzeit: {{booking_time}}

Adresse:
{{salon_address}}

Wir freuen uns auf Sie!

{{salon_name}}`,
        language: 'de'
      },
      en: {
        subject: 'Reminder: Your appointment at {{salon_name}}',
        body: `Hello {{customer_name}},

This is a friendly reminder of your appointment:

- Service: {{service_name}}
- Date: {{booking_date}}
- Time: {{booking_time}}

Address:
{{salon_address}}

We look forward to seeing you!

{{salon_name}}`,
        language: 'en'
      }
    },
    review: {
      de: {
        subject: 'Wie war Ihr Besuch bei {{salon_name}}?',
        body: `Hallo {{customer_name}},

vielen Dank für Ihren Besuch bei uns!

Wir würden uns sehr über Ihr Feedback freuen. Ihre Meinung hilft uns, unseren Service kontinuierlich zu verbessern.

Bitte teilen Sie Ihre Erfahrung auf Google:
{{google_review_url}}

Ihre Bewertung dauert nur 1 Minute und bedeutet uns sehr viel!

Herzlichen Dank und bis bald!

{{salon_name}}`,
        language: 'de'
      },
      en: {
        subject: 'How was your visit to {{salon_name}}?',
        body: `Hello {{customer_name}},

Thank you for visiting us!

We would love to hear your feedback. Your opinion helps us continuously improve our service.

Please share your experience on Google:
{{google_review_url}}

Your review takes only 1 minute and means a lot to us!

Thank you and see you soon!

{{salon_name}}`,
        language: 'en'
      }
    }
  };
};

// Pre-save hook
salonSchema.pre('save', function(next) {
  // Initialize templates if empty
  if (!this.emailTemplates || !this.emailTemplates.confirmation) {
    this.initializeDefaultTemplates();
  }

  // Set trial end date if new trial (14-day Enterprise trial)
  if (this.isNew && this.subscription.status === 'trial' && !this.subscription.trialEndsAt) {
    const { TRIAL_CONFIG } = require('../config/pricing.js');
    const trialDays = TRIAL_CONFIG.durationDays || 14;

    // Set trial end date
    this.subscription.trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    // Set trial tier to Enterprise (show full power of platform)
    this.subscription.tier = TRIAL_CONFIG.tier || 'enterprise';

    // Initialize SMS counter for trial
    this.subscription.smsUsedThisMonth = 0;

    // Set SMS reset date to 1st of next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    this.subscription.smsResetDate = nextMonth;
  }

  // Auto-reset SMS counter if reset date passed
  const now = new Date();
  if (this.subscription.smsResetDate && now >= this.subscription.smsResetDate && !this.isNew) {
    this.subscription.smsUsedThisMonth = 0;

    // Set next reset date
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    this.subscription.smsResetDate = nextMonth;
  }

  next();
});

// Soft delete method with cascade to related data
salonSchema.methods.softDeleteWithCascade = async function(userId) {
  const Service = mongoose.model('Service');
  const Booking = mongoose.model('Booking');
  const Widget = mongoose.model('Widget');
  const User = mongoose.model('User');

  // Soft delete the salon
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive = false;

  // Soft delete all related services
  await Service.updateMany(
    { companyId: this._id },
    {
      deletedAt: new Date(),
      deletedBy: userId,
      isAvailable: false
    }
  );

  // Soft delete all related bookings
  await Booking.updateMany(
    { salonId: this._id },
    {
      deletedAt: new Date(),
      deletedBy: userId,
      status: 'cancelled'
    }
  );

  // Hard delete widget (no sensitive data)
  await Widget.deleteOne({ salonId: this._id });

  // Archive employees (don't break their accounts)
  await User.updateMany(
    { salonId: this._id, role: 'employee' },
    {
      isActive: false,
      salonId: null
    }
  );

  return await this.save();
};

// Restore soft-deleted salon and related data
salonSchema.methods.restoreWithCascade = async function() {
  const Service = mongoose.model('Service');
  const Booking = mongoose.model('Booking');

  // Restore the salon
  this.deletedAt = null;
  this.deletedBy = null;
  this.isActive = true;

  // Restore all related services
  await Service.updateMany(
    { companyId: this._id, deletedAt: { $ne: null } },
    {
      deletedAt: null,
      deletedBy: null,
      isAvailable: true
    }
  );

  // Restore bookings (only future ones)
  const now = new Date();
  await Booking.updateMany(
    {
      salonId: this._id,
      deletedAt: { $ne: null },
      bookingDate: { $gte: now }
    },
    {
      deletedAt: null,
      deletedBy: null,
      status: 'pending'
    }
  );

  return await this.save();
};

// Check if soft-deleted
salonSchema.methods.isDeleted = function() {
  return this.deletedAt !== null;
};

// Statics
salonSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

salonSchema.statics.findActiveByOwner = function(ownerId) {
  return this.findOne({ owner: ownerId, isActive: true });
};

// ES6 Export
export default mongoose.model('Salon', salonSchema);
