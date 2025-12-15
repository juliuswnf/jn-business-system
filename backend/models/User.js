import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const userSchema = new mongoose.Schema(
  {
    // ==================== Authentication ====================
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Valid email required'],
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
      trim: true
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
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return resetToken;
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
