import logger from '../utils/logger.js';
/**
 * CEO Feature Flags Controller
 * Feature toggle management
 */

import FeatureFlag from '../models/FeatureFlag.js';
import Salon from '../models/Salon.js';

// ==================== GET ALL FLAGS ====================
export const getAllFlags = async (req, res) => {
  try {
    const { category, enabled } = req.query;

    const query = {};
    if (category) query.category = category;
    if (enabled !== undefined) query.enabled = enabled === 'true';

    const flags = await FeatureFlag.find(query)
      .sort({ category: 1, name: 1 })
      .populate('createdBy', 'name')
      .populate('lastModifiedBy', 'name');

    // Get customer counts for each flag
    const flagsWithCounts = await Promise.all(flags.map(async (flag) => {
      const enabledCount = flag.enabledFor?.length || 0;
      const disabledCount = flag.disabledFor?.length || 0;

      return {
        ...flag.toObject(),
        stats: {
          enabledForCount: enabledCount,
          disabledForCount: disabledCount
        }
      };
    }));

    res.status(200).json({
      success: true,
      flags: flagsWithCounts,
      total: flags.length
    });
  } catch (error) {
    logger.error('GetAllFlags Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET FLAG DETAILS ====================
export const getFlagDetails = async (req, res) => {
  try {
    const { flagId } = req.params;

    const flag = await FeatureFlag.findById(flagId)
      .populate('enabledFor', 'name ownerEmail')
      .populate('disabledFor', 'name ownerEmail')
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
    }

    res.status(200).json({
      success: true,
      flag
    });
  } catch (error) {
    logger.error('GetFlagDetails Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== CREATE FLAG ====================
export const createFlag = async (req, res) => {
  try {
    const {
      key,
      name,
      description,
      enabled,
      category,
      enabledPlans,
      rolloutPercentage
    } = req.body;

    if (!key || !name) {
      return res.status(400).json({
        success: false,
        message: 'Key and name are required'
      });
    }

    // Check for duplicate key
    const existing = await FeatureFlag.findOne({ key });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A flag with this key already exists'
      });
    }

    const flag = await FeatureFlag.create({
      key,
      name,
      description,
      enabled: enabled || false,
      category: category || 'feature',
      enabledPlans: enabledPlans || [],
      rolloutPercentage: rolloutPercentage || 0,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Feature flag created successfully',
      flag
    });
  } catch (error) {
    logger.error('CreateFlag Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== UPDATE FLAG ====================
export const updateFlag = async (req, res) => {
  try {
    const { flagId } = req.params;
    const {
      name,
      description,
      enabled,
      category,
      enabledPlans,
      rolloutPercentage
    } = req.body;

    const flag = await FeatureFlag.findById(flagId);
    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
    }

    // Update fields
    if (name !== undefined) flag.name = name;
    if (description !== undefined) flag.description = description;
    if (enabled !== undefined) flag.enabled = enabled;
    if (category !== undefined) flag.category = category;
    if (enabledPlans !== undefined) flag.enabledPlans = enabledPlans;
    if (rolloutPercentage !== undefined) flag.rolloutPercentage = rolloutPercentage;

    flag.lastModifiedBy = req.user._id;
    await flag.save();

    res.status(200).json({
      success: true,
      message: 'Feature flag updated successfully',
      flag
    });
  } catch (error) {
    logger.error('UpdateFlag Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== TOGGLE FLAG ====================
export const toggleFlag = async (req, res) => {
  try {
    const { flagId } = req.params;

    const flag = await FeatureFlag.findById(flagId);
    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
    }

    flag.enabled = !flag.enabled;
    flag.lastModifiedBy = req.user._id;
    await flag.save();

    res.status(200).json({
      success: true,
      message: `Feature flag ${flag.enabled ? 'enabled' : 'disabled'}`,
      flag
    });
  } catch (error) {
    logger.error('ToggleFlag Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== DELETE FLAG ====================
export const deleteFlag = async (req, res) => {
  try {
    const { flagId } = req.params;

    const flag = await FeatureFlag.findByIdAndDelete(flagId);
    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feature flag deleted successfully'
    });
  } catch (error) {
    logger.error('DeleteFlag Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== ENABLE/DISABLE FOR CUSTOMER ====================
export const updateCustomerFlag = async (req, res) => {
  try {
    const { flagId } = req.params;
    const { salonId, action } = req.body; // action: 'enable' or 'disable' or 'remove'

    const flag = await FeatureFlag.findById(flagId);
    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
    }

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (action === 'enable') {
      // Add to enabledFor, remove from disabledFor
      if (!flag.enabledFor.includes(salonId)) {
        flag.enabledFor.push(salonId);
      }
      flag.disabledFor = flag.disabledFor.filter(id => id.toString() !== salonId);
    } else if (action === 'disable') {
      // Add to disabledFor, remove from enabledFor
      if (!flag.disabledFor.includes(salonId)) {
        flag.disabledFor.push(salonId);
      }
      flag.enabledFor = flag.enabledFor.filter(id => id.toString() !== salonId);
    } else if (action === 'remove') {
      // Remove from both lists (use default behavior)
      flag.enabledFor = flag.enabledFor.filter(id => id.toString() !== salonId);
      flag.disabledFor = flag.disabledFor.filter(id => id.toString() !== salonId);
    }

    flag.lastModifiedBy = req.user._id;
    await flag.save();

    res.status(200).json({
      success: true,
      message: 'Customer flag updated',
      flag
    });
  } catch (error) {
    logger.error('UpdateCustomerFlag Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== CHECK FLAG FOR CUSTOMER ====================
export const checkFlagForCustomer = async (req, res) => {
  try {
    const { flagKey, salonId } = req.params;

    const flag = await FeatureFlag.findOne({ key: flagKey });
    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
    }

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const isEnabled = flag.isEnabledFor(salonId, salon.subscription?.plan);

    res.status(200).json({
      success: true,
      flagKey,
      salonId,
      isEnabled
    });
  } catch (error) {
    logger.error('CheckFlagForCustomer Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default {
  getAllFlags,
  getFlagDetails,
  createFlag,
  updateFlag,
  toggleFlag,
  deleteFlag,
  updateCustomerFlag,
  checkFlagForCustomer
};
