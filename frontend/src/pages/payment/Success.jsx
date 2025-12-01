import React from 'react';
import { useNavigate } from 'react-router-dom';

const Success = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">✓</div>
        <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-300 mb-8">
          Your payment has been processed successfully. You will receive a confirmation email shortly.
        </p>
        <button
          onClick={() => navigate('/customer/booking')}
          className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white hover:shadow-lg transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Success;
