import mongoose from 'mongoose';

const pricingWizardResponseSchema = new mongoose.Schema({
  // User Reference (optional - can be anonymous)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },

  // Session ID for anonymous tracking
  sessionId: {
    type: String,
    required: true,
    index: true
  },

  // User Answers
  answers: {
    customerCount: String,
    bookingsPerWeek: String,
    locations: Number,
    features: [String],
    employees: String,
    budget: String,
    industry: String // Optional
  },

  // Recommendation Results
  recommendedTier: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    required: true
  },

  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  scoreBreakdown: {
    type: Map,
    of: Number
  },

  confidence: {
    type: Number,
    min: 0,
    max: 100
  },

  // User Selection (what they actually chose)
  selectedTier: {
    type: String,
    enum: ['starter', 'professional', 'enterprise', null],
    default: null
  },

  // Did they choose different than recommended?
  tierMismatch: {
    type: Boolean,
    default: false
  },

  // Conversion Tracking
  converted: {
    type: Boolean,
    default: false,
    index: true
  },

  convertedAt: Date,

  // Analytics
  timeToComplete: {
    type: Number, // seconds
    default: null
  },

  stepsCompleted: {
    type: Number,
    default: 6
  },

  // A/B Testing
  questionSetVersion: {
    type: String,
    default: 'v1'
  },

  // Metadata
  userAgent: String,
  ipAddress: String,
  referrer: String

}, {
  timestamps: true
});

// Indexes
pricingWizardResponseSchema.index({ createdAt: -1 });
pricingWizardResponseSchema.index({ recommendedTier: 1, converted: 1 });
pricingWizardResponseSchema.index({ selectedTier: 1, converted: 1 });
pricingWizardResponseSchema.index({ sessionId: 1, createdAt: -1 });

// Methods
pricingWizardResponseSchema.methods.markConverted = async function(selectedTier) {
  this.converted = true;
  this.convertedAt = new Date();
  this.selectedTier = selectedTier;
  this.tierMismatch = selectedTier !== this.recommendedTier;
  await this.save();
  return this;
};

// Statics
pricingWizardResponseSchema.statics.getConversionRate = async function(tier = null) {
  const query = tier ? { recommendedTier: tier } : {};

  const total = await this.countDocuments(query);
  const converted = await this.countDocuments({ ...query, converted: true });

  return {
    total,
    converted,
    rate: total > 0 ? Math.round((converted / total) * 100) : 0
  };
};

pricingWizardResponseSchema.statics.getTierDistribution = async function() {
  const distribution = await this.aggregate([
    {
      $group: {
        _id: '$recommendedTier',
        count: { $sum: 1 },
        converted: {
          $sum: { $cond: ['$converted', 1, 0] }
        }
      }
    }
  ]);

  return distribution;
};

pricingWizardResponseSchema.statics.getAverageScore = async function(tier = null) {
  const query = tier ? { recommendedTier: tier } : {};

  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$score' },
        avgConfidence: { $avg: '$confidence' },
        avgTimeToComplete: { $avg: '$timeToComplete' }
      }
    }
  ]);

  return result[0] || { avgScore: 0, avgConfidence: 0, avgTimeToComplete: 0 };
};

pricingWizardResponseSchema.statics.getMismatchRate = async function() {
  const total = await this.countDocuments({ converted: true });
  const mismatches = await this.countDocuments({ tierMismatch: true });

  return {
    total,
    mismatches,
    rate: total > 0 ? Math.round((mismatches / total) * 100) : 0
  };
};

const PricingWizardResponse = mongoose.model('PricingWizardResponse', pricingWizardResponseSchema);

export default PricingWizardResponse;
