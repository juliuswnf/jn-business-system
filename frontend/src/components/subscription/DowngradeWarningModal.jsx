import { useState } from 'react';
import axios from 'axios';

/**
 * Downgrade Warning Modal
 * 
 * Shows features that will be lost when downgrading
 * Requires user confirmation before proceeding
 */

const DowngradeWarningModal = ({ currentTier, newTier, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [immediate, setImmediate] = useState(false);

  const featureComparison = {
    enterprise: {
      professional: [
        'SMS-Benachrichtigungen (500/Monat)',
        'Multi-Standort Support (5 Standorte → 1)',
        'Unbegrenzte Mitarbeiter → 10',
        'Unbegrenzte Buchungen → 1.000/Monat',
        'White-Label Optionen',
        'REST API-Zugang',
        'HIPAA Compliance',
        'Dedizierter Account Manager',
        'SEPA & Rechnung als Zahlungsart',
        '24/7 Priority Support',
      ],
      starter: [
        'SMS-Benachrichtigungen (500/Monat)',
        'Multi-Standort Support (5 Standorte → 1)',
        'Unbegrenzte Mitarbeiter → 3',
        'Unbegrenzte Buchungen → 200/Monat',
        'White-Label Optionen',
        'REST API-Zugang',
        'HIPAA Compliance',
        'Marketing-Automation',
        'Erweiterte Analytics',
        'Portfolio & Galerien',
        'Service-Pakete',
        'Fortschrittsverfolgung',
        'Ressourcenmanagement',
        'Dedizierter Account Manager',
        'SEPA & Rechnung als Zahlungsart',
        'Priority Support',
      ],
    },
    professional: {
      starter: [
        'Zusätzliche Mitarbeiter (10 → 3)',
        'Mehr Buchungen (1.000 → 200/Monat)',
        'Mehr Kunden (2.500 → 500)',
        'Marketing-Automation',
        'Erweiterte Analytics',
        'Multi-Service Buchungen',
        'Portfolio & Galerien',
        'Custom Branding',
        'Service-Pakete',
        'Fortschrittsverfolgung',
        'Ressourcenmanagement',
        'Priority Support',
      ],
    },
  };

  const lostFeatures = featureComparison[currentTier]?.[newTier] || [];

  const handleDowngrade = async () => {
    if (!confirmed) {
      setError('Bitte bestätige, dass du die Feature-Einschränkungen verstanden hast');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/subscriptions/manage/downgrade`,
        {
          newTier,
          immediate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        onConfirm(response.data);
      }
    } catch (err) {
      console.error('Downgrade error:', err);
      setError(err.response?.data?.message || 'Downgrade fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-12 w-12 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-2xl font-bold text-gray-900">
                ⚠️ Plan-Downgrade bestätigen
              </h3>
              <p className="mt-2 text-gray-600">
                Du bist dabei, von <span className="font-semibold">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span> auf{' '}
                <span className="font-semibold">{newTier.charAt(0).toUpperCase() + newTier.slice(1)}</span> herabzustufen.
              </p>
            </div>
          </div>
        </div>

        {/* Lost Features */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              📉 Diese Features verlierst du:
            </h4>
            <ul className="space-y-2">
              {lostFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Timing Options */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">
              🗓️ Wann soll das Downgrade wirksam werden?
            </h4>
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  checked={!immediate}
                  onChange={() => setImmediate(false)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    Am Ende der aktuellen Abrechnungsperiode
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Du behältst alle Features bis zum Ende deiner bezahlten Periode.
                    <span className="font-semibold"> (Empfohlen)</span>
                  </div>
                </div>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  checked={immediate}
                  onChange={() => setImmediate(true)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Sofort</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Das Downgrade wird sofort wirksam. Du erhältst keine Rückerstattung für die
                    verbleibende Zeit.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="mb-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 mr-3 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Ich habe verstanden, dass ich die oben aufgeführten Features verlieren werde und
                möchte mit dem Downgrade fortfahren.
              </span>
            </label>
          </div>

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
              onClick={handleDowngrade}
              disabled={!confirmed || loading}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                !confirmed || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
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
                  Downgrade wird durchgeführt...
                </span>
              ) : (
                'Downgrade bestätigen'
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Abbrechen
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡 Du kannst jederzeit wieder upgraden, um diese Features zurückzuerhalten.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DowngradeWarningModal;
