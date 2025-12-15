import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserMenu from '../../components/common/UserMenu';
import { useNotification } from '../../context/NotificationContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CEOSettings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const notification = useNotification();
  
  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });
  
  // Security State
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });
  
  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailOnNewCustomer: true,
    emailOnPayment: true,
    emailOnError: true,
    emailOnChurn: true,
    weeklyReport: true,
    monthlyReport: true
  });
  
  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    ipWhitelist: '',
    sessionTimeout: 30
  });

  // Get auth token
  const getToken = () => {
    return localStorage.getItem('jnAuthToken') || localStorage.getItem('token');
  };

  // Get user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('jnUser') || localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
      setSecurity(prev => ({
        ...prev,
        twoFactorEnabled: user.twoFactorEnabled || false
      }));
    }
  }, []);

  // Save Profile
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('jnUser', JSON.stringify(data.user));
        notification.success('Profil gespeichert');
      } else {
        notification.error('Fehler beim Speichern');
      }
    } catch (err) {
      notification.error('Verbindungsfehler');
    } finally {
      setSaving(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      notification.error('Passwörter stimmen nicht überein');
      return;
    }
    
    if (security.newPassword.length < 8) {
      notification.error('Passwort muss mindestens 8 Zeichen haben');
      return;
    }
    
    setSaving(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword
        })
      });
      
      if (response.ok) {
        notification.success('Passwort geändert');
        setSecurity(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const data = await response.json();
        notification.error(data.message || 'Fehler beim Ändern');
      }
    } catch (err) {
      notification.error('Verbindungsfehler');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profil', icon: 'user' },
    { id: 'security', label: 'Sicherheit', icon: 'shield' },
    { id: 'notifications', label: 'Benachrichtigungen', icon: 'bell' },
    { id: 'system', label: 'System', icon: 'cog' },
    { id: 'billing', label: 'Abrechnung', icon: 'credit-card' },
    { id: 'api', label: 'API & Integrationen', icon: 'code' },
  ];

  const renderIcon = (icon) => {
    const iconClass = "w-5 h-5";
    switch (icon) {
      case 'user':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'shield':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'bell':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'cog':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'credit-card':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'code':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/ceo/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">CEO Settings</h1>
                  <p className="text-xs text-gray-500">System-Konfiguration</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/ceo/dashboard" 
                className="px-4 py-2 text-gray-400 hover:text-white transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Zurück zum Dashboard
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-gray-900/50 border border-gray-800 rounded-xl p-2 sticky top-24">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {renderIcon(section.icon)}
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Profil</h2>
                  
                  {/* Avatar */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                      {profile.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{profile.name || 'CEO'}</h3>
                      <p className="text-gray-500">{profile.email}</p>
                      <button className="mt-2 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 transition">
                        Avatar ändern
                      </button>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">E-Mail</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Telefon</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                        placeholder="+49..."
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50"
                    >
                      {saving ? 'Speichern...' : 'Änderungen speichern'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                {/* 2FA Status */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Zwei-Faktor-Authentifizierung</h3>
                        <p className="text-green-400 text-sm">Aktiviert und geschützt</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      Aktiv
                    </span>
                  </div>
                </div>

                {/* Change Password */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Passwort ändern</h2>
                  
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Aktuelles Passwort</label>
                      <input
                        type="password"
                        value={security.currentPassword}
                        onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Neues Passwort</label>
                      <input
                        type="password"
                        value={security.newPassword}
                        onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Passwort bestätigen</label>
                      <input
                        type="password"
                        value={security.confirmPassword}
                        onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={saving || !security.currentPassword || !security.newPassword}
                      className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition disabled:opacity-50"
                    >
                      Passwort ändern
                    </button>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Aktive Sitzungen</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">Aktuelle Sitzung</p>
                          <p className="text-gray-500 text-sm">Windows • Chrome • Jetzt aktiv</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Aktiv</span>
                    </div>
                  </div>
                  <button className="mt-4 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition">
                    Alle anderen Sitzungen beenden
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">E-Mail Benachrichtigungen</h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'emailOnNewCustomer', label: 'Neuer Kunde registriert', desc: 'Benachrichtigung wenn ein neues Unternehmen sich registriert' },
                    { key: 'emailOnPayment', label: 'Zahlung eingegangen', desc: 'Benachrichtigung bei erfolgreichen Zahlungen' },
                    { key: 'emailOnError', label: 'Kritische Fehler', desc: 'Sofortige Benachrichtigung bei Systemfehlern' },
                    { key: 'emailOnChurn', label: 'Kündigung', desc: 'Benachrichtigung wenn ein Kunde kündigt' },
                    { key: 'weeklyReport', label: 'Wöchentlicher Report', desc: 'Zusammenfassung jeden Montag' },
                    { key: 'monthlyReport', label: 'Monatlicher Report', desc: 'Detaillierter Monatsbericht' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-500 text-sm">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                        className={`w-12 h-6 rounded-full transition-all ${
                          notifications[item.key] ? 'bg-indigo-500' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Section */}
            {activeSection === 'system' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">System-Einstellungen</h2>
                  
                  <div className="space-y-6">
                    {/* Maintenance Mode */}
                    <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Wartungsmodus</p>
                        <p className="text-gray-500 text-sm">Zeigt allen Nutzern eine Wartungsseite an</p>
                      </div>
                      <button
                        onClick={() => setSystemSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode })}
                        className={`w-12 h-6 rounded-full transition-all ${
                          systemSettings.maintenanceMode ? 'bg-orange-500' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    {/* Debug Mode */}
                    <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Debug-Modus</p>
                        <p className="text-gray-500 text-sm">Erweiterte Fehlerausgaben aktivieren</p>
                      </div>
                      <button
                        onClick={() => setSystemSettings({ ...systemSettings, debugMode: !systemSettings.debugMode })}
                        className={`w-12 h-6 rounded-full transition-all ${
                          systemSettings.debugMode ? 'bg-indigo-500' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          systemSettings.debugMode ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    {/* IP Whitelist */}
                    <div className="p-4 bg-black/30 rounded-lg">
                      <p className="text-white font-medium mb-2">CEO IP-Whitelist</p>
                      <p className="text-gray-500 text-sm mb-3">Komma-getrennte Liste von erlaubten IPs für CEO-Login</p>
                      <input
                        type="text"
                        value={systemSettings.ipWhitelist}
                        onChange={(e) => setSystemSettings({ ...systemSettings, ipWhitelist: e.target.value })}
                        placeholder="z.B. 192.168.1.1, 10.0.0.1"
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    {/* Session Timeout */}
                    <div className="p-4 bg-black/30 rounded-lg">
                      <p className="text-white font-medium mb-2">Session Timeout</p>
                      <p className="text-gray-500 text-sm mb-3">Automatische Abmeldung nach Inaktivität (Tage)</p>
                      <select
                        value={systemSettings.sessionTimeout}
                        onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })}
                        className="px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                      >
                        <option value={7}>7 Tage</option>
                        <option value={14}>14 Tage</option>
                        <option value={30}>30 Tage</option>
                        <option value={90}>90 Tage</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-red-400 mb-4">Gefahrenzone</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Cache leeren</p>
                        <p className="text-gray-500 text-sm">Löscht alle gecachten Daten</p>
                      </div>
                      <button className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                        Cache leeren
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Alle Logs löschen</p>
                        <p className="text-gray-500 text-sm">Löscht alle System-Logs</p>
                      </div>
                      <button className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                        Logs löschen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Section */}
            {activeSection === 'billing' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Plattform-Einnahmen</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-400">€0</p>
                      <p className="text-gray-500 text-sm">Diesen Monat</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-white">0</p>
                      <p className="text-gray-500 text-sm">Zahlende Kunden</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-indigo-400">€0</p>
                      <p className="text-gray-500 text-sm">Lifetime Revenue</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Stripe Integration</h2>
                  <div className="flex items-center gap-4 p-4 bg-black/30 rounded-lg">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Stripe Dashboard</p>
                      <p className="text-gray-500 text-sm">Zahlungen und Abonnements verwalten</p>
                    </div>
                    <a 
                      href="https://dashboard.stripe.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                    >
                      Öffnen
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* API Section */}
            {activeSection === 'api' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">API Konfiguration</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-black/30 rounded-lg">
                      <p className="text-white font-medium mb-2">API Base URL</p>
                      <code className="block px-4 py-3 bg-black rounded-lg text-indigo-400 font-mono text-sm">
                        {API_URL}
                      </code>
                    </div>

                    <div className="p-4 bg-black/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">API Key</p>
                        <button className="text-indigo-400 text-sm hover:text-indigo-300">
                          Neu generieren
                        </button>
                      </div>
                      <code className="block px-4 py-3 bg-black rounded-lg text-gray-500 font-mono text-sm">
                        ••••••••••••••••••••••••••••••••
                      </code>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Webhooks</h2>
                  <p className="text-gray-500 mb-4">Keine Webhooks konfiguriert</p>
                  <button className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition">
                    + Webhook hinzufügen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEOSettings;
