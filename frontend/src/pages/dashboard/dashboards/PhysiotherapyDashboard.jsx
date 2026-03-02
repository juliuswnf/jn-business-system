import React from 'react';
import { Activity } from 'lucide-react';

export default function PhysiotherapyDashboard() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900">Physiotherapie Kontrollpanel</h1>
        <p className="text-sm text-zinc-500">Willkommen in deiner Physiotherapie-Praxis.</p>
      </header>

      <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6 flex items-start gap-4">
        <Activity className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-cyan-900 mb-2">In Entwicklung</h2>
          <p className="text-cyan-800 mb-4">
            Das Physiotherapie Kontrollpanel wird derzeit entwickelt. Spezielle Funktionen für Physiotherapie-Praxen werden bald verfügbar sein.
          </p>
          <div className="bg-cyan-100/50 rounded p-4 border border-cyan-200">
            <p className="text-sm text-cyan-800">
              <strong>Geplante Funktionen:</strong>
            </p>
            <ul className="text-sm text-cyan-800 mt-2 space-y-1">
              <li>- Behandlungspläne</li>
              <li>- Fortschritts-Dokumentation</li>
              <li>- Nachsorge & Folgetermine</li>
              <li>- Einwilligungserklärungen</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Behandlungen</span>
          <p className="text-2xl font-semibold text-zinc-900">-</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Patienten</span>
          <p className="text-2xl font-semibold text-zinc-900">-</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Fortschritt</span>
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
