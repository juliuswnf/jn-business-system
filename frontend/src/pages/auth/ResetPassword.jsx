import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        showNotification('Invalid reset link', 'error');
        navigate('/forgot-password');
        return;
      }

      try {
        const response = await authAPI.verifyPasswordResetToken(token);
        if (response.data.success) {
          setTokenValid(true);
        }
      } catch (error) {
        showNotification('Reset link expired. Please request a new one.', 'error');
        navigate('/forgot-password');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, navigate, showNotification]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      showNotification('Password must be at least 8 characters', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword({
        token,
        password,
      });

      if (response.data.success) {
        showNotification('Password reset successful! Redirecting to login...', 'success');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-primary text-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-secondary/50 border border-accent/20 p-8 backdrop-blur-xl text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-350">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-primary text-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-secondary/50 border border-accent/20 p-8 backdrop-blur-xl text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Link</h2>
            <p className="text-slate-350 mb-8">
              This password reset link is invalid or has expired.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block px-8 py-3 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold transition duration-300 shadow-lg shadow-accent/30"
            >
              Request New Link
            </Link>
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
          <h2 className="text-xl text-slate-350 mb-8">Create New Password</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-3 rounded-lg bg-primary/50 border border-accent/20 hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent text-white placeholder:text-slate-350"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-350 hover:text-accent transition"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 rounded-lg bg-primary/50 border border-accent/20 hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent text-white placeholder:text-slate-350"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-lg shadow-accent/30 hover:shadow-accent/50"
            >
              {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
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

export default ResetPassword;
