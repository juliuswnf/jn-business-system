import mongoose from 'mongoose';
import { multiTenantPlugin } from '../middleware/multiTenantPlugin.js';

/**
 * Artist Portfolio Model
 * For Tattoo/Piercing Studios - Artist work showcase
 */
const artistPortfolioSchema = new mongoose.Schema(
  {
    // ==================== Salon & Artist Reference ====================
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      index: true
    },

    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // ==================== Portfolio Item ====================
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500
    },

    // ==================== Image Storage ====================
    imageUrl: {
      type: String,
      required: true,
      comment: 'Cloudinary/S3 URL or local path'
    },

    thumbnailUrl: {
      type: String,
      comment: 'Optimized thumbnail for gallery view'
    },

    // ==================== Metadata ====================
    category: {
      type: String,
      enum: [
        'tattoo',
        'piercing',
        'coverup',
        'realism',
        'traditional',
        'watercolor',
        'geometric',
        'blackwork',
        'other'
      ],
      default: 'other'
    },

    style: {
      type: String,
      enum: [
        'blackAndGrey',
        'color',
        'fine-line',
        'neo-traditional',
        'japanese',
        'tribal',
        'other'
      ]
    },

    tags: {
      type: [String],
      default: [],
      index: true,
      comment: 'e.g., ["sleeve", "floral", "portrait"]'
    },

    // ==================== Privacy Settings ====================
    isPublic: {
      type: Boolean,
      default: true,
      comment: 'Show in public portfolio?'
    },

    consentGiven: {
      type: Boolean,
      default: false,
      required: true,
      comment: 'Client consent to display their work'
    },

    // ==================== Display Order ====================
    featured: {
      type: Boolean,
      default: false,
      comment: 'Featured work shown first'
    },

    order: {
      type: Number,
      default: 0,
      comment: 'Manual ordering in portfolio'
    },

    // ==================== Engagement ====================
    views: {
      type: Number,
      default: 0
    },

    likes: {
      type: Number,
      default: 0
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
    collection: 'artist_portfolios'
  }
);

// ==================== INDEXES ====================
artistPortfolioSchema.index({ salonId: 1, isPublic: 1, deletedAt: 1 });
artistPortfolioSchema.index({ artistId: 1, featured: -1, order: 1 });
artistPortfolioSchema.index({ salonId: 1, category: 1 });
artistPortfolioSchema.index({ tags: 1 });

// ==================== QUERY MIDDLEWARE - EXCLUDE DELETED ====================
artistPortfolioSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ==================== MULTI-TENANT PLUGIN ====================
artistPortfolioSchema.plugin(multiTenantPlugin);

// ==================== MODEL EXPORT ====================
const ArtistPortfolio = mongoose.model('ArtistPortfolio', artistPortfolioSchema);

export default ArtistPortfolio;
