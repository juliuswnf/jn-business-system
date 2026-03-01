import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, Clock, Scissors, Link2, Code, 
  Check, ChevronRight, ChevronLeft, Loader2, Copy, ExternalLink
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { salonAPI, serviceAPI, widgetAPI } from '../../utils/api';

const STEPS = [
  { id: 1, title: 'Studio-Info', icon: Building2, description: 'Name & Kontakt' },
  { id: 2, title: 'Adresse', icon: MapPin, description: 'Standort' },
  { id: 3, title: 'Öffnungszeiten', icon: Clock, description: 'Wann bist du geöffnet?' },
  { id: 4, title: 'Services', icon: Scissors, description: 'Was bietest du an?' },
  { id: 5, title: 'Google Reviews', icon: Link2, description: 'Bewertungs-Link' },
  { id: 6, title: 'Widget', icon: Code, description: 'Buchungs-Code' },
];

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const DEFAULT_SERVICES = [
  { name: 'Beratung Standard', duration: 30, price: 25 },
  { name: 'Beratung Premium', duration: 45, price: 40 },
  { name: 'Basis Service', duration: 30, price: 25 },
  { name: 'Behandlung Komplett', duration: 90, price: 80 },
  { name: 'Express Service', duration: 20, price: 15 },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 1: Studio Info
  const [studioInfo, setStudioInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Step 2: Address
  const [address, setAddress] = useState({
    street: '',
    city: '',
    zip: '',
  });

  // Step 3: Opening Hours
  const [openingHours, setOpeningHours] = useState(
    DAYS.map((day, i) => ({
      day,
      open: '09:00',
      close: '18:00',
      closed: i === 6, // Sonntag geschlossen
    }))
  );

  // Step 4: Services
  const [services, setServices] = useState([
    { name: '', duration: 30, price: 0, enabled: true },
  ]);

  // Step 5: Google Reviews
  const [googleReviewLink, setGoogleReviewLink] = useState('');

  // Step 6: Widget Code
  const [widgetCode, setWidgetCode] = useState('');
  const [salonSlug, setSalonSlug] = useState('');

  // Load existing data
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      const response = await salonAPI.getInfo().catch(() => null);
      
      if (response?.data) {
        const salon = response.data;
        
        setStudioInfo({
          name: salon.name || '',
          email: salon.email || '',
          phone: salon.phone || '',
        });

        if (salon.address) {
          setAddress({
            street: salon.address.street || '',
            city: salon.address.city || '',
            zip: salon.address.zip || '',
          });
        }

        if (salon.openingHours?.length) {
          setOpeningHours(salon.openingHours);
        }

        if (salon.googleReviewLink) {
          setGoogleReviewLink(salon.googleReviewLink);
        }

        if (salon.slug) {
          setSalonSlug(salon.slug);
          generateWidgetCode(salon.slug);
        }

        // Check completion status
        const step = determineCurrentStep(salon);
        setCurrentStep(step);
      }

      // Load services
      const servicesRes = await serviceAPI.getAll().catch(() => null);
      if (servicesRes?.data?.data?.length) {
        setServices(servicesRes.data.data.map(s => ({
          ...s,
          enabled: true
        })));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const determineCurrentStep = (salon) => {
    if (!salon.name) return 1;
    if (!salon.address?.city) return 2;
    if (!salon.openingHours?.length) return 3;
    return 4;
  };

  const generateWidgetCode = (slug) => {
    const baseUrl = window.location.origin;
    const code = `<!-- JN Booking Widget -->
<div id="jn-booking-widget" data-salon="${slug}"></div>
<script src="${baseUrl}/widget.js" async></script>`;
    setWidgetCode(code);
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      // Save current step data
      switch (currentStep) {
        case 1:
          if (!studioInfo.name || !studioInfo.email) {
            showNotification('Bitte fülle alle Pflichtfelder aus', 'error');
            setSaving(false);
            return;
          }
          await salonAPI.update({ 
            name: studioInfo.name, 
            email: studioInfo.email, 
            phone: studioInfo.phone 
          });
          break;

        case 2:
          if (!address.city) {
            showNotification('Bitte gib mindestens die Stadt an', 'error');
            setSaving(false);
            return;
          }
          await salonAPI.update({ address });
          break;

        case 3:
          await salonAPI.update({ openingHours });
          break;

        case 4: {
          const validServices = services.filter(s => s.name && s.name.trim() && s.price > 0);
          if (validServices.length === 0) {
            showNotification('Füge mindestens einen Service mit Name und Preis hinzu', 'error');
            setSaving(false);
            return;
          }
          try {
            for (const service of validServices) {
              if (!service._id) {
                await serviceAPI.create({
                  name: service.name.trim(),
                  duration: service.duration || 30,
                  price: service.price
                });
              } else {
                await serviceAPI.update(service._id, {
                  name: service.name.trim(),
                  duration: service.duration || 30,
                  price: service.price
                });
              }
            }
          } catch (serviceError) {
            showNotification('Fehler beim Speichern der Services: ' + (serviceError.response?.data?.message || serviceError.message), 'error');
            setSaving(false);
            return;
          }
          break;
        }

        case 5:
          await salonAPI.update({ googleReviewLink });
          break;

        case 6:
          // Complete onboarding
          await salonAPI.update({ onboardingCompleted: true });
          showNotification('Onboarding abgeschlossen! Dein Studio ist bereit.', 'success');
          navigate('/dashboard');
          return;
      }

      setCurrentStep(prev => Math.min(prev + 1, 6));
      showNotification('Gespeichert!', 'success');
    } catch (error) {
      showNotification('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addService = () => {
    setServices(prev => [...prev, { name: '', duration: 30, price: 0, enabled: true }]);
  };

  const removeService = (index) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const updateService = (index, field, value) => {
    setServices(prev => prev.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    ));
  };

  const useTemplate = (template) => {
    setServices(DEFAULT_SERVICES.map(s => ({ ...s, enabled: true })));
  };

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    showNotification('Code kopiert!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const updateHours = (index, field, value) => {
    setOpeningHours(prev => prev.map((h, i) => 
      i === index ? { ...h, [field]: value } : h
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Progress Bar */}
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Studio einrichten</h1>
            <span className="text-sm text-zinc-400">Schritt {currentStep} von 6</span>
          </div>
          
          {/* Step Indicators */}
          <div className="flex gap-2">
            {STEPS.map((step) => (
              <div 
                key={step.id}
                className={`flex-1 h-2 rounded-full transition-all ${
                  step.id < currentStep 
                    ? 'bg-green-500' 
                    : step.id === currentStep 
                    ? 'bg-white' 
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center mx-auto mb-4">
            {React.createElement(STEPS[currentStep - 1].icon, { className: 'w-8 h-8 text-white' })}
          </div>
          <h2 className="text-2xl font-bold mb-2">{STEPS[currentStep - 1].title}</h2>
          <p className="text-zinc-400">{STEPS[currentStep - 1].description}</p>
        </div>

        {/* Step Content */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 mb-8">
          
          {/* Step 1: Studio Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Studio Name *
                </label>
                <input
                  type="text"
                  value={studioInfo.name}
                  onChange={(e) => setStudioInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Hairstyle Studio München"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={studioInfo.email}
                  onChange={(e) => setStudioInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="kontakt@deinstudio.de"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={studioInfo.phone}
                  onChange={(e) => setStudioInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+49 89 123456"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Straße & Hausnummer
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Musterstraße 123"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    PLZ
                  </label>
                  <input
                    type="text"
                    value={address.zip}
                    onChange={(e) => setAddress(prev => ({ ...prev, zip: e.target.value }))}
                    placeholder="80331"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Stadt *
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="München"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Opening Hours */}
          {currentStep === 3 && (
            <div className="space-y-3">
              {openingHours.map((hours, index) => (
                <div key={hours.day} className="flex items-center gap-4 py-2">
                  <span className="w-28 text-sm text-zinc-300">{hours.day}</span>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => updateHours(index, 'closed', !e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-zinc-400">Geöffnet</span>
                  </label>

                  {!hours.closed && (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateHours(index, 'open', e.target.value)}
                        className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-sm"
                      />
                      <span className="text-zinc-500">-</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateHours(index, 'close', e.target.value)}
                        className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-sm"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Services */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Quick Template */}
              <button
                onClick={useTemplate}
                className="w-full px-4 py-3 border border-dashed border-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-900 hover:border-zinc-500 transition text-sm"
              >
                Beispiel-Services verwenden
              </button>

              {/* Services List */}
              {services.map((service, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => updateService(index, 'name', e.target.value)}
                    placeholder="Service Name"
                    className="col-span-5 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-sm"
                  />
                  <div className="col-span-3 flex items-center gap-1">
                    <input
                      type="number"
                      value={service.duration}
                      onChange={(e) => updateService(index, 'duration', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-sm text-center"
                    />
                    <span className="text-xs text-zinc-500">min</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <input
                      type="number"
                      value={service.price}
                      onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-sm text-center"
                    />
                    <span className="text-xs text-zinc-500">€</span>
                  </div>
                  <button
                    onClick={() => removeService(index)}
                    className="col-span-1 text-zinc-500 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={addService}
                className="w-full px-4 py-3 border border-dashed border-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-900 hover:border-zinc-500 transition"
              >
                + Service hinzufügen
              </button>
            </div>
          )}

          {/* Step 5: Google Reviews */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-zinc-50 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-zinc-900 mb-2">Wozu der Google Review Link?</h4>
                <p className="text-sm text-zinc-400">
                  Nach jedem Termin senden wir automatisch eine E-Mail mit deinem Review-Link. 
                  Das erhöht deine Google-Bewertungen erheblich!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Google Review Link
                </label>
                <input
                  type="url"
                  value={googleReviewLink}
                  onChange={(e) => setGoogleReviewLink(e.target.value)}
                  placeholder="https://g.page/r/..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>

              <a 
                href="https://support.google.com/business/answer/7035772" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Wie finde ich meinen Google Review Link?
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Step 6: Widget Code */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-green-600 mb-2">Fast geschafft!</h4>
                <p className="text-sm text-zinc-300">
                  Kopiere diesen Code und füge ihn in deine Website ein, wo das Buchungsformular erscheinen soll.
                </p>
              </div>

              <div className="relative">
                <pre className="bg-zinc-50 rounded-xl p-4 text-sm text-zinc-300 overflow-x-auto">
                  {widgetCode || `<!-- JN Booking Widget -->
<div id="jn-booking-widget" data-salon="${salonSlug || 'dein-studio'}"></div>
<script src="${window.location.origin}/widget.js" async></script>`}
                </pre>
                <button
                  onClick={copyWidgetCode}
                  className="absolute top-3 right-3 p-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="bg-zinc-50 rounded-xl p-4">
                <h4 className="font-medium text-zinc-900 mb-2">Deine Buchungs-URL:</h4>
                <a 
                  href={`/s/${salonSlug || 'dein-studio'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm break-all"
                >
                  {window.location.origin}/s/{salonSlug || 'dein-studio'}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Zurück
          </button>

          <button
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 disabled:opacity-50 transition"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : currentStep === 6 ? (
              <>
                <Check className="w-5 h-5" />
                Fertig
              </>
            ) : (
              <>
                Weiter
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Skip Link */}
        {currentStep < 6 && (
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition"
            >
              Später fortsetzen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
