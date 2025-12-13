import ArtistPortfolio from '../models/ArtistPortfolio.js';
import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryHelper.js';
import fs from 'fs';

/**
 * Artist Portfolio Controller
 * For Tattoo/Piercing Studios - Portfolio Management
 */

// ==================== CREATE PORTFOLIO ITEM ====================
export const uploadPortfolioItem = async (req, res) => {
  try {
    const { salonId, title, description, category, style, tags, consentGiven } = req.body;
    const userId = req.user.id;

    // Verify salon ownership or artist employment
    const salon = await Salon.findById(salonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    // Check if user is owner or employee
    const isOwner = salon.owner.toString() === userId;
    const isEmployee = req.user.role === 'employee' && req.user.salonId?.toString() === salonId;
    if (!isOwner && !isEmployee && req.user.role !== 'admin' && req.user.role !== 'ceo') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    // Upload to Cloudinary (or local storage)
    let imageUrl, thumbnailUrl;
    if (process.env.CLOUDINARY_ENABLED === 'true') {
      const uploadResult = await uploadToCloudinary(req.file.path, {
        folder: `portfolios/${salonId}`,
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
      });
      imageUrl = uploadResult.secure_url;

      // Generate thumbnail
      const thumbResult = await uploadToCloudinary(req.file.path, {
        folder: `portfolios/${salonId}/thumbs`,
        transformation: [{ width: 400, height: 400, crop: 'fill' }]
      });
      thumbnailUrl = thumbResult.secure_url;

      // Delete local file
      fs.unlinkSync(req.file.path);
    } else {
      // Local storage
      imageUrl = `/uploads/portfolios/${req.file.filename}`;
      thumbnailUrl = imageUrl; // Same for now
    }

    // Create portfolio item
    const portfolioItem = await ArtistPortfolio.create({
      salonId,
      artistId: userId,
      title,
      description,
      imageUrl,
      thumbnailUrl,
      category,
      style,
      tags: tags ? JSON.parse(tags) : [],
      consentGiven: consentGiven === 'true',
      isPublic: true
    });

    return res.status(201).json({
      success: true,
      message: 'Portfolio item uploaded successfully',
      portfolioItem
    });
  } catch (error) {
    console.error('Error uploading portfolio item:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET PUBLIC PORTFOLIO ====================
export const getPublicPortfolio = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { category, artistId, featured, limit = 50, page = 1 } = req.query;

    const query = {
      salonId,
      isPublic: true,
      deletedAt: null
    };

    if (category) query.category = category;
    if (artistId) query.artistId = artistId;
    if (featured === 'true') query.featured = true;

    const skip = (page - 1) * limit;

    const portfolioItems = await ArtistPortfolio.find(query)
      .sort({ featured: -1, order: 1, createdAt: -1 })
      .limit(parseInt(limit).lean().maxTimeMS(5000))
      .skip(skip)
      .populate('artistId', 'name email')
      .lean();

    const total = await ArtistPortfolio.countDocuments(query);

    return res.json({
      success: true,
      portfolioItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET ARTIST-SPECIFIC PORTFOLIO ====================
export const getArtistPortfolio = async (req, res) => {
  try {
    const { artistId } = req.params;

    const portfolioItems = await ArtistPortfolio.find({
      artistId,
      isPublic: true,
      deletedAt: null
    })
      .sort({ featured: -1, order: 1, createdAt: -1 }).lean().maxTimeMS(5000)
      .populate('salonId', 'name slug')
      .lean();

    return res.json({
      success: true,
      portfolioItems
    });
  } catch (error) {
    console.error('Error fetching artist portfolio:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPDATE PORTFOLIO ITEM ====================
export const updatePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, style, tags, isPublic, featured } = req.body;
    const userId = req.user.id;

    const portfolioItem = await ArtistPortfolio.findById(id).maxTimeMS(5000);
    if (!portfolioItem) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }

    // Verify ownership
    if (portfolioItem.artistId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update fields
    if (title) portfolioItem.title = title;
    if (description) portfolioItem.description = description;
    if (category) portfolioItem.category = category;
    if (style) portfolioItem.style = style;
    if (tags) portfolioItem.tags = JSON.parse(tags);
    if (typeof isPublic !== 'undefined') portfolioItem.isPublic = isPublic;
    if (typeof featured !== 'undefined') portfolioItem.featured = featured;

    await portfolioItem.save();

    return res.json({
      success: true,
      message: 'Portfolio item updated',
      portfolioItem
    });
  } catch (error) {
    console.error('Error updating portfolio item:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== DELETE PORTFOLIO ITEM ====================
export const deletePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const portfolioItem = await ArtistPortfolio.findById(id).maxTimeMS(5000);
    if (!portfolioItem) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }

    // Verify ownership
    if (portfolioItem.artistId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Soft delete
    portfolioItem.deletedAt = new Date();
    portfolioItem.deletedBy = userId;
    await portfolioItem.save();

    // Delete from Cloudinary
    if (process.env.CLOUDINARY_ENABLED === 'true') {
      try {
        await deleteFromCloudinary(portfolioItem.imageUrl);
        await deleteFromCloudinary(portfolioItem.thumbnailUrl);
      } catch (err) {
        logger.warn('Failed to delete from Cloudinary:', err);
      }
    }

    return res.json({
      success: true,
      message: 'Portfolio item deleted'
    });
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== TOGGLE FEATURED ====================
export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const portfolioItem = await ArtistPortfolio.findById(id).maxTimeMS(5000);
    if (!portfolioItem) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }

    // Verify ownership
    if (portfolioItem.artistId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    portfolioItem.featured = !portfolioItem.featured;
    await portfolioItem.save();

    return res.json({
      success: true,
      message: `Portfolio item ${portfolioItem.featured ? 'featured' : 'unfeatured'}`,
      featured: portfolioItem.featured
    });
  } catch (error) {
    console.error('Error toggling featured:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== INCREMENT VIEW COUNT ====================
export const incrementViews = async (req, res) => {
  try {
    const { id } = req.params;

    await ArtistPortfolio.findByIdAndUpdate(id, {
      $inc: { views: 1 }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error incrementing views:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== INCREMENT LIKES ====================
export const incrementLikes = async (req, res) => {
  try {
    const { id } = req.params;

    const portfolioItem = await ArtistPortfolio.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    return res.json({
      success: true,
      likes: portfolioItem.likes
    });
  } catch (error) {
    console.error('Error incrementing likes:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


