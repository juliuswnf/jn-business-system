import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { authAPI } from '../../utils/api';

const CustomerLogin = () => {
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
        // Store auth data (both new and legacy keys for compatibility)
        localStorage.setItem('jnAuthToken', data.token);
        localStorage.setItem('jnUser', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Auth data saved, redirecting

        // Redirect based on role
        const role = data.user?.role || 'customer';

        if (role === 'customer') {
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
      console.error('Customer login error:', err);
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
          <h1 className="text-3xl font-bold mb-1">Kundenlogin</h1>
          <p className="text-gray-400">Melden Sie sich an, um Ihre Termine zu verwalten</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
              <span className="font-medium">Fehler:</span> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">E‑Mail Adresse</label>
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">Passwort</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 rounded" />
                <span className="text-gray-400">Angemeldet bleiben</span>
              </label>
              <Link to="/forgot-password" className="text-gray-200 hover:text-white">Passwort vergessen?</Link>
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
          <p className="text-gray-400">Noch kein Konto? <Link to="/register/customer" className="text-white font-semibold">Jetzt registrieren</Link></p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-400">← Zurück zur Auswahl</Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
