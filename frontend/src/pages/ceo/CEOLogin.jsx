import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { AuthLayout } from '../../components/layout';
import { ButtonLoading } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';

/**
 * CEO Login (dark, consistent design)
 */
const CEOLogin = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { error: showError, success: showSuccess } = useNotification();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'E-Mail ist erforderlich';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Ungültiges E-Mail-Format';
    if (!formData.password) newErrors.password = 'Passwort ist erforderlich';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        const user = result.data;
        if (user.role !== 'ceo') {
          showError('Zugriff nur für CEO-Konten');
          return;
        }
        showSuccess('Willkommen zurück');
        navigate('/ceo/dashboard', { replace: true });
      } else {
        showError(result.error || 'Anmeldung fehlgeschlagen');
      }
    } catch (err) {
      showError('Fehler bei der Anmeldung');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Systemzugang" subtitle="CEO-Portal — Zutritt nur für berechtigte Personen">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
          <p className="text-sm text-zinc-600">Sicherheitsprotokoll: Unautorisierte Zugriffsversuche werden protokolliert.</p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-600 mb-2">E-Mail</label>
          <div className="relative">
            <FiMail className="absolute left-3 top-3 text-zinc-500" size={18} />
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ceo@firma.de"
              className={`input-field w-full pl-10 pr-4 py-3 ${errors.email ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-600 mb-2">Passwort</label>
          <div className="relative">
            <FiLock className="absolute left-3 top-3 text-zinc-500" size={18} />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`input-field w-full pl-10 pr-10 py-3 ${errors.password ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-700"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600">
            <input type="checkbox" className="rounded text-zinc-900" /> Angemeldet bleiben
          </label>
          <a href="/forgot-password?role=business" className="text-sm text-indigo-300 hover:text-indigo-200">Passwort vergessen?</a>
        </div>

        <ButtonLoading type="submit" isLoading={isSubmitting || isLoading} loadingText="Überprüfe..." variant="primary" className="w-full">
          Zugang zum CEO-Portal
        </ButtonLoading>

        <p className="text-xs text-zinc-400 text-center">Zwei-Faktor-Authentifizierung wird empfohlen</p>
      </form>

      <div className="mt-6 text-sm text-zinc-500">Support: <strong className="text-zinc-700">security@jn-business-system.de</strong></div>
    </AuthLayout>
  );
};

export default CEOLogin;
