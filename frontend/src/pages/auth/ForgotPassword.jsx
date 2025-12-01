import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      if (response.data.success) {
        setSubmitted(true);
        showNotification('Password reset link sent to your email!', 'success');
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-primary text-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-secondary/50 border border-accent/20 p-8 backdrop-blur-xl text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-white mb-4">Check your email</h2>
            <p className="text-slate-350 mb-6">
              We've sent a password reset link to <strong>{email}</strong>. The link will expire in 1 hour.
            </p>
            <p className="text-sm text-slate-400 mb-8">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-accent hover:text-accent-light font-semibold transition mb-4"
            >
              Try another email
            </button>
            <div className="border-t border-accent/10 pt-6 mt-6">
              <Link
                to="/login"
                className="text-accent hover:text-accent-light font-semibold transition"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-secondary/50 border border-accent/20 p-8 backdrop-blur-xl">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent mb-2">JN Business</h1>
          <h2 className="text-xl text-slate-350 mb-8">Forgot Password?</h2>
          
          <p className="text-slate-350 mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg bg-primary/50 border border-accent/20 hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent text-white placeholder:text-slate-350"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-lg shadow-accent/30 hover:shadow-accent/50"
            >
              {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-350 border-t border-accent/10 pt-8">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="text-accent hover:text-accent-light font-semibold transition">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
