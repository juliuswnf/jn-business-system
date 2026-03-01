import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../../utils/api';
import { captureError } from '../../utils/errorTracking';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

/**
 * Subscription Checkout Component
 * 
 * Handles:
 * - Plan selection (Starter/Professional/Enterprise)
 * - Billing cycle (monthly/yearly)
 * - Payment method collection
 * - Subscription creation via API
 */

const CheckoutForm = ({ tier, billingCycle, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          email,
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // ? SECURITY FIX: Use central api instance
      // Create subscription
      const response = await api.post('/subscriptions/manage/create', {
        tier,
        billingCycle,
        paymentMethodId: paymentMethod.id,
        email,
      });

      if (response.data.success) {
        const { subscription } = response.data;

        // Handle 3D Secure authentication if required
        if (subscription.clientSecret) {
          const { error: confirmError } = await stripe.confirmCardPayment(
            subscription.clientSecret
          );

          if (confirmError) {
            throw new Error(confirmError.message);
          }
        }

        onSuccess(subscription);
      }
    } catch (error) {
      captureError(error, { context: 'subscriptionCheckout' });
      onError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          placeholder="deine@email.de"
        />
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kreditkarte
        </label>
        <div className="p-4 border border-gray-300 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          🔒 Sichere Zahlung über Stripe. Deine Kartendaten werden verschlüsselt übertragen.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-zinc-900 transition-all ${
          loading
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
            Abonnement wird erstellt...
          </span>
        ) : (
          'Jetzt abonnieren'
        )}
      </button>

      {/* Security Notice */}
      <div className="flex items-start space-x-2 text-xs text-zinc-400">
        <svg
          className="w-5 h-5 text-green-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span>
          Jederzeit kündbar. Keine versteckten Kosten. Automatische Verlängerung monatlich oder jährlich.
        </span>
      </div>
    </form>
  );
};

const SubscriptionCheckout = ({ tier, billingCycle, onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const prices = {
    starter: { monthly: 69, yearly: 690 },
    professional: { monthly: 169, yearly: 1690 },
    enterprise: { monthly: 399, yearly: 3990 },
  };

  const handleSuccess = (subscription) => {
    setSuccess(true);
    setError('');
    setTimeout(() => {
      onSuccess(subscription);
    }, 2000);
  };

  const handleError = (message) => {
    setError(message);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
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
            🎉 Abonnement erfolgreich erstellt!
          </h3>
          <p className="mt-2 text-gray-600">
            Dein {tier.charAt(0).toUpperCase() + tier.slice(1)}-Plan wurde aktiviert.
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Du wirst in Kürze weitergeleitet...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Zahlungsinformationen</h2>
        <p className="mt-2 text-gray-600">
          Schließe dein {tier.charAt(0).toUpperCase() + tier.slice(1)}-Abonnement ab
        </p>
      </div>

      {/* Plan Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Zusammenfassung</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan:</span>
            <span className="font-semibold">
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Abrechnungszyklus:</span>
            <span className="font-semibold">
              {billingCycle === 'yearly' ? 'Jährlich' : 'Monatlich'}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between text-lg font-bold">
              <span>Gesamt:</span>
              <span className="text-indigo-600">
                €{prices[tier][billingCycle]}{' '}
                {billingCycle === 'yearly' ? '/ Jahr' : '/ Monat'}
              </span>
            </div>
            {billingCycle === 'yearly' && (
              <p className="text-sm text-green-600 text-right mt-1">
                ✓ Du sparst 17% (2 Monate gratis)
              </p>
            )}
          </div>
        </div>
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

      {/* Checkout Form */}
      <Elements stripe={stripePromise}>
        <CheckoutForm
          tier={tier}
          billingCycle={billingCycle}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </Elements>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="w-full mt-4 py-2 px-4 text-gray-600 hover:text-gray-800 font-medium transition-colors"
      >
        Abbrechen
      </button>
    </div>
  );
};

export default SubscriptionCheckout;
