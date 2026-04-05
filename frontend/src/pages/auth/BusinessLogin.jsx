import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { authAPI, localizeApiMessage } from '../../utils/api';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const BusinessLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const notification = useNotification();

  // No auto-redirect - allow users to log in as different account

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setError('');

    // Login attempt

    try {
      const response = await authAPI.login(email, password, rememberMe);
      const data = response.data;

      // Login response received

      if (data.success && data.user) {
        const role = data.user?.role || 'salon_owner';

        // ? SECURITY FIX: Tokens are now in HTTP-only cookies
        // Tokens are automatically sent by browser with withCredentials: true
        // No need to store in localStorage

        // Defensive cleanup: avoid stale post-logout flag blocking auth init on next route.
        sessionStorage.removeItem('jn:skipAuthInitOnce');

        // Auth data saved, redirecting

        // Redirect based on role
        if (role === 'customer') {
          window.location.replace('/customer/dashboard');
        } else if (role === 'ceo') {
          window.location.replace('/ceo/dashboard');
        } else {
          // salon_owner, employee, etc.
          window.location.replace('/dashboard');
        }
        return; // Stop execution after redirect
      } else {
        // Login failed
        const msg = localizeApiMessage(data.message, 'Anmeldung fehlgeschlagen');
        setError(msg);
        notification.error(msg);
        setLoading(false);
      }
    } catch (err) {
      const errorMsg = localizeApiMessage(
        err.response?.data?.message || err.message,
        'Verbindungsfehler. Bitte versuchen Sie es erneut.'
      );
      setError(errorMsg);
      notification.error(errorMsg);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Component mounted
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
            Geschäfts-Login
          </h1>
          <p className="text-gray-500">
            Zugang zu Ihrem Geschäfts-Kontrollpanel
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-500 rounded-xl text-red-600 text-sm">
              <span className="font-medium">Fehler:</span> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
                E-Mail Adresse
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition"
                placeholder="ihre@firma.de"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-2">
                Passwort
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-200 bg-white text-gray-900 cursor-pointer transition-colors"
                />
                <span className="ml-2 text-gray-500 group-hover:text-gray-600 transition-colors">Angemeldet bleiben</span>
              </label>
              <Link to="/forgot-password?role=business" className="text-gray-900 hover:text-gray-900 transition-colors">
                Passwort vergessen?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500">
            Noch kein Business-Account?{' '}
            <Link to="/register" className="text-gray-900 hover:text-gray-600 font-medium">
              Kostenlos registrieren
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600">
            ← Zurück zur Auswahl
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogin;
