import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';
import { FiLock, FiClipboard } from 'react-icons/fi';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { success, error: showError } = useNotification();
  
  // Check if coming from checkout or direct signup
  const fromCheckout = location.state?.fromCheckout;
  const selectedPlan = location.state?.plan || searchParams.get('plan') || 'starter';
  const checkoutEmail = location.state?.email || searchParams.get('email') || '';
  
  // Get plan info from sessionStorage
  const storedPlan = JSON.parse(sessionStorage.getItem('selectedPlan') || 'null');

  // Plan details
  const planDetails = {
    starter: { name: 'Starter', price: 49 },
    professional: { name: 'Professional', price: 99 },
    enterprise: { name: 'Enterprise', price: 199 }
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: checkoutEmail || storedPlan?.email || '',
    phone: '',
    companyName: '',
    companyAddress: '',
    companyCity: '',
    companyZip: '',
    password: '',
    confirmPassword: '',
    userType: 'salon_owner',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const planInfo = storedPlan || {
    planId: selectedPlan,
    planName: planDetails[selectedPlan]?.name || 'Starter',
    price: planDetails[selectedPlan]?.price || 49,
  };

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
    if (!formData.companyName.trim()) newErrors.companyName = 'Firmenname erforderlich';
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
        companyName: formData.companyName,
        password: formData.password,
        role: 'salon_owner',
        plan: planInfo.planId,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Clear session storage
        sessionStorage.removeItem('selectedPlan');
        
        success('Registrierung erfolgreich! Weiterleitung...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      const errorMsg = formatError(error);
      setApiError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl font-bold mb-2">Konto erstellen</div>
          <p className="text-gray-400 text-lg">
            Fast geschafft! Erstelle dein {planInfo.planName}-Konto
          </p>
        </div>

        {/* Plan Info Banner */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-white">{planInfo.planName} Plan</p>
              <p className="text-sm text-gray-400">30 Tage kostenlos testen</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-white">€{planInfo.price}/Monat</p>
            <p className="text-xs text-gray-500">nach Testphase</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="card">
          {/* Error Message */}
          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-600/10 border border-red-600/30 text-red-400 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Personal Info */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold"><FiClipboard /></span>
                Persönliche Daten
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Vorname</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Max"
                    className={`input-field ${errors.firstName ? 'input-error' : ''}`}
                  />
                  {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Nachname</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Mustermann"
                    className={`input-field ${errors.lastName ? 'input-error' : ''}`}
                  />
                  {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">E‑Mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="kontakt@salon.de"
                  className={`input-field ${errors.email ? 'input-error' : ''}`}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">Telefon</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+49 123 456789"
                  className={`input-field ${errors.phone ? 'input-error' : ''}`}
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">Firmenname</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Ihr Unternehmen"
                  className={`input-field ${errors.companyName ? 'input-error' : ''}`}
                />
                {errors.companyName && <p className="text-red-400 text-xs mt-1">{errors.companyName}</p>}
              </div>
            </div>

            {/* Security Info */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold"><FiLock /></span>
                Zugangsdaten
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Passwort</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mind. 8 Zeichen"
                      className={`input-field ${errors.password ? 'input-error' : ''}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">{showPassword ? 'Verstecken' : 'Anzeigen'}</button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Passwort wiederholen</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Passwort bestätigen"
                    className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start p-4 rounded-lg bg-gray-900 border border-gray-800 cursor-pointer hover:border-gray-700 transition">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mt-1 mr-3 rounded cursor-pointer w-4 h-4"
              />
              <span className="text-sm text-gray-300">
                Ich stimme den{' '}
                <a href="#" className="text-white font-semibold">Nutzungsbedingungen</a>{' '}
                und der{' '}
                <a href="#" className="text-white font-semibold">Datenschutzerklärung</a>{' '}zu.
              </span>
            </label>
            {errors.agreeToTerms && <p className="text-red-400 text-xs">{errors.agreeToTerms}</p>}

            {/* Submit Button */}
            <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed">{isLoading ? 'Registrierung...' : 'Konto erstellen'}</button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-800 pt-6">
            <p>Bereits registriert? <Link to="/login" className="text-white font-semibold">Hier anmelden</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
