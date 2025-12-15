import mongoose from 'mongoose';

/**
 * TattooProject Model
 *
 * Manages multi-session tattoo projects for tattoo studios.
 * Tracks overall project progress, estimated duration, and pricing.
 */

const tattooProjectSchema = new mongoose.Schema({
  // ==================== Multi-Tenancy ====================
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },

  // ==================== Customer Reference ====================
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },

  // ==================== Project Details ====================
  name: {
    type: String,
    required: true,
    trim: true,
    comment: 'Project name (e.g., "Japanese Dragon Back Piece")'
  },

  description: {
    type: String,
    trim: true,
    comment: 'Detailed project description'
  },

  style: {
    type: String,
    trim: true,
    comment: 'Tattoo style (e.g., Japanese, Blackwork, Realism, Traditional, Neo-Traditional, Watercolor)'
  },

  bodyPart: {
    type: String,
    required: true,
    trim: true,
    comment: 'Body part/location (e.g., Back, Arm, Leg, Chest, Sleeve)'
  },

  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'full-body'],
    required: true,
    comment: 'Overall project size'
  },

  // ==================== Session Management ====================
  totalSessions: {
    type: Number,
    required: true,
    min: 1,
    comment: 'Total number of planned sessions'
  },

  completedSessions: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Number of completed sessions'
  },

  // ==================== Progress Tracking ====================
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    comment: 'Overall project completion percentage'
  },

  status: {
    type: String,
    enum: ['draft', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
    index: true,
    comment: 'Project status'
  },

  // ==================== Estimates ====================
  estimatedDuration: {
    type: Number,
    comment: 'Total estimated duration in hours'
  },

  estimatedPrice: {
    type: Number,
    comment: 'Total estimated price in cents'
  },

  actualDuration: {
    type: Number,
    default: 0,
    comment: 'Actual total duration in hours (sum of completed sessions)'
  },

  actualPrice: {
    type: Number,
    default: 0,
    comment: 'Actual total price in cents (sum of completed sessions)'
  },

  // ==================== Dates ====================
  startDate: {
    type: Date,
    comment: 'Project start date (first session)'
  },

  completedDate: {
    type: Date,
    comment: 'Project completion date (last session)'
  },

  // ==================== Artist ====================
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    comment: 'Primary artist for this project'
  },

  // ==================== Notes & Reference ====================
  notes: {
    type: String,
    comment: 'Internal notes about the project'
  },

  referenceImages: [{
    type: String,
    comment: 'URLs of reference images'
  }],

  // ==================== Checklist ====================
  checklist: [{
    item: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],

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
tattooProjectSchema.index({ salonId: 1, status: 1 });
tattooProjectSchema.index({ customerId: 1 });
tattooProjectSchema.index({ artistId: 1 });
tattooProjectSchema.index({ salonId: 1, createdAt: -1 });

// ==================== Virtual: Sessions ====================
tattooProjectSchema.virtual('sessions', {
  ref: 'TattooSession',
  localField: '_id',
  foreignField: 'projectId'
});

// ==================== Methods ====================

/**
 * Update project progress based on completed sessions
 */
tattooProjectSchema.methods.updateProgress = async function() {
  const TattooSession = mongoose.model('TattooSession');
  const sessions = await TattooSession.find({ projectId: this._id });

  if (sessions.length === 0) {
    this.progress = 0;
    return;
  }

  // Calculate average progress from all sessions
  const totalProgress = sessions.reduce((sum, session) => sum + (session.progress || 0), 0);
  this.progress = Math.round(totalProgress / sessions.length);

  // Count completed sessions
  this.completedSessions = sessions.filter(s => s.status === 'completed').length;

  // Calculate actual duration and price
  const completedSessions = sessions.filter(s => s.status === 'completed');
  this.actualDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  this.actualPrice = completedSessions.reduce((sum, s) => sum + (s.price || 0), 0);

  // Auto-complete project if all sessions done
  if (this.completedSessions >= this.totalSessions && this.status === 'in_progress') {
    this.status = 'completed';
    this.completedDate = new Date();
    this.progress = 100;
  }

  await this.save();
};

/**
 * Start project (set first session date as start date)
 */
tattooProjectSchema.methods.startProject = function() {
  if (this.status === 'draft') {
    this.status = 'in_progress';
    this.startDate = new Date();
  }
};

/**
 * Cancel project
 */
tattooProjectSchema.methods.cancelProject = async function() {
  this.status = 'cancelled';

  // Cancel all pending sessions
  const TattooSession = mongoose.model('TattooSession');
  await TattooSession.updateMany(
    { projectId: this._id, status: { $in: ['scheduled', 'in_progress'] } },
    { status: 'cancelled' }
  );

  await this.save();
};

// ==================== Statics ====================

/**
 * Get projects with statistics
 */
tattooProjectSchema.statics.getProjectsWithStats = async function(salonId, filters = {}) {
  const query = { salonId, ...filters };

  const projects = await this.find(query)
    .populate('customerId', 'firstName lastName email phone')
    .populate('artistId', 'firstName lastName')
    .sort({ createdAt: -1 });

  return projects;
};

/**
 * Get project statistics for dashboard
 */
tattooProjectSchema.statics.getDashboardStats = async function(salonId) {
  const projects = await this.find({ salonId });

  const stats = {
    total: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
    totalRevenue: projects
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.actualPrice || 0), 0),
    averageProgress: Math.round(
      projects
        .filter(p => p.status === 'in_progress')
        .reduce((sum, p) => sum + p.progress, 0) /
      (projects.filter(p => p.status === 'in_progress').length || 1)
    )
  };

  return stats;
};

// ==================== Pre-save Middleware ====================
tattooProjectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const TattooProject = mongoose.model('TattooProject', tattooProjectSchema);

export default TattooProject;
