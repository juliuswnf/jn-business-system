import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { authAPI, formatError } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { success, error, info } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      if (response.data.success) {
        const { token, refreshToken, user, requires2FA } = response.data;

        if (requires2FA) {
          localStorage.setItem('tempUser', JSON.stringify(user));
          info('2FA required');
          navigate('/2fa-verify', { state: { user } });
        } else {
          if (loading) return <LoadingSpinner />;

          return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
              <div className="w-full max-w-md">
                <div className="card">
                  <h1 className="text-3xl font-bold mb-1">Anmeldung</h1>
                  <p className="text-sm text-gray-400 mb-6">Melden Sie sich an, um auf Ihr Konto zuzugreifen.</p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">E‑Mail</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="beispiel@firma.de"
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Passwort</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Ihr Passwort"
                          className="input-field pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-100"
                          aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Anmeldung...' : 'Anmelden'}
                    </button>
                  </form>

                  <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-800 pt-6 space-y-3">
                    <div>
                      <Link to="/forgot-password" className="text-gray-200 hover:text-white font-medium">Passwort vergessen?</Link>
                    </div>
                    <div>
                      <p>
                        Noch kein Konto?{' '}
                        <Link to="/register" className="text-white font-semibold hover:opacity-95">Registrieren</Link>
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-800 space-y-2">
                      <p className="text-xs text-gray-500">Andere Anmeldemöglichkeiten</p>
                      <div className="space-y-2">
                        <Link to="/ceo-login" className="block px-4 py-2 rounded-lg bg-transparent text-center text-gray-200 font-semibold border border-gray-800 hover:border-gray-700 transition text-sm">CEO-Login</Link>
                        <Link to="/employee-login" className="block px-4 py-2 rounded-lg bg-transparent text-center text-gray-200 font-semibold border border-gray-800 hover:border-gray-700 transition text-sm">Mitarbeiter-Login</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
                <Link
                  to="/register"
                  className="text-accent hover:text-accent-light font-semibold transition"
                >
                  Sign up
                </Link>
              </p>
            </div>
            <div className="pt-3 border-t border-accent/10 space-y-2">
              <p className="text-xs text-slate-400">Other login options:</p>
              <div className="space-y-2">
                <Link
                  to="/ceo-login"
                  className="block px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-center text-white font-semibold border border-accent/30 transition text-sm"
                >
                  👑 CEO Login
                </Link>
                <Link
                  to="/employee-login"
                  className="block px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-center text-white font-semibold border border-accent/30 transition text-sm"
                >
                  👨‍💼 Employee Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
