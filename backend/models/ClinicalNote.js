import mongoose from 'mongoose';
import { multiTenantPlugin } from '../middleware/multiTenantPlugin.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Clinical Notes Model
 * For Medical Aesthetics / Physiotherapy
 * ?? HIPAA/GDPR-Enhanced: Encrypted PHI Storage
 */

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.PHI_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

const clinicalNoteSchema = new mongoose.Schema(
  {
    // ==================== References ====================
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      index: true,
      comment: 'Business/Practice reference'
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      comment: 'Link to appointment'
    },

    practitionerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      comment: 'Doctor/Practitioner/Therapist'
    },

    // ==================== Clinical Data (ENCRYPTED) ====================
    encryptedContent: {
      type: String,
      required: true,
      comment: 'AES-256-GCM encrypted clinical notes'
    },

    encryptedIV: {
      type: String,
      required: true,
      comment: 'Initialization vector for decryption'
    },

    encryptedAuthTag: {
      type: String,
      required: true,
      comment: 'GCM authentication tag'
    },

    // ==================== Metadata (NOT encrypted) ====================
    noteType: {
      type: String,
      enum: [
        'consultation',
        'treatment',
        'followUp',
        'assessment',
        'prescription',
        'labResults',
        'other'
      ],
      required: true,
      index: true
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      comment: 'Brief summary (NOT sensitive PHI)'
    },

    treatmentDate: {
      type: Date,
      required: true,
      index: true
    },

    // ==================== Access Control ====================
    accessLevel: {
      type: String,
      enum: ['restricted', 'normal', 'public'],
      default: 'restricted',
      comment: 'Who can access this note'
    },

    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        comment: 'Time-limited access'
      }
    }],

    // ==================== Compliance ====================
    consentFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConsentForm',
      comment: 'Link to signed consent'
    },

    hipaaCompliant: {
      type: Boolean,
      default: true
    },

    // ==================== Attachments ====================
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'document', 'xray', 'scan', 'other']
      },
      url: String,
      encryptedUrl: String,
      fileName: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],

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
    collection: 'clinical_notes'
  }
);

// ==================== INDEXES ====================
clinicalNoteSchema.index({ salonId: 1, customerId: 1, treatmentDate: -1 });
clinicalNoteSchema.index({ practitionerId: 1, treatmentDate: -1 });
clinicalNoteSchema.index({ salonId: 1, noteType: 1 });

// ==================== ENCRYPTION METHODS ====================

/**
 * Encrypt clinical note content
 */
clinicalNoteSchema.methods.encryptContent = function(plainText) {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  this.encryptedContent = encrypted;
  this.encryptedIV = iv.toString('hex');
  this.encryptedAuthTag = authTag.toString('hex');
};

/**
 * Decrypt clinical note content
 */
clinicalNoteSchema.methods.decryptContent = function() {
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(this.encryptedIV, 'hex');
    const authTag = Buffer.from(this.encryptedAuthTag, 'hex');

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(this.encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt clinical note');
  }
};

// ==================== QUERY MIDDLEWARE ====================
clinicalNoteSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ==================== AUDIT LOG TRIGGER ====================
clinicalNoteSchema.post('findOne', async function(doc) {
  if (doc && process.env.HIPAA_AUDIT_ENABLED === 'true') {
    // Log PHI access (implement in AuditLog model)
    const AuditLog = mongoose.model('AuditLog');
    await AuditLog.create({
      action: 'PHI_ACCESS',
      resourceType: 'ClinicalNote',
      resourceId: doc._id,
      userId: this.getOptions().accessedBy,
      timestamp: new Date()
    }).catch(err => logger.error('Audit log failed:', err));
  }
});

// ==================== MULTI-TENANT PLUGIN ====================
clinicalNoteSchema.plugin(multiTenantPlugin);

const ClinicalNote = mongoose.model('ClinicalNote', clinicalNoteSchema);

export default ClinicalNote;

