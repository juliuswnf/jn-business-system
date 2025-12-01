import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-secondary/50 border border-accent/20 p-8 backdrop-blur-xl text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-350 mb-8">
            You don't have permission to access this resource.
          </p>
          
          <div className="space-y-3">
            <Link
              to="/"
              className="block px-8 py-3 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold transition duration-300 shadow-lg shadow-accent/30"
            >
              ← Back to Home
            </Link>
            <Link
              to="/login"
              className="block px-8 py-3 rounded-lg border-2 border-accent text-accent hover:bg-accent/10 font-semibold transition duration-300"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
