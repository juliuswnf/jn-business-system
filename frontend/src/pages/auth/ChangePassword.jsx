import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const ChangePassword = () => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword.length < 8) {
      showNotification('Das neue Passwort muss mindestens 8 Zeichen lang sein', 'error');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showNotification('Passwörter stimmen nicht überein', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        showNotification('Passwort erfolgreich geändert!', 'success');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold tracking-tight">Passwort ändern</h1>
          <Link
            to="/customer/settings"
            className="px-4 py-2 text-gray-500 hover:text-gray-900 font-medium transition"
          >
            ← Zurück
          </Link>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Aktuelles Passwort</label>
              <div className="relative">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Aktuelles Passwort eingeben"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-100 text-gray-900 placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent transition"
                  onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPassword.current ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Neues Passwort</label>
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Mind. 8 Zeichen"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-100 text-gray-900 placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent transition"
                  onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPassword.new ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Neues Passwort bestätigen</label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Neues Passwort bestätigen"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-100 text-gray-900 placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent transition"
                  onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPassword.confirm ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-900 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-sm shadow-gray-100"
            >
              {loading ? '⏳ Updating...' : '✓ Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
