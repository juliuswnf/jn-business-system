import React from 'react';

export default function ButtonLoading({ isLoading, children, ...props }) {
  return (
    <button
      disabled={isLoading}
      className="disabled:opacity-50 disabled:cursor-not-allowed transition"
      {...props}
    >
      {isLoading ? '⏳ Lädt...' : children}
    </button>
  );
}
