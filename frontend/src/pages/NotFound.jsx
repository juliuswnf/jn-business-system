import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-white mb-4">404</div>
        <h1 className="text-3xl font-bold mb-4 text-white">Seite nicht gefunden</h1>
        <p className="text-gray-200 mb-8">
          Die Seite, die Sie suchen, existiert nicht oder wurde verschoben.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-lg bg-white text-black font-medium hover:bg-gray-100 transition"
        >
          ← Zur Startseite
        </button>
      </div>
    </div>
  );
}
