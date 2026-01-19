import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiExternalLink } from 'react-icons/fi';

/**
 * StripeConnectAlert Component
 * Shows alert banner in dashboard if Stripe Connect account is not set up
 */
export default function StripeConnectAlert() {
  const [accountStatus, setAccountStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStripeStatus();
  }, []);

  const checkStripeStatus = async () => {
    try {
      const res = await api.get('/stripe-connect/account-status');
      setAccountStatus(res.data);
    } catch (error) {
      console.error('Failed to check Stripe status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const res = await api.post('/stripe-connect/create-account');
      if (res.data.onboardingUrl) {
        window.location.href = res.data.onboardingUrl;
      }
    } catch (error) {
      alert('Fehler beim Verbinden mit Stripe: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRefreshOnboarding = async () => {
    try {
      const res = await api.post('/stripe-connect/refresh-onboarding');
      window.location.href = res.data.onboardingUrl;
    } catch (error) {
      alert('Fehler: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return null;

  // No account yet
  if (!accountStatus?.hasAccount) {
    return (
      <div className="mb-6 bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FiAlertCircle className="text-yellow-400" size={20} />
              <h3 className="font-semibold text-yellow-400">
                Stripe-Konto verbinden erforderlich
              </h3>
            </div>
            <p className="text-sm text-gray-300 mb-3">
              Um No-Show-Gebühren zu erhalten, verbinden Sie Ihr Stripe-Konto.
              Die Einrichtung dauert nur 2-3 Minuten.
            </p>
            <ul className="text-sm text-gray-400 space-y-1 mb-3">
              <li>✓ Direkte Auszahlungen auf Ihr Bankkonto</li>
              <li>✓ Automatische No-Show-Gebühren-Abrechnung</li>
              <li>✓ 100% sicher über Stripe</li>
            </ul>
          </div>
          <button
            onClick={handleConnectStripe}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition whitespace-nowrap"
          >
            Jetzt verbinden
          </button>
        </div>
      </div>
    );
  }

  // Account exists but not complete
  if (!accountStatus.chargesEnabled) {
    return (
      <div className="mb-6 bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FiInfo className="text-blue-400" size={20} />
              <h3 className="font-semibold text-blue-400">
                Stripe-Einrichtung unvollständig
              </h3>
            </div>
            <p className="text-sm text-gray-300 mb-3">
              Ihre Stripe-Kontoanmeldung ist noch nicht abgeschlossen.
              Schließen Sie die Einrichtung ab, um No-Show-Gebühren zu erhalten.
            </p>
          </div>
          <button
            onClick={handleRefreshOnboarding}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition whitespace-nowrap"
          >
            Einrichtung fortsetzen
          </button>
        </div>
      </div>
    );
  }

  // All good - show success briefly or hide
  return (
    <div className="mb-6 bg-green-900/20 border border-green-600/50 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <FiCheckCircle className="text-green-400" size={20} />
        <span className="font-medium text-green-400">Stripe-Konto verbunden und aktiv</span>
      </div>
    </div>
  );
}

