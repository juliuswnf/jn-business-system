import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import SEO from '../../components/SEO';

export default function EmployeeSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Ungültiger Einladungslink</h1>
          <p className="text-gray-600 text-sm mb-6">
            Der Link ist ungültig oder wurde bereits verwendet. Bitte fordere eine neue Einladung an.
          </p>
          <Link to="/login/employee" className="text-gray-900 font-semibold hover:underline text-sm">
            Zum Login →
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/employees/setup-password', {
        token,
        password: formData.password,
      });

      if (res.data.success) {
        setDone(true);
        setTimeout(() => navigate('/login/employee', { replace: true }), 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Ungültiger oder abgelaufener Einladungslink. Bitte fordere eine neue Einladung an.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Passwort gesetzt!</h1>
          <p className="text-gray-600 mb-2">Dein Konto ist jetzt aktiv.</p>
          <p className="text-sm text-gray-500">Du wirst automatisch zum Login weitergeleitet…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Konto einrichten – JN Business System" />
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Konto einrichten</h1>
            <p className="text-gray-500">Setze dein Passwort, um loszulegen</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mind. 8 Zeichen"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-900"
                  >
                    {showPassword ? 'Verstecken' : 'Anzeigen'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passwort bestätigen</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Passwort wiederholen"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird gespeichert…' : 'Passwort setzen & Konto aktivieren'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Bereits registriert?{' '}
            <Link to="/login/employee" className="text-gray-900 font-semibold hover:underline">
              Zum Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
