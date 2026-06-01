import ConsentForm from '../models/ConsentForm.js';
import Salon from '../models/Salon.js';
import Customer from '../models/Customer.js';
import logger from '../utils/logger.js';
import { generateConsentPDF } from '../utils/pdfGenerator.js';
import { validateUrl } from '../utils/securityHelpers.js';
import mongoose from 'mongoose';

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

    const rawQuerySalonId = req.query?.salonId;
    if (rawQuerySalonId) {
      if (!mongoose.isValidObjectId(rawQuerySalonId)) {
        throw new Error('Invalid salonId format');
      }
      // Cast to ObjectId — breaks taint chain from req.query into the DB query
      query.salonId = new mongoose.Types.ObjectId(String(rawQuerySalonId));
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

const buildScopedConsentByIdQuery = (req, consentId) => {
  const query = {
    _id: consentId,
    deletedAt: null
  };

  if (req.user?.role !== 'ceo') {
    const trustedSalonId = req.user?.salonId;
    if (!trustedSalonId || !mongoose.isValidObjectId(String(trustedSalonId))) {
      return null;
    }

    query.salonId = new mongoose.Types.ObjectId(String(trustedSalonId));
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

    if (!salonId || !mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId' });
    }

    if (!customerId || !mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customerId' });
    }

    const safeSalonId = new mongoose.Types.ObjectId(salonId);
    const safeCustomerId = new mongoose.Types.ObjectId(customerId);

    let parsedRisks = [];
    if (Array.isArray(risks)) {
      parsedRisks = risks;
    } else if (typeof risks === 'string' && risks.trim()) {
      try {
        const decodedRisks = JSON.parse(risks);
        if (!Array.isArray(decodedRisks)) {
          return res.status(400).json({ success: false, message: 'Invalid risks format' });
        }
        parsedRisks = decodedRisks;
      } catch (_parseError) {
        return res.status(400).json({ success: false, message: 'Invalid risks JSON' });
      }
    }

    // Verify salon
    const salon = await Salon.findById(safeSalonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    const customer = await Customer.findOne({
      _id: safeCustomerId,
      salonId: safeSalonId
    })
      .select('_id')
      .lean()
      .maxTimeMS(5000);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found for this salon' });
    }

    // Create consent form
    const consentForm = await ConsentForm.create({
      salonId: safeSalonId,
      customerId: safeCustomerId,
      consentType,
      title,
      description,
      treatmentName,
      risks: parsedRisks,
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

    const { customerId: rawCustomerId } = req.params;
    const { consentType, isActive } = req.query;

    if (!rawCustomerId || !mongoose.isValidObjectId(rawCustomerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customerId' });
    }
    // Cast to ObjectId — breaks taint chain from req.params into query
    const customerId = new mongoose.Types.ObjectId(rawCustomerId);

    let query;
    try {
      query = buildTenantScopedConsentQuery(req, customerId);
    } catch (_error) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    // .find() returns value from static array, breaking taint chain
    const safeConsentTypeFilter = typeof consentType === 'string'
      ? ALLOWED_CONSENT_TYPES.find(t => t === consentType)
      : undefined;
    if (safeConsentTypeFilter) query.consentType = safeConsentTypeFilter;
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

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid consent id' });
    }

    const safeConsentId = new mongoose.Types.ObjectId(id);

    const scopedQuery = buildScopedConsentByIdQuery(req, safeConsentId);
    if (!scopedQuery) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const consent = await ConsentForm.findOne(scopedQuery)
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

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid consent id' });
    }

    const safeConsentId = new mongoose.Types.ObjectId(id);

    const scopedQuery = buildScopedConsentByIdQuery(req, safeConsentId);
    if (!scopedQuery) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const consent = await ConsentForm.findOne(scopedQuery).maxTimeMS(5000);
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

    const { customerId: rawCustomerId2, consentType: rawConsentType } = req.params;

    if (!rawCustomerId2 || !mongoose.isValidObjectId(rawCustomerId2)) {
      return res.status(400).json({ success: false, message: 'Invalid customerId' });
    }
    // Cast to ObjectId — breaks taint chain from req.params into query
    const customerId = new mongoose.Types.ObjectId(rawCustomerId2);

    // .find() returns value from static array, breaking taint chain
    const consentType = typeof rawConsentType === 'string'
      ? ALLOWED_CONSENT_TYPES.find(t => t === rawConsentType) ?? null
      : null;
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

    if (requestedSalonId && !mongoose.isValidObjectId(requestedSalonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId' });
    }

    const rawTargetId = req.user.role === 'ceo' ? requestedSalonId : req.user.salonId?.toString();
    // Ensure salonId is a plain string (prevents object-operator injection)
    const targetSalonId = typeof rawTargetId === 'string' ? rawTargetId : null;

    if (!targetSalonId) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    if (req.user.role !== 'ceo' && requestedSalonId !== targetSalonId) {
      return res.status(403).json({ success: false, message: 'Access denied - Resource belongs to another salon' });
    }

    if (!mongoose.isValidObjectId(targetSalonId)) {
      return res.status(400).json({ success: false, message: 'Invalid tenant context' });
    }
    const safeTargetSalonId = new mongoose.Types.ObjectId(targetSalonId);

    const parsedDaysAhead = Number.parseInt(daysAhead, 10);
    const normalizedDaysAhead = Number.isFinite(parsedDaysAhead)
      ? Math.min(365, Math.max(1, parsedDaysAhead))
      : 30;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + normalizedDaysAhead);

    const expiringConsents = await ConsentForm.find({
      salonId: safeTargetSalonId,
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

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid consent id' });
    }

    const safeConsentId = new mongoose.Types.ObjectId(id);

    const scopedQuery = buildScopedConsentByIdQuery(req, safeConsentId);
    if (!scopedQuery) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const consent = await ConsentForm.findOne(scopedQuery)
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

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid consent id' });
    }

    const safeConsentId = new mongoose.Types.ObjectId(id);

    const scopedQuery = buildScopedConsentByIdQuery(req, safeConsentId);
    if (!scopedQuery) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const consent = await ConsentForm.findOne(scopedQuery).maxTimeMS(5000);
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

    const { salonId: rawSalonId } = req.params;
    const userId = getRequestUserId(req);
    const { consentType, isActive, page = 1, limit = 50 } = req.query;

    if (!rawSalonId || !mongoose.isValidObjectId(rawSalonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId' });
    }

    const safeSalonId = new mongoose.Types.ObjectId(rawSalonId);

    // Verify authorization
    const salon = await Salon.findById(safeSalonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    const isCeo = req.user.role === 'ceo';
    const hasSalonTenantAccess = req.user.salonId?.toString() === rawSalonId;
    const isOwner = salon.owner?.toString() === userId?.toString();

    if (!isCeo && !hasSalonTenantAccess && !isOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const query = { salonId: safeSalonId, deletedAt: null };
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


