import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import SubscriptionUpgrade from '../components/subscription/SubscriptionUpgrade';
import DowngradeWarningModal from '../components/subscription/DowngradeWarningModal';

/**
 * Subscription Management Page
 *
 * Complete subscription management interface:
 * - Current plan display
 * - Features included
 * - Payment method info
 * - Next billing date
 * - Upgrade/downgrade buttons
 * - Cancel subscription
 * - Billing history
 */

const SubscriptionManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showDowngrade, setShowDowngrade] = useState(false);
  const [downgradeTarget, setDowngradeTarget] = useState('');

  const tiers = ['starter', 'professional', 'enterprise'];

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/subscriptions/manage/status');

      if (response.data.success) {
        setSubscription(response.data.subscription);
      }
    } catch (err) {
      setError('Fehler beim Laden der Subscription-Informationen');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSuccess = () => {
    setShowUpgrade(false);
    fetchSubscriptionStatus();
    // Show success notification
    alert('? Upgrade erfolgreich! Dein Plan wurde aktualisiert.');
  };

  const handleDowngradeClick = (tier) => {
    setDowngradeTarget(tier);
    setShowDowngrade(true);
  };

  const handleDowngradeSuccess = () => {
    setShowDowngrade(false);
    fetchSubscriptionStatus();
    alert('? Downgrade erfolgreich durchgeführt!');
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        'Möchtest du dein Abonnement wirklich kündigen? Du behältst den Zugriff bis zum Ende der Abrechnungsperiode.'
      )
    ) {
      return;
    }

    try {
      const response = await api.post('/subscriptions/manage/cancel', { immediately: false });

      if (response.data.success) {
        alert('? Abonnement gekündigt. Du behältst Zugriff bis zum Ende der Abrechnungsperiode.');
        fetchSubscriptionStatus();
      }
    } catch (err) {
      alert('? Kündigung fehlgeschlagen: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-zinc-900 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-700">Lade Subscription-Informationen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-sm text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-xl font-bold text-gray-900">{error}</h3>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-indigo-600 text-zinc-900 rounded-lg hover:bg-indigo-700"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (showUpgrade) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <SubscriptionUpgrade
          currentTier={subscription.tier}
          onSuccess={handleUpgradeSuccess}
          onCancel={() => setShowUpgrade(false)}
        />
      </div>
    );
  }

  const currentTierIndex = tiers.indexOf(subscription.tier);
  const availableDowngrades = tiers.slice(0, currentTierIndex);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-gray-900 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Zurück
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-2 text-gray-700">Verwalte deinen JN Business System Plan</p>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-3xl font-bold text-gray-900">
                  {subscription.tierName}
                </h2>
                {subscription.tier === 'enterprise' && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-semibold rounded-full">
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="mt-2 text-gray-700">
                Abrechnungszyklus:{' '}
                <span className="font-semibold">
                  {subscription.billingCycle === 'yearly' ? 'Jährlich' : 'Monatlich'}
                </span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-zinc-900">
                €{subscription.price.current}
              </div>
              <div className="text-sm text-zinc-500">
                {subscription.billingCycle === 'yearly' ? '/ Jahr' : '/ Monat'}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-4 mb-6">
            <div
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                subscription.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : subscription.status === 'trial'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {subscription.status === 'active'
                ? '? Aktiv'
                : subscription.status === 'trial'
                ? '?? Testphase'
                : subscription.status}
            </div>
            {subscription.cancelAtPeriodEnd && (
              <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                ?? Endet am {new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE')}
              </div>
            )}
          </div>

          {/* Billing Info */}
          <div className="grid md:grid-cols-2 gap-6 py-6 border-t border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-2">Nächste Abrechnung</h3>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-2">Zahlungsmethode</h3>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {subscription.paymentMethod === 'card'
                  ? '?? Kreditkarte'
                  : subscription.paymentMethod === 'sepa'
                  ? '?? SEPA Lastschrift'
                  : subscription.paymentMethod === 'invoice'
                  ? '?? Rechnung'
                  : subscription.paymentMethod}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Upgrade */}
          {currentTierIndex < tiers.length - 1 && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-zinc-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Upgrade</h3>
                  <p className="mt-1 text-sm text-gray-700">
                    Erhalte mehr Features und höhere Limits
                  </p>
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-zinc-900 rounded-lg hover:bg-indigo-700 font-semibold"
                  >
                    Jetzt upgraden
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Downgrade */}
          {availableDowngrades.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Downgrade</h3>
                  <p className="mt-1 text-sm text-gray-700">Wechsel zu einem günstigeren Plan</p>
                  <div className="mt-4 space-x-2">
                    {availableDowngrades.map((tier) => (
                      <button
                        key={tier}
                        onClick={() => handleDowngradeClick(tier)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                      >
                        ? {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cancel Subscription */}
        {!subscription.cancelAtPeriodEnd && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Abonnement kündigen</h3>
            <p className="text-gray-700 mb-6">
              Du kannst dein Abonnement jederzeit kündigen. Du behältst den Zugriff bis zum Ende
              der aktuellen Abrechnungsperiode.
            </p>
            <button
              onClick={handleCancelSubscription}
              className="px-6 py-2 bg-red-600 text-zinc-900 rounded-lg hover:bg-red-700 font-semibold"
            >
              Abonnement kündigen
            </button>
          </div>
        )}

        {/* Help */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-4">
              <h4 className="text-lg font-semibold text-blue-900">Brauchst du Hilfe?</h4>
              <p className="mt-1 text-sm text-blue-800">
                Bei Fragen zu deinem Abonnement oder den Zahlungen kontaktiere uns unter{' '}
                <a
                  href="mailto:support@jn-business-system.com"
                  className="font-semibold underline hover:text-blue-900"
                >
                  support@jn-business-system.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Downgrade Modal */}
      {showDowngrade && (
        <DowngradeWarningModal
          currentTier={subscription.tier}
          newTier={downgradeTarget}
          onConfirm={handleDowngradeSuccess}
          onCancel={() => setShowDowngrade(false)}
        />
      )}
    </div>
  );
};

export default SubscriptionManagement;
