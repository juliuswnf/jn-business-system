import React from 'react';
import { Palette } from 'lucide-react';

export default function TattooStudioDashboard() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900">Tattoo Studio Kontrollpanel</h1>
        <p className="text-sm text-zinc-500">Willkommen in deinem Tattoo Studio.</p>
      </header>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
        <Palette className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-amber-900 mb-2">In Entwicklung</h2>
          <p className="text-amber-800 mb-4">
            Das Tattoo Studio Kontrollpanel wird derzeit entwickelt. Spezielle Funktionen für Tattoo-Studios werden bald verfügbar sein.
          </p>
          <div className="bg-amber-100/50 rounded p-4 border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Geplante Funktionen:</strong>
            </p>
            <ul className="text-sm text-amber-800 mt-2 space-y-1">
              <li>- Mehrsitzungs-Projekte (z. B. Sleeve über 4 Termine)</li>
              <li>- Fortschritts-Dokumentation mit Fotos</li>
              <li>- Portfolio & Galerie</li>
              <li>- Körperstellen-Planung</li>
              <li>- Einwilligungserklärungen</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Projekte</span>
          <p className="text-2xl font-semibold text-zinc-900">-</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Künstler</span>
          <p className="text-2xl font-semibold text-zinc-900">-</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Portfolio</span>
          <p className="text-2xl font-semibold text-zinc-900">-</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Umsatz</span>
          <p className="text-2xl font-semibold text-zinc-900">-</p>
        </div>
      </div>
    </div>
  );
}
