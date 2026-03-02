import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { captureError } from '../utils/errorTracking';

export default function UpgradeModal({ isOpen, onClose, feature, currentTier }) {
  const [pricingTiers, setPricingTiers] = useState([]);
  const [requiredTier, setRequiredTier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPricingData();
    }
  }, [isOpen, feature]);

  const fetchPricingData = async () => {
    try {
      setLoading(true);

      // Fetch pricing tiers
      const tiersResponse = await api.get('/pricing/tiers');
      if (tiersResponse.data.success) {
        setPricingTiers(tiersResponse.data.tiers);
      }

      // Check which tier is required for this feature
      if (feature) {
        const checkResponse = await api.post('/pricing/check-feature', { feature });
        if (checkResponse.data.success && !checkResponse.data.hasAccess) {
          setRequiredTier(checkResponse.data.requiredTier);
        }
      }
    } catch (err) {
      captureError(err, { context: 'fetchPricingData' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Feature names mapping
  const featureNames = {
    smsNotifications: 'SMS-Benachrichtigungen',
    multiLocation: 'Mehrere Standorte',
    apiAccess: 'API-Zugang',
    webhooks: 'Webhook-Integrationen',
    whiteLabel: 'White-Label',
    hipaaCompliance: 'HIPAA Compliance',
    auditLogs: 'Audit-Logs',
    portfolio: 'Portfolio & Galerien',
    marketingAutomation: 'Automatisches Marketing',
    advancedAnalytics: 'Erweiterte Auswertungen',
    packages: 'Service-Pakete',
    progressTracking: 'Fortschrittsverfolgung',
  };

  const featureName = featureNames[feature] || feature;

  // Feature benefits
  const featureBenefits = {
    smsNotifications: [
      'Weniger verpasste Termine',
      '500 SMS pro Monat inklusive',
      'Automatische 2h & 24h Erinnerungen',
      'Prioritäts-basiertes SMS-System',
      'Skalierbar mit Team-Größe',
    ],
    multiLocation: [
      'Verwalte bis zu 5 Standorte',
      'Zentrale Übersicht aller Buchungen',
      'Standort-spezifische Mitarbeiter',
      'Separate Kalender pro Standort',
      'Konsolidierte Reports',
    ],
    apiAccess: [
      'REST API-Zugang',
      'Integration mit eigenen Systemen',
      'Automatisierung von Abläufen',
      'Daten-Export & -Import',
      'Entwickler-Dokumentation',
    ],
    portfolio: [
      'Zeige deine besten Arbeiten',
      'Unbegrenzte Galerien',
      'Hochauflösende Bilder',
      'Kategorisierung nach Services',
      'Einbettbar auf Website',
    ],
    marketingAutomation: [
      'Automatische Kampagnen',
      'Geburtstags-E-Mails',
      'Re-Engagement Kampagnen',
      'Personalisierte Nachrichten',
      'A/B Testing',
    ],
  };

  const benefits = featureBenefits[feature] || [
    'Erweiterte Funktionalität',
    'Bessere Performance',
    'Mehr Kontrolle',
    'Schneller Support',
  ];

  // Tier order for comparison
  const tierOrder = ['starter', 'professional', 'enterprise'];
  const currentTierIndex = tierOrder.indexOf(currentTier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-50 border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Upgrade erforderlich</h2>
            <p className="text-zinc-500 text-sm mt-1">
              {featureName} ist in deinem aktuellen Plan nicht verfügbar
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-50 transition"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              {/* Feature Benefits */}
              <div className="mb-8 p-6 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Mit {featureName} kannst du:
                </h3>
                <ul className="space-y-2">
                  {benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-zinc-600">
                      <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing Comparison */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Wähle dein Upgrade:</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {pricingTiers.map((tier, idx) => {
                    const tierIndex = tierOrder.indexOf(tier.slug);
                    const isCurrentTier = tier.slug === currentTier;
                    const isUpgrade = tierIndex > currentTierIndex;
                    const hasFeature = requiredTier ? tierOrder.indexOf(tier.slug) >= tierOrder.indexOf(requiredTier) : false;

                    return (
                      <div
                        key={tier.slug}
                        className={`border rounded-lg p-4 ${
                          hasFeature && isUpgrade
                            ? 'border-purple-500 bg-purple-900/20'
                            : isCurrentTier
                            ? 'border-zinc-200 bg-zinc-50/50 opacity-60'
                            : 'border-zinc-200 bg-zinc-50/50'
                        }`}
                      >
                        {tier.popular && (
                          <span className="inline-block text-xs font-bold bg-white text-black px-2 py-1 rounded mb-2">
                            BELIEBT
                          </span>
                        )}
                        {hasFeature && isUpgrade && (
                          <span className="inline-block text-xs font-bold bg-purple-500 text-zinc-900 px-2 py-1 rounded mb-2">
                            EMPFOHLEN
                          </span>
                        )}
                        {isCurrentTier && (
                          <span className="inline-block text-xs font-bold bg-zinc-100 text-zinc-500 px-2 py-1 rounded mb-2">
                            AKTUELL
                          </span>
                        )}

                        <h4 className="text-lg font-semibold text-zinc-900 mb-1">{tier.name}</h4>

                        <div className="mb-4">
                          <span className="text-2xl font-bold text-zinc-900">€{tier.priceMonthly}</span>
                          <span className="text-zinc-500 text-sm"> / Monat</span>
                          <p className="text-xs text-zinc-400 mt-1">
                            oder €{tier.priceYearly} jährlich ({tier.yearlyDiscount}% sparen)
                          </p>
                        </div>

                        {hasFeature && (
                          <div className="mb-4 p-2 bg-green-500/10 border border-green-500/30 rounded flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs text-green-400 font-medium">
                              {featureName} inklusive
                            </span>
                          </div>
                        )}

                        {!isCurrentTier && isUpgrade && (
                          <Link
                            to={`/settings/billing?upgrade=${tier.slug}`}
                            onClick={onClose}
                            className={`block w-full py-2 rounded text-center text-sm font-medium transition ${
                              hasFeature
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-zinc-50 hover:bg-zinc-100 text-white'
                            }`}
                          >
                            Zu {tier.name} upgraden
                          </Link>
                        )}

                        {isCurrentTier && (
                          <button
                            disabled
                            className="w-full py-2 bg-zinc-50 text-zinc-400 rounded text-sm font-medium cursor-not-allowed"
                          >
                            Dein aktueller Plan
                          </button>
                        )}

                        {!isCurrentTier && !isUpgrade && (
                          <button
                            disabled
                            className="w-full py-2 bg-zinc-50 text-zinc-400 rounded text-sm font-medium cursor-not-allowed"
                          >
                            Nicht verfügbar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Info */}
              <div className="p-4 bg-zinc-50/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-600 mb-2">
                      <strong className="text-zinc-900">Upgrade jederzeit möglich:</strong> Deine Abrechnung wird automatisch angepasst.
                      Du zahlst nur die Differenz für die verbleibende Zeit im aktuellen Abrechnungszeitraum.
                    </p>
                    <p className="text-xs text-zinc-500">
                      Keine versteckten Kosten. Keine Mindestvertragslaufzeit. Kündigung jederzeit möglich.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-50 border-t border-zinc-200 px-6 py-4 flex items-center justify-between">
          <Link
            to="/pricing"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition"
          >
            Alle Preise & Features ansehen →
          </Link>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
