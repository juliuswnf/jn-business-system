import ConsentForm from '../models/ConsentForm.js';
import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';
import { generateConsentPDF } from '../utils/pdfGenerator.js';
import { validateUrl } from '../utils/securityHelpers.js';

/**
 * Consent Form Controller
 * For Medical Aesthetics / Tattoo Studios
 * Digital signature + compliance tracking
 */

// ==================== CREATE CONSENT FORM ====================
export const createConsentForm = async (req, res) => {
  try {
    const {
      salonId,
      customerId,
      consentType,
      title,
      description,
      treatmentName,
      risks,
      signature,
      guardianName,
      guardianRelationship,
      guardianSignature,
      version,
      language
    } = req.body;

    // Verify salon
    const salon = await Salon.findById(salonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    // Create consent form
    const consentForm = await ConsentForm.create({
      salonId,
      customerId,
      consentType,
      title,
      description,
      treatmentName,
      risks: risks ? JSON.parse(risks) : [],
      signature,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      guardianName,
      guardianRelationship,
      guardianSignature,
      version: version || '1.0',
      language: language || 'de',
      signedAt: new Date(),
      isActive: true
    });

    // Generate PDF (optional)
    if (process.env.PDF_GENERATION_ENABLED === 'true') {
      try {
        const pdfUrl = await generateConsentPDF(consentForm);
        consentForm.pdfUrl = pdfUrl;
        await consentForm.save();
      } catch (error) {
        logger.warn('PDF generation failed:', error);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Consent form created',
      consentForm
    });
  } catch (error) {
    logger.error('Error creating consent form:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET CUSTOMER CONSENTS ====================
export const getCustomerConsents = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { consentType, isActive } = req.query;

    const query = { customerId, deletedAt: null };
    if (consentType) query.consentType = consentType;
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';

    const consents = await ConsentForm.find(query).lean().maxTimeMS(5000)
      .sort({ signedAt: -1 })
      .lean();

    return res.json({
      success: true,
      consents
    });
  } catch (error) {
    logger.error('Error getting customer consents:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET CONSENT BY ID ====================
export const getConsentById = async (req, res) => {
  try {
    const { id } = req.params;

    const consent = await ConsentForm.findById(id)
      .populate('customerId', 'name email')
      .lean().maxTimeMS(5000);

    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent form not found' });
    }

    // ? SECURITY FIX: Authorization check - prevent IDOR
    if (req.user.role !== 'ceo' && consent.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    return res.json({
      success: true,
      consent
    });
  } catch (error) {
    logger.error('Error getting consent:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== REVOKE CONSENT ====================
export const revokeConsent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const consent = await ConsentForm.findById(id).maxTimeMS(5000);
    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent form not found' });
    }

    // ? SECURITY FIX: Authorization check - prevent IDOR
    if (req.user.role !== 'ceo' && consent.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    // Check if already revoked
    if (consent.revokedAt) {
      return res.status(400).json({
        success: false,
        message: 'Consent already revoked'
      });
    }

    // Revoke consent
    await consent.revoke(userId, reason);

    return res.json({
      success: true,
      message: 'Consent revoked successfully',
      revokedAt: consent.revokedAt
    });
  } catch (error) {
    logger.error('Error revoking consent:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== CHECK CONSENT VALIDITY ====================
export const checkConsentValidity = async (req, res) => {
  try {
    const { customerId, consentType } = req.params;

    const consent = await ConsentForm.findOne({
      customerId,
      consentType,
      isActive: true,
      deletedAt: null
    }).sort({ signedAt: -1 }).maxTimeMS(5000);

    if (!consent) {
      return res.json({
        success: true,
        hasValidConsent: false,
        message: 'No active consent found'
      });
    }

    const isValid = consent.isValid();

    return res.json({
      success: true,
      hasValidConsent: isValid,
      consent: isValid ? consent : null,
      reason: !isValid ? 'Consent expired or revoked' : null
    });
  } catch (error) {
    logger.error('Error checking consent validity:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET EXPIRING CONSENTS ====================
export const getExpiringConsents = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { daysAhead = 30 } = req.query;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(daysAhead));

    const expiringConsents = await ConsentForm.find({
      salonId,
      isActive: true,
      expiresAt: {
        $lte: expirationDate,
        $gte: new Date().lean().maxTimeMS(5000)
      },
      deletedAt: null
    })
      .populate('customerId', 'name email phone')
      .sort({ expiresAt: 1 })
      .lean();

    return res.json({
      success: true,
      expiringConsents,
      count: expiringConsents.length
    });
  } catch (error) {
    logger.error('Error getting expiring consents:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== DOWNLOAD CONSENT PDF ====================
export const downloadConsentPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const consent = await ConsentForm.findById(id)
      .populate('customerId', 'name email').maxTimeMS(5000);

    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent form not found' });
    }

    // ? SECURITY FIX: Authorization check - prevent IDOR
    if (req.user.role !== 'ceo' && consent.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    // If PDF already exists, validate and redirect to it
    if (consent.pdfUrl) {
      try {
        // Validate URL is from trusted domain (Cloudinary or our domain)
        const allowedDomains = ['res.cloudinary.com', process.env.FRONTEND_URL?.replace(/^https?:\/\//, '')];
        validateUrl(consent.pdfUrl, allowedDomains.filter(Boolean));
        return res.redirect(consent.pdfUrl);
      } catch (error) {
        logger.error('Invalid PDF URL:', error);
        return res.status(400).json({ success: false, message: 'Invalid PDF URL' });
      }
    }

    // Generate PDF on-demand
    if (process.env.PDF_GENERATION_ENABLED === 'true') {
      const pdfUrl = await generateConsentPDF(consent);
      try {
        // Validate generated URL
        const allowedDomains = ['res.cloudinary.com', process.env.FRONTEND_URL?.replace(/^https?:\/\//, '')];
        validateUrl(pdfUrl, allowedDomains.filter(Boolean));
        consent.pdfUrl = pdfUrl;
        await consent.save();
        return res.redirect(pdfUrl);
      } catch (error) {
        logger.error('Invalid generated PDF URL:', error);
        return res.status(500).json({ success: false, message: 'PDF generation failed' });
      }
    }

    // Fallback: return JSON
    return res.json({
      success: true,
      message: 'PDF generation not enabled',
      consent
    });
  } catch (error) {
    logger.error('Error downloading consent PDF:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== ADD WITNESS SIGNATURE ====================
export const addWitnessSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const { witnessName, witnessSignature } = req.body;

    const consent = await ConsentForm.findById(id).maxTimeMS(5000);
    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent form not found' });
    }

    consent.witnessName = witnessName;
    consent.witnessSignature = witnessSignature;
    consent.witnessSignedAt = new Date();

    await consent.save();

    return res.json({
      success: true,
      message: 'Witness signature added',
      consent
    });
  } catch (error) {
    logger.error('Error adding witness signature:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET SALON CONSENTS (ADMIN) ====================
export const getSalonConsents = async (req, res) => {
  try {
    const { salonId } = req.params;
    const userId = req.user.id;
    const { consentType, isActive, page = 1, limit = 50 } = req.query;

    // Verify authorization
    const salon = await Salon.findById(salonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const query = { salonId, deletedAt: null };
    if (consentType) query.consentType = consentType;
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';

    // ? SECURITY FIX: Validate and limit pagination to prevent DoS
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Max 100 items
    const skip = (validatedPage - 1) * validatedLimit;

    const consents = await ConsentForm.find(query)
      .sort({ signedAt: -1 })
      .skip(skip)
      .limit(validatedLimit)
      .populate('customerId', 'name email')
      .lean()
      .maxTimeMS(5000);

    const total = await ConsentForm.countDocuments(query);

    return res.json({
      success: true,
      consents,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        pages: Math.ceil(total / validatedLimit)
      }
    });
  } catch (error) {
    logger.error('Error getting salon consents:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


