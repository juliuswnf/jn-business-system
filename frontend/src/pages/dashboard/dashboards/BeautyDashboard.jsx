import React from 'react';
import { Sparkles, Zap, AlertCircle } from 'lucide-react';

export default function BeautyDashboard() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Beauty Studio Dashboard</h1>
        <p className="text-sm text-gray-400">Willkommen in deinem Beauty Studio.</p>
      </header>

      <div className="bg-pink-500/20 border border-pink-500 rounded-2xl p-6 flex items-start gap-4">
        <Sparkles className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-pink-50 mb-2">Coming Soon</h2>
          <p className="text-pink-100 mb-4">
            Das Beauty Studio Dashboard wird derzeit entwickelt. Features für Make-up, Skincare und Beauty-Behandlungen werden bald verfügbar sein.
          </p>
          <div className="bg-pink-900/30 rounded p-4 border border-pink-500/30">
            <p className="text-sm text-pink-100">
              <strong>Geplante Features:</strong>
            </p>
            <ul className="text-sm text-pink-100 mt-2 space-y-1">
              <li>- Make-up Services</li>
              <li>- Kosmetiker-Verwaltung</li>
              <li>- Skincare Programme</li>
              <li>- Behandlungs-Tracker</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Services</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Kosmetiker</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Kunden</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Umsatz</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
      </div>
    </div>
  );
}
