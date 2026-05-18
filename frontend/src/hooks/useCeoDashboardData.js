import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { captureError } from '../utils/errorTracking';

const DEFAULT_STATS = {
  totalCustomers: 0,
  starterAbos: 0,
  professionalAbos: 0,
  enterpriseAbos: 0,
  proAbos: 0,
  trialAbos: 0,
  totalRevenue: 0
};

export default function useCeoDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [errors, setErrors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, errorsRes, customersRes, subsRes] = await Promise.all([
        api.get('/ceo/stats'),
        api.get('/ceo/errors?limit=50'),
        api.get('/ceo/customers?limit=100'),
        api.get('/ceo/ceo-subscriptions?limit=100')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats || DEFAULT_STATS);
      }

      if (errorsRes.data.success) {
        setErrors(errorsRes.data.errors || []);
      }

      if (customersRes.data.success) {
        setCustomers(customersRes.data.customers || []);
      }

      if (subsRes.data.success) {
        setSubscriptions(subsRes.data.subscriptions || []);
      }
    } catch (err) {
      captureError(err, { context: 'fetchCEODashboard' });
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }, []);

  const markErrorAsResolved = useCallback(async (errorId) => {
    try {
      const response = await api.patch(
        `/ceo/errors/${errorId}/resolve`,
        { notes: 'Vom CEO Kontrollpanel als geloest markiert' }
      );

      if (response.data.success) {
        setErrors((prevErrors) => prevErrors.map((entry) => (
          entry.id === errorId
            ? { ...entry, resolved: true, resolvedAt: new Date().toISOString() }
            : entry
        )));
      }
    } catch (err) {
      captureError(err, { context: 'resolveError', errorId });
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    loading,
    error,
    stats,
    errors,
    customers,
    subscriptions,
    fetchDashboardData,
    markErrorAsResolved
  };
}
