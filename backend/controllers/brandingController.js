/**
 * Branding Controller - Custom Styling & White-Label
 *
 * Allows salon owners to customize their booking page appearance.
 *
 * @module controllers/brandingController
 */

import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';

/**
 * Get current branding settings
 * GET /api/branding
 */
export const getBranding = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Kein Salon zugeordnet'
      });
    }

    const salon = await Salon.findById(salonId)
      .select('name branding subscription.tier')
      .maxTimeMS(5000);

    if (!salon) {
      return res.status(404).json({
        success: false,
        error: 'Salon nicht gefunden'
      });
    }

    // Check if custom branding is available for this tier
    const tier = salon.subscription?.tier || 'starter';
    const canCustomize = tier !== 'starter';
    const canWhiteLabel = tier === 'enterprise';

    res.status(200).json({
      success: true,
      branding: {
        logo: salon.branding?.logo || null,
        favicon: salon.branding?.favicon || null,
        primaryColor: salon.branding?.primaryColor || '#EF4444',
        secondaryColor: salon.branding?.secondaryColor || '#1F2937',
        accentColor: salon.branding?.accentColor || '#10B981',
        fontFamily: salon.branding?.fontFamily || 'inter',
        buttonStyle: salon.branding?.buttonStyle || 'rounded',
        showPoweredBy: salon.branding?.showPoweredBy !== false
      },
      permissions: {
        canCustomize,
        canWhiteLabel,
        tier
      }
    });
  } catch (error) {
    logger.error('Branding getBranding Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Branding-Einstellungen'
    });
  }
};

/**
 * Update branding settings
 * PUT /api/branding
 */
export const updateBranding = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      buttonStyle,
      showPoweredBy
    } = req.body;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Kein Salon zugeordnet'
      });
    }

    const salon = await Salon.findById(salonId).maxTimeMS(5000);

    if (!salon) {
      return res.status(404).json({
        success: false,
        error: 'Salon nicht gefunden'
      });
    }

    // Check tier for permissions
    const tier = salon.subscription?.tier || 'starter';

    if (tier === 'starter') {
      return res.status(403).json({
        success: false,
        error: 'Custom Branding ist ab dem Professional-Tarif verfÃ¼gbar. Bitte upgraden Sie Ihr Abonnement.'
      });
    }

    // White-label (showPoweredBy = false) is Enterprise only
    if (showPoweredBy === false && tier !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'White-Label (ohne "Powered by JN Business System") ist nur im Enterprise-Tarif verfÃ¼gbar.'
      });
    }

    // Validate color format
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (primaryColor && !colorRegex.test(primaryColor)) {
      return res.status(400).json({
        success: false,
        error: 'UngÃ¼ltiges Farbformat fÃ¼r PrimÃ¤rfarbe. Verwenden Sie #RRGGBB.'
      });
    }
    if (secondaryColor && !colorRegex.test(secondaryColor)) {
      return res.status(400).json({
        success: false,
        error: 'UngÃ¼ltiges Farbformat fÃ¼r SekundÃ¤rfarbe. Verwenden Sie #RRGGBB.'
      });
    }
    if (accentColor && !colorRegex.test(accentColor)) {
      return res.status(400).json({
        success: false,
        error: 'UngÃ¼ltiges Farbformat fÃ¼r Akzentfarbe. Verwenden Sie #RRGGBB.'
      });
    }

    // Update branding
    const updates = {};
    if (primaryColor) updates['branding.primaryColor'] = primaryColor;
    if (secondaryColor) updates['branding.secondaryColor'] = secondaryColor;
    if (accentColor) updates['branding.accentColor'] = accentColor;
    if (fontFamily) updates['branding.fontFamily'] = fontFamily;
    if (buttonStyle) updates['branding.buttonStyle'] = buttonStyle;
    if (typeof showPoweredBy === 'boolean') updates['branding.showPoweredBy'] = showPoweredBy;

    const updatedSalon = await Salon.findByIdAndUpdate(
      salonId,
      { $set: updates },
      { new: true }
    ).select('branding').maxTimeMS(5000);

    logger.info(`Branding updated for salon ${salonId}`);

    res.status(200).json({
      success: true,
      message: 'Branding-Einstellungen wurden aktualisiert',
      branding: updatedSalon.branding
    });
  } catch (error) {
    logger.error('Branding updateBranding Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Aktualisieren der Branding-Einstellungen'
    });
  }
};

/**
 * Upload logo
 * POST /api/branding/logo
 */
export const uploadLogo = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Kein Salon zugeordnet'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Keine Datei hochgeladen'
      });
    }

    const salon = await Salon.findById(salonId).maxTimeMS(5000);
    const tier = salon?.subscription?.tier || 'starter';

    if (tier === 'starter') {
      return res.status(403).json({
        success: false,
        error: 'Logo-Upload ist ab dem Professional-Tarif verfÃ¼gbar.'
      });
    }

    // File URL (relative path stored in uploads)
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    await Salon.findByIdAndUpdate(salonId, {
      $set: { 'branding.logo': logoUrl }
    }).maxTimeMS(5000);

    logger.info(`Logo uploaded for salon ${salonId}`);

    res.status(200).json({
      success: true,
      message: 'Logo wurde hochgeladen',
      logoUrl
    });
  } catch (error) {
    logger.error('Branding uploadLogo Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Hochladen des Logos'
    });
  }
};

/**
 * Delete logo
 * DELETE /api/branding/logo
 */
export const deleteLogo = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Kein Salon zugeordnet'
      });
    }

    await Salon.findByIdAndUpdate(salonId, {
      $set: { 'branding.logo': null }
    }).maxTimeMS(5000);

    logger.info(`Logo deleted for salon ${salonId}`);

    res.status(200).json({
      success: true,
      message: 'Logo wurde gelÃ¶scht'
    });
  } catch (error) {
    logger.error('Branding deleteLogo Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim LÃ¶schen des Logos'
    });
  }
};

/**
 * Reset branding to defaults
 * POST /api/branding/reset
 */
export const resetBranding = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Kein Salon zugeordnet'
      });
    }

    const defaultBranding = {
      logo: null,
      favicon: null,
      primaryColor: '#EF4444',
      secondaryColor: '#1F2937',
      accentColor: '#10B981',
      fontFamily: 'inter',
      buttonStyle: 'rounded',
      showPoweredBy: true
    };

    await Salon.findByIdAndUpdate(salonId, {
      $set: { branding: defaultBranding }
    }).maxTimeMS(5000);

    logger.info(`Branding reset to defaults for salon ${salonId}`);

    res.status(200).json({
      success: true,
      message: 'Branding wurde auf Standard zurÃ¼ckgesetzt',
      branding: defaultBranding
    });
  } catch (error) {
    logger.error('Branding resetBranding Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim ZurÃ¼cksetzen des Brandings'
    });
  }
};

export default {
  getBranding,
  updateBranding,
  uploadLogo,
  deleteLogo,
  resetBranding
};
