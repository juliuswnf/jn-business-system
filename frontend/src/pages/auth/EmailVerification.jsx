import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [email, setEmail] = useState(location.state?.email || '');
  const [resendLoading, setResendLoading] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmailToken();
    }
  }, [token]);

  const verifyEmailToken = async () => {
    setVerifying(true);
    try {
      const response = await authAPI.verifyEmail(token);
      if (response.data.success) {
        showNotification('Email verified successfully!', 'success');
        setTimeout(() => {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          navigate(`/${user.role || 'customer'}/dashboard`);
        }, 1500);
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitCode = async (e) => {
    e.preventDefault();
    
    if (code.length < 6) {
      showNotification('Verification code must be 6 digits', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyEmail(code);
      if (response.data.success) {
        showNotification('Email verified successfully!', 'success');
        setTimeout(() => {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          navigate(`/${user.role || 'customer'}/dashboard`);
        }, 1500);
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      showNotification('Email address is required', 'error');
      return;
    }

    setResendLoading(true);

    try {
      const response = await authAPI.resendVerificationEmail(email);
      if (response.data.success) {
        showNotification('Verification email sent! Check your inbox.', 'success');
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setResendLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-8 text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400">Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-8">
          <div className="text-5xl text-center mb-4"></div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2 text-center">
            E-Mail verifizieren
          </h1>
          <p className="text-zinc-400 text-center mb-8">
            {email ? `Wir haben einen Verifizierungslink an ${email} gesendet` : 'Geben Sie den Verifizierungscode ein, der an Ihre E-Mail gesendet wurde'}
          </p>
          
          {token ? (
            <div className="text-center py-8">
              <p className="text-zinc-400">Your email has been verified! Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitCode} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900 placeholder:text-zinc-400 text-center text-2xl tracking-widest"
                  required
                />
                <p className="text-xs text-slate-400 mt-2">Check your email for the code</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-sm shadow-zinc-200 hover:shadow-accent/50"
              >
                {loading ? '⏳ Verifying...' : '✓ Verify Email'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-zinc-400 border-t border-zinc-200 pt-8 space-y-3">
            <div>
              <p>
                Didn't receive the code?{' '}
                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  className="text-accent hover:text-accent-light font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {resendLoading ? 'Sending...' : 'Resend'}
                </button>
              </p>
            </div>
            <div>
              <Link to="/login" className="text-accent hover:text-accent-light font-semibold transition">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
