/**
 * Tier Recommendation Engine
 *
 * Intelligenter Scoring-Algorithmus der basierend auf 6 Fragen
 * das optimale Subscription-Tier empfiehlt.
 */

const TIER_THRESHOLDS = {
  starter: { min: 0, max: 40 },
  professional: { min: 41, max: 80 },
  enterprise: { min: 81, max: 100 }
};

const TIER_PRICING = {
  starter: 49,
  professional: 199,
  enterprise: 499
};

/**
 * Calculate tier recommendation based on user answers
 *
 * @param {Object} answers - User answers from wizard
 * @returns {Object} recommendation with tier, score, reasoning
 */
export function calculateTierRecommendation(answers) {
  let score = 0;
  const reasoning = [];
  const scoreBreakdown = {};

  // ==================== CUSTOMER COUNT SCORING ====================
  const customerScore = calculateCustomerCountScore(answers.customerCount);
  score += customerScore.score;
  scoreBreakdown.customerCount = customerScore.score;
  if (customerScore.reason) reasoning.push(customerScore.reason);

  // ==================== BOOKINGS PER WEEK SCORING ====================
  const bookingsScore = calculateBookingsScore(answers.bookingsPerWeek);
  score += bookingsScore.score;
  scoreBreakdown.bookingsPerWeek = bookingsScore.score;
  if (bookingsScore.reason) reasoning.push(bookingsScore.reason);

  // ==================== LOCATIONS SCORING ====================
  const locationsScore = calculateLocationsScore(answers.locations);
  score += locationsScore.score;
  scoreBreakdown.locations = locationsScore.score;
  if (locationsScore.reason) reasoning.push(locationsScore.reason);

  // ==================== FEATURES SCORING ====================
  const featuresScore = calculateFeaturesScore(answers.features || []);
  score += featuresScore.score;
  scoreBreakdown.features = featuresScore.score;
  if (featuresScore.reason) reasoning.push(featuresScore.reason);

  // ==================== EMPLOYEES SCORING ====================
  const employeesScore = calculateEmployeesScore(answers.employees);
  score += employeesScore.score;
  scoreBreakdown.employees = employeesScore.score;
  if (employeesScore.reason) reasoning.push(employeesScore.reason);

  // ==================== BUDGET SCORING ====================
  const budgetScore = calculateBudgetScore(answers.budget);
  score += budgetScore.score;
  scoreBreakdown.budget = budgetScore.score;
  if (budgetScore.reason) reasoning.push(budgetScore.reason);

  // ==================== INDUSTRY BONUS ====================
  if (answers.industry) {
    const industryBonus = calculateIndustryBonus(answers.industry, answers.features || []);
    score += industryBonus.score;
    scoreBreakdown.industryBonus = industryBonus.score;
    if (industryBonus.reason) reasoning.push(industryBonus.reason);
  }

  // ==================== DETERMINE RECOMMENDED TIER ====================
  const recommendedTier = determineTier(score);

  // ==================== CALCULATE ALTERNATIVES ====================
  const alternatives = calculateAlternatives(score, recommendedTier, answers);

  // ==================== CALCULATE ROI ====================
  const roi = calculateROI(recommendedTier, answers);

  return {
    recommendedTier,
    score: Math.min(score, 100), // Cap at 100
    reasoning: reasoning.slice(0, 4), // Top 4 reasons
    scoreBreakdown,
    alternatives,
    estimatedMonthlySavings: roi.savings,
    estimatedROI: roi.multiplier,
    tierPrice: TIER_PRICING[recommendedTier],
    confidence: calculateConfidence(score)
  };
}

/**
 * Customer Count Scoring
 */
function calculateCustomerCountScore(customerCount) {
  switch (customerCount) {
    case '0-50':
      return { score: 10, reason: 'Kleine Kundenbasis - perfekt für den Start' };
    case '51-200':
      return { score: 20, reason: '150 Kunden - brauchst erweiterte Features' };
    case '201-500':
      return { score: 25, reason: '300+ Kunden - Automatisierung wird wichtig' };
    case '500+':
      return { score: 30, reason: '500+ Kunden - Enterprise-Features essentiell' };
    default:
      return { score: 5, reason: null };
  }
}

/**
 * Bookings Per Week Scoring
 */
function calculateBookingsScore(bookingsPerWeek) {
  switch (bookingsPerWeek) {
    case '0-20':
      return { score: 10, reason: 'Wenige Termine - Basis-Tools ausreichend' };
    case '21-50':
      return { score: 20, reason: '40 Termine/Woche - SMS-Reminder wichtig' };
    case '51-100':
      return { score: 25, reason: '75 Termine/Woche - Automatisierung spart Zeit' };
    case '100+':
      return { score: 30, reason: '100+ Termine/Woche - No-Show-Prevention kritisch' };
    default:
      return { score: 5, reason: null };
  }
}

/**
 * Locations Scoring
 */
function calculateLocationsScore(locations) {
  const count = parseInt(locations) || 1;

  if (count === 1) {
    return { score: 5, reason: null };
  } else if (count === 2 || count === 3) {
    return { score: 15, reason: 'Multi-Location - zentrale Verwaltung wichtig' };
  } else if (count >= 4) {
    return { score: 25, reason: `${count} Standorte - Enterprise-Features nötig` };
  }

  return { score: 5, reason: null };
}

/**
 * Features Scoring
 */
function calculateFeaturesScore(features) {
  const count = features.length;

  // Score based on number of features
  let score = 0;
  let reason = '';

  if (count <= 2) {
    score = 5;
    reason = 'Wenige Features - Starter reicht';
  } else if (count >= 3 && count <= 5) {
    score = 15;
    reason = `${count} Features gewünscht - Professional empfohlen`;
  } else if (count >= 6) {
    score = 20;
    reason = `${count}+ Features - Enterprise für volle Power`;
  }

  // Bonus for specific high-value features
  const enterpriseFeatures = ['white_label', 'api_access', 'custom_integrations', 'dedicated_support'];
  const hasEnterpriseFeature = features.some(f => enterpriseFeatures.includes(f));

  if (hasEnterpriseFeature) {
    score += 10;
    reason = 'Premium-Features benötigt - Enterprise ideal';
  }

  return { score, reason };
}

/**
 * Employees Scoring
 */
function calculateEmployeesScore(employees) {
  switch (employees) {
    case 'solo':
      return { score: 10, reason: 'Solo - einfache Verwaltung ausreichend' };
    case '2-5':
      return { score: 15, reason: '2-5 Mitarbeiter - Team-Features wichtig' };
    case '6-10':
      return { score: 20, reason: '6-10 Mitarbeiter - erweiterte Rechte nötig' };
    case '10+':
      return { score: 25, reason: '10+ Mitarbeiter - Enterprise-Organisation essentiell' };
    default:
      return { score: 5, reason: null };
  }
}

/**
 * Budget Scoring
 */
function calculateBudgetScore(budget) {
  switch (budget) {
    case 'under-100':
      return { score: 5, reason: null };
    case '100-200':
      return { score: 10, reason: '€150 Budget - Professional in Reichweite' };
    case '200-500':
      return { score: 12, reason: '€350 Budget - Professional optimal' };
    case '500+':
      return { score: 15, reason: '€500+ Budget - Enterprise für maximale Leistung' };
    default:
      return { score: 5, reason: null };
  }
}

/**
 * Industry Bonus Scoring
 */
function calculateIndustryBonus(industry, features) {
  let score = 0;
  let reason = null;

  if (industry === 'tattoo' && features.includes('multi_session')) {
    score = 10;
    reason = 'Tattoo + Multi-Session - Professional ideal';
  } else if (industry === 'medical_aesthetics' && features.includes('consents')) {
    score = 15;
    reason = 'Medical + Consents - Professional/Enterprise für Compliance';
  } else if (industry === 'spa_wellness' && features.includes('memberships')) {
    score = 10;
    reason = 'Spa + Memberships - Recurring Revenue Features wichtig';
  }

  return { score, reason };
}

/**
 * Determine tier based on score
 */
function determineTier(score) {
  if (score <= TIER_THRESHOLDS.starter.max) {
    return 'starter';
  } else if (score <= TIER_THRESHOLDS.professional.max) {
    return 'professional';
  } else {
    return 'enterprise';
  }
}

/**
 * Calculate alternative tiers with match percentage
 */
function calculateAlternatives(score, recommendedTier, _answers) {
  const alternatives = {};

  // Calculate match for each tier
  Object.keys(TIER_THRESHOLDS).forEach(tier => {
    if (tier === recommendedTier) return;

    const threshold = TIER_THRESHOLDS[tier];
    const midpoint = (threshold.min + threshold.max) / 2;
    const distance = Math.abs(score - midpoint);
    const maxDistance = 50; // Max distance for 0% match
    const match = Math.max(0, Math.round((1 - distance / maxDistance) * 100));

    let reason = '';

    if (tier === 'starter' && recommendedTier !== 'starter') {
      reason = match < 30 ? 'Zu wenig Features für deine Anforderungen' : 'Könnte knapp reichen, aber eng';
    } else if (tier === 'professional') {
      if (recommendedTier === 'starter') {
        reason = 'Mehr Features als du aktuell brauchst';
      } else {
        reason = 'Fast perfekt, aber Enterprise bietet mehr';
      }
    } else if (tier === 'enterprise' && recommendedTier !== 'enterprise') {
      reason = match < 40 ? 'Overkill für deine Größe' : 'Nice-to-have, aber nicht nötig';
    }

    alternatives[tier] = { match, reason, price: TIER_PRICING[tier] };
  });

  return alternatives;
}

/**
 * Calculate ROI and savings
 */
function calculateROI(tier, answers) {
  const tierPrice = TIER_PRICING[tier];

  // Estimate costs without system (manual work, no-shows, inefficiency)
  let estimatedCosts = 0;

  // Time savings (manual booking management)
  const bookingsPerWeek = getBookingsPerWeekNumber(answers.bookingsPerWeek);
  const timePerBooking = 5; // minutes
  const totalMinutesPerWeek = bookingsPerWeek * timePerBooking;
  const hourlyRate = 25; // €/hour
  const timeCostPerMonth = (totalMinutesPerWeek / 60) * hourlyRate * 4;
  estimatedCosts += timeCostPerMonth;

  // No-show costs (average 15% no-show rate, €50 average booking value)
  const avgBookingValue = 50;
  const noShowRate = 0.15;
  const noShowCostPerMonth = bookingsPerWeek * 4 * noShowRate * avgBookingValue;
  estimatedCosts += noShowCostPerMonth;

  // Marketing inefficiency (lost revenue from poor follow-up)
  const features = answers.features || [];
  if (features.includes('marketing') || features.includes('sms_reminders')) {
    estimatedCosts += 200; // Additional revenue opportunity
  }

  const savings = Math.round(estimatedCosts - tierPrice);
  const multiplier = estimatedCosts > tierPrice
    ? `${Math.round(estimatedCosts / tierPrice)}x`
    : '1x';

  return {
    savings: Math.max(savings, 0),
    multiplier,
    estimatedCosts: Math.round(estimatedCosts),
    breakdown: {
      timeSavings: Math.round(timeCostPerMonth),
      noShowPrevention: Math.round(noShowCostPerMonth),
      marketingRevenue: features.includes('marketing') ? 200 : 0
    }
  };
}

/**
 * Calculate confidence in recommendation (0-100%)
 */
function calculateConfidence(score) {
  // High confidence if score is clearly in one tier range
  const tier = determineTier(score);
  const threshold = TIER_THRESHOLDS[tier];
  const midpoint = (threshold.min + threshold.max) / 2;
  const distance = Math.abs(score - midpoint);
  const maxDistance = (threshold.max - threshold.min) / 2;

  const confidence = Math.round((1 - distance / maxDistance) * 100);
  return Math.max(60, Math.min(confidence, 95)); // Between 60-95%
}

/**
 * Helper: Get numeric bookings per week
 */
function getBookingsPerWeekNumber(bookingsPerWeek) {
  switch (bookingsPerWeek) {
    case '0-20': return 10;
    case '21-50': return 35;
    case '51-100': return 75;
    case '100+': return 150;
    default: return 20;
  }
}

/**
 * Get tier details
 */
export function getTierDetails(tier) {
  const details = {
    starter: {
      name: 'Starter',
      price: 49,
      icon: '🥉',
      tagline: 'Perfekt für den Start',
      features: [
        'Unbegrenzte Buchungen',
        'Kunden-Datenbank',
        'Basis-Kalender',
        'Email-Notifications',
        'Mobile App'
      ],
      limits: {
        employees: 2,
        locations: 1,
        smsPerMonth: 0,
        emailsPerMonth: 500
      }
    },
    professional: {
      name: 'Professional',
      price: 199,
      icon: '🥈',
      tagline: 'Für etablierte Businesses',
      features: [
        'Alles aus Starter',
        '1.000 SMS/Monat',
        'Marketing-Kampagnen',
        'Analytics & Reports',
        'Workflow-Automation',
        'Waitlist-Management',
        'Multi-Session-Projekte',
        'Packages & Memberships'
      ],
      limits: {
        employees: 10,
        locations: 3,
        smsPerMonth: 1000,
        emailsPerMonth: 5000
      }
    },
    enterprise: {
      name: 'Enterprise',
      price: 499,
      icon: '🥇',
      tagline: 'Maximale Power für Profis',
      features: [
        'Alles aus Professional',
        '5.000 SMS/Monat',
        'White-Label Branding',
        'API Access',
        'Dedicated Support',
        'Custom Integrations',
        'Multi-Location Management',
        'Advanced Analytics',
        'Priority Updates'
      ],
      limits: {
        employees: 999,
        locations: 999,
        smsPerMonth: 5000,
        emailsPerMonth: 20000
      }
    }
  };

  return details[tier] || details.starter;
}

export default calculateTierRecommendation;
