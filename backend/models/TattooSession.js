import mongoose from 'mongoose';

/**
 * TattooSession Model
 *
 * Represents individual sessions within a tattoo project.
 * Tracks session progress, photos, and links to bookings.
 */

const tattooSessionSchema = new mongoose.Schema({
  // ==================== References ====================
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TattooProject',
    required: true,
    index: true
  },

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    index: true,
    comment: 'Linked booking for this session'
  },

  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },

  // ==================== Session Info ====================
  sessionNumber: {
    type: Number,
    required: true,
    min: 1,
    comment: 'Session number in sequence (1, 2, 3...)'
  },

  phase: {
    type: String,
    trim: true,
    comment: 'Session phase (e.g., Outline, Shading, Colors, Details, Touch-up)'
  },

  // ==================== Duration & Pricing ====================
  duration: {
    type: Number,
    comment: 'Session duration in hours'
  },

  price: {
    type: Number,
    comment: 'Session price in cents'
  },

  // ==================== Status & Progress ====================
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },

  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    comment: 'Project progress after this session (%)'
  },

  // ==================== Session Details ====================
  scheduledDate: {
    type: Date,
    comment: 'Scheduled date/time for this session'
  },

  completedAt: {
    type: Date,
    comment: 'When session was completed'
  },

  // ==================== Notes ====================
  notes: {
    type: String,
    comment: 'Artist notes about this session'
  },

  customerNotes: {
    type: String,
    comment: 'Notes/feedback from customer'
  },

  // ==================== Photos ====================
  beforePhotos: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    caption: String
  }],

  afterPhotos: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    caption: String
  }],

  photos: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['before', 'during', 'after'],
      default: 'during'
    },
    caption: String
  }],

  // ==================== Checklist ====================
  checklist: [{
    item: String,
    checked: {
      type: Boolean,
      default: false
    }
  }],

  // ==================== Aftercare ====================
  aftercareInstructions: {
    type: String,
    comment: 'Post-session aftercare instructions'
  },

  aftercareSent: {
    type: Boolean,
    default: false,
    comment: 'Whether aftercare instructions were sent'
  },

  // ==================== Timestamps ====================
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

// ==================== Indexes ====================
tattooSessionSchema.index({ projectId: 1, sessionNumber: 1 });
tattooSessionSchema.index({ bookingId: 1 });
tattooSessionSchema.index({ salonId: 1, status: 1 });
tattooSessionSchema.index({ scheduledDate: 1 });

// ==================== Methods ====================

/**
 * Complete session and update project progress
 */
tattooSessionSchema.methods.completeSession = async function(progressPercent, notes) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progress = progressPercent;
  if (notes) this.notes = notes;

  await this.save();

  // Update parent project
  const TattooProject = mongoose.model('TattooProject');
  const project = await TattooProject.findById(this.projectId);
  if (project) {
    await project.updateProgress();
  }
};

/**
 * Add photos to session
 */
tattooSessionSchema.methods.addPhotos = function(photos, type = 'during') {
  const photoObjects = photos.map(url => ({
    url,
    uploadedAt: new Date(),
    type
  }));

  this.photos.push(...photoObjects);

  if (type === 'before') {
    this.beforePhotos.push(...photoObjects);
  } else if (type === 'after') {
    this.afterPhotos.push(...photoObjects);
  }

  return this.save();
};

/**
 * Cancel session and linked booking
 */
tattooSessionSchema.methods.cancelSession = async function() {
  this.status = 'cancelled';
  await this.save();

  // Cancel linked booking if exists
  if (this.bookingId) {
    const Booking = mongoose.model('Booking');
    const booking = await Booking.findById(this.bookingId);
    if (booking && booking.status !== 'cancelled') {
      booking.status = 'cancelled';
      booking.cancellationReason = 'Tattoo session cancelled';
      await booking.save();
    }
  }
};

/**
 * Get checklist summary
 */
tattooSessionSchema.methods.getChecklistSummary = function() {
  if (!this.checklist || this.checklist.length === 0) {
    return { items: [], allChecked: true, checkedCount: 0, totalCount: 0 };
  }

  const checkedCount = this.checklist.filter(item => item.checked).length;
  const totalCount = this.checklist.length;

  return {
    items: this.checklist,
    allChecked: checkedCount === totalCount,
    checkedCount,
    totalCount
  };
};

// ==================== Statics ====================

/**
 * Get all sessions for a project
 */
tattooSessionSchema.statics.getProjectSessions = async function(projectId) {
  return this.find({ projectId })
    .populate('bookingId')
    .sort({ sessionNumber: 1 });
};

/**
 * Create session with auto-booking
 */
tattooSessionSchema.statics.createWithBooking = async function(sessionData, bookingData) {
  const Booking = mongoose.model('Booking');

  // Create booking first
  const booking = await Booking.create(bookingData);

  // Create session linked to booking
  const session = await this.create({
    ...sessionData,
    bookingId: booking._id,
    scheduledDate: booking.dateTime
  });

  return { session, booking };
};

// ==================== Pre-save Middleware ====================
tattooSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const TattooSession = mongoose.model('TattooSession', tattooSessionSchema);

export default TattooSession;
