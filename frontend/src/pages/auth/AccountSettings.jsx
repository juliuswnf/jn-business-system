import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const AccountSettings = () => {
  const { error, info } = useNotification();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        setTwoFAEnabled(storedUser.twoFAEnabled || false);
      } catch (error) {
        error(formatError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleDisable2FA = async () => {
    const confirmed = window.confirm('Are you sure? You will need to set up 2FA again to enable it.');
    if (!confirmed) return;

    // Replace browser prompt with a guided flow: require the user to confirm password on the Change Password page
    info('To disable 2FA, please confirm your password on the Change Password page and then disable 2FA from there.');
    navigate('/change-password');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="rounded-lg bg-secondary/50 border border-zinc-200 p-6 hover:border-zinc-300 transition">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">Profile Information</h2>
                <p className="text-sm text-slate-400">Manage your account details</p>
              </div>
              <Link
                to="/customer/settings"
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold transition text-sm"
              >
                Edit Profile
              </Link>
            </div>
            {user && (
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-400">Name:</span> <span className="text-zinc-900">{user.firstName} {user.lastName}</span></p>
                <p><span className="text-slate-400">Email:</span> <span className="text-zinc-900">{user.email}</span></p>
                <p><span className="text-slate-400">Phone:</span> <span className="text-zinc-900">{user.phone}</span></p>
                <p><span className="text-slate-400">Role:</span> <span className="text-zinc-900 capitalize">{user.role}</span></p>
              </div>
            )}
          </div>

          {/* Security Section */}
          <div className="rounded-lg bg-secondary/50 border border-zinc-200 p-6 hover:border-zinc-300 transition">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                <div>
                  <p className="text-zinc-900 font-semibold">Password</p>
                  <p className="text-sm text-slate-400">Change your password</p>
                </div>
                <Link
                  to="/change-password"
                  className="px-4 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200 transition text-sm"
                >
                  Change
                </Link>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                <div>
                  <p className="text-zinc-900 font-semibold">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-400">
                    {twoFAEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </p>
                </div>
                {twoFAEnabled ? (
                  <button
                    onClick={handleDisable2FA}
                    className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 hover:bg-red-500/20 font-semibold transition text-sm"
                  >
                    Disable
                  </button>
                ) : (
                  <Link
                    to="/2fa-setup"
                    className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold transition text-sm"
                  >
                    Enable
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                <div>
                  <p className="text-zinc-900 font-semibold">Active Sessions</p>
                  <p className="text-sm text-slate-400">Manage your devices</p>
                </div>
                <Link
                  to="/sessions"
                  className="px-4 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200 transition text-sm"
                >
                  View
                </Link>
              </div>
            </div>
          </div>

          {/* Account Actions Section */}
          <div className="rounded-lg bg-secondary/50 border border-zinc-200 p-6 hover:border-zinc-300 transition">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Konto-Aktionen</h2>
            <div className="space-y-3">
              <button
                className="w-full px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 hover:bg-red-500/20 font-semibold transition"
              >
                Konto löschen
              </button>
              <p className="text-xs text-slate-400 text-center">
                Ihr Konto und alle zugehörigen Daten dauerhaft löschen
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link
            to="/customer/dashboard"
            className="text-accent hover:text-accent-light font-semibold transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
