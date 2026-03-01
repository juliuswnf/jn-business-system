import React from 'react';
import { useNavigate } from 'react-router-dom';

const Cancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">✕</div>
        <h1 className="text-4xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-zinc-900 mb-8">
          Your payment was cancelled. You can try again at any time.
        </p>
        <button
          onClick={() => navigate('/pricing')}
          className="inline-block px-8 py-3 rounded-full bg-white text-black font-semibold hover:opacity-90 transition"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  );
};

export default Cancel;
