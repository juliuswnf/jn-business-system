/**
 * White-Label Utility
 *
 * Provides white-label branding information for emails and widgets.
 * Enterprise users can hide JN Business System branding.
 *
 * @module utils/whiteLabelUtils
 */

import Salon from '../models/Salon.js';

/**
 * Get branding info for a salon
 * Returns default JN Business System branding if not Enterprise or no custom branding
 *
 * @param {string} salonId - The salon ID
 * @returns {Object} Branding information
 */
export const getSalonBranding = async (salonId) => {
  const defaultBranding = {
    companyName: 'JN Business System',
    logo: null,
    primaryColor: '#EF4444',
    showPoweredBy: true,
    emailSignature: 'JN Business System Team',
    footerText: 'JN Business System • Das Buchungssystem für Salons & Studios'
  };

  if (!salonId) {
    return defaultBranding;
  }

  try {
    const salon = await Salon.findById(salonId)
      .select('name branding subscription.tier')
      .maxTimeMS(5000);

    if (!salon) {
      return defaultBranding;
    }

    const tier = salon.subscription?.tier || 'starter';
    const isEnterprise = tier === 'enterprise';
    const canWhiteLabel = isEnterprise && salon.branding?.showPoweredBy === false;

    if (canWhiteLabel) {
      // White-label: Use salon's branding
      return {
        companyName: salon.name,
        logo: salon.branding?.logo || null,
        primaryColor: salon.branding?.primaryColor || defaultBranding.primaryColor,
        showPoweredBy: false,
        emailSignature: `${salon.name} Team`,
        footerText: salon.name
      };
    }

    // Non-white-label: Use JN Business System branding with custom colors
    return {
      ...defaultBranding,
      logo: salon.branding?.logo || null,
      primaryColor: salon.branding?.primaryColor || defaultBranding.primaryColor,
      salonName: salon.name
    };
  } catch {
    return defaultBranding;
  }
};

/**
 * Generate email footer based on branding
 *
 * @param {string} salonId - The salon ID
 * @returns {string} HTML footer content
 */
export const getEmailFooter = async (salonId) => {
  const branding = await getSalonBranding(salonId);

  if (!branding.showPoweredBy) {
    // White-label footer
    return `
      <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e5e5; margin-top: 30px;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          ${branding.footerText}
        </p>
      </div>
    `;
  }

  // Standard footer with JN Business System branding
  return `
    <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e5e5; margin-top: 30px;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        ${branding.salonName ? `${branding.salonName} • Powered by ` : ''}JN Business System
      </p>
      <p style="color: #999; font-size: 11px; margin: 5px 0 0 0;">
        Das Buchungssystem für Salons & Studios
      </p>
    </div>
  `;
};

/**
 * Check if a salon has white-label enabled
 *
 * @param {string} salonId - The salon ID
 * @returns {boolean} True if white-label is enabled
 */
export const isWhiteLabelEnabled = async (salonId) => {
  if (!salonId) return false;

  try {
    const salon = await Salon.findById(salonId)
      .select('branding.showPoweredBy subscription.tier')
      .maxTimeMS(5000);

    if (!salon) return false;

    const isEnterprise = salon.subscription?.tier === 'enterprise';
    return isEnterprise && salon.branding?.showPoweredBy === false;
  } catch {
    return false;
  }
};

export default {
  getSalonBranding,
  getEmailFooter,
  isWhiteLabelEnabled
};
