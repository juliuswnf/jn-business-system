import mongoose from 'mongoose';

/**
 * Consent Model
 *
 * Manages legal consent forms for tattoo studios.
 * Includes tattoo consent, medical consent, and photo release forms.
 */

const consentSchema = new mongoose.Schema({
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

  // ==================== Project Reference (Optional) ====================
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TattooProject',
    index: true,
    comment: 'Optional link to specific project'
  },

  // ==================== Consent Type ====================
  type: {
    type: String,
    enum: ['tattoo_consent', 'medical_consent', 'photo_consent', 'minor_consent', 'aftercare_acknowledgement'],
    required: true,
    index: true,
    comment: 'Type of consent form'
  },

  // ==================== Consent Content ====================
  consentText: {
    type: String,
    required: true,
    comment: 'Full legal consent text'
  },

  // ==================== Signature ====================
  signature: {
    type: String,
    comment: 'Base64 encoded signature image or digital signature hash'
  },

  signedAt: {
    type: Date,
    comment: 'When consent was signed'
  },

  // ==================== Metadata ====================
  ipAddress: {
    type: String,
    comment: 'IP address of signer'
  },

  userAgent: {
    type: String,
    comment: 'Browser/device info'
  },

  // ==================== Witness (for legal purposes) ====================
  witnessed: {
    type: Boolean,
    default: false,
    comment: 'Whether consent was witnessed'
  },

  witnessName: {
    type: String,
    comment: 'Name of witness'
  },

  witnessSignature: {
    type: String,
    comment: 'Witness signature (Base64)'
  },

  witnessedAt: {
    type: Date,
    comment: 'When witness signed'
  },

  // ==================== Status ====================
  status: {
    type: String,
    enum: ['pending', 'signed', 'declined', 'expired'],
    default: 'pending',
    index: true
  },

  // ==================== Expiration ====================
  expiresAt: {
    type: Date,
    comment: 'Optional expiration date for consent'
  },

  // ==================== Document Version ====================
  version: {
    type: String,
    default: '1.0',
    comment: 'Consent form version'
  },

  // ==================== Additional Data ====================
  additionalData: {
    type: mongoose.Schema.Types.Mixed,
    comment: 'Additional form-specific data (e.g., medical conditions, allergies)'
  },

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
consentSchema.index({ salonId: 1, customerId: 1, type: 1 });
consentSchema.index({ projectId: 1 });
consentSchema.index({ status: 1, expiresAt: 1 });

// ==================== Virtual: Is Valid ====================
consentSchema.virtual('isValid').get(function() {
  if (this.status !== 'signed') return false;
  if (!this.expiresAt) return true;
  return new Date() < this.expiresAt;
});

// ==================== Methods ====================

/**
 * Sign consent form
 */
consentSchema.methods.sign = function(signatureData, metadata = {}) {
  this.signature = signatureData;
  this.signedAt = new Date();
  this.status = 'signed';
  this.ipAddress = metadata.ipAddress;
  this.userAgent = metadata.userAgent;

  return this.save();
};

/**
 * Add witness signature
 */
consentSchema.methods.addWitness = function(witnessName, witnessSignature) {
  this.witnessed = true;
  this.witnessName = witnessName;
  this.witnessSignature = witnessSignature;
  this.witnessedAt = new Date();

  return this.save();
};

/**
 * Decline consent
 */
consentSchema.methods.decline = function() {
  this.status = 'declined';
  return this.save();
};

/**
 * Check if expired
 */
consentSchema.methods.checkExpiration = function() {
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'expired';
    return this.save();
  }
  return Promise.resolve(this);
};

/**
 * Generate PDF (placeholder - would use PDFKit or similar)
 */
consentSchema.methods.generatePDF = async function() {
  // TODO: Implement PDF generation
  return {
    url: `/api/consents/${this._id}/pdf`,
    filename: `consent_${this.type}_${this._id}.pdf`
  };
};

// ==================== Statics ====================

/**
 * Get all consents for a customer
 */
consentSchema.statics.getCustomerConsents = async function(salonId, customerId) {
  return this.find({ salonId, customerId })
    .populate('projectId', 'name')
    .sort({ createdAt: -1 });
};

/**
 * Check if customer has valid consent of type
 */
consentSchema.statics.hasValidConsent = async function(salonId, customerId, type) {
  const consent = await this.findOne({
    salonId,
    customerId,
    type,
    status: 'signed',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });

  return !!consent;
};

/**
 * Create default tattoo consent
 */
consentSchema.statics.createDefaultTattooConsent = async function(salonId, customerId, projectId) {
  const defaultText = `
TATTOO CONSENT FORM

I, the undersigned, being at least 18 years of age, do hereby consent to the application of a tattoo by the artist at this establishment.

I understand that:
1. Tattooing involves breaking the skin and there is some risk of infection or allergic reaction
2. I have disclosed all medical conditions and medications
3. I am not under the influence of drugs or alcohol
4. The design is final and changes cannot be made after starting
5. Touch-ups may be required and are not included in initial price
6. Proper aftercare is my responsibility
7. The studio is not liable for poor healing due to improper aftercare

I have been given aftercare instructions and agree to follow them carefully.

I release the artist and studio from all liability for any future complications that may arise from this tattoo.
`;

  return this.create({
    salonId,
    customerId,
    projectId,
    type: 'tattoo_consent',
    consentText: defaultText,
    version: '1.0'
  });
};

/**
 * Create photo consent
 */
consentSchema.statics.createPhotoConsent = async function(salonId, customerId, projectId) {
  const photoConsentText = `
PHOTO RELEASE CONSENT

I hereby grant permission to the artist and studio to photograph my tattoo work and use these photographs for:

☐ Social media (Instagram, Facebook, etc.)
☐ Website portfolio
☐ Marketing materials
☐ Promotional use

I understand that:
- My face may be visible in photos unless I request otherwise
- Photos may be shared publicly
- I will be credited if requested
- I can request removal of photos at any time

I waive any right to compensation for use of these photographs.
`;

  return this.create({
    salonId,
    customerId,
    projectId,
    type: 'photo_consent',
    consentText: photoConsentText,
    version: '1.0'
  });
};

// ==================== Pre-save Middleware ====================
consentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Consent = mongoose.model('Consent', consentSchema);

export default Consent;
