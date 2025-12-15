import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const TwoFASetup = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState('setup');

  useEffect(() => {
    const initiate2FA = async () => {
      try {
        const response = await authAPI.enable2FA();
        if (response.data.success) {
          const { qrCode, secret, backupCodes } = response.data.data;
          setQrCode(qrCode);
          setSecret(secret);
          setBackupCodes(backupCodes);
          setStep('verify');
        }
      } catch (error) {
        showNotification(formatError(error), 'error');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    initiate2FA();
  }, [navigate, showNotification]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (verificationCode.length < 6) {
      showNotification('Verification code must be 6 digits', 'error');
      return;
    }

    setVerifying(true);

    try {
      const response = await authAPI.verify2FACode(verificationCode);
      if (response.data.success) {
        showNotification('Two-factor authentication enabled!', 'success');
        setStep('backup');
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary text-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-8 text-center">
            <div className="w-12 h-12 border-4 border-zinc-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Setting up 2FA...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-primary text-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-8">
            <h1 className="text-3xl font-bold text-white mb-8 text-center">Setup 2FA</h1>
            
            <div className="bg-primary/50 rounded-lg p-6 mb-8 text-center">
              <p className="text-sm text-slate-350 mb-4">Scan with your authenticator app:</p>
              {qrCode && (
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  className="w-48 h-48 mx-auto border-2 border-accent rounded"
                />
              )}
              <p className="text-xs text-slate-400 mt-4 break-all">Or enter code: {secret}</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-3 rounded-lg bg-primary/50 border border-accent/20 hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent text-white placeholder:text-slate-350 text-center text-2xl tracking-widest"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-lg shadow-accent/30"
              >
                {verifying ? '⏳ Verifying...' : '✓ Verify & Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-8">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4 text-center">2FA aktiviert</h1>
          <p className="text-slate-350 text-center mb-6">
            Speichern Sie Ihre Backup-Codes an einem sicheren Ort. Sie können diese verwenden, falls Sie den Zugriff auf Ihre Authenticator-App verlieren.
          </p>

          <div className="bg-primary/50 rounded-lg p-6 mb-8">
            <div className="space-y-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Code {index + 1}</span>
                  <span className="font-mono text-accent">{code}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              const text = backupCodes.join('\n');
              navigator.clipboard.writeText(text);
              showNotification('Backup codes copied to clipboard!', 'success');
            }}
            className="w-full py-3 rounded-lg bg-secondary hover:bg-secondary/80 text-white font-semibold border border-accent/30 transition duration-300 mb-4"
          >
            📋 Copy Codes
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold transition duration-300 shadow-lg shadow-accent/30"
          >
            ✓ Done
          </button>

          <p className="text-xs text-slate-400 text-center mt-6">
            Make sure to save these codes before closing this page!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwoFASetup;
