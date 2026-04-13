import ConsentForm from '../models/ConsentForm.js';
import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';
import { generateConsentPDF } from '../utils/pdfGenerator.js';
import { validateUrl } from '../utils/securityHelpers.js';

const ALLOWED_CONSENT_TYPES = ['general', 'photo', 'gdpr', 'treatment', 'minor', 'tattoo', 'medical', 'aftercare', 'liability'];

/**
 * Consent Form Controller
 * For Medical Aesthetics / Tattoo Studios
 * Digital signature + compliance tracking
 */

const getRequestUserId = (req) => req.user?.id || req.user?._id;

const isAuthorizedForConsent = (req, consent) => {
  if (!req.user || !consent) {
    return false;
  }

  if (req.user.role === 'ceo') {
    return true;
  }

  const userSalonId = req.user.salonId?.toString();
  return Boolean(userSalonId && consent.salonId?.toString() === userSalonId);
};

const buildTenantScopedConsentQuery = (req, customerId) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const query = { deletedAt: null };

  if (req.user.role === 'ceo') {
    if (customerId) {
      query.customerId = customerId;
    }

    if (req.query?.salonId) {
      query.salonId = req.query.salonId;
    }

    return query;
  }

  if (!req.user.salonId) {
    throw new Error('Missing tenant context');
  }

  query.salonId = req.user.salonId;
  if (customerId) {
    query.customerId = customerId;
  }

  return query;
};

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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { customerId } = req.params;
    const { consentType, isActive } = req.query;

    let query;
    try {
      query = buildTenantScopedConsentQuery(req, customerId);
    } catch (_error) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    if (consentType && ALLOWED_CONSENT_TYPES.includes(String(consentType))) query.consentType = String(consentType);
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';

    const consents = await ConsentForm.find(query)
      .sort({ signedAt: -1 })
      .lean()
      .maxTimeMS(5000);

    return res.json({
      success: true,
      consents,
      forms: consents
    });
  } catch (error) {
    logger.error('Error getting customer consents:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET CONSENT BY ID ====================
export const getConsentById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;

    const consent = await ConsentForm.findById(id)
      .populate('customerId', 'name email')
      .lean().maxTimeMS(5000);

    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent form not found' });
    }

    if (!isAuthorizedForConsent(req, consent)) {
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const userId = getRequestUserId(req);

    const consent = await ConsentForm.findById(id).maxTimeMS(5000);
    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent form not found' });
    }

    if (!isAuthorizedForConsent(req, consent)) {
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { customerId, consentType: rawConsentType } = req.params;
    const consentType = ALLOWED_CONSENT_TYPES.includes(String(rawConsentType)) ? String(rawConsentType) : null;
    if (!consentType) {
      return res.status(400).json({ success: false, message: 'Invalid consent type' });
    }

    let query;
    try {
      query = buildTenantScopedConsentQuery(req, customerId);
    } catch (_error) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const consent = await ConsentForm.findOne({
      ...query,
      consentType,
      isActive: true
    })
      .sort({ signedAt: -1 })
      .maxTimeMS(5000);

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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { salonId: requestedSalonId } = req.params;
    const { daysAhead = 30 } = req.query;

    const targetSalonId = req.user.role === 'ceo' ? requestedSalonId : req.user.salonId?.toString();

    if (!targetSalonId) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    if (req.user.role !== 'ceo' && requestedSalonId !== targetSalonId) {
      return res.status(403).json({ success: false, message: 'Access denied - Resource belongs to another salon' });
    }

    const parsedDaysAhead = Number.parseInt(daysAhead, 10);
    const normalizedDaysAhead = Number.isFinite(parsedDaysAhead)
      ? Math.min(365, Math.max(1, parsedDaysAhead))
      : 30;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + normalizedDaysAhead);

    const expiringConsents = await ConsentForm.find({
      salonId: targetSalonId,
      isActive: true,
      expiresAt: {
        $lte: expirationDate,
        $gte: new Date()
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;

    const consent = await ConsentForm.findById(id)
      .populate('customerId', 'name email').maxTimeMS(5000);

    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent form not found' });
    }

    if (!isAuthorizedForConsent(req, consent)) {
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;
    const { witnessName, witnessSignature } = req.body;

    const consent = await ConsentForm.findById(id).maxTimeMS(5000);
    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent form not found' });
    }

    if (!isAuthorizedForConsent(req, consent)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { salonId } = req.params;
    const userId = getRequestUserId(req);
    const { consentType, isActive, page = 1, limit = 50 } = req.query;

    // Verify authorization
    const salon = await Salon.findById(salonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    const isCeo = req.user.role === 'ceo';
    const hasSalonTenantAccess = req.user.salonId?.toString() === salonId;
    const isOwner = salon.owner?.toString() === userId?.toString();

    if (!isCeo && !hasSalonTenantAccess && !isOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const query = { salonId, deletedAt: null };
    if (consentType) {
      const safeConsentType = ALLOWED_CONSENT_TYPES.includes(String(consentType)) ? String(consentType) : undefined;
      if (safeConsentType) query.consentType = safeConsentType;
    }
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


