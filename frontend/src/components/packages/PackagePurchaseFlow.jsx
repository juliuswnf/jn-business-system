import { useState, useEffect } from 'react';
import { Check, Clock, DollarSign, Calendar, TrendingUp, Package as PackageIcon, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../../utils/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function PackagePurchaseFlow({ salonId }) {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, [salonId]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/packages/salon/${salonId}`);
      setPackages(response.data.packages || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setShowCheckout(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {!showCheckout ? (
        <PackageList 
          packages={packages} 
          onSelect={handleSelectPackage}
        />
      ) : (
        <Elements stripe={stripePromise}>
          <CheckoutForm 
            package={selectedPackage}
            onBack={() => setShowCheckout(false)}
            onSuccess={() => {
              setShowCheckout(false);
              // Redirect to dashboard or show success message
            }}
          />
        </Elements>
      )}
    </div>
  );
}

// Package List Component
function PackageList({ packages, onSelect }) {
  const calculateSavings = (pkg) => {
    const regularPrice = pkg.price / pkg.totalSessions;
    const savings = ((regularPrice * pkg.totalSessions) - pkg.price).toFixed(2);
    return savings > 0 ? savings : 0;
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Training Package
        </h1>
        <p className="text-xl text-gray-600">
          Save money and stay committed with our session packages
        </p>
      </div>

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div
            key={pkg._id}
            className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-200 hover:border-blue-500"
          >
            {/* Most Popular Badge */}
            {pkg.soldCount > 50 && (
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              </div>
            )}

            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <PackageIcon className="w-8 h-8 text-white" />
              </div>

              {/* Name */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {pkg.name}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 min-h-[3rem]">
                {pkg.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">
                    {pkg.currency === 'EUR' ? '€' : '$'}{pkg.price}
                  </span>
                  <span className="ml-2 text-gray-500">
                    / {pkg.totalSessions} sessions
                  </span>
                </div>
                <div className="mt-2 text-sm text-green-600 font-semibold">
                  {pkg.currency === 'EUR' ? '€' : '$'}{(pkg.price / pkg.totalSessions).toFixed(2)} per session
                </div>
                {calculateSavings(pkg) > 0 && (
                  <div className="mt-1 text-sm text-blue-600">
                    Save {pkg.currency === 'EUR' ? '€' : '$'}{calculateSavings(pkg)}!
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>{pkg.totalSessions} Training Sessions</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span>{pkg.sessionDuration} minutes per session</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Valid for {pkg.validityPeriod} days</span>
                </div>
                {pkg.trainerSpecific && pkg.trainerId && (
                  <div className="flex items-center text-gray-700">
                    <TrendingUp className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                    <span>Personal Trainer Dedicated</span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => onSelect(pkg)}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Purchase Package
              </button>

              {/* Stats */}
              {pkg.soldCount > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  {pkg.soldCount} {pkg.soldCount === 1 ? 'person has' : 'people have'} purchased
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No Packages */}
      {packages.length === 0 && (
        <div className="text-center py-16">
          <PackageIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No packages available</h3>
          <p className="text-gray-500">Check back later for training packages</p>
        </div>
      )}
    </div>
  );
}

// Checkout Form Component
function CheckoutForm({ package: pkg, onBack, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const { data } = await api.post('/api/payments/create-intent', {
        amount: pkg.price * 100, // Convert to cents
        currency: pkg.currency.toLowerCase(),
        metadata: {
          packageId: pkg._id,
          packageName: pkg.name,
          type: 'package_purchase'
        }
      });

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // Purchase package
      await api.post(`/api/packages/${pkg._id}/purchase`, {
        paymentId: paymentIntent.id
      });

      setPaymentSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
        <p className="text-xl text-gray-600 mb-8">
          Your {pkg.name} package has been activated
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-gray-700">
            You now have <span className="font-bold text-blue-600">{pkg.totalSessions} sessions</span> available
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Valid until {new Date(Date.now() + pkg.validityPeriod * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 text-gray-600 hover:text-gray-900 flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to packages
      </button>

      {/* Package Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-700">Package:</span>
            <span className="font-semibold text-gray-900">{pkg.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Sessions:</span>
            <span className="font-semibold text-gray-900">{pkg.totalSessions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Session Duration:</span>
            <span className="font-semibold text-gray-900">{pkg.sessionDuration} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Validity:</span>
            <span className="font-semibold text-gray-900">{pkg.validityPeriod} days</span>
          </div>
          <div className="pt-3 border-t border-blue-300 flex justify-between">
            <span className="text-lg font-bold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-blue-600">
              {pkg.currency === 'EUR' ? '€' : '$'}{pkg.price}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <CreditCard className="w-6 h-6 mr-2 text-blue-500" />
          Payment Details
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Card Element */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#374151',
                      '::placeholder': {
                        color: '#9CA3AF',
                      },
                    },
                    invalid: {
                      color: '#EF4444',
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || loading}
            className={`
              w-full py-4 rounded-xl font-semibold text-white text-lg
              transition-all duration-300
              ${loading || !stripe
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              `Pay ${pkg.currency === 'EUR' ? '€' : '$'}${pkg.price}`
            )}
          </button>

          {/* Security Notice */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure payment powered by Stripe
          </div>
        </form>
      </div>
    </div>
  );
}
