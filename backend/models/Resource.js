import mongoose from 'mongoose';
import { multiTenantPlugin } from '../middleware/multiTenantPlugin.js';

/**
 * Resource Model
 * For Spa/Wellness - Room/Equipment management
 */
const resourceSchema = new mongoose.Schema(
  {
    // ==================== References ====================
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      index: true
    },

    // ==================== Resource Details ====================
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      comment: 'e.g., "Massage Room 1", "Sauna"'
    },

    type: {
      type: String,
      required: true,
      enum: [
        'room',
        'equipment',
        'table',
        'chair',
        'vehicle',
        'other'
      ],
      index: true
    },

    category: {
      type: String,
      enum: [
        'massage-room',
        'facial-room',
        'sauna',
        'steam-room',
        'hot-tub',
        'yoga-studio',
        'treatment-bed',
        'massage-table',
        'equipment',
        'other'
      ]
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500
    },

    // ==================== Capacity ====================
    capacity: {
      type: Number,
      default: 1,
      min: 1,
      comment: 'How many clients can use simultaneously'
    },

    // ==================== Availability ====================
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },

    availableFrom: {
      type: Date,
      comment: 'When does this resource become available'
    },

    availableUntil: {
      type: Date,
      comment: 'When does availability end'
    },

    // ==================== Business Hours Override ====================
    customHours: {
      monday: { open: String, close: String, closed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
      friday: { open: String, close: String, closed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, closed: { type: Boolean, default: true } }
    },

    useSalonHours: {
      type: Boolean,
      default: true,
      comment: 'If true, use salon business hours'
    },

    // ==================== Service Restrictions ====================
    compatibleServices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      comment: 'Which services can use this resource'
    }],

    // ==================== Location ====================
    location: {
      building: String,
      floor: String,
      roomNumber: String,
      notes: String
    },

    // ==================== Maintenance ====================
    maintenanceSchedule: [{
      startDate: Date,
      endDate: Date,
      reason: String,
      isRecurring: {
        type: Boolean,
        default: false
      },
      recurringPattern: String // e.g., "every Monday"
    }],

    lastMaintenanceDate: {
      type: Date
    },

    nextMaintenanceDate: {
      type: Date
    },

    // ==================== Amenities ====================
    amenities: {
      type: [String],
      default: [],
      comment: 'e.g., ["heated table", "aromatherapy", "dimmer lights"]'
    },

    // ==================== Images ====================
    images: [{
      url: String,
      thumbnailUrl: String,
      caption: String
    }],

    // ==================== Bookings ====================
    requiresBooking: {
      type: Boolean,
      default: true,
      comment: 'Must be explicitly booked or auto-assigned?'
    },

    // ==================== Status ====================
    status: {
      type: String,
      enum: ['active', 'maintenance', 'retired', 'temporarily-unavailable'],
      default: 'active',
      index: true
    },

    // ==================== Statistics ====================
    totalBookings: {
      type: Number,
      default: 0
    },

    utilizationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      comment: 'Percentage of time booked'
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
  },
  { 
    timestamps: true,
    collection: 'resources'
  }
);

// ==================== INDEXES ====================
resourceSchema.index({ salonId: 1, type: 1, isAvailable: 1 });
resourceSchema.index({ salonId: 1, status: 1 });
resourceSchema.index({ nextMaintenanceDate: 1 });

// ==================== METHODS ====================

/**
 * Check if resource is available at given time
 */
resourceSchema.methods.isAvailableAt = function(dateTime) {
  if (!this.isAvailable || this.status !== 'active') {
    return false;
  }

  // Check maintenance schedule
  const isMaintenance = this.maintenanceSchedule.some(m => 
    dateTime >= m.startDate && dateTime <= m.endDate
  );

  if (isMaintenance) {
    return false;
  }

  // Check availability window
  if (this.availableFrom && dateTime < this.availableFrom) {
    return false;
  }

  if (this.availableUntil && dateTime > this.availableUntil) {
    return false;
  }

  return true;
};

/**
 * Schedule maintenance
 */
resourceSchema.methods.scheduleMaintenance = function(startDate, endDate, reason) {
  this.maintenanceSchedule.push({
    startDate,
    endDate,
    reason,
    isRecurring: false
  });

  this.nextMaintenanceDate = startDate;
  this.status = 'maintenance';

  return this.save();
};

// ==================== QUERY MIDDLEWARE ====================
resourceSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ==================== MULTI-TENANT PLUGIN ====================
resourceSchema.plugin(multiTenantPlugin);

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
