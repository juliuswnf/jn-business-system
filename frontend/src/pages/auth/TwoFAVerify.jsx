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
      <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Ungültige Sitzung</h2>
            <p className="text-zinc-500 mb-6">Bitte melden Sie sich erneut an.</p>
            <Link
              to="/login"
              className="inline-block px-8 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold transition"
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
      showNotification('Der Code muss mindestens 6 Zeichen lang sein', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verify2FACode(code);
      if (response.data.success) {
        // ? SECURITY FIX: Tokens are now in HTTP-only cookies
        // Tokens are automatically sent by browser with withCredentials: true
        // No need to store in localStorage
        
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
    <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-8">
          <div className="text-5xl text-center mb-4"></div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2 text-center">Two-Factor Authentication</h1>
          <p className="text-zinc-500 text-center mb-8">
            Enter the code from your authenticator app
          </p>
          
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                {useBackupCode ? 'Backup Code' : 'Authentication Code'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={useBackupCode ? 'xxxx-xxxx-xxxx' : '000000'}
                maxLength={useBackupCode ? 14 : 6}
                className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900 placeholder:text-zinc-400"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-sm shadow-zinc-200"
            >
              {loading ? '⏳ Verifying...' : '✓ Verify'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-400 border-t border-zinc-200 pt-8 space-y-3">
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
