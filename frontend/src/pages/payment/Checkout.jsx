import React, { useState } from 'react';
import { paymentAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

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

  const { success, error } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      onPaymentStart(formData.amount, `ORD-${Date.now()}`);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Use centralized paymentAPI
      await paymentAPI.process({
        amount: formData.amount,
        cardName: formData.cardName,
        cardEmail: formData.cardEmail,
        serviceType: formData.serviceType,
      });

      onPaymentSuccess();
      success('Payment processed successfully');
    } catch (error) {
      const msg = formatError(error);
      onPaymentError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <div className="text-3xl font-bold text-white">
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
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-zinc-500 focus:outline-none"
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
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:border-zinc-500 focus:outline-none"
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
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:border-zinc-500 focus:outline-none"
          />
        </div>

        {/* Security Note */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
          <p className="text-sm text-gray-300">
            Ihre Zahlungsdaten sind sicher und verschlüsselt
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 rounded-full bg-white text-black font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
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