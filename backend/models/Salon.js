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
    required: true
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

  // Subscription & Billing
  subscription: {
    status: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'canceled', 'inactive'],
      default: 'trial'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    planId: String,
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
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
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
salonSchema.index({ slug: 1 });
salonSchema.index({ owner: 1 });
salonSchema.index({ 'subscription.status': 1 });
salonSchema.index({ isActive: 1 });

// Virtual for public booking URL
salonSchema.virtual('bookingUrl').get(function() {
  return `/s/${this.slug}`;
});

// Check if subscription is valid
salonSchema.methods.hasActiveSubscription = function() {
  const now = new Date();

  // Trial is valid if not expired
  if (this.subscription.status === 'trial') {
    return !this.subscription.trialEndsAt || this.subscription.trialEndsAt > now;
  }

  // Active subscription
  return this.subscription.status === 'active';
};

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

  // Set trial end date if new trial
  if (this.isNew && this.subscription.status === 'trial' && !this.subscription.trialEndsAt) {
    const trialDays = 14; // 14 day trial
    this.subscription.trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
  }

  next();
});

// Statics
salonSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

salonSchema.statics.findActiveByOwner = function(ownerId) {
  return this.findOne({ owner: ownerId, isActive: true });
};

// ES6 Export
export default mongoose.model('Salon', salonSchema);
