import mongoose from 'mongoose';

/**
 * Breach Incident Model
 * HIPAA Breach Notification Rule tracking
 */
const breachIncidentSchema = new mongoose.Schema({
  // Incident identification
  incidentId: {
    type: String,
    unique: true,
    default: () => `BREACH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Breach details
  type: {
    type: String,
    enum: [
      'excessive_phi_access',
      'brute_force_attack',
      'unusual_access_location',
      'unauthorized_access_attempt',
      'data_theft',
      'malware',
      'phishing',
      'lost_device',
      'improper_disposal',
      'other'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },

  // Who/What/When
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: String,
  detectedAt: {
    type: Date,
    required: true
  },
  occurredAt: Date, // When breach actually happened (may differ from detection)

  // Affected data
  affectedRecords: {
    type: Number,
    default: 0
  },
  affectedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  affectedDataTypes: [{
    type: String,
    enum: [
      'medical_records',
      'clinical_notes',
      'billing_information',
      'insurance_details',
      'personal_identifiers',
      'contact_information',
      'treatment_history',
      'diagnostic_images',
      'lab_results',
      'other'
    ]
  }],

  // Details
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  description: String,

  // Status tracking
  status: {
    type: String,
    enum: [
      'detected',
      'investigating',
      'confirmed',
      'mitigated',
      'resolved',
      'false_positive'
    ],
    default: 'detected'
  },

  // Investigation
  investigationStarted: {
    type: Boolean,
    default: false
  },
  investigationStartedAt: Date,
  investigationStartedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  investigationNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Root cause
  rootCause: String,
  contributingFactors: [String],

  // Remediation
  remediationActions: [{
    action: String,
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Notification requirements
  notificationRequired: {
    type: Boolean,
    default: false
  },
  notificationCategory: {
    type: String,
    enum: [
      'tier1_500plus', // 500+ patients: notify HHS, media, patients
      'tier2_under500', // <500 patients: notify HHS annually, patients
      'no_notification' // Below notification threshold
    ]
  },

  // Notifications sent
  patientsNotified: {
    type: Boolean,
    default: false
  },
  patientsNotifiedAt: Date,
  patientsNotifiedCount: {
    type: Number,
    default: 0
  },

  hhsNotified: {
    type: Boolean,
    default: false
  },
  hhsNotifiedAt: Date,
  hhsConfirmationNumber: String,

  mediaNotified: {
    type: Boolean,
    default: false
  },
  mediaNotifiedAt: Date,

  // Compliance
  hipaaCompliant: {
    type: Boolean,
    default: false
  },
  complianceNotes: String,

  // Financial impact
  estimatedCost: Number,
  actualCost: Number,

  // Insurance
  insuranceClaim: {
    filed: Boolean,
    claimNumber: String,
    filedAt: Date,
    status: String
  },

  // Legal
  legalCounselInvolved: {
    type: Boolean,
    default: false
  },
  lawEnforcementInvolved: {
    type: Boolean,
    default: false
  },
  lawEnforcementCaseNumber: String,

  // Salon association
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon'
  },

  // Metadata
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

// Indexes
breachIncidentSchema.index({ salonId: 1, status: 1 });
breachIncidentSchema.index({ detectedAt: -1 });
breachIncidentSchema.index({ severity: 1, status: 1 });
breachIncidentSchema.index({ incidentId: 1 });

// Virtual: Days since detection
breachIncidentSchema.virtual('daysSinceDetection').get(function() {
  const now = new Date();
  const detected = new Date(this.detectedAt);
  const diffTime = now - detected;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method: Get critical incidents
breachIncidentSchema.statics.getCriticalIncidents = function(salonId) {
  return this.find({
    salonId,
    severity: { $in: ['HIGH', 'CRITICAL'] },
    status: { $nin: ['resolved', 'false_positive'] }
  }).sort({ detectedAt: -1 });
};

// Static method: Get unresolved incidents
breachIncidentSchema.statics.getUnresolvedIncidents = function(salonId) {
  return this.find({
    salonId,
    status: { $nin: ['resolved', 'false_positive'] }
  }).sort({ detectedAt: -1 });
};

export default mongoose.model('BreachIncident', breachIncidentSchema);
