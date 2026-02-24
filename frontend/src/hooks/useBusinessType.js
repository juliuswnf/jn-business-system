import { useAuth } from './useAuth';

export const useBusinessType = () => {
  const { user } = useAuth();
  return user?.businessType || 'salon'; // default to salon
};

export default useBusinessType;