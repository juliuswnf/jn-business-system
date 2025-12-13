import mongoose from 'mongoose';
import { multiTenantPlugin } from '../middleware/multiTenantPlugin.js';

/**
 * Consent Form Model
 * For Medical Aesthetics / Physiotherapy
 * HIPAA/GDPR Compliance: Treatment consent tracking
 */
const consentFormSchema = new mongoose.Schema(
  {
    // ==================== References ====================
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },

    // ==================== Consent Details ====================
    consentType: {
      type: String,
      enum: [
        'treatment',
        'photography',
        'beforeAfter',
        'dataProcessing',
        'marketing',
        'thirdPartySharing',
        'telehealth',
        'minorConsent'
      ],
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      maxlength: 5000
    },

    // ==================== Treatment-Specific ====================
    treatmentName: {
      type: String,
      trim: true,
      comment: 'e.g., "Botox Injection", "Laser Hair Removal"'
    },

    risks: {
      type: [String],
      default: [],
      comment: 'List of disclosed risks'
    },

    // ==================== Signature ====================
    signedAt: {
      type: Date,
      required: true,
      default: Date.now
    },

    signature: {
      type: String,
      required: true,
      comment: 'Base64 encoded signature or typed name'
    },

    ipAddress: {
      type: String,
      required: true,
      comment: 'IP address when consent was given'
    },

    userAgent: {
      type: String,
      comment: 'Browser/device info'
    },

    // ==================== Legal Guardian (for minors) ====================
    guardianName: {
      type: String,
      trim: true
    },

    guardianRelationship: {
      type: String,
      enum: ['parent', 'legal_guardian', 'other']
    },

    guardianSignature: {
      type: String
    },

    // ==================== Witness (if required) ====================
    witnessName: {
      type: String,
      trim: true
    },

    witnessSignature: {
      type: String
    },

    witnessSignedAt: {
      type: Date
    },

    // ==================== Expiration ====================
    expiresAt: {
      type: Date,
      comment: 'Some consents expire after X months'
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // ==================== Revocation ====================
    revokedAt: {
      type: Date,
      default: null
    },

    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    revocationReason: {
      type: String,
      maxlength: 500
    },

    // ==================== Compliance ====================
    version: {
      type: String,
      required: true,
      comment: 'Version of consent form (e.g., "1.0", "2.1")'
    },

    language: {
      type: String,
      enum: ['de', 'en', 'es', 'fr'],
      default: 'de'
    },

    // ==================== Attachments ====================
    pdfUrl: {
      type: String,
      comment: 'Signed PDF stored in cloud storage'
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
    collection: 'consent_forms'
  }
);

// ==================== INDEXES ====================
consentFormSchema.index({ salonId: 1, customerId: 1, consentType: 1 });
consentFormSchema.index({ customerId: 1, isActive: 1 });
consentFormSchema.index({ expiresAt: 1 });

// ==================== METHODS ====================

/**
 * Check if consent is still valid
 */
consentFormSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.revokedAt) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

/**
 * Revoke consent
 */
consentFormSchema.methods.revoke = function(userId, reason) {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedBy = userId;
  this.revocationReason = reason;
  return this.save();
};

// ==================== QUERY MIDDLEWARE ====================
consentFormSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ==================== MULTI-TENANT PLUGIN ====================
consentFormSchema.plugin(multiTenantPlugin);

const ConsentForm = mongoose.model('ConsentForm', consentFormSchema);

export default ConsentForm;
