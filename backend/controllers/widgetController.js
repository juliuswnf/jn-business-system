import Widget from '../models/Widget.js';
import Salon from '../models/Salon.js';
import Service from '../models/Service.js';
import logger from '../utils/logger.js';

/**
 * Widget Controller - For Embeddable Booking System
 * Allows salon owners to integrate booking on their website
 */

// ==================== CREATE WIDGET ====================

export const createWidget = async (req, res) => {
  try {
    const { salonId } = req.body;
    const userId = req.user.id;

    // Check if salon exists and belongs to user
    const salon = await Salon.findOne({ _id: salonId, owner: userId });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you do not have permission'
      });
    }

    // Create widget
    const widget = await Widget.createForSalon(salonId, req.body);

    logger.log(`✅ Widget created for salon: ${salonId}`);

    res.status(201).json({
      success: true,
      message: 'Widget created successfully',
      widget: {
        id: widget._id,
        apiKey: widget.apiKey,
        embedCode: widget.embedCode,
        iframeCode: widget.iframeCode,
        directUrl: widget.directUrl,
        settings: widget.settings,
        theme: widget.theme
      }
    });
  } catch (error) {
    if (error.message === 'Widget already exists for this salon') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    logger.error('❌ CreateWidget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create widget'
    });
  }
};

// ==================== GET WIDGET ====================

export const getWidget = async (req, res) => {
  try {
    const { salonId } = req.params;
    const userId = req.user.id;

    // Check if salon belongs to user
    const salon = await Salon.findOne({ _id: salonId, owner: userId });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you do not have permission'
      });
    }

    const widget = await Widget.findBySalon(salonId);
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }

    res.status(200).json({
      success: true,
      widget: {
        id: widget._id,
        apiKey: widget.apiKey,
        embedCode: widget.embedCode,
        iframeCode: widget.iframeCode,
        directUrl: widget.directUrl,
        allowedDomains: widget.allowedDomains,
        settings: widget.settings,
        theme: widget.theme,
        stats: widget.stats,
        isActive: widget.isActive
      }
    });
  } catch (error) {
    logger.error('❌ GetWidget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch widget'
    });
  }
};

// ==================== GET WIDGET BY API KEY (PUBLIC) ====================

export const getWidgetByApiKey = async (req, res) => {
  try {
    const { apiKey } = req.params;

    const widget = await Widget.findByApiKey(apiKey)
      .populate({
        path: 'salonId',
        select: 'name email phone address businessHours defaultLanguage googleReviewUrl'
      });

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }

    // Check origin for CORS
    const origin = req.headers.origin || req.headers.referer;
    if (origin && !widget.isDomainAllowed(origin)) {
      return res.status(403).json({
        success: false,
        message: 'Domain not allowed'
      });
    }

    // Increment view count
    await widget.incrementView();

    // Get services for this salon
    const services = await Service.find({
      salonId: widget.salonId._id,
      isActive: true
    }).select('name description duration price category');

    res.status(200).json({
      success: true,
      widget: {
        salonId: widget.salonId._id,
        salon: widget.salonId,
        services,
        settings: widget.settings,
        theme: widget.theme,
        layout: widget.layout
      }
    });
  } catch (error) {
    logger.error('❌ GetWidgetByApiKey Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch widget'
    });
  }
};

// ==================== UPDATE WIDGET ====================

export const updateWidget = async (req, res) => {
  try {
    const { salonId } = req.params;
    const userId = req.user.id;
    const { theme, settings, layout, allowedDomains } = req.body;

    // Check if salon belongs to user
    const salon = await Salon.findOne({ _id: salonId, owner: userId });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you do not have permission'
      });
    }

    const widget = await Widget.findBySalon(salonId);
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }

    // Update fields
    if (theme) {await widget.updateTheme(theme);}
    if (settings) {await widget.updateSettings(settings);}
    if (layout) {widget.layout = layout;}
    if (allowedDomains) {widget.allowedDomains = allowedDomains;}

    await widget.save();

    logger.log(`✅ Widget updated: ${widget._id}`);

    res.status(200).json({
      success: true,
      message: 'Widget updated successfully',
      widget
    });
  } catch (error) {
    logger.error('❌ UpdateWidget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update widget'
    });
  }
};

// ==================== REGENERATE API KEY ====================

export const regenerateApiKey = async (req, res) => {
  try {
    const { salonId } = req.params;
    const userId = req.user.id;

    // Check if salon belongs to user
    const salon = await Salon.findOne({ _id: salonId, owner: userId });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you do not have permission'
      });
    }

    const widget = await Widget.findBySalon(salonId);
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }

    await widget.regenerateApiKey();

    logger.log(`⚠️ API Key regenerated for salon: ${salonId}`);

    res.status(200).json({
      success: true,
      message: 'API Key regenerated successfully',
      widget: {
        apiKey: widget.apiKey,
        embedCode: widget.embedCode,
        iframeCode: widget.iframeCode
      }
    });
  } catch (error) {
    logger.error('❌ RegenerateApiKey Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate API key'
    });
  }
};

// ==================== DELETE WIDGET ====================

export const deleteWidget = async (req, res) => {
  try {
    const { salonId } = req.params;
    const userId = req.user.id;

    // Check if salon belongs to user
    const salon = await Salon.findOne({ _id: salonId, owner: userId });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you do not have permission'
      });
    }

    const widget = await Widget.findBySalon(salonId);
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }

    await widget.deleteOne();

    logger.log(`✅ Widget deleted: ${widget._id}`);

    res.status(200).json({
      success: true,
      message: 'Widget deleted successfully'
    });
  } catch (error) {
    logger.error('❌ DeleteWidget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete widget'
    });
  }
};

// ==================== GET WIDGET STATS ====================

export const getWidgetStats = async (req, res) => {
  try {
    const { salonId } = req.params;
    const userId = req.user.id;

    // Check if salon belongs to user
    const salon = await Salon.findOne({ _id: salonId, owner: userId });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you do not have permission'
      });
    }

    const stats = await Widget.getStats(salonId);
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('❌ GetWidgetStats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch widget stats'
    });
  }
};

// ==================== EXPORT ====================

export default {
  createWidget,
  getWidget,
  getWidgetByApiKey,
  updateWidget,
  regenerateApiKey,
  deleteWidget,
  getWidgetStats
};
