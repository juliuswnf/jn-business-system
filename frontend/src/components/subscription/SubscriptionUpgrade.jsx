import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { captureError } from '../../utils/errorTracking';

/**
 * Subscription Upgrade Component
 * 
 * Allows users to upgrade their subscription to a higher tier
 * Shows prorated amount and features comparison
 */

const SubscriptionUpgrade = ({ currentTier, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [proratedAmount, setProratedAmount] = useState(null);

  const tiers = ['starter', 'professional', 'enterprise'];
  const currentIndex = tiers.indexOf(currentTier);
  const availableTiers = tiers.slice(currentIndex + 1);

  const prices = {
    starter: { monthly: 69, yearly: 690 },
    professional: { monthly: 169, yearly: 1690 },
    enterprise: { monthly: 399, yearly: 3990 },
  };

  const features = {
    starter: ['5 Mitarbeiter', '1 Standort', '200 Buchungen/Monat', 'Basis-Features'],
    professional: [
      '30 Mitarbeiter',
      '1 Standort',
      '1.000 Buchungen/Monat',
      'Marketing-Automation',
      'Erweiterte Analytics',
      'Portfolio & Galerien',
    ],
    enterprise: [
      'Unbegrenzte Mitarbeiter',
      '5 Standorte',
      'Unbegrenzte Buchungen',
      'SMS-Benachrichtigungen (500/Monat)',
      'HIPAA Compliance',
      'API-Zugang',
      'White-Label',
      '24/7 Priority Support',
    ],
  };

  // Calculate prorated amount when tier changes
  useEffect(() => {
    if (selectedTier) {
      const currentPrice = prices[currentTier][billingCycle];
      const newPrice = prices[selectedTier][billingCycle];
      const difference = newPrice - currentPrice;
      
      // Rough proration calculation (will be exact from backend)
      const daysInPeriod = billingCycle === 'yearly' ? 365 : 30;
      const daysRemaining = Math.floor(daysInPeriod / 2); // Assuming mid-cycle
      const prorated = (difference / daysInPeriod) * daysRemaining;
      
      setProratedAmount(Math.max(0, prorated));
    }
  }, [selectedTier, billingCycle, currentTier]);

  const handleUpgrade = async () => {
    if (!selectedTier) {
      setError('Bitte wähle einen Plan aus');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ? SECURITY FIX: Use central api instance
      const response = await api.post('/subscriptions/manage/upgrade', {
        newTier: selectedTier,
        billingCycle,
      });

      if (response.data.success) {
        onSuccess(response.data);
      }
    } catch (err) {
      captureError(err, { context: 'subscriptionUpgrade' });
      setError(err.response?.data?.message || 'Upgrade fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  if (availableTiers.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
            <svg
              className="h-10 w-10 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-2xl font-bold text-gray-900">
            Du hast bereits den höchsten Plan!
          </h3>
          <p className="mt-2 text-gray-600">
            Du nutzt bereits Enterprise mit allen verfügbaren Features.
          </p>
          <button
            onClick={onCancel}
            className="mt-6 px-6 py-2 bg-indigo-600 text-zinc-900 rounded-lg hover:bg-indigo-700"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Plan-Upgrade</h2>
        <p className="mt-2 text-gray-600">
          Aktueller Plan: <span className="font-semibold">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span>
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Abrechnungszyklus
        </label>
        <div className="flex items-center space-x-4 bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Jährlich
            <span className="ml-2 text-xs text-green-600 font-semibold">-17%</span>
          </button>
        </div>
      </div>

      {/* Available Tiers */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {availableTiers.map((tier) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              selectedTier === tier
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300'
            }`}
          >
            {/* Tier Name & Price */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </h3>
                {tier === 'enterprise' && (
                  <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    SMS INCLUDED
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">
                  €{prices[tier][billingCycle]}
                </div>
                <div className="text-sm text-zinc-400">
                  {billingCycle === 'yearly' ? '/ Jahr' : '/ Monat'}
                </div>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2">
              {features[tier].map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Selected Indicator */}
            {selectedTier === tier && (
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <div className="flex items-center text-indigo-600 font-semibold">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Ausgewählt
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Prorated Amount */}
      {selectedTier && proratedAmount !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-blue-900">
                Anteilige Abrechnung
              </h4>
              <p className="text-sm text-blue-800 mt-1">
                Du wirst ca. <span className="font-bold">€{proratedAmount.toFixed(2)}</span> für
                den verbleibenden Zeitraum berechnet. Der volle Betrag von €
                {prices[selectedTier][billingCycle]} wird ab der nächsten Periode fällig.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-red-800">Fehler</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleUpgrade}
          disabled={!selectedTier || loading}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold text-zinc-900 transition-all ${
            !selectedTier || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Upgrade läuft...
            </span>
          ) : (
            `Jetzt upgraden auf ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`
          )}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
};

export default SubscriptionUpgrade;
