import calculateTierRecommendation, { getTierDetails } from '../utils/tierRecommendationEngine.js';
import PricingWizardResponse from '../models/PricingWizardResponse.js';
import { createLogger } from '../config/logger.js';

const logger = createLogger('PricingWizardController');

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
        subtitle: 'Hilft uns, die richtige GrÃ¶ÃŸe fÃ¼r dein Business zu finden',
        type: 'single',
        icon: 'ðŸ‘¥',
        options: [
          { value: '0-50', label: '0-50 Kunden', subtitle: 'Gerade gestartet' },
          { value: '51-200', label: '51-200 Kunden', subtitle: 'Etabliertes Business' },
          { value: '201-500', label: '201-500 Kunden', subtitle: 'Gut laufend' },
          { value: '500+', label: '500+ Kunden', subtitle: 'GroÃŸes Business' }
        ]
      },
      {
        id: 2,
        key: 'bookingsPerWeek',
        title: 'Wie viele Termine hast du pro Woche?',
        subtitle: 'Zeigt uns, wie viel Automatisierung du brauchst',
        type: 'single',
        icon: 'ðŸ“…',
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
        icon: 'ðŸ“',
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
        subtitle: 'WÃ¤hle alles, was fÃ¼r dich wichtig ist (mehrere mÃ¶glich)',
        type: 'multiple',
        icon: 'âœ¨',
        options: [
          { value: 'sms_reminders', label: 'SMS-Erinnerungen', subtitle: 'Reduziere No-Shows um 70%', icon: 'ðŸ“±' },
          { value: 'marketing', label: 'Marketing-Kampagnen', subtitle: 'Email & SMS Automation', icon: 'ðŸ“§' },
          { value: 'multi_session', label: 'Multi-Session-Projekte', subtitle: 'FÃ¼r Tattoo, Medical', icon: 'ðŸŽ¨' },
          { value: 'memberships', label: 'Packages & Memberships', subtitle: 'Recurring Revenue', icon: 'ðŸ’Ž' },
          { value: 'waitlist', label: 'Waitlist-Management', subtitle: 'FÃ¼lle freie Slots automatisch', icon: 'â°' },
          { value: 'analytics', label: 'Analytics & Reports', subtitle: 'Datenbasierte Entscheidungen', icon: 'ðŸ“Š' },
          { value: 'white_label', label: 'White-Label Branding', subtitle: 'Deine eigene Brand', icon: 'ðŸ·ï¸' }
        ]
      },
      {
        id: 5,
        key: 'employees',
        title: 'Wie viele Mitarbeiter hast du?',
        subtitle: 'Team-Features und User-Limits variieren',
        type: 'single',
        icon: 'ðŸ‘”',
        options: [
          { value: 'solo', label: 'Nur ich', subtitle: 'Solo-Unternehmer' },
          { value: '2-5', label: '2-5 Mitarbeiter', subtitle: 'Kleines Team' },
          { value: '6-10', label: '6-10 Mitarbeiter', subtitle: 'Mittleres Team' },
          { value: '10+', label: '10+ Mitarbeiter', subtitle: 'GroÃŸes Team' }
        ]
      },
      {
        id: 6,
        key: 'budget',
        title: 'Was ist dein monatliches Budget fÃ¼r Software?',
        subtitle: 'Ehrlich sein hilft uns, das beste Preis-Leistungs-VerhÃ¤ltnis zu finden',
        type: 'single',
        icon: 'ðŸ’°',
        options: [
          { value: 'under-100', label: 'Unter â‚¬100/Monat', subtitle: 'Budget-bewusst' },
          { value: '100-200', label: 'â‚¬100-200/Monat', subtitle: 'Standard-Budget' },
          { value: '200-500', label: 'â‚¬200-500/Monat', subtitle: 'GroÃŸzÃ¼giges Budget' },
          { value: '500+', label: 'â‚¬500+/Monat', subtitle: 'Premium-Budget' }
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

    // Calculate recommendation
    const recommendation = calculateTierRecommendation(answers);

    // Add tier details
    recommendation.tierDetails = getTierDetails(recommendation.recommendedTier);
    recommendation.allTiers = {
      starter: getTierDetails('starter'),
      professional: getTierDetails('professional'),
      enterprise: getTierDetails('enterprise')
    };

    // Save response to database (optional - for analytics)
    if (sessionId) {
      try {
        await PricingWizardResponse.create({
          userId: req.user?._id || null,
          sessionId,
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
    }

    logger.info(`Recommendation generated: ${recommendation.recommendedTier} (score: ${recommendation.score})`);

    res.json({
      success: true,
      data: recommendation
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
    const { sessionId, selectedTier, converted } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Find most recent response for this session
    const response = await PricingWizardResponse.findOne({ sessionId })
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
