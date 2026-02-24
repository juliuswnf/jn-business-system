import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';
import { FiLock, FiClipboard } from 'react-icons/fi';
import BusinessTypeModal from '../../components/onboarding/BusinessTypeModal';

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
    starter: { name: 'Starter', price: 129 },
    professional: { name: 'Professional', price: 249 },
    enterprise: { name: 'Enterprise', price: 599 }
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
    businessType: '',
    customBusinessType: '', // For "other" selection
    password: '',
    confirmPassword: '',
    userType: 'salon_owner',
    agreeToTerms: false,
  });
  const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(!checkoutEmail); // Show modal first if not from checkout
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const planInfo = storedPlan || {
    planId: selectedPlan,
    planName: planDetails[selectedPlan]?.name || 'Starter',
    price: planDetails[selectedPlan]?.price || 129,
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

  const handleBusinessTypeSelect = (data) => {
    // data: { businessType, customBusinessType? }
    setFormData((prev) => ({
      ...prev,
      businessType: data.businessType,
      customBusinessType: data.customBusinessType || '',
    }));
    setShowBusinessTypeModal(false);
  };

  const handleBackFromModal = () => {
    // Go back to pricing/checkout page
    navigate(-1);
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
    if (!formData.businessType) newErrors.businessType = 'Bitte wählen Sie Ihre Branche';
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
        businessType: formData.businessType,
        ...(formData.customBusinessType && { customBusinessType: formData.customBusinessType }),
        password: formData.password,
        role: 'salon_owner',
        plan: planInfo.planId,
      });

      if (response.data.success) {
        // ? SECURITY FIX: Tokens are now in HTTP-only cookies
        // Tokens are automatically sent by browser with withCredentials: true
        // No need to store in localStorage or set headers manually

        // Clear session storage
        sessionStorage.removeItem('selectedPlan');

        success('Registrierung erfolgreich! Weiterleitung...');

        // Navigate immediately - no timeout needed since token is already set
        navigate('/dashboard', { replace: true });
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
    <>
      {/* Business Type Modal - Show first, before registration form */}
      {showBusinessTypeModal && (
        <BusinessTypeModal
          onSelect={handleBusinessTypeSelect}
          onBack={handleBackFromModal}
        />
      )}

      {/* Registration Form - Show only after business type is selected */}
      {!showBusinessTypeModal && (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl font-bold mb-2">Konto erstellen</div>
          <p className="text-gray-400 text-lg">
            Bitte füllen Sie die erforderlichen Informationen aus
          </p>
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
                  placeholder="kontakt@firma.de"
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
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Passwort bestätigen"
                      className={`input-field pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                      aria-label={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    >
                      {showConfirmPassword ? 'Verstecken' : 'Anzeigen'}
                    </button>
                  </div>
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
      )}
    </>
  );
}
