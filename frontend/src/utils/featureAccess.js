/**
 * Feature Access Control
 * Determines which features are available based on business type and subscription tier
 */

/**
 * Get available navigation items based on business type and tier
 * @param {string} businessType - The business type (e.g., 'tattoo-piercing', 'hair-salon')
 * @param {string} tier - The subscription tier ('starter', 'professional', 'enterprise')
 * @returns {Array} Filtered navigation items
 */
export function getAvailableNavItems(businessType, tier = 'starter') {
  // Base navigation items available to all
  const baseItems = [
    { path: '/dashboard', label: 'Übersicht', exact: true, group: 'Hauptbereich' },
    { path: '/dashboard/bookings', label: 'Buchungen', group: 'Hauptbereich' },
    { path: '/dashboard/services', label: 'Services', group: 'Verwaltung' },
    { path: '/dashboard/employees', label: 'Mitarbeiter', group: 'Verwaltung' },
    { path: '/dashboard/settings', label: 'Einstellungen', group: 'Einstellungen' },
    { path: '/dashboard/widget', label: 'Widget', group: 'Einstellungen' },
  ];

  // Tier-based features
  const tierFeatures = {
    starter: [
      { path: '/dashboard/waitlist', label: 'Warteliste', group: 'Hauptbereich' },
    ],
    professional: [
      { path: '/dashboard/waitlist', label: 'Warteliste', group: 'Hauptbereich' },
      { path: '/dashboard/packages-memberships', label: 'Packages & Memberships', group: 'Verwaltung' },
      { path: '/dashboard/marketing', label: 'Marketing', group: 'Marketing & Analytics' },
      { path: '/dashboard/success-metrics', label: 'Erfolgsmetriken', group: 'Marketing & Analytics' },
    ],
    enterprise: [
      { path: '/dashboard/waitlist', label: 'Warteliste', group: 'Hauptbereich' },
      { path: '/dashboard/packages-memberships', label: 'Packages & Memberships', group: 'Verwaltung' },
      { path: '/dashboard/marketing', label: 'Marketing', group: 'Marketing & Analytics' },
      { path: '/dashboard/success-metrics', label: 'Erfolgsmetriken', group: 'Marketing & Analytics' },
    ],
  };

  // Business type specific features
  const businessTypeFeatures = {
    'tattoo-piercing': [
      { path: '/dashboard/workflow-projects', label: 'Projekte', group: 'Projekte & Workflows' },
      { path: '/dashboard/workflows', label: 'Workflows', group: 'Projekte & Workflows' },
    ],
    'medical-aesthetics': [
      { path: '/dashboard/workflow-projects', label: 'Projekte', group: 'Projekte & Workflows' },
      { path: '/dashboard/workflows', label: 'Workflows', group: 'Projekte & Workflows' },
    ],
    'spa-wellness': [
      { path: '/dashboard/packages-memberships', label: 'Packages & Memberships', group: 'Verwaltung' },
    ],
    'beauty-salon': [
      { path: '/dashboard/packages-memberships', label: 'Packages & Memberships', group: 'Verwaltung' },
    ],
  };

  // Combine all available items
  const availableItems = [...baseItems];

  // Add tier-based features
  if (tierFeatures[tier]) {
    availableItems.push(...tierFeatures[tier]);
  }

  // Add business type specific features (if tier allows)
  if (businessTypeFeatures[businessType]) {
    const businessItems = businessTypeFeatures[businessType];
    // Only add if not already added by tier or if tier is professional/enterprise
    businessItems.forEach(item => {
      if (!availableItems.find(existing => existing.path === item.path)) {
        // Check if tier allows this feature
        if (tier === 'professional' || tier === 'enterprise') {
          availableItems.push(item);
        }
      }
    });
  }

  // Group items
  const grouped = {};
  availableItems.forEach(item => {
    if (!grouped[item.group]) {
      grouped[item.group] = [];
    }
    grouped[item.group].push(item);
  });

  return grouped;
}

/**
 * Check if a feature is available for the given business type and tier
 * @param {string} feature - Feature name (e.g., 'workflows', 'marketing')
 * @param {string} businessType - Business type
 * @param {string} tier - Subscription tier
 * @returns {boolean}
 */
export function hasFeatureAccess(feature, businessType, tier = 'starter') {
  const featureMap = {
    workflows: ['tattoo-piercing', 'medical-aesthetics'],
    packages: ['spa-wellness', 'beauty-salon'],
    marketing: ['professional', 'enterprise'],
    successMetrics: ['professional', 'enterprise'],
    multiLocation: ['enterprise'],
    smsNotifications: ['enterprise'],
    apiAccess: ['enterprise'],
  };

  // Check tier-based features
  if (featureMap[feature]?.includes(tier)) {
    return true;
  }

  // Check business type features
  if (featureMap[feature]?.includes(businessType)) {
    // Also check if tier allows it
    if (tier === 'professional' || tier === 'enterprise') {
      return true;
    }
  }

  return false;
}

