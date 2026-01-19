import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Refresh Token Model
 * Stores refresh tokens for JWT token rotation
 * Security: Tokens are hashed before storage
 */

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 } // Auto-delete expired tokens
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    revokedAt: {
      type: Date
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    },
    rotationCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ tokenHash: 1, isRevoked: 1 });

/**
 * Hash token before saving
 * ✅ FIX: Also hash on create if tokenHash is not already set
 */
refreshTokenSchema.pre('save', function(next) {
  // If token is modified or tokenHash is missing, hash the token
  if (this.token && (!this.tokenHash || this.isModified('token'))) {
    this.tokenHash = crypto.createHash('sha256').update(this.token).digest('hex');
  }
  next();
});

/**
 * Hash token before creating (validate hook runs before pre('save'))
 * ✅ FIX: Ensure tokenHash is ALWAYS set during validation phase
 */
refreshTokenSchema.pre('validate', function(next) {
  // CRITICAL: Set tokenHash before validation runs (required field)
  if (this.token) {
    // Always recalculate tokenHash from token to ensure consistency
    this.tokenHash = crypto.createHash('sha256').update(this.token).digest('hex');
  }
  next();
});

/**
 * Find token by hash
 */
refreshTokenSchema.statics.findByToken = function(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({ tokenHash, isRevoked: false });
};

/**
 * Revoke token
 */
refreshTokenSchema.methods.revoke = async function() {
  this.isRevoked = true;
  this.revokedAt = new Date();
  await this.save();
};

/**
 * Revoke all tokens for a user
 */
refreshTokenSchema.statics.revokeAllForUser = async function(userId) {
  return this.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true, revokedAt: new Date() }
  );
};

/**
 * Clean up old tokens (older than 30 days)
 */
refreshTokenSchema.statics.cleanupOldTokens = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { createdAt: { $lt: thirtyDaysAgo } }
    ]
  });
};

/**
 * Check if token is valid
 */
refreshTokenSchema.methods.isValid = function() {
  return !this.isRevoked && this.expiresAt > new Date();
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;

