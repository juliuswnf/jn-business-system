// useCEO.js
import { useContext } from 'react';
import { CEOContext } from '../context/CEOContext';

export const useCEO = () => {
  const context = useContext(CEOContext);
  if (!context) {
    throw new Error('useCEO must be used within CEOProvider');
  }
  return context;
};

export default useCEO;
