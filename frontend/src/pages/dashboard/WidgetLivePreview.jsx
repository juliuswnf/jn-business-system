import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowLeft, Monitor } from 'lucide-react';
import { salonAPI } from '../../utils/api';

export default function WidgetLivePreview() {
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    const loadSalonSlug = async () => {
      try {
        const response = await salonAPI.getInfo(true);
        const salon = response?.data?.salon || response?.data || {};
        setSlug(salon?.slug || '');
      } catch {
        setSlug('');
      } finally {
        setLoading(false);
      }
    };

    loadSalonSlug();
  }, []);

  const previewUrl = useMemo(() => (slug ? `/s/${slug}` : ''), [slug]);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-white">
        <p className="text-gray-400">Live Preview wird geladen...</p>
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-white space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Widget Live Preview</h1>
        <p className="text-gray-400">Für dieses Studio konnte kein öffentlicher Booking-Link ermittelt werden.</p>
        <Link to="/dashboard/widget" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-900 transition">
          <ArrowLeft className="w-4 h-4" />
          Zurück zu Widget Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-2xl font-semibold tracking-tight text-white">Widget Live Preview</h1>
          <p className="text-gray-400 text-sm">Exakt die öffentliche Buchungsseite, wie sie Kunden sehen.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/widget" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-900 text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Widget Setup
          </Link>
          <Link to={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black hover:bg-gray-200 transition font-medium">
            <ExternalLink className="w-4 h-4" />
            In neuem Tab öffnen
          </Link>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-gray-300 text-sm">
          <Monitor className="w-4 h-4" />
          {previewUrl}
        </div>
        <div className="h-[75vh] bg-black">
          <iframe
            title="Widget Live Preview"
            src={previewUrl}
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
