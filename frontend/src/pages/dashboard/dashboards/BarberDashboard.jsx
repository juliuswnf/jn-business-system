import React from 'react';
import { Scissors, Zap, AlertCircle } from 'lucide-react';

export default function BarberDashboard() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Barbershop Dashboard</h1>
        <p className="text-sm text-gray-400">Willkommen in deinem Barbershop.</p>
      </header>

      <div className="bg-orange-500/20 border border-orange-500 rounded-2xl p-6 flex items-start gap-4">
        <Scissors className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-orange-50 mb-2">Coming Soon</h2>
          <p className="text-orange-100 mb-4">
            Das Barbershop Dashboard wird derzeit entwickelt. Features für Barber-Spezialisten und Walk-In Management werden bald verfügbar sein.
          </p>
          <div className="bg-orange-900/30 rounded p-4 border border-orange-500/30">
            <p className="text-sm text-orange-100">
              <strong>Geplante Features:</strong>
            </p>
            <ul className="text-sm text-orange-100 mt-2 space-y-1">
              <li>- Friseur-Management</li>
              <li>- Walk-In Queue</li>
              <li>- Spezial-Schnitte</li>
              <li>- Kundenprofile</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Schnitte</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Friseure</span>
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
