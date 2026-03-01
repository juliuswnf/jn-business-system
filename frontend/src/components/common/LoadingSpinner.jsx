import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ text = 'Lädt...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="spinner"></div>
      <p className="text-zinc-500 mt-4">{text}</p>
    </div>
  );
}
