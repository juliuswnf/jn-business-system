import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Widget Model - For Embeddable Booking System
 * Allows salon owners to embed booking on their website
 */

const widgetSchema = new mongoose.Schema(
  {
    // ==================== SALON REFERENCE ====================
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      unique: true,
      index: true
    },

    // ==================== WIDGET CONFIGURATION ====================
    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Allowed domains (CORS)
    allowedDomains: [{
      type: String,
      trim: true,
      lowercase: true
    }],

    // ==================== CUSTOMIZATION ====================
    theme: {
      primaryColor: {
        type: String,
        default: '#3B82F6' // Tailwind blue-500
      },
      secondaryColor: {
        type: String,
        default: '#1F2937' // Tailwind gray-800
      },
      fontFamily: {
        type: String,
        default: 'Inter, system-ui, sans-serif'
      },
      borderRadius: {
        type: String,
        default: '8px'
      }
    },

    // ==================== WIDGET SETTINGS ====================
    settings: {
      showLogo: {
        type: Boolean,
        default: true
      },
      showAddress: {
        type: Boolean,
        default: true
      },
      showBusinessHours: {
        type: Boolean,
        default: true
      },
      requirePhone: {
        type: Boolean,
        default: false
      },
      enableGuestBooking: {
        type: Boolean,
        default: true // No registration required
      },
      defaultLanguage: {
        type: String,
        enum: ['de', 'en'],
        default: 'de'
      },
      enableLanguageSwitch: {
        type: Boolean,
        default: true
      }
    },

    // ==================== WIDGET SIZE ====================
    layout: {
      type: String,
      enum: ['popup', 'inline', 'sidebar'],
      default: 'popup'
    },

    width: {
      type: String,
      default: '100%'
    },

    height: {
      type: String,
      default: '600px'
    },

    // ==================== STATUS & STATS ====================
    isActive: {
      type: Boolean,
      default: true
    },

    stats: {
      totalBookings: {
        type: Number,
        default: 0
      },
      lastBookingAt: {
        type: Date,
        default: null
      },
      totalViews: {
        type: Number,
        default: 0
      },
      lastViewAt: {
        type: Date,
        default: null
      }
    },

    // ==================== TIMESTAMPS ====================
    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// ==================== INDEXES ====================
widgetSchema.index({ salonId: 1 });
widgetSchema.index({ apiKey: 1 });
widgetSchema.index({ isActive: 1 });

// ==================== VIRTUALS ====================
widgetSchema.virtual('embedCode').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `<script src="${baseUrl}/widget/embed.js" data-widget-id="${this.apiKey}"></script>`;
});

widgetSchema.virtual('iframeCode').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `<iframe src="${baseUrl}/widget/${this.apiKey}" width="${this.width}" height="${this.height}" frameborder="0"></iframe>`;
});

widgetSchema.virtual('directUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/widget/${this.apiKey}`;
});

// ==================== METHODS ====================

// Generate new API key
widgetSchema.methods.regenerateApiKey = function() {
  this.apiKey = crypto.randomBytes(32).toString('hex');
  return this.save();
};

// Add allowed domain
widgetSchema.methods.addAllowedDomain = function(domain) {
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!this.allowedDomains.includes(cleanDomain)) {
    this.allowedDomains.push(cleanDomain);
  }
  return this.save();
};

// Remove allowed domain
widgetSchema.methods.removeAllowedDomain = function(domain) {
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  this.allowedDomains = this.allowedDomains.filter(d => d !== cleanDomain);
  return this.save();
};

// Check if domain is allowed
widgetSchema.methods.isDomainAllowed = function(domain) {
  // If no domains specified, allow all (for testing)
  if (this.allowedDomains.length === 0) return true;
  
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return this.allowedDomains.includes(cleanDomain) || this.allowedDomains.includes('*');
};

// Increment booking count
widgetSchema.methods.incrementBooking = async function() {
  this.stats.totalBookings += 1;
  this.stats.lastBookingAt = new Date();
  return await this.save();
};

// Increment view count
widgetSchema.methods.incrementView = async function() {
  this.stats.totalViews += 1;
  this.stats.lastViewAt = new Date();
  return await this.save();
};

// Update theme
widgetSchema.methods.updateTheme = async function(theme) {
  this.theme = { ...this.theme.toObject(), ...theme };
  return await this.save();
};

// Update settings
widgetSchema.methods.updateSettings = async function(settings) {
  this.settings = { ...this.settings.toObject(), ...settings };
  return await this.save();
};

// ==================== STATICS ====================

// Find by API key
widgetSchema.statics.findByApiKey = function(apiKey) {
  return this.findOne({ apiKey, isActive: true });
};

// Find by salon
widgetSchema.statics.findBySalon = function(salonId) {
  return this.findOne({ salonId });
};

// Create widget for salon
widgetSchema.statics.createForSalon = async function(salonId, config = {}) {
  // Check if widget already exists
  const existing = await this.findOne({ salonId });
  if (existing) {
    throw new Error('Widget already exists for this salon');
  }

  // Generate API key
  const apiKey = crypto.randomBytes(32).toString('hex');

  // Create widget
  return await this.create({
    salonId,
    apiKey,
    ...config
  });
};

// Get widget statistics
widgetSchema.statics.getStats = async function(salonId) {
  const widget = await this.findOne({ salonId });
  if (!widget) return null;

  return {
    totalBookings: widget.stats.totalBookings,
    totalViews: widget.stats.totalViews,
    lastBookingAt: widget.stats.lastBookingAt,
    lastViewAt: widget.stats.lastViewAt,
    conversionRate: widget.stats.totalViews > 0 
      ? (widget.stats.totalBookings / widget.stats.totalViews * 100).toFixed(2) 
      : 0
  };
};

// ==================== PRE-SAVE HOOKS ====================

widgetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ==================== EXPORT ====================

export default mongoose.model('Widget', widgetSchema);
