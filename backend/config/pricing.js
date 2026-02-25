/**
 * Pricing Configuration for JN Business System
 * Updated: December 13, 2025
 *
 * Pricing Structure:
 * - Starter: ?69/month (?690/year with 17% discount)
 * - Professional: ?169/month (?1,690/year with 17% discount)
 * - Enterprise: ?399/month (?3,990/year with 17% discount)
 */

export const PRICING_TIERS = {
  starter: {
    name: 'Starter',
    slug: 'starter',

    // Pricing
    priceMonthly: 69,
    priceYearly: 690, // 17% discount (2 months free)
    currency: 'EUR',

    // Limits
    limits: {
      staff: 5,
      locations: 1,
      bookingsPerMonth: 200,
      customers: 500,
      smsPerMonth: 0, // No SMS in Starter
      storageGB: 5
    },

    // Features
    features: {
      // Core Booking
      onlineBooking: true,
      calendar: true,
      customerCRM: true,
      publicSalonPage: true,

      // Notifications
      emailNotifications: true,
      smsNotifications: false, // ? No SMS

      // Security
      twoFactorAuth: false,

      // Payments
      stripeIntegration: true,

      // Reports
      basicReports: true,
      advancedAnalytics: false,
      customReporting: false,

      // Marketing
      marketingAutomation: false,
      emailCampaigns: false,

      // Advanced Features
      multiServiceBookings: false,
      recurringAppointments: false,
      waitlistManagement: false,
      noShowProtection: false,
      customBookingForms: false,
      beforeAfterPhotos: false,
      portfolioManagement: false,
      servicePackages: false,

      // Multi-Location
      multiLocation: false,
      multiLocationDashboard: false,

      // Enterprise Features
      whiteLabel: false,
      customDomain: false,
      apiAccess: false,
      webhooks: false,
      hipaaCompliance: false,
      auditLogs: false,
      teamPermissions: false
    }
  },

  professional: {
    name: 'Professional',
    slug: 'professional',

    // Pricing
    priceMonthly: 169,
    priceYearly: 1690, // 17% discount
    currency: 'EUR',

    // Limits
    limits: {
      staff: 30,
      locations: 1,
      bookingsPerMonth: 1000,
      customers: -1, // Unlimited
      smsPerMonth: 0, // ? No SMS (key change from original spec)
      storageGB: 25
    },

    // Features
    features: {
      // All Starter features
      onlineBooking: true,
      calendar: true,
      customerCRM: true,
      publicSalonPage: true,
      emailNotifications: true,
      smsNotifications: false, // ? Still no SMS in Professional

      // Security
      twoFactorAuth: true,
      stripeIntegration: true,
      basicReports: true,

      // Professional Features
      advancedAnalytics: true,
      marketingAutomation: true,
      emailCampaigns: true,
      multiServiceBookings: true,
      recurringAppointments: true,
      waitlistManagement: true,
      noShowProtection: true,
      customBookingForms: true,
      beforeAfterPhotos: true,
      portfolioManagement: true,
      servicePackages: true,

      // Still locked
      customReporting: false,
      multiLocation: false,
      multiLocationDashboard: false,
      whiteLabel: false,
      customDomain: false,
      apiAccess: false,
      webhooks: false,
      hipaaCompliance: false,
      auditLogs: true,
      teamPermissions: true
    }
  },

  enterprise: {
    name: 'Enterprise',
    slug: 'enterprise',

    // Pricing
    priceMonthly: 399,
    priceYearly: 3990, // 17% discount
    currency: 'EUR',

    // Limits
    limits: {
      staff: -1, // Unlimited
      locations: 5,
      bookingsPerMonth: -1, // Unlimited
      customers: -1, // Unlimited
      smsPerMonth: 500, // Base: 500 SMS/month
      smsPerAdditionalStaff: 50, // +50 SMS per staff member beyond 5
      storageGB: 100
    },

    // SMS Pricing (Overage)
    smsPricing: {
      includedSMS: 500, // Included in base price
      overageTier1: {
        from: 501,
        to: 1000,
        pricePerSMS: 0.05 // ?0.05 per SMS
      },
      overageTier2: {
        from: 1001,
        to: -1, // Unlimited
        pricePerSMS: 0.045 // ?0.045 per SMS (volume discount)
      }
    },

    // Features
    features: {
      // All Professional features
      onlineBooking: true,
      calendar: true,
      customerCRM: true,
      publicSalonPage: true,
      emailNotifications: true,
      smsNotifications: true, // ? SMS only in Enterprise

      // Security
      twoFactorAuth: true,
      stripeIntegration: true,
      basicReports: true,
      advancedAnalytics: true,
      marketingAutomation: true,
      emailCampaigns: true,
      multiServiceBookings: true,
      recurringAppointments: true,
      waitlistManagement: true,
      noShowProtection: true,
      customBookingForms: true,
      beforeAfterPhotos: true,
      portfolioManagement: true,
      servicePackages: true,

      // Enterprise Features
      customReporting: true,
      multiLocation: true,
      multiLocationDashboard: true,
      whiteLabel: true,
      customDomain: true,
      apiAccess: true,
      webhooks: true,
      hipaaCompliance: true,
      auditLogs: true,
      teamPermissions: true
    }
  }
};

/**
 * SMS Priority System
 * Determines which reminders get SMS vs Email
 */
export const SMS_PRIORITY = {
  // High priority: Always send SMS if available
  high: [
    '2h_reminder', // 2 hours before appointment
    '24h_reminder' // 24 hours before appointment (OPTIMIZED: added this)
  ],

  // Medium priority: Send SMS if budget available
  medium: [
    'same_day_reminder' // Morning of appointment
  ],

  // Low priority: Email only
  low: [
    'booking_confirmation',
    'booking_cancellation',
    'booking_rescheduled',
    'payment_received',
    'payment_failed'
  ]
};

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
  stripe: {
    name: 'Credit/Debit Card',
    slug: 'stripe',
    availableFor: ['starter', 'professional', 'enterprise'],
    fees: {
      percentage: 2.9,
      fixed: 0.30
    }
  },

  sepa: {
    name: 'SEPA Direct Debit',
    slug: 'sepa',
    availableFor: ['enterprise'], // Only Enterprise
    fees: {
      percentage: 0.8, // Much lower than Stripe
      fixed: 0
    },
    requiresVerification: true
  },

  invoice: {
    name: 'Invoice (Manual)',
    slug: 'invoice',
    availableFor: ['enterprise'], // Only Enterprise
    fees: {
      percentage: 0,
      fixed: 0
    },
    paymentTerms: 14 // 14 days payment terms
  }
};

/**
 * Trial Configuration
 * OPTIMIZED: Enterprise trial (show full power, then downgrade to chosen tier)
 */
export const TRIAL_CONFIG = {
  durationDays: 14,
  tier: 'enterprise', // Start with Enterprise tier
  features: 'all', // All features unlocked
  requiresPaymentMethod: true, // Require CC to start trial
  smsIncluded: 50, // 50 SMS during trial period
  autoDowngradeAfterTrial: true // Downgrade to selected tier after trial
};

/**
 * Feature Display Names (for UI)
 */
export const FEATURE_NAMES = {
  onlineBooking: 'Online Booking System',
  calendar: 'Staff Calendar',
  customerCRM: 'Customer Management',
  publicSalonPage: 'Public Booking Page',
  emailNotifications: 'Email Notifications',
  smsNotifications: 'SMS Notifications',
  twoFactorAuth: 'Two-Factor Authentication (2FA)',
  stripeIntegration: 'Stripe Payment Integration',
  basicReports: 'Basic Reports',
  advancedAnalytics: 'Advanced Analytics',
  customReporting: 'Custom Reports',
  marketingAutomation: 'Marketing Automation',
  emailCampaigns: 'Email Campaigns',
  multiServiceBookings: 'Multi-Service Bookings',
  recurringAppointments: 'Recurring Appointments',
  waitlistManagement: 'Waitlist Management',
  noShowProtection: 'No-Show Protection',
  customBookingForms: 'Custom Booking Forms',
  beforeAfterPhotos: 'Before/After Photos',
  portfolioManagement: 'Portfolio Gallery',
  servicePackages: 'Service Packages',
  multiLocation: 'Multi-Location Support',
  multiLocationDashboard: 'Multi-Location Dashboard',
  whiteLabel: 'White-Label Branding',
  customDomain: 'Custom Domain',
  apiAccess: 'API Access',
  webhooks: 'Webhooks',
  hipaaCompliance: 'HIPAA Compliance',
  auditLogs: 'Audit Logs',
  teamPermissions: 'Team Permissions'
};

/**
 * Helper Functions
 */

/**
 * Get pricing tier configuration
 */
export function getTierConfig(tierSlug) {
  return PRICING_TIERS[tierSlug] || null;
}

/**
 * Check if tier has specific feature
 */
export function tierHasFeature(tierSlug, featureName) {
  const tier = getTierConfig(tierSlug);
  return tier ? tier.features[featureName] === true : false;
}

/**
 * Calculate SMS limit for salon based on staff count
 * OPTIMIZED: Base 500 + 50 per additional staff member (beyond 5)
 */
export function calculateSMSLimit(tierSlug, staffCount) {
  const tier = getTierConfig(tierSlug);

  if (!tier || tier.limits.smsPerMonth === 0) {
    return 0; // No SMS for Starter/Professional
  }

  const baseSMS = tier.limits.smsPerMonth; // 500
  const additionalStaff = Math.max(0, staffCount - 5); // Staff beyond 5
  const bonusSMS = additionalStaff * tier.limits.smsPerAdditionalStaff; // 50 per staff

  return baseSMS + bonusSMS;
}

/**
 * Calculate SMS overage cost
 * OPTIMIZED: Tiered overage pricing
 */
export function calculateSMSOverageCost(tierSlug, smsUsed, smsLimit) {
  const tier = getTierConfig(tierSlug);

  if (!tier || tierSlug !== 'enterprise') {
    return 0;
  }

  const overage = smsUsed - smsLimit;
  if (overage <= 0) {
    return 0;
  }

  const pricing = tier.smsPricing;
  let cost = 0;

  // Tier 1: 501-1000 (?0.05/SMS)
  const tier1SMS = Math.min(overage, pricing.overageTier1.to - smsLimit);
  if (tier1SMS > 0) {
    cost += tier1SMS * pricing.overageTier1.pricePerSMS;
  }

  // Tier 2: 1001+ (?0.045/SMS)
  const tier2SMS = Math.max(0, overage - tier1SMS);
  if (tier2SMS > 0) {
    cost += tier2SMS * pricing.overageTier2.pricePerSMS;
  }

  return cost;
}

/**
 * Get yearly discount percentage
 */
export function getYearlyDiscount() {
  return 17; // 17% discount = 2 months free
}

/**
 * Calculate yearly price from monthly
 */
export function calculateYearlyPrice(monthlyPrice) {
  const yearlyPrice = monthlyPrice * 12;
  const discount = getYearlyDiscount() / 100;
  return Math.round(yearlyPrice * (1 - discount));
}

/**
 * Get required tier for feature
 */
export function getRequiredTierForFeature(featureName) {
  for (const [tierSlug, config] of Object.entries(PRICING_TIERS)) {
    if (config.features[featureName] === true) {
      return tierSlug;
    }
  }
  return null;
}

/**
 * Compare tiers (returns -1, 0, 1)
 */
export function compareTiers(tier1, tier2) {
  const tierOrder = ['starter', 'professional', 'enterprise'];
  const index1 = tierOrder.indexOf(tier1);
  const index2 = tierOrder.indexOf(tier2);

  if (index1 < index2) return -1;
  if (index1 > index2) return 1;
  return 0;
}

/**
 * Check if notification should use SMS
 * OPTIMIZED: Priority-based SMS allocation
 */
export function shouldUseSMS(notificationType, smsRemaining, tierSlug) {
  // Only Enterprise can use SMS
  if (tierSlug !== 'enterprise') {
    return false;
  }

  // No SMS budget remaining
  if (smsRemaining <= 0) {
    return false;
  }

  // High priority: Always use SMS if available
  if (SMS_PRIORITY.high.includes(notificationType)) {
    return true;
  }

  // Medium priority: Use SMS if we have >20% budget remaining
  const tier = getTierConfig(tierSlug);
  const smsLimit = tier.limits.smsPerMonth;
  const usagePercentage = ((smsLimit - smsRemaining) / smsLimit) * 100;

  if (SMS_PRIORITY.medium.includes(notificationType) && usagePercentage < 80) {
    return true;
  }

  // Low priority: Never use SMS
  return false;
}

export default {
  PRICING_TIERS,
  SMS_PRIORITY,
  PAYMENT_METHODS,
  TRIAL_CONFIG,
  FEATURE_NAMES,
  getTierConfig,
  tierHasFeature,
  calculateSMSLimit,
  calculateSMSOverageCost,
  getYearlyDiscount,
  calculateYearlyPrice,
  getRequiredTierForFeature,
  compareTiers,
  shouldUseSMS
};
