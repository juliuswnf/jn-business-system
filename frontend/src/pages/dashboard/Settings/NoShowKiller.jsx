import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useNotification } from '../../../hooks/useNotification';
import { FiAlertCircle, FiInfo, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

/**
 * No-show settings page
 * Allows salon owners to configure missed-appointment fee feature
 */
export default function NoShowKillerSettings() {
  const { showNotification } = useNotification();
  const [settings, setSettings] = useState({
    enabled: false,
    feeAmount: 15,
    requireCardForBooking: true
  });
  const [stripeStatus, setStripeStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    checkStripeStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/salon');
      if (res.data?.salon?.noShowKiller) {
        setSettings({
          enabled: res.data.salon.noShowKiller.enabled || false,
          feeAmount: (res.data.salon.noShowKiller.feeAmount || 1500) / 100,
          requireCardForBooking: res.data.salon.noShowKiller.requireCardForBooking !== false
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const checkStripeStatus = async () => {
    try {
      const res = await api.get('/stripe-connect/account-status');
      setStripeStatus(res.data);
    } catch (error) {
    }
  };

  const handleSave = async () => {
    if (!stripeStatus?.chargesEnabled) {
      showNotification('Bitte verbinden Sie zuerst Ihr Stripe-Konto!', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.put('/salon', {
        noShowKiller: {
          enabled: settings.enabled,
          feeAmount: Math.round(settings.feeAmount * 100),
          requireCardForBooking: settings.requireCardForBooking
        }
      });
      showNotification('Einstellungen gespeichert!', 'success');
    } catch (error) {
      showNotification('Fehler beim Speichern: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const canEnable = stripeStatus?.chargesEnabled;

  if (loading) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6">
        <div className="text-zinc-500">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6">Ausfall-Schutz Einstellungen</h2>

        {/* Stripe Warning */}
        {!canEnable && (
          <div className="bg-yellow-50/20 border border-yellow-600/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-yellow-600 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-medium text-yellow-600 mb-2">⚠️ Stripe-Konto erforderlich</p>
                <p className="text-sm text-zinc-600 mb-3">
                  Um den Ausfall-Schutz zu nutzen, müssen Sie zuerst Ihr Stripe-Konto verbinden.
                </p>
                <Link
                  to="/dashboard/settings/stripe"
                  className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-zinc-900 rounded-lg text-sm font-medium transition"
                >
                  Jetzt verbinden
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Enable Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              disabled={!canEnable}
              className="w-5 h-5 rounded border-zinc-200 bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 focus:ring-offset-zinc-900 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div>
              <span className="font-medium text-zinc-900">Ausfall-Schutz aktivieren</span>
              <p className="text-sm text-zinc-500 mt-1">
                Kunden müssen eine Kreditkarte hinterlegen. Bei Nichterscheinen wird automatisch eine Gebühr berechnet.
              </p>
            </div>
          </label>
        </div>

        {/* Fee Amount */}
        {settings.enabled && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-600 mb-2">
                Gebühr bei Nichterscheinen
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.feeAmount}
                  onChange={(e) => setSettings({ ...settings, feeAmount: parseFloat(e.target.value) || 15 })}
                  min="5"
                  max="50"
                  step="1"
                  className="w-32 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <span className="text-zinc-500">€</span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                Empfohlen: €15. Wird automatisch bei Nichterscheinen berechnet.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <FiInfo className="text-blue-400 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-blue-400 mb-2">So funktioniert's:</p>
                  <ul className="text-sm text-zinc-600 space-y-1">
                    <li>• Kunden hinterlegen Kreditkarte bei Buchung</li>
                    <li>• Karte wird NICHT belastet (nur gespeichert)</li>
                    <li>• Sie markieren den Termin als „Nicht erschienen“ in der Übersicht</li>
                    <li>• Gebühr wird automatisch abgebucht</li>
                    <li>• Geld geht direkt auf Ihr Stripe-Konto</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-zinc-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-zinc-900 mb-3">Gebühren-Übersicht</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Kunde zahlt:</span>
                  <span className="font-medium text-zinc-900">€{settings.feeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Stripe-Gebühr (ca.):</span>
                  <span className="text-red-600">-€{(0.25 + settings.feeAmount * 0.014).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-200">
                  <span className="font-medium text-zinc-900">Sie erhalten:</span>
                  <span className="font-bold text-green-600">
                    €{(settings.feeAmount - (0.25 + settings.feeAmount * 0.014)).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Stripe-Standardgebühren: €0,25 + 1,4% pro Transaktion
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !canEnable}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>
      </div>

      {/* Stats Card (if enabled) */}
      {settings.enabled && canEnable && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-zinc-900 mb-4">Statistiken zu Nichterscheinen</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-zinc-900">0</div>
              <div className="text-sm text-zinc-500 mt-1">Nichterscheinen diesen Monat</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">€0,00</div>
              <div className="text-sm text-zinc-500 mt-1">Gebühren eingenommen</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">0%</div>
              <div className="text-sm text-zinc-500 mt-1">Rate Nichterscheinen</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

