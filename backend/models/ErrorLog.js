import mongoose from 'mongoose';

/**
 * ErrorLog Model
 * Für System-Fehlermeldungen und Error-Tracking im CEO Dashboard
 */

const errorLogSchema = new mongoose.Schema({
  // Error Type
  type: {
    type: String,
    enum: ['error', 'warning', 'info', 'critical'],
    default: 'error',
    required: true
  },

  // Error Message
  message: {
    type: String,
    required: true,
    trim: true
  },

  // Error Details
  details: {
    type: String,
    trim: true
  },

  // Source of the error
  source: {
    type: String,
    enum: ['payment', 'email', 'booking', 'widget', 'auth', 'subscription', 'system', 'other'],
    default: 'system'
  },

  // Related Salon (optional)
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    default: null
  },

  // Related User (optional)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Stack trace (für debugging)
  stackTrace: {
    type: String,
    select: false
  },

  // Request info
  requestInfo: {
    method: String,
    path: String,
    ip: String,
    userAgent: String
  },

  // Resolution Status
  resolved: {
    type: Boolean,
    default: false
  },

  resolvedAt: {
    type: Date,
    default: null
  },

  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  resolutionNotes: {
    type: String,
    trim: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
errorLogSchema.index({ type: 1, resolved: 1 });
errorLogSchema.index({ source: 1 });
errorLogSchema.index({ salonId: 1 });
errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ resolved: 1, createdAt: -1 });

// Static method to log an error
errorLogSchema.statics.logError = async function(data) {
  const errorLog = new this({
    type: data.type || 'error',
    message: data.message,
    details: data.details,
    source: data.source || 'system',
    salonId: data.salonId,
    userId: data.userId,
    stackTrace: data.stackTrace,
    requestInfo: data.requestInfo
  });

  return await errorLog.save();
};

// Static method to get unresolved errors count
errorLogSchema.statics.getUnresolvedCount = async function() {
  return await this.countDocuments({ resolved: false });
};

// Static method to get errors by type
errorLogSchema.statics.getByType = async function(type, limit = 50) {
  return await this.find({ type })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('salonId', 'name')
    .populate('userId', 'name email');
};

// Instance method to resolve error
errorLogSchema.methods.resolve = async function(userId, notes = '') {
  this.resolved = true;
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  this.resolutionNotes = notes;
  return await this.save();
};

export default mongoose.model('ErrorLog', errorLogSchema);
