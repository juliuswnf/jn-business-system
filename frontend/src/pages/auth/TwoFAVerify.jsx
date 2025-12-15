import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const TwoFAVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = location.state?.user;

  if (!user) {
    return (
      <div className="min-h-screen bg-primary text-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Session</h2>
            <p className="text-gray-400 mb-6">Please log in again.</p>
            <Link
              to="/login"
              className="inline-block px-8 py-3 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold transition"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();

    if (code.length < 6) {
      showNotification('Code must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verify2FACode(code);
      if (response.data.success) {
        const { token, refreshToken } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        showNotification('2FA verified successfully!', 'success');
        setTimeout(() => {
          navigate(`/${user.role}/dashboard`);
        }, 1000);
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-8">
          <div className="text-5xl text-center mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Two-Factor Authentication</h1>
          <p className="text-gray-400 text-center mb-8">
            Enter the code from your authenticator app
          </p>
          
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                {useBackupCode ? 'Backup Code' : 'Authentication Code'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={useBackupCode ? 'xxxx-xxxx-xxxx' : '000000'}
                maxLength={useBackupCode ? 14 : 6}
                className="w-full px-4 py-3 rounded-lg bg-primary/50 border border-accent/20 hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent text-white placeholder:text-slate-350"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-lg shadow-accent/30"
            >
              {loading ? '⏳ Verifying...' : '✓ Verify'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-350 border-t border-accent/10 pt-8 space-y-3">
            <button
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode('');
              }}
              className="text-accent hover:text-accent-light font-semibold transition w-full"
            >
              {useBackupCode ? 'Use authenticator code' : 'Use backup code'}
            </button>
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

export default TwoFAVerify;
