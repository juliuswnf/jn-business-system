import { useEffect, useMemo, useState } from 'react';
import { salonAPI } from '../utils/api';

// Roles that own all features — skip the salon info fetch
const CEO_ROLES = ['ceo', 'admin'];

const getCurrentUserRole = () => {
  try {
    const raw = localStorage.getItem('jnUser') || localStorage.getItem('user');
    return raw ? JSON.parse(raw)?.role : null;
  } catch {
    return null;
  }
};

const TIER_ORDER = ['starter', 'professional', 'enterprise'];

const FEATURE_TIER_REQUIREMENTS = {
  waitlistManagement: 'professional',
  treatmentPlans: 'professional',
  servicePackages: 'professional',
  memberships: 'professional',
  upsells: 'professional',
  advancedAnalytics: 'professional',
  multiLocation: 'enterprise',
  apiAccess: 'enterprise',
  whiteLabel: 'enterprise'
};

const normalizeTier = (tierValue) => {
  if (!tierValue || typeof tierValue !== 'string') {
    return 'starter';
  }

  const value = tierValue.toLowerCase().trim();

  if (value === 'pro') {
    return 'professional';
  }

  if (value.includes('enterprise')) {
    return 'enterprise';
  }

  if (value.includes('professional') || value.includes('pro')) {
    return 'professional';
  }

  return 'starter';
};

const compareTiers = (currentTier, requiredTier) => {
  const currentIndex = TIER_ORDER.indexOf(normalizeTier(currentTier));
  const requiredIndex = TIER_ORDER.indexOf(normalizeTier(requiredTier));
  return currentIndex >= requiredIndex;
};

export const usePlanAccess = () => {
  const [currentTier, setCurrentTier] = useState('starter');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTier = async () => {
      // CEO/admin users own all features — skip salon API call
      const role = getCurrentUserRole();
      if (CEO_ROLES.includes(role)) {
        if (isMounted) {
          setCurrentTier('enterprise');
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await salonAPI.getInfo();
        const subscription = response?.data?.salon?.subscription;
        const tierFromSubscription = subscription?.tier;
        const tierFromPlanId = subscription?.planId;

        if (isMounted) {
          setCurrentTier(normalizeTier(tierFromSubscription || tierFromPlanId));
        }
      } catch {
        if (isMounted) {
          setCurrentTier('starter');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTier();

    return () => {
      isMounted = false;
    };
  }, []);

  const api = useMemo(() => ({
    currentTier,
    isLoading,
    canAccessTier: (requiredTier = 'starter') => compareTiers(currentTier, requiredTier),
    getRequiredTier: (featureName, fallbackTier = 'professional') => {
      return FEATURE_TIER_REQUIREMENTS[featureName] || fallbackTier;
    }
  }), [currentTier, isLoading]);

  return api;
};

export default usePlanAccess;