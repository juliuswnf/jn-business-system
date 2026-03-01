import React, { useState } from 'react';
import Checkout from './Checkout';

/**
 * PaymentProvider Component - Manages payment flow
 * Version: 1.0.0
 * Note: Stripe integration will be added when network allows
 */
const PaymentProvider = () => {
  const [paymentState, setPaymentState] = useState({
    status: 'idle', // idle, processing, success, error
    amount: 0,
    orderId: null,
    errorMessage: null,
  });

  const handlePaymentStart = (amount, orderId) => {
    setPaymentState({
      status: 'processing',
      amount,
      orderId,
      errorMessage: null,
    });
  };

  const handlePaymentSuccess = () => {
    setPaymentState((prev) => ({
      ...prev,
      status: 'success',
    }));
  };

  const handlePaymentError = (errorMessage) => {
    setPaymentState((prev) => ({
      ...prev,
      status: 'error',
      errorMessage,
    }));
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Payment</h1>

        {paymentState.status === 'idle' && (
          <Checkout
            onPaymentStart={handlePaymentStart}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        )}

        {paymentState.status === 'processing' && (
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg">Processing payment...</p>
            <p className="text-zinc-900 mt-2">Amount: ${paymentState.amount}</p>
          </div>
        )}

        {paymentState.status === 'success' && (
          <div className="bg-green-50 border border-green-600 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">✓ Payment Successful!</h2>
            <p className="text-zinc-900 mb-6">Order ID: {paymentState.orderId}</p>
            <p className="text-lg mb-6">Amount Paid: ${paymentState.amount}</p>
            <a
              href="/customer/booking"
              className="inline-block px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 transition font-semibold"
            >
              Back to Bookings
            </a>
          </div>
        )}

        {paymentState.status === 'error' && (
          <div className="bg-red-50 border border-red-600 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">✗ Payment Failed</h2>
            <p className="text-red-600 mb-6">{paymentState.errorMessage}</p>
            <button
              onClick={() => setPaymentState({ status: 'idle', amount: 0, orderId: null, errorMessage: null })}
              className="inline-block px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 transition font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentProvider;
