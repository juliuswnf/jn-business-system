import React, { useEffect, useState } from 'react';
import { settingsAPI, formatError } from '../../utils/api';
import { LoadingSpinner } from '../common';
import './AccountStatus.css';

export default function AccountStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await settingsAPI.getAccountStatus();
      setStatus(res.data.accountStatus);
      setError(null);
    } catch (err) {
      setError(formatError(err));
      console.error('Error loading account status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!status) return <div className="alert alert-error">Fehler beim Laden des Kontostatus</div>;

  return (
    <div className="account-status">
      <div className="status-header">
        <h1>🔐 Kontostand</h1>
        {error && <div className="alert alert-error">{error}</div>}
      </div>

      <div className="status-container">
        {/* Account Information */}
        <section className="status-section">
          <h2>👤 Kontoinformationen</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{status.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{status.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Rolle:</span>
              <span className="info-value">{status.role}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className={`badge badge-${status.accountStatus}`}>
                {status.accountStatus}
              </span>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="status-section">
          <h2>🔒 Sicherheit</h2>
          <div className="security-grid">
            <div className="security-item">
              <span className="security-label">Email-Verifizierung:</span>
              <span className={`badge ${status.emailVerified ? 'badge-success' : 'badge-danger'}`}>
                {status.emailVerified ? '✅ Verifiziert' : '❌ Nicht verifiziert'}
              </span>
            </div>
            <div className="security-item">
              <span className="security-label">Zwei-Faktor-Auth:</span>
              <span className={`badge ${status.security.twoFactorEnabled ? 'badge-success' : 'badge-danger'}`}>
                {status.security.twoFactorEnabled ? '✅ Aktiviert' : '❌ Deaktiviert'}
              </span>
            </div>
            <div className="security-item">
              <span className="security-label">Aktive Sitzungen:</span>
              <span className="info-value">{status.security.sessionsActive}</span>
            </div>
            <div className="security-item">
              <span className="security-label">Verbundene Geräte:</span>
              <span className="info-value">{status.security.deviceCount}</span>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="status-section">
          <h2>💳 Abonnement</h2>
          <div className="subscription-grid">
            <div className="subscription-item">
              <span className="subscription-label">Plan:</span>
              <strong>{status.subscription.plan}</strong>
            </div>
            <div className="subscription-item">
              <span className="subscription-label">Status:</span>
              <span className={`badge badge-${status.subscription.status}`}>
                {status.subscription.status}
              </span>
            </div>
            {status.subscription.expiresAt && (
              <div className="subscription-item">
                <span className="subscription-label">Läuft ab:</span>
                <span>{new Date(status.subscription.expiresAt).toLocaleDateString('de-DE')}</span>
              </div>
            )}
            <div className="subscription-item">
              <span className="subscription-label">Auto-Verlängerung:</span>
              <span>{status.subscription.autoRenew ? '✅' : '❌'}</span>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="status-section">
          <h2>⚖️ Compliance</h2>
          <div className="compliance-grid">
            <div className="compliance-item">
              <span>Datensicherung:</span>
              <strong>{status.complianceStatus.dataBackup}</strong>
            </div>
            <div className="compliance-item">
              <span>Datenschutzrichtlinie:</span>
              <strong>{status.complianceStatus.privacyPolicy}</strong>
            </div>
            <div className="compliance-item">
              <span>Nutzungsbedingungen:</span>
              <strong>{status.complianceStatus.termsOfService}</strong>
            </div>
            <div className="compliance-item">
              <span>GDPR-konform:</span>
              <strong>{status.complianceStatus.gdprCompliant ? '✅ Ja' : '❌ Nein'}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
