import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Vorname erforderlich';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nachname erforderlich';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Gültige E-Mail erforderlich';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Telefon erforderlich';
    if (formData.password.length < 8) {
      newErrors.password = 'Mind. 8 Zeichen';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Bitte AGB akzeptieren';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'customer',
      });

      if (response.data.success) {
        // ? SECURITY FIX: Tokens are now in HTTP-only cookies
        // Tokens are automatically sent by browser with withCredentials: true
        // No need to store in localStorage
        
        showNotification('Registrierung erfolgreich!', 'success');
        setTimeout(() => {
          navigate('/customer/dashboard');
        }, 1500);
      }
    } catch (error) {
      const errorMsg = formatError(error);
      setApiError(errorMsg);
      showNotification(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Kundenkonto erstellen</h1>
          <p className="text-zinc-500">Registriere dich, um Termine zu buchen</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl border border-zinc-200 p-8">
          {/* Error Message */}
          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-600/10 border border-red-600/30 text-red-600 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">Vorname</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Max"
                  className={`w-full px-4 py-3 bg-zinc-50 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent ${
                    errors.firstName ? 'border-red-500' : 'border-zinc-200'
                  }`}
                />
                {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">Nachname</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Mustermann"
                  className={`w-full px-4 py-3 bg-zinc-50 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent ${
                    errors.lastName ? 'border-red-500' : 'border-zinc-200'
                  }`}
                />
                {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">E-Mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ihre@email.de"
                className={`w-full px-4 py-3 bg-zinc-50 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-zinc-200'
                }`}
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Telefon</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+49 123 456789"
                className={`w-full px-4 py-3 bg-zinc-50 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-zinc-200'
                }`}
              />
              {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mind. 8 Zeichen"
                  className={`w-full px-4 py-3 bg-zinc-50 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-zinc-200'
                  }`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm hover:text-zinc-900"
                >
                  {showPassword ? 'Verstecken' : 'Anzeigen'}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Passwort bestätigen</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Passwort wiederholen"
                  className={`w-full px-4 py-3 pr-10 bg-zinc-50 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-zinc-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm hover:text-zinc-900 transition-colors"
                  aria-label={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showConfirmPassword ? 'Verstecken' : 'Anzeigen'}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-zinc-900"
              />
              <span className="text-sm text-zinc-500">
                Ich stimme den{' '}
                <Link to="/agb" className="text-zinc-900 hover:text-zinc-900">AGB</Link>{' '}
                und der{' '}
                <Link to="/datenschutz" className="text-zinc-900 hover:text-zinc-900">Datenschutzerklärung</Link>{' '}
                zu.
              </span>
            </label>
            {errors.agreeToTerms && <p className="text-red-600 text-xs">{errors.agreeToTerms}</p>}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-white text-black py-3 rounded-full font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registrierung...' : 'Konto erstellen'}
            </button>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-zinc-500">
            Bereits registriert?{' '}
            <Link to="/login/customer" className="text-zinc-900 font-medium hover:text-zinc-600">
              Hier anmelden
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
}
