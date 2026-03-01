import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const PHONE_REGEX = /^\+?[0-9\s().-]{7,20}$/;

const userSchema = new mongoose.Schema(
  {
    // ==================== Authentication ====================
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Valid email required'],
      index: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },

    // ==================== Personal Information ====================
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    phone: {
      type: String,
      trim: true,
      match: [PHONE_REGEX, 'Valid phone number required']
    },

    avatar: {
      type: String
    },

    // ==================== Role & Access ====================
    role: {
      type: String,
      enum: ['salon_owner', 'employee', 'ceo', 'customer'],
      default: 'salon_owner',
      index: true
    },

    // Link to salon (for salon_owner and employees)
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      default: null,
      index: true
    },

    // Multi-Location: Additional salons for Enterprise tier
    additionalSalonIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon'
    }],

    // ==================== Account Status ====================
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    emailVerified: {
      type: Boolean,
      default: false,
      index: true
    },

    // ==================== Password Reset ====================
    passwordResetToken: {
      type: String,
      select: false
    },

    passwordResetExpire: {
      type: Date,
      select: false
    },

    passwordResetAttempts: {
      type: Number,
      default: 0,
      min: 0
    },

    passwordResetLockUntil: {
      type: Date,
      select: false
    },

    passwordResetLastAttempt: {
      type: Date,
      select: false
    },

    passwordChangedAt: {
      type: Date,
      select: false
    },

    // ==================== Email Verification ====================
    emailVerificationToken: {
      type: String,
      select: false
    },

    emailVerificationExpire: {
      type: Date,
      select: false
    },

    // ==================== Two Factor Authentication ====================
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },

    twoFactorSecret: {
      type: String,
      select: false
    },

    twoFactorBackupCodes: [{
      code: String,
      used: { type: Boolean, default: false }
    }],

    // ==================== User Preferences ====================
    language: {
      type: String,
      enum: ['de', 'en'],
      default: 'de'
    },

    timezone: {
      type: String,
      default: 'Europe/Berlin'
    },

    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },

    // ==================== Security ====================
    loginAttempts: {
      type: Number,
      default: 0,
      min: 0
    },

    lockUntil: {
      type: Date,
      select: false
    },

    lastLogin: {
      type: Date,
      index: true
    },

    lastActivityAt: {
      type: Date
    },

    // ==================== Employee Specific ====================
    // Only for role: 'employee'
    availability: [
      {
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        start: { type: String, match: /^\d{2}:\d{2}$/ },
        end: { type: String, match: /^\d{2}:\d{2}$/ }
      }
    ],

    // ==================== Timestamps ====================
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// ==================== INDEXES ====================

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ salonId: 1, isActive: 1 });
userSchema.index({ salonId: 1, role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// ==================== VIRTUALS ====================

userSchema.virtual('isLocked').get(function() {
  return this.lockUntil && this.lockUntil > Date.now();
});

userSchema.virtual('isCEO').get(function() {
  return this.role === 'ceo';
});

userSchema.virtual('isSalonOwner').get(function() {
  return this.role === 'salon_owner';
});

userSchema.virtual('isEmployee').get(function() {
  return this.role === 'employee';
});

userSchema.virtual('isCustomer').get(function() {
  return this.role === 'customer';
});

// ==================== METHODS ====================

userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getPasswordResetToken = function() {
  // Check if account is locked due to too many reset attempts
  if (this.passwordResetLockUntil && this.passwordResetLockUntil > Date.now()) {
    const minutesLeft = Math.ceil((this.passwordResetLockUntil - Date.now()) / (1000 * 60));
    throw new Error(`Account temporarily locked. Please try again in ${minutesLeft} minute(s).`);
  }

  // Reset attempts if lock expired
  if (this.passwordResetLockUntil && this.passwordResetLockUntil <= Date.now()) {
    this.passwordResetAttempts = 0;
    this.passwordResetLockUntil = null;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.passwordResetLastAttempt = new Date();
  return resetToken;
};

userSchema.methods.incPasswordResetAttempts = async function() {
  // Reset if lock expired
  if (this.passwordResetLockUntil && this.passwordResetLockUntil < Date.now()) {
    this.passwordResetAttempts = 0;
    this.passwordResetLockUntil = null;
  } else {
    this.passwordResetAttempts += 1;
    // Lock after 5 failed attempts for 1 hour
    if (this.passwordResetAttempts >= 5) {
      this.passwordResetLockUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      logger.warn(`⚠️ Password reset locked for account: ${this.email}`);
    }
  }
  this.passwordResetLastAttempt = new Date();
  return await this.save();
};

userSchema.methods.resetPasswordResetAttempts = async function() {
  this.passwordResetAttempts = 0;
  this.passwordResetLockUntil = null;
  return await this.save();
};

userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return verificationToken;
};

userSchema.methods.verifyEmail = async function() {
  this.emailVerified = true;
  this.emailVerificationToken = null;
  this.emailVerificationExpire = null;
  logger.log(`✅ Email verified: ${this.email}`);
  return await this.save();
};

userSchema.methods.incLoginAttempts = async function() {
  // Reset if lock expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = null;
  } else {
    this.loginAttempts += 1;
    // Lock after 5 failed attempts
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      logger.warn(`⚠️ Account locked: ${this.email}`);
    }
  }
  return await this.save();
};

userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  this.lastLogin = new Date();
  logger.log(`✅ Login successful: ${this.email}`);
  return await this.save();
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.updateActivity = async function() {
  this.lastActivityAt = new Date();
  return await this.save({ validateBeforeSave: false });
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.emailVerificationToken;
  delete obj.twoFactorSecret;
  delete obj.twoFactorBackupCodes;
  delete obj.lockUntil;
  delete obj.__v;
  return obj;
};

// ==================== STATICS ====================

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findBySalon = function(salonId, role = null) {
  const filter = { salonId, isActive: true };
  if (role) {filter.role = role;}
  return this.find(filter);
};

userSchema.statics.getEmployeesBySalon = function(salonId) {
  return this.find({ salonId, role: 'employee', isActive: true });
};

userSchema.statics.getCEO = function() {
  return this.findOne({ role: 'ceo', isActive: true });
};

userSchema.statics.getActiveUsers = function() {
  return this.find({ isActive: true });
};

const deleteManyIfModelExists = async (modelName, filter) => {
  try {
    const model = mongoose.model(modelName);
    await model.deleteMany(filter);
  } catch (error) {
    if (error.name !== 'MissingSchemaError') {
      throw error;
    }
  }
};

const cascadeDeleteSalonOwnerData = async (ownerId) => {
  const Salon = mongoose.model('Salon');
  const salons = await Salon.find({ owner: ownerId })
    .setOptions({ includeDeleted: true })
    .select('_id')
    .lean();

  const salonIds = salons.map((salon) => salon._id);
  if (salonIds.length === 0) {
    return;
  }

  const bySalon = { salonId: { $in: salonIds } };

  await Promise.all([
    deleteManyIfModelExists('Booking', bySalon),
    deleteManyIfModelExists('Customer', bySalon),
    deleteManyIfModelExists('Service', bySalon),
    deleteManyIfModelExists('Waitlist', bySalon),
    deleteManyIfModelExists('SlotSuggestion', bySalon),
    deleteManyIfModelExists('SMSConsent', bySalon),
    deleteManyIfModelExists('SMSLog', bySalon),
    deleteManyIfModelExists('Consent', bySalon),
    deleteManyIfModelExists('ConsentForm', bySalon),
    deleteManyIfModelExists('ClinicalNote', bySalon),
    deleteManyIfModelExists('MedicalHistory', bySalon),
    deleteManyIfModelExists('CustomerPackage', bySalon),
    deleteManyIfModelExists('Membership', bySalon),
    deleteManyIfModelExists('NoShowAnalytics', bySalon),
    deleteManyIfModelExists('TattooProject', bySalon),
    deleteManyIfModelExists('TattooSession', bySalon),
    deleteManyIfModelExists('WorkflowProject', bySalon),
    deleteManyIfModelExists('WorkflowSession', bySalon),
    deleteManyIfModelExists('SupportTicket', bySalon),
    deleteManyIfModelExists('Widget', bySalon)
  ]);

  try {
    const MarketingCampaign = mongoose.model('MarketingCampaign');
    const campaignIds = (await MarketingCampaign.find(bySalon).select('_id').lean()).map((campaign) => campaign._id);
    if (campaignIds.length > 0) {
      await deleteManyIfModelExists('MarketingRecipient', { campaignId: { $in: campaignIds } });
    }
    await deleteManyIfModelExists('MarketingCampaign', bySalon);
  } catch (error) {
    if (error.name !== 'MissingSchemaError') {
      throw error;
    }
  }

  await Promise.all([
    deleteManyIfModelExists('Payment', { companyId: ownerId }),
    deleteManyIfModelExists('User', { role: 'employee', salonId: { $in: salonIds } }),
    deleteManyIfModelExists('Salon', { _id: { $in: salonIds } })
  ]);

  await mongoose.model('User').updateMany(
    { additionalSalonIds: { $in: salonIds } },
    { $pull: { additionalSalonIds: { $in: salonIds } } }
  );
};

const runOwnerCascadeIfNeeded = async (userDoc) => {
  if (!userDoc || userDoc.role !== 'salon_owner') {
    return;
  }

  await cascadeDeleteSalonOwnerData(userDoc._id);
};

userSchema.pre('findOneAndDelete', async function(next) {
  try {
    const userDoc = await this.model.findOne(this.getFilter()).setOptions({ includeDeleted: true });
    await runOwnerCascadeIfNeeded(userDoc);
    next();
  } catch (error) {
    logger.error('User owner cascade delete failed:', error);
    next(error);
  }
});

userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    await runOwnerCascadeIfNeeded(this);
    next();
  } catch (error) {
    logger.error('User owner cascade delete failed:', error);
    next(error);
  }
});

userSchema.pre('deleteOne', { document: false, query: true }, async function(next) {
  try {
    const userDoc = await this.model.findOne(this.getFilter()).setOptions({ includeDeleted: true });
    await runOwnerCascadeIfNeeded(userDoc);
    next();
  } catch (error) {
    logger.error('User owner cascade delete failed:', error);
    next(error);
  }
});

// ==================== PRE-SAVE HOOKS ====================

userSchema.pre('save', async function(next) {
  // Only hash password if it was modified
  if (!this.isModified('password')) {
    this.updatedAt = new Date();
    return next();
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // Set passwordChangedAt for existing users
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  this.updatedAt = new Date();
  next();
});

// ==================== EXPORT ====================

export default mongoose.model('User', userSchema);
