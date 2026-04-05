import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServerError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-red-500 mb-4">500</div>
        <h1 className="text-2xl font-semibold tracking-tight mb-4 text-gray-900">Server-Fehler</h1>
        <p className="text-gray-700 mb-8">
          Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie später erneut.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-100 transition"
        >
          ← Zur Startseite
        </button>
      </div>
    </div>
  );
}
