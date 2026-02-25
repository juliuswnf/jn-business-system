import { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { api } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function BrandingSettings() {
  const { showNotification } = useNotification();
  const [branding, setBranding] = useState({
    logo: null,
    primaryColor: '#EF4444',
    secondaryColor: '#1F2937',
    accentColor: '#10B981',
    fontFamily: 'inter',
    buttonStyle: 'rounded',
    showPoweredBy: true
  });
  const [permissions, setPermissions] = useState({
    canCustomize: false,
    canWhiteLabel: false,
    tier: 'starter'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch branding settings
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await api.get('/branding');

        if (res.data) {
          const data = res.data;
          if (data.success) {
            setBranding(data.branding);
            setPermissions(data.permissions);
          }
        }
      } catch (error) {
        // Error handled by UI state
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  // Save branding settings
  const handleSave = async () => {
    setSaving(true);
    try {
      // ? SECURITY FIX: Use central api instance
      const res = await api.put('/branding', branding);
      const data = res.data;

      if (data.success) {
        showNotification('Branding-Einstellungen gespeichert', 'success');
      } else {
        showNotification(data.error || 'Fehler beim Speichern', 'error');
      }
    } catch (error) {
      showNotification('Netzwerkfehler', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Upload logo
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      // ? SECURITY FIX: Use central api instance
      const res = await api.post('/branding/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const data = res.data;

      if (data.success) {
        setBranding(prev => ({ ...prev, logo: data.logoUrl }));
        showNotification('Logo hochgeladen', 'success');
      } else {
        showNotification(data.error || 'Fehler beim Hochladen', 'error');
      }
    } catch (error) {
      showNotification('Netzwerkfehler', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Delete logo
  const handleDeleteLogo = async () => {
    try {
      // ? SECURITY FIX: Use central api instance
      const res = await api.delete('/branding/logo');

      if (res.data.success) {
        setBranding(prev => ({ ...prev, logo: null }));
        showNotification('Logo gelöscht', 'success');
      }
    } catch (error) {
      showNotification('Fehler beim Löschen', 'error');
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!confirm('Möchten Sie das Branding wirklich auf Standard zurücksetzen?')) return;

    try {
      // ? SECURITY FIX: Use central api instance
      const res = await api.post('/branding/reset');
      const data = res.data;

      if (data.success) {
        setBranding(data.branding);
        showNotification('Branding zurückgesetzt', 'success');
      }
    } catch (error) {
      showNotification('Fehler beim Zurücksetzen', 'error');
    }
  };

  const fonts = [
    { value: 'inter', label: 'Inter' },
    { value: 'roboto', label: 'Roboto' },
    { value: 'open-sans', label: 'Open Sans' },
    { value: 'lato', label: 'Lato' },
    { value: 'montserrat', label: 'Montserrat' },
    { value: 'poppins', label: 'Poppins' }
  ];

  const buttonStyles = [
    { value: 'rounded', label: 'Abgerundet' },
    { value: 'square', label: 'Eckig' },
    { value: 'pill', label: 'Pill' }
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Branding</h1>
        <p className="text-gray-300">Passen Sie das Aussehen Ihrer Buchungsseite an</p>
      </div>

      {/* Tier Warning */}
      {!permissions.canCustomize && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-yellow-400 font-medium">Custom Branding nicht verfügbar</h3>
              <p className="text-yellow-300/70 text-sm mt-1">
                Custom Branding ist ab dem Professional-Tarif verfügbar.
                <a href="/pricing" className="text-yellow-400 hover:text-yellow-300 ml-1 underline">Jetzt upgraden</a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`space-y-6 ${!permissions.canCustomize ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Logo Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Logo</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
              {branding.logo ? (
                <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                {uploading ? 'Wird hochgeladen...' : 'Logo hochladen'}
              </button>
              {branding.logo && (
                <button
                  onClick={handleDeleteLogo}
                  className="text-red-500 hover:text-red-400 text-sm"
                >
                  Logo entfernen
                </button>
              )}
              <p className="text-xs text-gray-600">JPEG, PNG, SVG oder WebP. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Colors Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Farben</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Primärfarbe</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Sekundärfarbe</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Akzentfarbe</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={branding.accentColor}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography & Style */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Typografie & Stil</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Schriftart</label>
              <select
                value={branding.fontFamily}
                onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                {fonts.map(font => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Button-Stil</label>
              <select
                value={branding.buttonStyle}
                onChange={(e) => setBranding({ ...branding, buttonStyle: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                {buttonStyles.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* White Label (Enterprise only) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">White-Label</h2>
              <p className="text-sm text-gray-300 mt-1">
                "Powered by JN Business System" ausblenden
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!permissions.canWhiteLabel && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Enterprise</span>
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!branding.showPoweredBy}
                  onChange={(e) => setBranding({ ...branding, showPoweredBy: !e.target.checked })}
                  disabled={!permissions.canWhiteLabel}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Vorschau</h2>
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: branding.secondaryColor, fontFamily: branding.fontFamily }}
          >
            <div className="flex items-center gap-3 mb-4">
              {branding.logo ? (
                <img src={branding.logo} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-700"></div>
              )}
              <span className="text-white font-semibold">Ihr Unternehmen</span>
            </div>
            <p className="text-gray-300 mb-4">Wählen Sie einen Service für Ihre Buchung.</p>
            <button
              className={`px-6 py-2 text-white font-medium transition ${
                branding.buttonStyle === 'pill' ? 'rounded-full' :
                branding.buttonStyle === 'square' ? 'rounded-none' : 'rounded-lg'
              }`}
              style={{ backgroundColor: branding.primaryColor }}
            >
              Jetzt buchen
            </button>
            <button
              className={`ml-3 px-6 py-2 font-medium transition ${
                branding.buttonStyle === 'pill' ? 'rounded-full' :
                branding.buttonStyle === 'square' ? 'rounded-none' : 'rounded-lg'
              }`}
              style={{ backgroundColor: branding.accentColor, color: 'white' }}
            >
              Mehr erfahren
            </button>
            {branding.showPoweredBy && (
              <p className="text-xs text-gray-600 mt-4">Powered by JN Business System</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleReset}
            className="text-gray-300 hover:text-white text-sm"
          >
            Auf Standard zurücksetzen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

