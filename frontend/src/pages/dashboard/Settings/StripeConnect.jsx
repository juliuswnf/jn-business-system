import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { FiCheckCircle, FiXCircle, FiExternalLink, FiAlertCircle } from 'react-icons/fi';

/**
 * Stripe Connect Settings Page
 * Allows salon owners to connect their Stripe account for No-Show-Killer payments
 */
export default function StripeConnectSettings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await api.get('/stripe-connect/account-status');
      setStatus(res.data);
    } catch (error) {
      console.error('Error loading Stripe status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await api.post('/stripe-connect/create-account');
      window.location.href = res.data.onboardingUrl;
    } catch (error) {
      alert('Fehler: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRefresh = async () => {
    try {
      const res = await api.post('/stripe-connect/refresh-onboarding');
      window.location.href = res.data.onboardingUrl;
    } catch (error) {
      alert('Fehler: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Stripe-Konto Verbindung</h2>

      {!status?.hasAccount && (
        <>
          <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-blue-400 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-blue-400 mb-2">Warum Stripe verbinden?</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Automatische No-Show-Gebühren-Abrechnung</li>
                  <li>• Direkte Auszahlungen auf Ihr Bankkonto</li>
                  <li>• Sichere Zahlungsabwicklung über Stripe</li>
                  <li>• Keine zusätzlichen Gebühren (nur Stripe-Standardgebühren)</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
          >
            Stripe-Konto jetzt verbinden
          </button>
        </>
      )}

      {status?.hasAccount && !status.chargesEnabled && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm font-medium">
              Unvollständig
            </span>
            <span className="text-gray-400 text-sm">
              Account-ID: {status.accountId?.slice(0, 15)}...
            </span>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 mb-1">Ihre Stripe-Einrichtung ist noch nicht abgeschlossen.</p>
            <p className="text-sm text-gray-300">
              Sie können noch keine Zahlungen empfangen.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition"
          >
            Einrichtung fortsetzen
          </button>
        </>
      )}

      {status?.chargesEnabled && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium flex items-center gap-2">
              <FiCheckCircle size={16} />
              Aktiv
            </span>
            <span className="text-gray-400 text-sm">
              Account-ID: {status.accountId?.slice(0, 15)}...
            </span>
          </div>

          <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-4 mb-6">
            <p className="font-medium text-green-400 mb-1 flex items-center gap-2">
              <FiCheckCircle size={18} />
              Stripe-Konto verbunden und aktiv
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Sie können jetzt No-Show-Gebühren empfangen.
            </p>
          </div>

          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-gray-400">Zahlungen empfangen:</span>
              <span className="font-medium text-white flex items-center gap-2">
                {status.chargesEnabled ? (
                  <>
                    <FiCheckCircle className="text-green-400" size={16} />
                    Aktiviert
                  </>
                ) : (
                  <>
                    <FiXCircle className="text-red-400" size={16} />
                    Deaktiviert
                  </>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-gray-400">Auszahlungen:</span>
              <span className="font-medium text-white flex items-center gap-2">
                {status.payoutsEnabled ? (
                  <>
                    <FiCheckCircle className="text-green-400" size={16} />
                    Aktiviert
                  </>
                ) : (
                  <>
                    <FiXCircle className="text-red-400" size={16} />
                    Deaktiviert
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <h4 className="font-medium text-white mb-2">Stripe-Dashboard</h4>
            <p className="text-sm text-gray-400 mb-3">
              Verwalten Sie Ihre Auszahlungen und Transaktionen direkt bei Stripe.
            </p>
            <button
              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              Stripe-Dashboard öffnen
              <FiExternalLink size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

