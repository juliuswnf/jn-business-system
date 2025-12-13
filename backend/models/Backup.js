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
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

// Indexes
backupSchema.index({ createdAt: -1 });
backupSchema.index({ status: 1 });
backupSchema.index({ type: 1 });

// Format size helper
backupSchema.pre('save', function(next) {
  if (this.size) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.size) / Math.log(1024));
    this.sizeFormatted = parseFloat((this.size / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }
  next();
});

const Backup = mongoose.model('Backup', backupSchema);

export default Backup;
