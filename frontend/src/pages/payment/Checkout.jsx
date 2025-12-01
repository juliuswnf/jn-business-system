import React, { useState } from 'react';
import { API_URL } from '../../utils/api';

/**
 * Checkout Component - Mock payment form
 * Version: 1.0.0
 * Note: Will integrate with Stripe API when available
 */
const Checkout = ({ onPaymentStart, onPaymentSuccess, onPaymentError }) => {
  const [formData, setFormData] = useState({
    amount: 29.99,
    cardName: '',
    cardEmail: '',
    serviceType: 'subscription',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Start payment
      onPaymentStart(formData.amount, `ORD-${Date.now()}`);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Send to backend
      const response = await fetch(`${API_URL}/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: formData.amount,
          cardName: formData.cardName,
          cardEmail: formData.cardEmail,
          serviceType: formData.serviceType,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      onPaymentSuccess();
    } catch (error) {
      onPaymentError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-600 rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <div className="text-3xl font-bold text-purple-400">
            ${formData.amount}
          </div>
          <p className="text-gray-400 text-sm mt-1">per month</p>
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Service Type</label>
          <select
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-purple-600 focus:outline-none"
          >
            <option value="subscription">Monthly Subscription</option>
            <option value="single">Single Payment</option>
            <option value="annual">Annual Plan</option>
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            name="cardName"
            value={formData.cardName}
            onChange={handleChange}
            required
            placeholder="John Doe"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            name="cardEmail"
            value={formData.cardEmail}
            onChange={handleChange}
            required
            placeholder="john@example.com"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Security Note */}
        <div className="bg-purple-900 bg-opacity-30 border border-purple-600 rounded-lg p-4">
          <p className="text-sm text-purple-300">
            🔒 Your payment information is secure and encrypted
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : `Pay $${formData.amount}`}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By clicking pay, you agree to our terms and conditions
        </p>
      </form>
    </div>
  );
};

export default Checkout;