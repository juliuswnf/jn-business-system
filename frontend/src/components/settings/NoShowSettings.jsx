import { useEffect, useState } from 'react';
import { noShowAPI } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const DEFAULT_SETTINGS = {
  reminders: {
    enabled72h: true,
    enabled24h: true,
    enabled2h: true
  },
  autoMarkNoShowAfterMinutes: 30,
  highRiskThreshold: 3,
  depositPercentage: 30
};

export default function NoShowSettings() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await noShowAPI.getSettings();
        if (response.data?.settings) {
          setSettings({
            reminders: {
              enabled72h: response.data.settings.reminders?.enabled72h !== false,
              enabled24h: response.data.settings.reminders?.enabled24h !== false,
              enabled2h: response.data.settings.reminders?.enabled2h !== false
            },
            autoMarkNoShowAfterMinutes: response.data.settings.autoMarkNoShowAfterMinutes || 30,
            highRiskThreshold: response.data.settings.highRiskThreshold || 3,
            depositPercentage: response.data.settings.depositPercentage || 30
          });
        }
      } catch (error) {
        showNotification('No-Show Einstellungen konnten nicht geladen werden.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [showNotification]);

  const setReminder = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        [key]: value
      }
    }));
  };

  const setNumeric = (key, value, fallback) => {
    const parsed = Number(value);
    setSettings((prev) => ({
      ...prev,
      [key]: Number.isFinite(parsed) ? parsed : fallback
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        reminders: {
          enabled72h: Boolean(settings.reminders.enabled72h),
          enabled24h: Boolean(settings.reminders.enabled24h),
          enabled2h: Boolean(settings.reminders.enabled2h)
        },
        autoMarkNoShowAfterMinutes: Math.max(5, Math.min(240, Math.round(settings.autoMarkNoShowAfterMinutes))),
        highRiskThreshold: Math.max(1, Math.min(20, Math.round(settings.highRiskThreshold))),
        depositPercentage: Math.max(0, Math.min(100, Math.round(settings.depositPercentage)))
      };

      const response = await noShowAPI.updateSettings(payload);
      if (response.data?.settings) {
        setSettings(response.data.settings);
      }
      showNotification('No-Show Einstellungen gespeichert.', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Speichern fehlgeschlagen.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-gray-500">
        Lade No-Show Einstellungen...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">No-Show Einstellungen</h2>
        <p className="text-sm text-gray-500 mt-1">
          Definiere Reminder, Auto-Markierung und Anzahlungen fuer Risikokunden.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Reminder Zeitpunkte</p>
        <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
          <span className="text-sm text-gray-700">72h E-Mail Reminder</span>
          <input
            type="checkbox"
            checked={settings.reminders.enabled72h}
            onChange={(e) => setReminder('enabled72h', e.target.checked)}
            className="w-5 h-5"
          />
        </label>
        <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
          <span className="text-sm text-gray-700">24h Reminder (E-Mail + SMS)</span>
          <input
            type="checkbox"
            checked={settings.reminders.enabled24h}
            onChange={(e) => setReminder('enabled24h', e.target.checked)}
            className="w-5 h-5"
          />
        </label>
        <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
          <span className="text-sm text-gray-700">2h Reminder (E-Mail + SMS)</span>
          <input
            type="checkbox"
            checked={settings.reminders.enabled2h}
            onChange={(e) => setReminder('enabled2h', e.target.checked)}
            className="w-5 h-5"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">Auto No-Show nach Minuten</span>
          <input
            type="number"
            min="5"
            max="240"
            value={settings.autoMarkNoShowAfterMinutes}
            onChange={(e) => setNumeric('autoMarkNoShowAfterMinutes', e.target.value, 30)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">Risikoschwelle (Score)</span>
          <input
            type="number"
            min="1"
            max="20"
            value={settings.highRiskThreshold}
            onChange={(e) => setNumeric('highRiskThreshold', e.target.value, 3)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">Anzahlungsanteil in %</span>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.depositPercentage}
            onChange={(e) => setNumeric('depositPercentage', e.target.value, 30)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition disabled:opacity-60"
        >
          {saving ? 'Speichern...' : 'No-Show Einstellungen speichern'}
        </button>
      </div>
    </div>
  );
}
