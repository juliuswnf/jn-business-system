import React, { useEffect, useState } from 'react';
import { employeeAPI, formatError } from '../../utils/api';
import { LoadingSpinner } from '../common';
import './EmployeeNotificationSettings.css';

export default function EmployeeNotificationSettings() {
  const [preferences, setPreferences] = useState({
    newAppointment: true,
    appointmentReminder: true,
    reviewPosted: true,
    messageReceived: true,
    paymentProcessed: true,
    shiftReminder: true,
    courseUpdate: true,
    frequency: 'realtime'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const res = await employeeAPI.getNotificationPreferences();
      setPreferences(res.data.preferences);
      setError(null);
    } catch (err) {
      setError(formatError(err));
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSaved(false);
  };

  const handleFrequencyChange = (e) => {
    setPreferences(prev => ({
      ...prev,
      frequency: e.target.value
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await employeeAPI.updateNotificationPreferences(preferences);
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="notification-settings">
      <div className="settings-header">
        <h1>🔔 Benachrichtigungseinstellungen</h1>
        {error && <div className="alert alert-error">{error}</div>}
        {saved && <div className="alert alert-success">✅ Einstellungen gespeichert!</div>}
      </div>

      <div className="settings-container">
        <div className="settings-group">
          <h2>Benachrichtigungen aktivieren/deaktivieren</h2>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.newAppointment}
                onChange={() => handleToggle('newAppointment')}
              />
              <span>Neue Termine</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.appointmentReminder}
                onChange={() => handleToggle('appointmentReminder')}
              />
              <span>Termin-Erinnerungen</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.reviewPosted}
                onChange={() => handleToggle('reviewPosted')}
              />
              <span>Neue Bewertungen</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.messageReceived}
                onChange={() => handleToggle('messageReceived')}
              />
              <span>Nachrichten erhalten</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.paymentProcessed}
                onChange={() => handleToggle('paymentProcessed')}
              />
              <span>Zahlungsbenachrichtigungen</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.shiftReminder}
                onChange={() => handleToggle('shiftReminder')}
              />
              <span>Schicht-Erinnerungen</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.courseUpdate}
                onChange={() => handleToggle('courseUpdate')}
              />
              <span>Kurs-Updates</span>
            </label>
          </div>
        </div>

        <div className="settings-group">
          <h2>Benachrichtigungshäufigkeit</h2>
          <select
            value={preferences.frequency}
            onChange={handleFrequencyChange}
            className="form-select"
          >
            <option value="realtime">Echtzeit</option>
            <option value="daily">Täglich</option>
            <option value="weekly">Wöchentlich</option>
            <option value="monthly">Monatlich</option>
          </select>
        </div>
      </div>

      <div className="settings-actions">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'wird gespeichert...' : '💾 Speichern'}
        </button>
      </div>
    </div>
  );
}
