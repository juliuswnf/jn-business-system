import React, { useState, useEffect } from 'react';
import { Building2, Clock, Star, Mail, CreditCard, Bell, Save, ExternalLink, Palette, MapPin } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { salonAPI } from '../../utils/api';
import { Link } from 'react-router-dom';
import NoShowKillerSettings from './Settings/NoShowKiller';
import { useIsMobile } from '../../hooks/useMediaQuery';

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function Settings() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('studio');

  const [studioInfo, setStudioInfo] = useState({
    name: '',
    address: '',
    city: '',
    zip: '',
    phone: '',
    email: '',
    website: ''
  });

  const [openingHours, setOpeningHours] = useState(
    DAYS.map(day => ({ day, open: '09:00', close: '18:00', closed: day === 'Sonntag' }))
  );

  const [integrations, setIntegrations] = useState({
    googleReviewLink: '',
    stripeConnected: false,
    stripeAccountId: ''
  });

  const [notifications, setNotifications] = useState({
    emailConfirmation: true,
    emailReminder: true,
    emailReview: true,
    smsReminder: false
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await salonAPI.getInfo().catch(() => ({ data: {} }));

      if (response.data) {
        const data = response.data;
        setStudioInfo({
          name: data.name || '',
          address: data.address || '',
          city: data.city || '',
          zip: data.zip || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || ''
        });

        if (data.openingHours) {
          setOpeningHours(data.openingHours);
        }

        if (data.integrations) {
          setIntegrations(data.integrations);
        }

        if (data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (error) {
      // Error handled by UI state
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await salonAPI.update({
        ...studioInfo,
        openingHours,
        integrations,
        notifications
      });
      showNotification('Einstellungen gespeichert', 'success');
    } catch (error) {
      showNotification('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateHours = (index, field, value) => {
    setOpeningHours(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const tabs = [
    { id: 'studio', label: 'Studio-Info', icon: Building2 },
    { id: 'hours', label: 'Öffnungszeiten', icon: Clock },
    { id: 'integrations', label: 'Integrationen', icon: Star },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
    { id: 'noShowKiller', label: 'NO-SHOW-KILLER', icon: CreditCard }
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Einstellungen</h1>
        <p className="text-slate-400 text-sm md:text-base">
          Verwalte dein Studio, Öffnungszeiten und Integrationen
        </p>
      </div>

      {isMobile && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-yellow-500/10 text-yellow-600 border border-yellow-200 text-sm">
          Einige Einstellungen (z. B. Integrationen oder No-Show-Killer) sind nur am Desktop verfügbar.
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-800 pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 md:p-6">

        {/* Studio Info Tab */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Studio Name</label>
                <input
                  type="text"
                  value={studioInfo.name}
                  onChange={(e) => setStudioInfo({ ...studioInfo, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Mein Studio"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">E-Mail</label>
                <input
                  type="email"
                  value={studioInfo.email}
                  onChange={(e) => setStudioInfo({ ...studioInfo, email: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="kontakt@studio.de"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={studioInfo.phone}
                  onChange={(e) => setStudioInfo({ ...studioInfo, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="+49 123 456789"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Website</label>
                <input
                  type="url"
                  value={studioInfo.website}
                  onChange={(e) => setStudioInfo({ ...studioInfo, website: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="https://www.mein-studio.de"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-2">Adresse</label>
                <input
                  type="text"
                  value={studioInfo.address}
                  onChange={(e) => setStudioInfo({ ...studioInfo, address: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Musterstraße 123"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">PLZ</label>
                <input
                  type="text"
                  value={studioInfo.zip}
                  onChange={(e) => setStudioInfo({ ...studioInfo, zip: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="12345"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Stadt</label>
                <input
                  type="text"
                  value={studioInfo.city}
                  onChange={(e) => setStudioInfo({ ...studioInfo, city: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Berlin"
                />
              </div>
            </div>
          </div>
        )}

        {/* Opening Hours Tab */}
        {activeTab === 'hours' && (
          <div className="space-y-3">
            {openingHours.map((hours, index) => (
              <div
                key={hours.day}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-800 rounded-lg"
              >
                <div className="w-28 flex-shrink-0">
                  <span className="font-medium text-white">{hours.day}</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hours.closed}
                    onChange={(e) => updateHours(index, 'closed', !e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-blue-500"
                  />
                  <span className="text-sm text-zinc-400">Geöffnet</span>
                </label>

                {!hours.closed && (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateHours(index, 'open', e.target.value)}
                      className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                    <span className="text-zinc-500">bis</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateHours(index, 'close', e.target.value)}
                      className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                  </div>
                )}

                {hours.closed && (
                  <span className="text-zinc-500 text-sm">Geschlossen</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            {/* Google Reviews */}
            <div className="p-4 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Google Bewertungen</h3>
                  <p className="text-sm text-zinc-400">Link für automatische Review-Anfragen</p>
                </div>
              </div>

              <input
                type="url"
                value={integrations.googleReviewLink}
                onChange={(e) => setIntegrations({ ...integrations, googleReviewLink: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="https://g.page/r/..."
              />
              <p className="mt-2 text-xs text-zinc-500">
                Kunden erhalten nach dem Termin automatisch einen Link zu deinen Google-Bewertungen
              </p>
            </div>

            {/* Stripe */}
            <div className="p-4 bg-zinc-800 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Stripe Zahlungen</h3>
                    <p className="text-sm text-zinc-400">Online-Zahlungen akzeptieren</p>
                  </div>
                </div>

                {integrations.stripeConnected ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    Verbunden
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-600 text-zinc-300">
                    Nicht verbunden
                  </span>
                )}
              </div>

              {!integrations.stripeConnected && (
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                  <ExternalLink className="w-4 h-4" />
                  Mit Stripe verbinden
                </button>
              )}
            </div>

            {/* Email Templates */}
            <div className="p-4 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">E-Mail Templates</h3>
                  <p className="text-sm text-zinc-400">Bestätigung, Erinnerung, Review-Anfrage</p>
                </div>
              </div>

              <p className="text-sm text-zinc-400">
                Die E-Mail-Templates werden automatisch mit deinen Studio-Daten personalisiert.
                Eigene Templates sind im Enterprise-Plan verfügbar.
              </p>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-white">Buchungsbestätigung</p>
                <p className="text-sm text-zinc-400">E-Mail nach jeder neuen Buchung</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailConfirmation}
                  onChange={(e) => setNotifications({ ...notifications, emailConfirmation: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-white">Terminerinnerung</p>
                <p className="text-sm text-zinc-400">E-Mail 24h vor dem Termin</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailReminder}
                  onChange={(e) => setNotifications({ ...notifications, emailReminder: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-white">Review-Anfrage</p>
                <p className="text-sm text-zinc-400">E-Mail nach abgeschlossenem Termin</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailReview}
                  onChange={(e) => setNotifications({ ...notifications, emailReview: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg opacity-60">
              <div>
                <p className="font-medium text-white">SMS-Erinnerung</p>
                <p className="text-sm text-zinc-400">SMS 2h vor dem Termin (Enterprise)</p>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={notifications.smsReminder}
                  disabled
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-5 after:w-5"></div>
              </label>
            </div>
          </div>
        )}

        {/* No-Show-Killer Tab */}
        {activeTab === 'noShowKiller' && <NoShowKillerSettings />}
        </div>
      </div>

      {/* Additional Settings Links */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/dashboard/branding"
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-cyan-500/30 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition">
              <Palette className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">Branding</div>
              <div className="text-sm text-gray-400">Buchungsseite anpassen</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition" />
          </div>
        </Link>

        <Link
          to="/dashboard/locations"
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-cyan-500/30 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition">
              <MapPin className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">Multi-Standort</div>
              <div className="text-sm text-gray-400">Mehrere Standorte verwalten</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition" />
          </div>
        </Link>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Speichern...' : 'Alle Änderungen speichern'}
        </button>
      </div>
    </div>
  );
}
