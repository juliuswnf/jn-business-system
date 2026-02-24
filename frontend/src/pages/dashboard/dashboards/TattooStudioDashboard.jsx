import React from 'react';
import { Palette, Zap, AlertCircle } from 'lucide-react';

export default function TattooStudioDashboard() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Tattoo Studio Dashboard</h1>
        <p className="text-sm text-gray-400">Willkommen in deinem Tattoo Studio.</p>
      </header>

      <div className="bg-amber-500/20 border border-amber-500 rounded-2xl p-6 flex items-start gap-4">
        <Palette className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-amber-50 mb-2">Coming Soon</h2>
          <p className="text-amber-100 mb-4">
            Das Tattoo Studio Dashboard wird derzeit entwickelt. Spezielle Features für Tattoo-Studios wie Künstler-Management, Portfolio und Termin-Buchung werden bald verfügbar sein.
          </p>
          <div className="bg-amber-900/30 rounded p-4 border border-amber-500/30">
            <p className="text-sm text-amber-100">
              <strong>Geplante Features:</strong>
            </p>
            <ul className="text-sm text-amber-100 mt-2 space-y-1">
              <li>- Künstler-Verwaltung</li>
              <li>- Portfolio-Galerie</li>
              <li>- Design-Konsultation Tracking</li>
              <li>- Session-Management</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Kunstauftrag</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Künstler</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Bewertung</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Portfolio</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
      </div>
    </div>
  );
}
