import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { salonAPI } from '../utils/api';

const BUSINESS_TYPE_TO_INDUSTRY = {
  'tattoo-piercing': 'tattoo',
  'medical-aesthetics': 'medical_aesthetics',
  'spa-wellness': 'spa_wellness',
  barbershop: 'barbershop',
  'nail-salon': 'nails',
  'massage-therapy': 'massage',
  massage: 'massage',
  physiotherapy: 'physiotherapy',
  'beauty-salon': 'beauty',
  'hair-salon': 'generic',
  'personal-training': 'generic',
  'yoga-studio': 'generic',
  'pilates-studio': 'generic',
  other: 'generic'
};

const normalizeIndustry = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalized = value.toLowerCase().replace(/-/g, '_').trim();

  const supportedIndustries = new Set([
    'tattoo',
    'medical_aesthetics',
    'spa_wellness',
    'barbershop',
    'beauty',
    'nails',
    'massage',
    'physiotherapy',
    'generic'
  ]);

  if (supportedIndustries.has(normalized)) {
    return normalized;
  }

  return null;
};

const resolveIndustry = ({ industry, businessType }) => {
  const normalizedIndustry = normalizeIndustry(industry);
  if (normalizedIndustry) {
    return normalizedIndustry;
  }

  if (!businessType) {
    return null;
  }

  return BUSINESS_TYPE_TO_INDUSTRY[businessType] || 'generic';
};

export const useDashboardIndustry = () => {
  const { user } = useAuth();
  const [industry, setIndustry] = useState(() =>
    resolveIndustry({ industry: user?.industry, businessType: user?.businessType }) || 'generic'
  );

  useEffect(() => {
    let isMounted = true;

    const resolve = async () => {
      const fromUser = resolveIndustry({ industry: user?.industry, businessType: user?.businessType });
      if (fromUser && isMounted) {
        setIndustry(fromUser);
        return;
      }

      try {
        const response = await salonAPI.getInfo();
        const salon = response?.data?.salon;
        const fromSalon = resolveIndustry({ industry: salon?.industry, businessType: salon?.businessType });

        if (isMounted) {
          setIndustry(fromSalon || 'generic');
        }
      } catch {
        if (isMounted) {
          setIndustry('generic');
        }
      }
    };

    resolve();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return industry;
};

export default useDashboardIndustry;