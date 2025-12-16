import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { authAPI } from '../../utils/api';

const BusinessLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const response = await authAPI.login(email, password);
      const data = response.data;

      // Login response received

      if (data.success && data.token) {
        const role = data.user?.role || 'salon_owner';

        // Block customers from business login - they should use customer login
        if (role === 'customer') {
          setError('Dieser Login ist nur für Geschäftskunden. Bitte nutzen Sie den Kunden-Login.');
          notification.error('Bitte nutzen Sie den Kunden-Login für Ihr Konto.');
          setLoading(false);
          return;
        }

        // Store auth data (both new and legacy keys for compatibility)
        localStorage.setItem('jnAuthToken', data.token);
        localStorage.setItem('jnUser', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Auth data saved, redirecting

        // Redirect based on role
        if (role === 'ceo') {
          window.location.replace('/ceo/dashboard');
        } else {
          // salon_owner, employee, etc.
          window.location.replace('/dashboard');
        }
        return; // Stop execution after redirect
      } else {
        // Login failed
        const msg = data.message || 'Login fehlgeschlagen';
        setError(msg);
        notification.error(msg);
        setLoading(false);
      }
    } catch (err) {
      console.error('Business login error:', err);
      const errorMsg = err.response?.data?.message || 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
      setError(errorMsg);
      notification.error(errorMsg);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Component mounted
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Business Login
          </h1>
          <p className="text-gray-400">
            Zugang zu Ihrem Geschäfts-Dashboard
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
              <span className="font-medium">Fehler:</span> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-Mail Adresse
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ihre@firma.de"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Passwort
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 rounded bg-gray-800 border-gray-700" />
                <span className="text-gray-400">Angemeldet bleiben</span>
              </label>
              <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300">
                Passwort vergessen?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Noch kein Business-Account?{' '}
            <Link to="/register" className="text-white hover:text-gray-300 font-medium">
              Kostenlos registrieren
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-300">
            ← Zurück zur Auswahl
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogin;
