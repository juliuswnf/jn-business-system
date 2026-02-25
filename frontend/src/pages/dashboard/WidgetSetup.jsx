import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Code, Palette, Type, Image, Eye } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { widgetAPI, serviceAPI, salonAPI } from '../../utils/api';

export default function WidgetSetup() {
  const { showNotification } = useNotification();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [config, setConfig] = useState({
    primaryColor: '#ffffff',
    backgroundColor: '#000000',
    accentColor: '#3b82f6',
    borderRadius: '12',
    fontFamily: 'Inter',
    buttonText: 'Termin buchen',
    headerText: 'Online Terminbuchung',
    showLogo: true,
    selectedServices: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use cached services if available to prevent duplicate requests
      const [widgetRes, servicesRes] = await Promise.all([
        widgetAPI.getConfig().catch(() => ({ data: {} })),
        serviceAPI.getAll(null, false).catch(() => ({ data: { data: [] } }))
      ]);

      if (widgetRes.data?.config) {
        setConfig(prev => ({ ...prev, ...widgetRes.data.config }));
      }

      const servicesList = servicesRes.data?.data || servicesRes.data || [];
      setServices(servicesList);

      // Only set default selected services if none are selected
      setConfig(prev => {
        if (servicesList.length > 0 && prev.selectedServices.length === 0) {
          return {
            ...prev,
            selectedServices: servicesList.map(s => s._id)
          };
        }
        return prev;
      });
    } catch (error) {
      console.error('Widget fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await widgetAPI.updateConfig(config);
      // Mark widget as configured in salon
      await salonAPI.update({ widgetConfigured: true });
      showNotification('Widget-Konfiguration gespeichert', 'success');
    } catch (error) {
      showNotification('Fehler beim Speichern', 'error');
    }
  };

  const embedCode = `<script src="https://jn-business-system.com/widget.js" data-studio-id="YOUR_STUDIO_ID"></script>
<div id="jn-booking-widget"></div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    showNotification('Code kopiert!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleService = (serviceId) => {
    setConfig(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Widget Setup</h1>
        <p className="text-slate-400 text-sm md:text-base">
          Konfiguriere dein Buchungs-Widget und bette es in deine Website ein
        </p>
        <div className="mt-4">
          <Link
            to="/dashboard/widget/live-preview"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition"
          >
            <Eye className="w-4 h-4" />
            Live Preview auf separater Seite öffnen
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Colors */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Farben</h2>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Primärfarbe</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Hintergrund</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Akzentfarbe</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text Settings */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <Type className="w-5 h-5 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Texte</h2>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Überschrift</label>
                  <input
                    type="text"
                    value={config.headerText}
                    onChange={(e) => setConfig({ ...config, headerText: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    placeholder="Online Terminbuchung"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Button-Text</label>
                  <input
                    type="text"
                    value={config.buttonText}
                    onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    placeholder="Termin buchen"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Border Radius (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={config.borderRadius}
                    onChange={(e) => setConfig({ ...config, borderRadius: e.target.value })}
                    className="w-full"
                  />
                  <span className="text-zinc-500 text-sm">{config.borderRadius}px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Services Selection */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <Image className="w-5 h-5 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Services auswählen</h2>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {services.length === 0 ? (
                  <p className="text-zinc-500 text-sm">Keine Services verfügbar</p>
                ) : (
                  services.map((service) => (
                    <label
                      key={service._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={config.selectedServices.includes(service._id)}
                        onChange={() => toggleService(service._id)}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-white">{service.name}</span>
                      <span className="text-zinc-500 text-sm ml-auto">{service.duration} Min</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Embed Code */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <Code className="w-5 h-5 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Embed Code</h2>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="relative">
                <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 overflow-x-auto">
                  <code>{embedCode}</code>
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
              </div>

              <p className="mt-3 text-sm text-gray-400">
                Kopiere diesen Code und füge ihn in deine Website ein, wo das Widget erscheinen soll.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-3 px-6 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition"
          >
            Konfiguration speichern
          </button>
        </div>

        {/* Live Preview */}
        <div className="xl:sticky xl:top-8 xl:self-start">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Live Preview</h2>
              </div>
            </div>
            <div className="p-4 md:p-6">
              {/* Widget Preview */}
              <div
                className="border border-zinc-700 overflow-hidden"
                style={{
                  backgroundColor: config.backgroundColor,
                  borderRadius: `${config.borderRadius}px`
                }}
              >
                <div className="p-6">
                  <h3
                    className="text-xl font-bold mb-4"
                    style={{ color: config.primaryColor }}
                  >
                    {config.headerText}
                  </h3>

                  <div className="space-y-3 mb-6">
                    {services.filter(s => config.selectedServices.includes(s._id)).slice(0, 3).map((service) => (
                      <div
                        key={service._id}
                        className="p-3 rounded-lg border"
                        style={{
                          borderColor: config.accentColor + '40',
                          borderRadius: `${Math.max(4, config.borderRadius - 4)}px`
                        }}
                      >
                        <p style={{ color: config.primaryColor }}>{service.name}</p>
                        <p className="text-sm opacity-60" style={{ color: config.primaryColor }}>
                          {service.duration} Min - {service.price}
                        </p>
                      </div>
                    ))}
                    {config.selectedServices.length === 0 && (
                      <p className="text-sm opacity-50" style={{ color: config.primaryColor }}>
                        Keine Services ausgewählt
                      </p>
                    )}
                  </div>

                  <button
                    className="w-full py-3 px-6 font-semibold transition"
                    style={{
                      backgroundColor: config.accentColor,
                      color: '#ffffff',
                      borderRadius: `${config.borderRadius}px`
                    }}
                  >
                    {config.buttonText}
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs text-zinc-500 text-center">
                So wird dein Widget auf deiner Website aussehen
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
