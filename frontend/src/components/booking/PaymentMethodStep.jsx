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
 * Collects payment method for missed-appointment fee protection
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
      setError('Bitte akzeptieren Sie die Richtlinie bei Nichterscheinen.');
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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Kreditkarte hinterlegen</h2>
      <p className="text-gray-500 mb-6">
        Fast fertig! Hinterlegen Sie Ihre Kreditkarte für den Ausfall-Schutz.
      </p>

      <div className="bg-gray-50 border border-gray-200/50 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <FiInfo className="text-gray-500 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-gray-500 mb-2">Warum ist das nötig?</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Ihre Karte wird <strong className="text-gray-900">NICHT belastet</strong></li>
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
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Kreditkarte
          </label>
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
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
              className="w-5 h-5 rounded border-gray-200 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 focus:ring-offset-zinc-900 cursor-pointer transition-colors mt-0.5"
              required
            />
            <span className="text-sm text-gray-600 flex-1">
              Ich akzeptiere die{' '}
              <button
                type="button"
                onClick={() => setShowPolicy(!showPolicy)}
                className="text-gray-500 hover:text-gray-400 underline"
              >
                Richtlinie bei Nichterscheinen
              </button>
              {' '}und stimme zu, dass bei Nichterscheinen eine Gebühr von €{feeAmount} automatisch von meiner Kreditkarte abgebucht wird.
            </span>
          </label>

          {showPolicy && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm max-h-64 overflow-y-auto border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">RICHTLINIE BEI NICHTERSCHEINEN</h4>
              
              <h5 className="font-medium mt-3 mb-1 text-gray-600">1. DEFINITION</h5>
              <p className="text-gray-500">
                Ein "Nichterscheinen" liegt vor, wenn Sie nicht zu Ihrem gebuchten Termin erscheinen 
                und diesen nicht mindestens 24 Stunden vorher storniert haben.
              </p>

              <h5 className="font-medium mt-3 mb-1 text-gray-600">2. GEBÜHR</h5>
              <p className="text-gray-500">
                Bei Nichterscheinen wird automatisch eine Gebühr von €{feeAmount} von Ihrer 
                hinterlegten Kreditkarte abgebucht.
              </p>

              <h5 className="font-medium mt-3 mb-1 text-gray-600">3. ZAHLUNGSMETHODE</h5>
              <p className="text-gray-500">
                Sie verpflichten sich, eine gültige Kreditkarte bei der Buchung zu hinterlegen. 
                Diese wird nur im Falle eines Nichterscheinens belastet.
              </p>

              <h5 className="font-medium mt-3 mb-1 text-gray-600">4. STORNIERUNG</h5>
              <p className="text-gray-500">
                Sie können Ihren Termin bis 24 Stunden vorher kostenlos stornieren. 
                Bei späterer Stornierung kann eine Gebühr anfallen.
              </p>

              <h5 className="font-medium mt-3 mb-1 text-gray-600">5. DATENSCHUTZ</h5>
              <p className="text-gray-500">
                Ihre Kreditkartendaten werden verschlüsselt über Stripe gespeichert und nach 90 Tagen automatisch gelöscht (DSGVO-konform).
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/50 rounded-xl p-4">
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
              className="flex-1 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl font-medium transition disabled:opacity-50"
            >
              Zurück
            </button>
          )}
          <button
            type="submit"
            disabled={!stripe || !policyAccepted || processing || loading}
            className="flex-1 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Wird verarbeitet...' : 'Weiter'}
          </button>
        </div>
      </form>
    </div>
  );
}

