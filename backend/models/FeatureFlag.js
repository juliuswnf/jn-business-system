import mongoose from 'mongoose';

/**
 * Feature Flag Model
 * For feature toggle management
 */

const featureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,

    // Global toggle
    enabled: {
      type: Boolean,
      default: false
    },

    // Per-customer overrides
    enabledFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon'
    }],
    disabledFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon'
    }],

    // Plan-based access
    enabledPlans: [{
      type: String,
      enum: ['free', 'trial', 'starter', 'pro', 'enterprise']
    }],

    // Percentage rollout
    rolloutPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    // Category
    category: {
      type: String,
      enum: ['feature', 'experiment', 'ops', 'beta'],
      default: 'feature'
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Method to check if flag is enabled for a salon
featureFlagSchema.methods.isEnabledFor = function(salonId, plan) {
  // Check if explicitly disabled
  if (this.disabledFor.includes(salonId)) return false;

  // Check if explicitly enabled
  if (this.enabledFor.includes(salonId)) return true;

  // Check global toggle
  if (this.enabled) return true;

  // Check plan-based access
  if (this.enabledPlans.includes(plan)) return true;

  // Check rollout percentage (using salon ID as seed for consistency)
  if (this.rolloutPercentage > 0) {
    const hash = salonId.toString().split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 100) < this.rolloutPercentage;
  }

  return false;
};

const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);

export default FeatureFlag;
