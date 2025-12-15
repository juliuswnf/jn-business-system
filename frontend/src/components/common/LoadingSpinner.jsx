import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ text = 'Lädt...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="spinner"></div>
      <p className="text-gray-400 mt-4">{text}</p>
    </div>
  );
}
