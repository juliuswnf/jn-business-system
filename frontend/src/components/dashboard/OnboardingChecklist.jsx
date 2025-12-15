import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, MapPin, Clock, Scissors, Link2, Code, 
  Check, ChevronRight, X, Sparkles 
} from 'lucide-react';
import { salonAPI, serviceAPI } from '../../utils/api';

const CHECKLIST_ITEMS = [
  { id: 'info', label: 'Studio-Info hinzufügen', icon: Building2, link: '/onboarding' },
  { id: 'address', label: 'Adresse eintragen', icon: MapPin, link: '/onboarding' },
  { id: 'hours', label: 'Öffnungszeiten festlegen', icon: Clock, link: '/onboarding' },
  { id: 'services', label: 'Services anlegen', icon: Scissors, link: '/dashboard/services' },
  { id: 'google', label: 'Google Review Link', icon: Link2, link: '/dashboard/settings' },
  { id: 'widget', label: 'Widget-Code kopieren', icon: Code, link: '/dashboard/widget' },
];

export default function OnboardingChecklist() {
  const [checklist, setChecklist] = useState({
    info: false,
    address: false,
    hours: false,
    services: false,
    google: false,
    widget: false,
  });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const [salonRes, servicesRes] = await Promise.all([
        salonAPI.getInfo().catch(() => ({ data: {} })),
        serviceAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      const salon = salonRes.data || {};
      const services = servicesRes.data?.data || [];

      const status = {
        info: !!(salon.name && salon.email),
        address: !!(salon.address?.city),
        hours: !!(salon.openingHours?.length > 0),
        services: services.length > 0,
        google: !!salon.googleReviewLink,
        widget: !!salon.onboardingCompleted,
      };

      setChecklist(status);
      
      const completed = Object.values(status).filter(Boolean).length;
      setProgress(Math.round((completed / 6) * 100));

      // If all done or previously dismissed
      if (completed === 6 || localStorage.getItem('onboardingDismissed') === 'true') {
        setDismissed(true);
      }
    } catch (error) {
      console.error('Onboarding check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('onboardingDismissed', 'true');
    setDismissed(true);
  };

  if (loading || dismissed || progress === 100) {
    return null;
  }

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const remainingItems = CHECKLIST_ITEMS.filter(item => !checklist[item.id]);

  return (
    <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-indigo-500/30 rounded-2xl p-6 mb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Studio einrichten</h3>
            <p className="text-sm text-zinc-400">{completedCount} von 6 Schritten erledigt</p>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="p-1 text-zinc-500 hover:text-zinc-300 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-zinc-800 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {CHECKLIST_ITEMS.slice(0, 4).map((item) => {
          const isCompleted = checklist[item.id];
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.id}
              to={item.link}
              className={`flex items-center justify-between p-3 rounded-xl transition ${
                isCompleted 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isCompleted ? 'bg-green-500/20' : 'bg-zinc-700'
                }`}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Icon className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
                <span className={`text-sm ${isCompleted ? 'text-green-400 line-through' : 'text-white'}`}>
                  {item.label}
                </span>
              </div>
              {!isCompleted && (
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Show More Button */}
      {remainingItems.length > 0 && (
        <Link
          to="/onboarding"
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition"
        >
          Weiter einrichten
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
