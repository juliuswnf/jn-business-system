import BAA from '../models/BAA.js';
import { upload } from '../middleware/uploadMiddleware.js';
import cloudinary from '../utils/cloudinaryHelper.js';
import logger from '../utils/logger.js';

/**
 * Compliance Controller
 * BAA Management, HIPAA Compliance Status
 */

/**
 * Get all BAAs for a salon
 */
export const getBaas = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    const baas = await BAA.find({ salonId })
      .sort({ expirationDate: 1 })
      .populate('createdBy', 'firstName lastName email')
      .populate('lastReviewedBy', 'firstName lastName')
      .lean();

    // Add virtual fields
    const baasWithVirtuals = baas.map(baa => ({
      ...baa,
      daysUntilExpiration: Math.ceil(
        (new Date(baa.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
      )
    }));

    res.json({
      success: true,
      baas: baasWithVirtuals
    });

  } catch (error) {
    logger.error('Failed to get BAAs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get BAAs'
    });
  }
};

/**
 * Create new BAA
 */
export const createBaa = async (req, res) => {
  try {
    const { associateName, associateType, contactEmail, contactPhone, signedDate, expirationDate, servicesCovered, phiAccessLevel } = req.body;
    const salonId = req.user.salonId;

    // Upload document to Cloudinary
    let documentUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'baa_documents',
        resource_type: 'auto'
      });
      documentUrl = result.secure_url;
    }

    const baa = await BAA.create({
      associateName,
      associateType,
      contactEmail,
      contactPhone,
      signedDate,
      expirationDate,
      servicesCovered: servicesCovered ? JSON.parse(servicesCovered) : [],
      phiAccessLevel,
      documentUrl,
      salonId,
      createdBy: req.user.id
    });

    logger.info('BAA created', { baaId: baa._id, associateName });

    res.status(201).json({
      success: true,
      baa
    });

  } catch (error) {
    logger.error('Failed to create BAA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create BAA',
      error: error.message
    });
  }
};

/**
 * Update BAA
 */
export const updateBaa = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const baa = await BAA.findByIdAndUpdate(
      id,
      {
        ...updates,
        lastReviewedDate: new Date(),
        lastReviewedBy: req.user.id
      },
      { new: true }
    );

    if (!baa) {
      return res.status(404).json({
        success: false,
        message: 'BAA not found'
      });
    }

    res.json({
      success: true,
      baa
    });

  } catch (error) {
    logger.error('Failed to update BAA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update BAA'
    });
  }
};

/**
 * Renew BAA
 */
export const renewBaa = async (req, res) => {
  try {
    const { id } = req.params;
    const { newExpirationDate } = req.body;

    const baa = await BAA.findById(id);
    if (!baa) {
      return res.status(404).json({
        success: false,
        message: 'BAA not found'
      });
    }

    baa.signedDate = new Date();
    baa.expirationDate = newExpirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    baa.status = 'active';
    baa.lastReviewedDate = new Date();
    baa.lastReviewedBy = req.user.id;

    await baa.save();

    logger.info('BAA renewed', { baaId: baa._id, newExpiration: baa.expirationDate });

    res.json({
      success: true,
      baa
    });

  } catch (error) {
    logger.error('Failed to renew BAA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew BAA'
    });
  }
};

/**
 * Delete/Terminate BAA
 */
export const terminateBaa = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const baa = await BAA.findByIdAndUpdate(
      id,
      {
        status: 'terminated',
        terminatedDate: new Date(),
        terminationReason: reason
      },
      { new: true }
    );

    if (!baa) {
      return res.status(404).json({
        success: false,
        message: 'BAA not found'
      });
    }

    logger.info('BAA terminated', { baaId: baa._id, reason });

    res.json({
      success: true,
      message: 'BAA terminated',
      baa
    });

  } catch (error) {
    logger.error('Failed to terminate BAA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to terminate BAA'
    });
  }
};

/**
 * Get compliance status
 */
export const getComplianceStatus = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    // Count active/expiring BAAs
    const [activeBAAs, expiringSoon, totalStaff, trainedStaff] = await Promise.all([
      BAA.countDocuments({ salonId, status: 'active' }),
      BAA.countDocuments({
        salonId,
        status: 'expiring_soon',
        expirationDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      }),
      // In production, query actual staff count
      Promise.resolve(10),
      Promise.resolve(8)
    ]);

    const allBaasActive = expiringSoon === 0;

    const status = {
      activeBAAs,
      expiringSoon,
      encryptionEnabled: true, // Check encryption service
      auditLoggingEnabled: true, // Check audit log middleware
      staffTrainingComplete: trainedStaff === totalStaff,
      trainedStaff,
      totalStaff,
      breachPlanActive: true,
      backupsEnabled: true,
      accessControlsEnabled: true,
      allBaasActive,
      
      overallCompliance: allBaasActive && trainedStaff === totalStaff ? 'COMPLIANT' : 'NEEDS_ATTENTION'
    };

    res.json({
      success: true,
      status
    });

  } catch (error) {
    logger.error('Failed to get compliance status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get compliance status'
    });
  }
};

export default {
  getBaas,
  createBaa,
  updateBaa,
  renewBaa,
  terminateBaa,
  getComplianceStatus
};
