import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { salonAPI } from '../utils/api';

const normalizeBusinessType = (value) => {
  const mapping = {
    salon: 'hair-salon',
    tattoo: 'tattoo-piercing',
    medical: 'medical-aesthetics',
    wellness: 'spa-wellness',
    beauty: 'beauty-salon',
    nails: 'nail-salon'
  };

  return mapping[value] || value || 'hair-salon';
};

export const useBusinessType = () => {
  const { user } = useAuth();
  const [businessType, setBusinessType] = useState(() => normalizeBusinessType(user?.businessType));

  useEffect(() => {
    let isMounted = true;

    const resolveBusinessType = async () => {
      if (!user) {
        if (isMounted) {
          setBusinessType('hair-salon');
        }
        return;
      }

      if (user.businessType) {
        if (isMounted) {
          setBusinessType(normalizeBusinessType(user.businessType));
        }
        return;
      }

      try {
        const response = await salonAPI.getInfo();
        const salonBusinessType = response?.data?.salon?.businessType;
        if (isMounted) {
          setBusinessType(normalizeBusinessType(salonBusinessType));
        }
      } catch {
        if (isMounted) {
          setBusinessType('hair-salon');
        }
      }
    };

    resolveBusinessType();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return businessType;
};

export default useBusinessType;