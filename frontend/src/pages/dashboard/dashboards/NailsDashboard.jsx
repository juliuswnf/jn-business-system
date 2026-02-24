import React from 'react';
import { CircleDot, Zap, AlertCircle } from 'lucide-react';

export default function NailsDashboard() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Nails Studio Dashboard</h1>
        <p className="text-sm text-gray-400">Willkommen in deinem Nails Studio.</p>
      </header>

      <div className="bg-purple-500/20 border border-purple-500 rounded-2xl p-6 flex items-start gap-4">
        <CircleDot className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-purple-50 mb-2">Coming Soon</h2>
          <p className="text-purple-100 mb-4">
            Das Nails Studio Dashboard wird derzeit entwickelt. Features für Nagel-Designs und Kunstnägel-Management werden bald verfügbar sein.
          </p>
          <div className="bg-purple-900/30 rounded p-4 border border-purple-500/30">
            <p className="text-sm text-purple-100">
              <strong>Geplante Features:</strong>
            </p>
            <ul className="text-sm text-purple-100 mt-2 space-y-1">
              <li>- Design-Galerie</li>
              <li>- Nagel-Techniker Verwaltung</li>
              <li>- Farb-Katalog</li>
              <li>- Kundenwünsche Tracking</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Designs</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Techniker</span>
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
