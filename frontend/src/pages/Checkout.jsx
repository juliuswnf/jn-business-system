import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { subscriptionAPI, api } from '../utils/api';

const plans = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    yearlyPrice: 39,
    description: 'Perfekt für Solo-Studios & Einzelunternehmer',
    features: [
      '150 Termine pro Monat',
      '1 Mitarbeiter-Account',
      'Online-Buchungswidget',
      'Automatische E-Mails',
      'Google-Review Integration',
      'Studio-Dashboard',
      'Kundendatenbank',
      'E-Mail Support',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 99,
    yearlyPrice: 79,
    description: 'Für wachsende Teams mit mehreren Mitarbeitern',
    features: [
      'Unbegrenzte Termine',
      'Bis zu 10 Mitarbeiter',
      'Alle Starter-Features',
      'Eigenes Branding & Logo',
      'Bis zu 3 Standorte',
      'WhatsApp-Benachrichtigungen',
      'Priorisierter Support (24h)',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    yearlyPrice: 159,
    description: 'Für Multi-Location Unternehmen & Filialisten',
    features: [
      'Unbegrenzte Termine',
      'Unbegrenzte Mitarbeiter',
      'Alle Professional-Features',
      'Unbegrenzte Standorte',
      'DATEV-Export',
      'Dedicated Account Manager',
      'Custom Integrationen',
    ],
  },
};

export default function Checkout() {
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const isYearly = searchParams.get('billing') === 'yearly';

  const plan = plans[planId];

  // ✅ FIX: Check authentication via API (tokens are in HTTP-only cookies)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/profile');
        setIsLoggedIn(response.data.success);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!plan) {
      navigate('/pricing');
    }
  }, [plan, navigate]);

  if (!plan) {
    return null;
  }

  const handleStripeCheckout = async () => {
    if (!isLoggedIn) {
      // Save plan selection and redirect to register
      sessionStorage.setItem('selectedPlan', JSON.stringify({
        planId: plan.id,
        planName: plan.name,
        price: isYearly ? plan.yearlyPrice : plan.price,
        billing: isYearly ? 'yearly' : 'monthly',
      }));
      navigate('/register', { state: { fromCheckout: true, plan: plan.id } });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const billing = isYearly ? 'yearly' : 'monthly';
      const response = await subscriptionAPI.createCheckout(plan.id, billing);

      if (response.data.success && response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        setError('Checkout konnte nicht erstellt werden. Bitte versuche es erneut.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const price = isYearly ? plan.yearlyPrice : plan.price;
  const vatAmount = (price * 0.19).toFixed(2);
  const totalAmount = (price * 1.19).toFixed(2);

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 text-gray-200 hover:text-white mb-8 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück zur Preisübersicht
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left: Plan Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{plan.name} Plan</h1>
            <p className="text-gray-200 mb-8">{plan.description}</p>

            {/* Features */}
            <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-800 mb-6">
              <h3 className="font-semibold mb-4">Was ist enthalten:</h3>
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trial Info */}
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-white">30 Tage kostenlos testen</h4>
                  <p className="text-sm text-gray-200 mt-1">
                    Du wirst erst nach Ablauf der Testphase belastet. Jederzeit kündbar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Checkout Summary */}
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h2 className="text-xl font-bold mb-6">Zusammenfassung</h2>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-200">
                <span>{plan.name} Plan ({isYearly ? 'jährlich' : 'monatlich'})</span>
                <span>€{price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-200">
                <span>MwSt. (19%)</span>
                <span>€{vatAmount}</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between font-semibold text-lg">
                <span>Gesamt nach Testphase</span>
                <span>€{totalAmount}/Monat</span>
              </div>
            </div>

            {/* Today's Charge */}
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-green-300">Heute zu zahlen:</span>
                <span className="text-2xl font-bold text-green-400">€0,00</span>
              </div>
              <p className="text-sm text-green-400/70 mt-1">
                Erste Abbuchung nach 30 Tagen Testphase
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleStripeCheckout}
              disabled={loading}
              className={`w-full py-3 rounded text-center font-medium transition mb-4 ${
                loading
                  ? 'bg-zinc-700 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird geladen...
                </span>
              ) : isLoggedIn ? (
                '30 Tage kostenlos starten'
              ) : (
                'Konto erstellen & starten'
              )}
            </button>

            {!isLoggedIn && (
              <p className="text-center text-gray-200 text-sm mb-4">
                Du hast bereits ein Konto?{' '}
                                <Link to="/login" className="text-gray-200 hover:text-white hover:underline">
                  Anmelden
                </Link>
              </p>
            )}

            {/* Guarantee & Security */}
            <div className="space-y-3 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>30 Tage Geld-zurück-Garantie</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Sichere Zahlung über Stripe</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Jederzeit kündbar, keine Mindestlaufzeit</span>
              </div>
            </div>

            {/* Legal Links */}
            <div className="mt-6 pt-4 border-t border-gray-800 text-center text-xs text-gray-600">
              Mit dem Klick auf "Starten" akzeptierst du unsere{' '}
              <Link to="/agb" className="text-zinc-400 hover:text-white hover:underline">AGB</Link>
              {' '}und{' '}
              <Link to="/datenschutz" className="text-zinc-400 hover:text-white hover:underline">Datenschutzerklärung</Link>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
