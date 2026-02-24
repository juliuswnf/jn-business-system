import React from 'React';
import { PawPrint, Zap, AlertCircle } from 'lucide-react';

export default function PetGroomingDashboard() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Pet Grooming Dashboard</h1>
        <p className="text-sm text-gray-400">Willkommen in deinem Pet Grooming Studio.</p>
      </header>

      <div className="bg-indigo-500/20 border border-indigo-500 rounded-2xl p-6 flex items-start gap-4">
        <PawPrint className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-indigo-50 mb-2">Coming Soon</h2>
          <p className="text-indigo-100 mb-4">
            Das Pet Grooming Dashboard wird derzeit entwickelt. Features für Haustier-Management und Pflegepläne werden bald verfügbar sein.
          </p>
          <div className="bg-indigo-900/30 rounded p-4 border border-indigo-500/30">
            <p className="text-sm text-indigo-100">
              <strong>Geplante Features:</strong>
            </p>
            <ul className="text-sm text-indigo-100 mt-2 space-y-1">
              <li>- Haustier-Verwaltung</li>
              <li>- Groomer-Verwaltung</li>
              <li>- Pflegepläne</li>
              <li>- Gesundheits-Tracking</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Haustiere</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Groomer</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Besitzer</span>
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
