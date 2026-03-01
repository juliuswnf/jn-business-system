import React, { useState } from 'react';
import { useNotification } from '../../hooks/useNotification';

export default function SystemSettings() {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('email');
  const [settings, setSettings] = useState({
    email: {
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: ''
    },
    stripe: {
      publicKey: '',
      secretKey: '',
      webhookSecret: ''
    },
    sms: {
      provider: 'twilio',
      accountSid: '',
      authToken: ''
    }
  });

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      // TODO: Integrate with API
      // await settingsAPI.update(settings);
      showNotification('Settings saved successfully', 'success');
    } catch (error) {
      showNotification('Error saving settings', 'error');
    }
  };

  const tabs = [
    { id: 'email', label: '📧 Email Configuration' },
    { id: 'stripe', label: '💳 Payment Gateway' },
    { id: 'sms', label: '📱 SMS Configuration' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">System Settings</h1>
        <p className="text-zinc-400">Configure platform integrations and settings</p>
      </div>

      <div className="bg-secondary/50 border border-zinc-200 rounded-lg overflow-hidden">
        <div className="flex border-b border-zinc-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === tab.id
                  ? 'text-accent border-b-2 border-accent bg-zinc-50'
                  : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">SMTP Host</label>
                <input
                  type="text"
                  value={settings.email.smtpHost}
                  onChange={(e) => handleChange('email', 'smtpHost', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => handleChange('email', 'smtpPort', e.target.value)}
                    placeholder="587"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">SMTP User</label>
                  <input
                    type="text"
                    value={settings.email.smtpUser}
                    onChange={(e) => handleChange('email', 'smtpUser', e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">SMTP Password</label>
                <input
                  type="password"
                  value={settings.email.smtpPassword}
                  onChange={(e) => handleChange('email', 'smtpPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
            </div>
          )}

          {activeTab === 'stripe' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">Stripe Public Key</label>
                <input
                  type="password"
                  value={settings.stripe.publicKey}
                  onChange={(e) => handleChange('stripe', 'publicKey', e.target.value)}
                  placeholder="pk_live_..."
                  className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">Stripe Secret Key</label>
                <input
                  type="password"
                  value={settings.stripe.secretKey}
                  onChange={(e) => handleChange('stripe', 'secretKey', e.target.value)}
                  placeholder="sk_live_..."
                  className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">Webhook Secret</label>
                <input
                  type="password"
                  value={settings.stripe.webhookSecret}
                  onChange={(e) => handleChange('stripe', 'webhookSecret', e.target.value)}
                  placeholder="whsec_..."
                  className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">SMS Provider</label>
                <select
                  value={settings.sms.provider}
                  onChange={(e) => handleChange('sms', 'provider', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900"
                >
                  <option value="twilio">Twilio</option>
                  <option value="vonage">Vonage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">Account SID</label>
                <input
                  type="password"
                  value={settings.sms.accountSid}
                  onChange={(e) => handleChange('sms', 'accountSid', e.target.value)}
                  placeholder="Your Account SID"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">Auth Token</label>
                <input
                  type="password"
                  value={settings.sms.authToken}
                  onChange={(e) => handleChange('sms', 'authToken', e.target.value)}
                  placeholder="Your Auth Token"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            className="mt-8 px-8 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold transition duration-300 shadow-sm shadow-zinc-200"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
