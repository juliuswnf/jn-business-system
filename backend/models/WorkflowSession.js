import mongoose from 'mongoose';

const workflowSessionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowProject',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  sessionNumber: {
    type: Number,
    required: true
  },
  phase: String,
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  duration: Number,
  price: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  scheduledDate: Date,
  completedAt: Date,
  notes: String,
  customerNotes: String,
  photos: [{
    url: String,
    type: {
      type: String,
      enum: ['before', 'during', 'after', 'progress']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    caption: String
  }],
  checklist: [{
    item: String,
    checked: { type: Boolean, default: false },
    required: { type: Boolean, default: false }
  }],
  nextSessionDate: Date,
  reminderSent: {
    type: Boolean,
    default: false
  },
  followUpSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
workflowSessionSchema.index({ projectId: 1, sessionNumber: 1 });
workflowSessionSchema.index({ bookingId: 1 });
workflowSessionSchema.index({ salonId: 1, status: 1 });
workflowSessionSchema.index({ scheduledDate: 1 });
workflowSessionSchema.index({ salonId: 1, scheduledDate: 1 });

// Virtuals
workflowSessionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

workflowSessionSchema.virtual('photoCount').get(function() {
  return this.photos ? this.photos.length : 0;
});

// Methods
workflowSessionSchema.methods.completeSession = async function(progressPercent, notes) {
  this.status = 'completed';
  this.progress = progressPercent || 100;
  this.completedAt = new Date();

  if (notes) {
    this.notes = notes;
  }

  await this.save();

  // Update project progress
  const WorkflowProject = mongoose.model('WorkflowProject');
  const project = await WorkflowProject.findById(this.projectId);
  if (project) {
    await project.updateProgress();
  }

  return this;
};

workflowSessionSchema.methods.addPhotos = async function(photos) {
  if (!Array.isArray(photos)) {
    photos = [photos];
  }

  photos.forEach(photo => {
    this.photos.push({
      url: photo.url,
      type: photo.type || 'progress',
      caption: photo.caption,
      uploadedAt: new Date()
    });
  });

  await this.save();
  return this;
};

workflowSessionSchema.methods.deletePhoto = async function(photoId) {
  this.photos = this.photos.filter(p => p._id.toString() !== photoId);
  await this.save();
  return this;
};

workflowSessionSchema.methods.cancelSession = async function() {
  this.status = 'cancelled';
  await this.save();

  // Cancel linked booking if exists
  if (this.bookingId) {
    const Booking = mongoose.model('Booking');
    const booking = await Booking.findById(this.bookingId);
    if (booking && booking.status !== 'cancelled') {
      booking.status = 'cancelled';
      await booking.save();
    }
  }

  return this;
};

workflowSessionSchema.methods.markNoShow = async function() {
  this.status = 'no_show';
  await this.save();

  // Mark booking as no-show
  if (this.bookingId) {
    const Booking = mongoose.model('Booking');
    const booking = await Booking.findById(this.bookingId);
    if (booking) {
      booking.status = 'no_show';
      await booking.save();
    }
  }

  return this;
};

workflowSessionSchema.methods.getChecklistSummary = function() {
  const total = this.checklist.length;
  const checked = this.checklist.filter(item => item.checked).length;
  const required = this.checklist.filter(item => item.required).length;
  const requiredChecked = this.checklist.filter(item => item.required && item.checked).length;

  return {
    total,
    checked,
    required,
    requiredChecked,
    percentage: total > 0 ? Math.round((checked / total) * 100) : 0,
    allRequiredChecked: required === requiredChecked
  };
};

// Statics
workflowSessionSchema.statics.getProjectSessions = async function(projectId) {
  return this.find({ projectId })
    .sort({ sessionNumber: 1 })
    .lean();
};

workflowSessionSchema.statics.createWithBooking = async function(sessionData, bookingData) {
  const Booking = mongoose.model('Booking');

  // Create booking first
  const booking = await Booking.create({
    ...bookingData,
    isWorkflowSession: true,
    workflowSessionId: null // Will be set after session creation
  });

  // Create session linked to booking
  const session = await this.create({
    ...sessionData,
    bookingId: booking._id,
    scheduledDate: booking.dateTime
  });

  // Update booking with session reference
  booking.workflowSessionId = session._id;
  if (sessionData.projectId) {
    booking.workflowProjectId = sessionData.projectId;
  }
  await booking.save();

  // Add session to project
  const WorkflowProject = mongoose.model('WorkflowProject');
  const project = await WorkflowProject.findById(sessionData.projectId);
  if (project) {
    await project.addSession(session._id);
  }

  return { session, booking };
};

workflowSessionSchema.statics.getUpcomingSessions = async function(salonId, daysAhead = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  return this.find({
    salonId,
    status: 'scheduled',
    scheduledDate: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .populate('projectId')
  .sort({ scheduledDate: 1 });
};

const WorkflowSession = mongoose.model('WorkflowSession', workflowSessionSchema);

export default WorkflowSession;
