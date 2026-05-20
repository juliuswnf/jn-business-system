import calculateTierRecommendation, { getTierDetails } from '../utils/tierRecommendationEngine.js';
import PricingWizardResponse from '../models/PricingWizardResponse.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{8,256}$/;
const WRITE_TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const ALLOWED_TIERS = ['starter', 'professional', 'enterprise'];

const createOwnerFingerprint = (req) => {
  const userAgent = String(req.headers['user-agent'] || 'unknown');
  const ipAddress = String(req.ip || 'unknown');
  return crypto.createHash('sha256').update(`${ipAddress}|${userAgent}`).digest('hex');
};

const createWriteToken = () => crypto.randomBytes(32).toString('hex');

const toTokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');

const resolveOptionalSalonId = (req, res) => {
  if (!req.user?.salonId) {
    return null;
  }

  const trustedSalonId = String(req.user.salonId);
  if (!mongoose.isValidObjectId(trustedSalonId)) {
    res.status(400).json({ success: false, message: 'Invalid authenticated salonId format' });
    return 'INVALID';
  }

  return new mongoose.Types.ObjectId(trustedSalonId);
};

/**
 * GET /api/pricing-wizard/questions
 * Get wizard questions configuration
 */
export const getQuestions = async (req, res) => {
  try {
    const questions = [
      {
        id: 1,
        key: 'customerCount',
        title: 'Wie viele Kunden hast du aktuell?',
        subtitle: 'Hilft uns, die richtige Größe für dein Business zu finden',
        type: 'single',
        icon: '👥',
        options: [
          { value: '0-50', label: '0-50 Kunden', subtitle: 'Gerade gestartet' },
          { value: '51-200', label: '51-200 Kunden', subtitle: 'Etabliertes Business' },
          { value: '201-500', label: '201-500 Kunden', subtitle: 'Gut laufend' },
          { value: '500+', label: '500+ Kunden', subtitle: 'Großes Business' }
        ]
      },
      {
        id: 2,
        key: 'bookingsPerWeek',
        title: 'Wie viele Termine hast du pro Woche?',
        subtitle: 'Zeigt uns, wie viel Automatisierung du brauchst',
        type: 'single',
        icon: '📅',
        options: [
          { value: '0-20', label: '0-20 Termine/Woche', subtitle: 'Entspanntes Tempo' },
          { value: '21-50', label: '21-50 Termine/Woche', subtitle: 'Moderate Auslastung' },
          { value: '51-100', label: '51-100 Termine/Woche', subtitle: 'Hohe Auslastung' },
          { value: '100+', label: '100+ Termine/Woche', subtitle: 'Sehr hohes Volumen' }
        ]
      },
      {
        id: 3,
        key: 'locations',
        title: 'Wie viele Standorte hast du?',
        subtitle: 'Multi-Location Features ab Professional',
        type: 'single',
        icon: '📍',
        options: [
          { value: 1, label: '1 Standort', subtitle: 'Ein Ort, volle Konzentration' },
          { value: 2, label: '2-3 Standorte', subtitle: 'Expandierend' },
          { value: 4, label: '4+ Standorte', subtitle: 'Multi-Location Business' }
        ]
      },
      {
        id: 4,
        key: 'features',
        title: 'Welche Features brauchst du?',
        subtitle: 'Wähle alles, was für dich wichtig ist (mehrere möglich)',
        type: 'multiple',
        icon: '✨',
        options: [
          { value: 'sms_reminders', label: 'SMS-Erinnerungen', subtitle: 'Reduziere No-Shows um 70%', icon: '📱' },
          { value: 'marketing', label: 'Marketing-Kampagnen', subtitle: 'Email & SMS Automation', icon: '📧' },
          { value: 'multi_session', label: 'Multi-Session-Projekte', subtitle: 'Für Tattoo, Medical', icon: '🎨' },
          { value: 'memberships', label: 'Packages & Memberships', subtitle: 'Recurring Revenue', icon: '💎' },
          { value: 'waitlist', label: 'Waitlist-Management', subtitle: 'Fülle freie Slots automatisch', icon: '⏰' },
          { value: 'analytics', label: 'Analytics & Reports', subtitle: 'Datenbasierte Entscheidungen', icon: '📊' },
          { value: 'white_label', label: 'White-Label Branding', subtitle: 'Deine eigene Brand', icon: '🏷️' }
        ]
      },
      {
        id: 5,
        key: 'employees',
        title: 'Wie viele Mitarbeiter hast du?',
        subtitle: 'Team-Features und User-Limits variieren',
        type: 'single',
        icon: '👔',
        options: [
          { value: 'solo', label: 'Nur ich', subtitle: 'Solo-Unternehmer' },
          { value: '2-5', label: '2-5 Mitarbeiter', subtitle: 'Kleines Team' },
          { value: '6-10', label: '6-10 Mitarbeiter', subtitle: 'Mittleres Team' },
          { value: '10+', label: '10+ Mitarbeiter', subtitle: 'Großes Team' }
        ]
      },
      {
        id: 6,
        key: 'budget',
        title: 'Was ist dein monatliches Budget für Software?',
        subtitle: 'Ehrlich sein hilft uns, das beste Preis-Leistungs-Verhältnis zu finden',
        type: 'single',
        icon: '💰',
        options: [
          { value: 'under-100', label: 'Unter €100/Monat', subtitle: 'Budget-bewusst' },
          { value: '100-200', label: '€100-200/Monat', subtitle: 'Standard-Budget' },
          { value: '200-500', label: '€200-500/Monat', subtitle: 'Großzügiges Budget' },
          { value: '500+', label: '€500+/Monat', subtitle: 'Premium-Budget' }
        ]
      }
    ];

    res.json({
      success: true,
      version: 'v1',
      data: questions
    });
  } catch (error) {
    logger.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
};

/**
 * POST /api/pricing-wizard/recommend
 * Get tier recommendation based on answers
 */
export const getRecommendation = async (req, res) => {
  try {
    const { answers, sessionId, timeToComplete } = req.body;

    if (!answers) {
      return res.status(400).json({
        success: false,
        message: 'Answers are required'
      });
    }

    if (!sessionId || typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid sessionId is required'
      });
    }

    // Calculate recommendation
    const recommendation = calculateTierRecommendation(answers);

    // Add tier details
    recommendation.tierDetails = getTierDetails(recommendation.recommendedTier);
    recommendation.allTiers = {
      starter: getTierDetails('starter'),
      professional: getTierDetails('professional'),
      enterprise: getTierDetails('enterprise')
    };

    const ownerFingerprint = createOwnerFingerprint(req);
    const writeToken = createWriteToken();
    const writeTokenHash = toTokenHash(writeToken);

    const salonId = resolveOptionalSalonId(req, res);
    if (salonId === 'INVALID') {
      return;
    }

    // Save response to database for analytics and secure state management.
    try {
      await PricingWizardResponse.create({
        salonId,
        userId: req.user?._id || null,
        sessionId,
        ownerFingerprint,
        writeTokenHash,
        answers,
        recommendedTier: recommendation.recommendedTier,
        score: recommendation.score,
        scoreBreakdown: recommendation.scoreBreakdown,
        confidence: recommendation.confidence,
        timeToComplete: timeToComplete || null,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        questionSetVersion: 'v1'
      });
    } catch (saveError) {
      // Non-critical error, just log it
      logger.warn('Failed to save wizard response:', saveError);
    }

    logger.info(`Recommendation generated: ${recommendation.recommendedTier} (score: ${recommendation.score})`);

    res.json({
      success: true,
      data: {
        ...recommendation,
        sessionId,
        writeToken
      }
    });
  } catch (error) {
    logger.error('Error generating recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendation',
      error: error.message
    });
  }
};

/**
 * POST /api/pricing-wizard/save
 * Save user selection (for conversion tracking)
 */
export const saveResponse = async (req, res) => {
  try {
    const { sessionId, selectedTier, writeToken } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    if (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID format' });
    }

    if (selectedTier && !ALLOWED_TIERS.includes(selectedTier)) {
      return res.status(400).json({ success: false, message: 'Invalid selected tier' });
    }

    const ownerFingerprint = createOwnerFingerprint(req);
    const query = { sessionId: String(sessionId) };

    const salonId = resolveOptionalSalonId(req, res);
    if (salonId === 'INVALID') {
      return;
    }

    if (req.user?._id) {
      query.userId = req.user._id;
      query.ownerFingerprint = ownerFingerprint;
      query.salonId = salonId;
    } else {
      if (!writeToken || typeof writeToken !== 'string' || !WRITE_TOKEN_PATTERN.test(writeToken)) {
        return res.status(400).json({
          success: false,
          message: 'Valid writeToken is required for anonymous session save'
        });
      }

      query.ownerFingerprint = ownerFingerprint;
      query.writeTokenHash = toTokenHash(writeToken);
    }

    // Find most recent response in the current owner scope only.
    const response = await PricingWizardResponse.findOne(query)
      .sort({ createdAt: -1 });

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Wizard response not found'
      });
    }

    // Update with selection
    if (selectedTier) {
      await response.markConverted(selectedTier);
      logger.info(`User selected tier: ${selectedTier} (recommended: ${response.recommendedTier})`);
    }

    res.json({
      success: true,
      message: 'Selection saved',
      data: response
    });
  } catch (error) {
    logger.error('Error saving response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save response',
      error: error.message
    });
  }
};

/**
 * GET /api/pricing-wizard/analytics
 * Get wizard analytics (admin only)
 */
export const getAnalytics = async (req, res) => {
  try {
    const conversionRate = await PricingWizardResponse.getConversionRate();
    const tierDistribution = await PricingWizardResponse.getTierDistribution();
    const averageMetrics = await PricingWizardResponse.getAverageScore();
    const mismatchRate = await PricingWizardResponse.getMismatchRate();

    const analytics = {
      conversionRate,
      tierDistribution,
      averageMetrics,
      mismatchRate
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};
