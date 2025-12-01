import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary dark:bg-black text-white flex items-center justify-center px-4 pt-20">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-accent mb-4">404</div>
        <h1 className="text-3xl font-bold mb-4 text-white">Page Not Found</h1>
        <p className="text-slate-350 dark:text-slate-400 mb-8">
          Soruka die Seite, die Sie suchen, existiert nicht oder wurde verschoben.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-block px-8 py-3 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold transition duration-300 shadow-lg shadow-accent/30"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
