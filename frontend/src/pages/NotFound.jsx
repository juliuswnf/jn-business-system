import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-gray-900 mb-4">404</div>
        <h1 className="text-2xl font-semibold tracking-tight mb-4 text-gray-900">Seite nicht gefunden</h1>
        <p className="text-gray-700 mb-8">
          Die Seite, die Sie suchen, existiert nicht oder wurde verschoben.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-900 transition"
        >
          ← Zur Startseite
        </button>
      </div>
    </div>
  );
}
