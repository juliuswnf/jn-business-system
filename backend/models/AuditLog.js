import mongoose from 'mongoose';

/**
 * Audit Log Model
 * For tracking all security-relevant actions
 */

const auditLogSchema = new mongoose.Schema(
  {
    // User info
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    userEmail: String,
    userName: String,
    userRole: String,

    // Action details
    action: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['auth', 'user', 'salon', 'subscription', 'payment', 'system', 'data', 'security', 'phi', 'compliance'],
      default: 'system',
      index: true
    },
    description: String,

    // ==================== HIPAA COMPLIANCE ====================
    isPHIAccess: {
      type: Boolean,
      default: false,
      index: true,
      comment: 'Protected Health Information access'
    },

    phiAccessDetails: {
      patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      },
      dataType: {
        type: String,
        enum: ['clinical-note', 'medical-history', 'consent-form', 'treatment-record', 'other']
      },
      accessReason: String,
      justification: String
    },

    // Target resource
    resourceType: {
      type: String,
      enum: ['user', 'salon', 'booking', 'payment', 'subscription', 'setting', 'system', 'clinical-note', 'medical-history', 'consent-form'],
      index: true
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    resourceName: String,

    // Request info
    ipAddress: String,
    userAgent: String,
    requestMethod: String,
    requestPath: String,

    // Changes (for updates)
    previousValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,

    // Status
    status: {
      type: String,
      enum: ['success', 'failed', 'warning'],
      default: 'success'
    },
    errorMessage: String,

    // Metadata
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });

// Static method to log an action
auditLogSchema.statics.logAction = async function(data) {
  try {
    return await this.create(data);
  } catch (error) {
    console.error('AuditLog Error:', error);
    return null;
  }
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
