import { useEffect, useMemo, useState } from 'react';
import { salonAPI } from '../utils/api';
import { useAuth } from './useAuth';

// Roles that own all features — skip the salon info fetch
const CEO_ROLES = ['ceo', 'admin'];

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
  const { user, isLoading: isAuthLoading } = useAuth();
  const [currentTier, setCurrentTier] = useState('starter');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (isAuthLoading) {
      setIsLoading(true);
      return () => {
        isMounted = false;
      };
    }

    const loadTier = async () => {
      if (isMounted) {
        setIsLoading(true);
      }

      if (!user) {
        if (isMounted) {
          setCurrentTier('starter');
          setIsLoading(false);
        }
        return;
      }

      // CEO/admin users own all features — skip salon API call
      if (CEO_ROLES.includes(user.role)) {
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
  }, [isAuthLoading, user]);

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