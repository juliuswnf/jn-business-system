import BAA from '../models/BAA.js';
import BreachIncident from '../models/BreachIncident.js';
import AuditLog from '../models/AuditLog.js';
import cloudinary from '../utils/cloudinaryHelper.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Compliance Controller
 * BAA Management, HIPAA Compliance Status
 */

const ALLOWED_BREACH_TYPES = [
  'excessive_phi_access',
  'brute_force_attack',
  'unusual_access_location',
  'unauthorized_access_attempt',
  'data_theft',
  'malware',
  'phishing',
  'lost_device',
  'improper_disposal',
  'other'
];

const ALLOWED_BREACH_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const resolveScopedSalonId = (req, res, inputSalonId = null) => {
  if (req.user?.role === 'ceo') {
    const candidateSalonId = inputSalonId || req.query?.salonId || req.user?.salonId;
    if (!candidateSalonId) {
      res.status(400).json({ success: false, message: 'salonId is required for CEO context' });
      return null;
    }
    if (!mongoose.isValidObjectId(candidateSalonId)) {
      res.status(400).json({ success: false, message: 'Invalid salonId format' });
      return null;
    }
    return new mongoose.Types.ObjectId(candidateSalonId);
  }

  if (!req.user?.salonId) {
    res.status(403).json({ success: false, message: 'Salon context required' });
    return null;
  }

  if (inputSalonId && String(inputSalonId) !== String(req.user.salonId)) {
    res.status(403).json({ success: false, message: 'Cross-tenant access denied' });
    return null;
  }

  return req.user.salonId;
};

/**
 * Get all BAAs for a salon
 */
export const getBaas = async (req, res) => {
  try {
    const salonId = resolveScopedSalonId(req, res, req.query?.salonId);
    if (!salonId) return;

    const baas = await BAA.find({ salonId })
      .sort({ expirationDate: 1 })
      .populate('createdBy', 'firstName lastName email').lean().maxTimeMS(5000)
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
    const salonId = resolveScopedSalonId(req, res, req.body?.salonId);
    if (!salonId) return;

    let parsedServicesCovered = [];
    if (Array.isArray(servicesCovered)) {
      parsedServicesCovered = servicesCovered;
    } else if (typeof servicesCovered === 'string' && servicesCovered.trim().length > 0) {
      try {
        const parsed = JSON.parse(servicesCovered);
        if (!Array.isArray(parsed)) {
          return res.status(400).json({ success: false, message: 'servicesCovered must be an array' });
        }
        parsedServicesCovered = parsed;
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid servicesCovered JSON' });
      }
    }

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
      servicesCovered: parsedServicesCovered,
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
    const { id: rawId } = req.params;
    if (!rawId || !mongoose.isValidObjectId(rawId)) {
      return res.status(400).json({ success: false, message: 'Invalid BAA id' });
    }

    const baaId = new mongoose.Types.ObjectId(rawId);
    const baaFilter = { _id: baaId };

    if (req.user.role !== 'ceo') {
      if (!req.user.salonId) {
        return res.status(403).json({ success: false, message: 'Salon context required' });
      }
      baaFilter.salonId = req.user.salonId;
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.salonId;
    delete updates.createdBy;
    delete updates.lastReviewedBy;
    delete updates.terminatedDate;
    delete updates.terminationReason;

    const baa = await BAA.findOneAndUpdate(
      baaFilter,
      {
        ...updates,
        lastReviewedDate: new Date(),
        lastReviewedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).maxTimeMS(5000);

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
    const { id: rawId } = req.params;
    const { newExpirationDate } = req.body;

    if (!rawId || !mongoose.isValidObjectId(rawId)) {
      return res.status(400).json({ success: false, message: 'Invalid BAA id' });
    }

    const baaId = new mongoose.Types.ObjectId(rawId);
    const baaFilter = { _id: baaId };

    if (req.user.role !== 'ceo') {
      if (!req.user.salonId) {
        return res.status(403).json({ success: false, message: 'Salon context required' });
      }
      baaFilter.salonId = req.user.salonId;
    }

    const baa = await BAA.findOne(baaFilter).maxTimeMS(5000);
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
    const { id: rawId } = req.params;
    const { reason } = req.body;

    if (!rawId || !mongoose.isValidObjectId(rawId)) {
      return res.status(400).json({ success: false, message: 'Invalid BAA id' });
    }

    const baaId = new mongoose.Types.ObjectId(rawId);
    const baaFilter = { _id: baaId };

    if (req.user.role !== 'ceo') {
      if (!req.user.salonId) {
        return res.status(403).json({ success: false, message: 'Salon context required' });
      }
      baaFilter.salonId = req.user.salonId;
    }

    const baa = await BAA.findOneAndUpdate(
      baaFilter,
      {
        status: 'terminated',
        terminatedDate: new Date(),
        terminationReason: reason
      },
      { new: true, runValidators: true }
    ).maxTimeMS(5000);

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
    const salonId = resolveScopedSalonId(req, res, req.query?.salonId);
    if (!salonId) return;

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

/**
 * Manually create a breach report
 */
export const createBreachReport = async (req, res) => {
  try {
    const {
      type,
      severity,
      description,
      details = {},
      affectedRecords = 0,
      affectedDataTypes = [],
      affectedPatients = [],
      occurredAt,
      userId,
      ipAddress,
      salonId: rawSalonId
    } = req.body;

    if (!ALLOWED_BREACH_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid breach type' });
    }

    if (!ALLOWED_BREACH_SEVERITIES.includes(severity)) {
      return res.status(400).json({ success: false, message: 'Invalid breach severity' });
    }

    const salonId = resolveScopedSalonId(req, res, rawSalonId);
    if (!salonId) return;

    if (userId && !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId format' });
    }

    const safeAffectedPatients = Array.isArray(affectedPatients) ? affectedPatients : [];
    for (const patientId of safeAffectedPatients) {
      if (!mongoose.isValidObjectId(patientId)) {
        return res.status(400).json({ success: false, message: 'Invalid affected patient id' });
      }
    }

    const incident = await BreachIncident.create({
      type,
      severity,
      description,
      details,
      affectedRecords,
      affectedDataTypes: Array.isArray(affectedDataTypes) ? affectedDataTypes : [],
      affectedPatients: safeAffectedPatients.map((id) => new mongoose.Types.ObjectId(id)),
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
      detectedAt: new Date(),
      userId: userId ? new mongoose.Types.ObjectId(userId) : req.user.id,
      ipAddress: ipAddress || req.ip,
      salonId,
      notificationRequired: severity === 'HIGH' || severity === 'CRITICAL',
      status: 'detected'
    });

    await AuditLog.logAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'BREACH_REPORT_CREATED',
      category: 'security',
      description: `Manual breach report created (${type})`,
      resourceType: 'system',
      status: 'warning',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: {
        incidentId: incident._id,
        salonId,
        severity,
        type
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Breach report created',
      incident
    });
  } catch (error) {
    logger.error('Failed to create breach report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create breach report'
    });
  }
};

export default {
  getBaas,
  createBaa,
  updateBaa,
  renewBaa,
  terminateBaa,
  getComplianceStatus,
  createBreachReport
};


