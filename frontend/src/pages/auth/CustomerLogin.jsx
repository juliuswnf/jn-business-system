import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { authAPI } from '../../utils/api';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const CustomerLogin = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const notification = useNotification();

  const redirectParam = searchParams.get('redirect') || '';
  const redirectTo = redirectParam.startsWith('/') ? redirectParam : '';

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

      if (data.success) {
        // ? SECURITY FIX: Tokens are now in HTTP-only cookies
        // Tokens are automatically sent by browser with withCredentials: true
        // No need to store in localStorage

        // Auth data saved, redirecting

        // Redirect based on role (optional safe redirect back to booking link)
        const role = data.user?.role || 'customer';

        if (redirectTo) {
          window.location.replace(redirectTo);
        } else if (role === 'customer') {
          window.location.replace('/customer/dashboard');
        } else if (role === 'ceo') {
          window.location.replace('/ceo/dashboard');
        } else {
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
    <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1">Kundenlogin</h1>
          <p className="text-zinc-500">Melden Sie sich an, um Ihre Termine zu verwalten</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-500 rounded-lg text-red-600 text-sm">
              <span className="font-medium">Fehler:</span> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">E‑Mail Adresse</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="ihre@email.de"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-2">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 transition-colors"
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
                  className="w-4 h-4 rounded border-gray-600 bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 focus:ring-offset-white cursor-pointer transition-colors"
                />
                <span className="ml-2 text-zinc-500 group-hover:text-zinc-600 transition-colors">Angemeldet bleiben</span>
              </label>
              <Link to="/forgot-password?role=customer" className="text-zinc-700 hover:text-zinc-900 transition-colors">Passwort vergessen?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-zinc-500">Noch kein Konto? <Link to="/register/customer" className="text-zinc-900 font-semibold">Jetzt registrieren</Link></p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-zinc-400 hover:text-zinc-500">← Zurück zur Auswahl</Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
