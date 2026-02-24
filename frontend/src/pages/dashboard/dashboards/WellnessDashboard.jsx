import React from 'react';
import { Leaf, Zap, AlertCircle } from 'lucide-react';

export default function WellnessDashboard() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Wellness Center Dashboard</h1>
        <p className="text-sm text-gray-400">Willkommen in deinem Wellness Center.</p>
      </header>

      <div className="bg-green-500/20 border border-green-500 rounded-2xl p-6 flex items-start gap-4">
        <Leaf className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-green-50 mb-2">Coming Soon</h2>
          <p className="text-green-100 mb-4">
            Das Wellness Center Dashboard wird derzeit entwickelt. Features wie Yoga-Klassen, Meditationskurse und Wellness-Programme werden bald verfügbar sein.
          </p>
          <div className="bg-green-900/30 rounded p-4 border border-green-500/30">
            <p className="text-sm text-green-100">
              <strong>Geplante Features:</strong>
            </p>
            <ul className="text-sm text-green-100 mt-2 space-y-1">
              <li>- Klassen-Management</li>
              <li>- Trainer-Verwaltung</li>
              <li>- Wellness-Programme</li>
              <li>- Fortschritts-Tracking</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Klassen</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Trainer</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Mitglieder</span>
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
