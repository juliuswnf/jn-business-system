import mongoose from 'mongoose';
import { multiTenantPlugin } from '../middleware/multiTenantPlugin.js';

/**
 * Medical History Model
 * For Medical Aesthetics / Physiotherapy
 * Stores patient intake forms and medical history
 */
const medicalHistorySchema = new mongoose.Schema(
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
      unique: true, // One medical history per customer
      index: true
    },

    // ==================== Medical Information ====================
    allergies: {
      type: [String],
      default: [],
      comment: 'List of known allergies'
    },

    currentMedications: {
      type: [String],
      default: [],
      comment: 'Current medications'
    },

    pastMedicalConditions: {
      type: [String],
      default: [],
      comment: 'Past diagnoses and conditions'
    },

    surgeries: [{
      name: String,
      date: Date,
      notes: String
    }],

    // ==================== Relevant History ====================
    smokingStatus: {
      type: String,
      enum: ['never', 'former', 'current', 'unknown'],
      default: 'unknown'
    },

    alcoholConsumption: {
      type: String,
      enum: ['none', 'occasional', 'moderate', 'heavy', 'unknown'],
      default: 'unknown'
    },

    // ==================== Emergency Contact ====================
    emergencyContact: {
      name: {
        type: String,
        trim: true
      },
      relationship: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      }
    },

    // ==================== Primary Care Physician ====================
    primaryPhysician: {
      name: String,
      phone: String,
      address: String
    },

    // ==================== Pregnancy & Breastfeeding ====================
    isPregnant: {
      type: Boolean,
      default: false
    },

    isBreastfeeding: {
      type: Boolean,
      default: false
    },

    // ==================== Skin Type (for aesthetics) ====================
    skinType: {
      type: String,
      enum: ['I', 'II', 'III', 'IV', 'V', 'VI', 'unknown'],
      default: 'unknown',
      comment: 'Fitzpatrick Skin Type'
    },

    // ==================== Previous Treatments ====================
    previousTreatments: [{
      treatmentName: String,
      date: Date,
      provider: String,
      complications: String
    }],

    // ==================== Contraindications ====================
    contraindications: {
      type: [String],
      default: [],
      comment: 'Conditions that prevent certain treatments'
    },

    // ==================== Custom Fields ====================
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
      comment: 'Practice-specific intake questions'
    },

    // ==================== Updates ====================
    lastReviewedAt: {
      type: Date,
      default: Date.now,
      comment: 'When was this history last reviewed/updated?'
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      comment: 'Practitioner who last reviewed'
    },

    // ==================== Privacy ====================
    consentGiven: {
      type: Boolean,
      default: false,
      required: true,
      comment: 'Consent to store medical history'
    },

    consentDate: {
      type: Date,
      default: Date.now
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
    collection: 'medical_histories'
  }
);

// ==================== INDEXES ====================
medicalHistorySchema.index({ salonId: 1, customerId: 1 });
medicalHistorySchema.index({ lastReviewedAt: 1 });

// ==================== METHODS ====================

/**
 * Check if medical history needs review (older than 6 months)
 */
medicalHistorySchema.methods.needsReview = function() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return this.lastReviewedAt < sixMonthsAgo;
};

/**
 * Get all contraindications for a specific treatment
 */
medicalHistorySchema.methods.checkContraindications = function(treatmentType) {
  // Logic to check if patient has contraindications for specific treatment
  return this.contraindications.filter(c => 
    c.toLowerCase().includes(treatmentType.toLowerCase())
  );
};

// ==================== QUERY MIDDLEWARE ====================
medicalHistorySchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ==================== MULTI-TENANT PLUGIN ====================
medicalHistorySchema.plugin(multiTenantPlugin);

const MedicalHistory = mongoose.model('MedicalHistory', medicalHistorySchema);

export default MedicalHistory;
