import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showNotification } = useNotification();
  
  // Get role from query parameter (business or customer)
  const role = searchParams.get('role') || 'business';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email, role);
      if (response.data.success) {
        setSubmitted(true);
        showNotification('Link zum Zurücksetzen wurde gesendet!', 'success');
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-4">E-Mail gesendet</h2>
            <p className="text-gray-500 mb-6">
              Wir haben einen Link zum Zurücksetzen an <strong className="text-gray-900">{email}</strong> gesendet. Der Link ist 10 Minuten gültig.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Keine E-Mail erhalten? Prüfen Sie Ihren Spam-Ordner.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-gray-900 hover:text-gray-900 font-medium mb-4"
            >
              Andere E-Mail verwenden
            </button>
            <div className="border-t border-gray-200 pt-6 mt-6">
              <Link
                to="/login"
                className="text-gray-500 hover:text-gray-900 transition"
              >
                ← Zurück zum Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">Passwort vergessen?</h1>
          <p className="text-gray-500">
            Kein Problem. Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                E-Mail Adresse
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.de"
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird gesendet...' : 'Link senden'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-gray-500 hover:text-gray-900 transition" aria-label="Zurück zum Login">
            ← Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
