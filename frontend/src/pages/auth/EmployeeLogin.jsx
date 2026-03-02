import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { authAPI } from '../../utils/api';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const EmployeeLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const notification = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.employeeLogin(email, password);
      const data = response.data;

      if (data.success) {
        // ? SECURITY FIX: Tokens are now in HTTP-only cookies
        // Tokens are automatically sent by browser with withCredentials: true
        // No need to store in localStorage

        notification.success('Anmeldung erfolgreich');
        navigate('/employee/dashboard');
        return;
      } else {
        const msg = data.message || 'Anmeldung fehlgeschlagen';
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

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            Mitarbeiter-Login
          </h1>
          <p className="text-zinc-500">
            Zugang zu Ihrem Mitarbeiter-Kontrollpanel
          </p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-500 rounded-lg text-red-600 text-sm">
              <span className="font-medium">Fehler:</span> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-600 mb-2">
                E-Mail Adresse
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                placeholder="ihre@email.de"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-600 mb-2">
                Passwort
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
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
              <Link to="/forgot-password?role=business" className="text-zinc-900 hover:text-zinc-900 transition-colors">
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
          <p className="text-zinc-500">
            Kein Mitarbeiterkonto?{' '}
            <Link to="/login" className="text-zinc-900 hover:text-zinc-600 font-medium">
              Zur Login-Auswahl
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-zinc-400 hover:text-zinc-600">
            ← Zurück zur Auswahl
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
