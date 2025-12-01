import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { AuthLayout } from '../../components/layout';

const EmployeeLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { success, error } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.employeeLogin(email, password);
      if (response.data.success) {
        const { token, refreshToken, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        success('Anmeldung erfolgreich');
        navigate('/employee/dashboard');
      }
    } catch (err) {
      error(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AuthLayout title="JN Business" subtitle="Mitarbeiter-Login">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">E-Mail</label>
          <div className="relative">
            <FiMail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ihre E-Mail"
              className="input-field w-full pl-10 pr-4 py-3"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Passwort</label>
          <div className="relative">
            <FiLock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ihr Passwort"
              className="input-field w-full pl-10 pr-10 py-3"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Anmeldung...' : 'Anmelden'}
        </button>

        <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-700 pt-4 space-y-2">
          <div>
            <Link to="/forgot-password" className="text-indigo-300 hover:text-indigo-200 font-semibold">
              Passwort vergessen?
            </Link>
          </div>
          <div>
            <p className="text-gray-400">
              Kein Mitarbeiterkonto?{' '}
              <Link to="/login" className="text-indigo-300 hover:text-indigo-200 font-semibold">Kunden-Login</Link>
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};

export default EmployeeLogin;
