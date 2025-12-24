import mongoose from 'mongoose';

/**
 * Backup Model
 * For database backup management
 */

const backupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['manual', 'scheduled', 'auto'],
      default: 'manual'
    },

    // Backup details
    size: {
      type: Number, // in bytes
      default: 0
    },
    sizeFormatted: String,

    collections: [{
      name: String,
      documentCount: Number,
      size: Number
    }],

    // Storage
    storageLocation: {
      type: String,
      enum: ['local', 's3', 'gcs', 'azure'],
      default: 'local'
    },
    storagePath: String,
    storageUrl: String,

    // Status
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed', 'deleted'],
      default: 'pending'
    },

    // Timing
    startedAt: Date,
    completedAt: Date,
    duration: Number, // in seconds

    // Error handling
    errorMessage: String,
    retryCount: {
      type: Number,
      default: 0
    },

    // Retention
    expiresAt: Date,
    isRetained: {
      type: Boolean,
      default: false
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    metadata: mongoose.Schema.Types.Mixed,

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
    timestamps: true
  }
);

// Indexes
backupSchema.index({ createdAt: -1 });
backupSchema.index({ status: 1 });
backupSchema.index({ type: 1 });

// ==================== QUERY MIDDLEWARE - EXCLUDE DELETED ====================
backupSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

backupSchema.pre('countDocuments', function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// Format size helper
backupSchema.pre('save', function(next) {
  if (this.size) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.size) / Math.log(1024));
    this.sizeFormatted = parseFloat((this.size / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }
  next();
});

// ==================== SOFT DELETE METHODS ====================
backupSchema.methods.softDelete = async function(userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = 'deleted'; // Also mark status as deleted
  return await this.save();
};

backupSchema.methods.restore = async function() {
  this.deletedAt = null;
  this.deletedBy = null;
  return await this.save();
};

backupSchema.methods.isDeleted = function() {
  return this.deletedAt !== null;
};

const Backup = mongoose.model('Backup', backupSchema);

export default Backup;
