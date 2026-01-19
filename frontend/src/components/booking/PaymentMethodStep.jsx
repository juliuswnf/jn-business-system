import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FiInfo, FiAlertCircle } from 'react-icons/fi';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

/**
 * PaymentMethodStep Component
 * Collects payment method for No-Show-Killer protection
 */
export default function PaymentMethodStep({
  onComplete,
  onBack,
  feeAmount = 15,
  loading = false,
  salonName = ''
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!policyAccepted) {
      setError('Bitte akzeptieren Sie die No-Show-Richtlinie.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create Payment Method
      const cardElement = elements.getElement(CardElement);
      
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      // Pass payment method to parent
      onComplete(paymentMethod.id);
      
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Kreditkarte hinterlegen</h2>
      <p className="text-gray-400 mb-6">
        Fast fertig! Hinterlegen Sie Ihre Kreditkarte für No-Show-Schutz.
      </p>

      <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FiInfo className="text-blue-400 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-blue-400 mb-2">Warum ist das nötig?</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>✓ Ihre Karte wird <strong className="text-white">NICHT belastet</strong></li>
              <li>✓ Nur bei Nichterscheinen: €{feeAmount} Gebühr</li>
              <li>✓ 100% sicher über Stripe verschlüsselt</li>
              <li>✓ Wenn Sie zu Ihrem Termin erscheinen, wird nichts abgebucht</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Card Element */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Kreditkarte
          </label>
          <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Ihre Kartendaten werden sicher von Stripe verarbeitet. Wir haben keinen Zugriff auf Ihre vollständigen Kartendaten.
          </p>
        </div>

        {/* Policy Acceptance */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={policyAccepted}
              onChange={(e) => setPolicyAccepted(e.target.checked)}
              className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-offset-zinc-900 cursor-pointer transition-colors mt-0.5"
              required
            />
            <span className="text-sm text-gray-300 flex-1">
              Ich akzeptiere die{' '}
              <button
                type="button"
                onClick={() => setShowPolicy(!showPolicy)}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                No-Show-Richtlinie
              </button>
              {' '}und stimme zu, dass bei Nichterscheinen eine Gebühr von €{feeAmount} automatisch von meiner Kreditkarte abgebucht wird.
            </span>
          </label>

          {showPolicy && (
            <div className="bg-zinc-800 rounded-lg p-4 text-sm max-h-64 overflow-y-auto border border-zinc-700">
              <h4 className="font-semibold text-white mb-2">NO-SHOW-GEBÜHR RICHTLINIE</h4>
              
              <h5 className="font-medium mt-3 mb-1 text-gray-300">1. DEFINITION</h5>
              <p className="text-gray-400">
                Ein "No-Show" liegt vor, wenn Sie nicht zu Ihrem gebuchten Termin erscheinen 
                und diesen nicht mindestens 24 Stunden vorher storniert haben.
              </p>

              <h5 className="font-medium mt-3 mb-1 text-gray-300">2. GEBÜHR</h5>
              <p className="text-gray-400">
                Bei einem No-Show wird automatisch eine Gebühr von €{feeAmount} von Ihrer 
                hinterlegten Kreditkarte abgebucht.
              </p>

              <h5 className="font-medium mt-3 mb-1 text-gray-300">3. ZAHLUNGSMETHODE</h5>
              <p className="text-gray-400">
                Sie verpflichten sich, eine gültige Kreditkarte bei der Buchung zu hinterlegen. 
                Diese wird nur im Falle eines No-Shows belastet.
              </p>

              <h5 className="font-medium mt-3 mb-1 text-gray-300">4. STORNIERUNG</h5>
              <p className="text-gray-400">
                Sie können Ihren Termin bis 24 Stunden vorher kostenlos stornieren. 
                Bei späterer Stornierung kann eine Gebühr anfallen.
              </p>

              <h5 className="font-medium mt-3 mb-1 text-gray-300">5. DATENSCHUTZ</h5>
              <p className="text-gray-400">
                Ihre Kreditkartendaten werden verschlüsselt über Stripe gespeichert und nach 90 Tagen automatisch gelöscht (DSGVO-konform).
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-red-400 mt-0.5" size={20} />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={processing || loading}
              className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              Zurück
            </button>
          )}
          <button
            type="submit"
            disabled={!stripe || !policyAccepted || processing || loading}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Wird verarbeitet...' : 'Weiter'}
          </button>
        </div>
      </form>
    </div>
  );
}

