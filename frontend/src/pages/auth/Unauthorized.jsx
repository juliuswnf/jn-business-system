import React from 'react';
import { Link } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
          <LockClosedIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-500 mb-8">
            Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
          </p>
          
          <div className="space-y-3">
            <Link
              to="/"
              className="block px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-900 transition text-center"
            >
              Zur Startseite
            </Link>
            <Link
              to="/login"
              className="block px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-center"
            >
              Zum Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
