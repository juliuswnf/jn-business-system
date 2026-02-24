import React from 'react';
import { Stethoscope, Zap, AlertCircle } from 'lucide-react';

export default function MedicalSpaDashboard() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Medical Spa Dashboard</h1>
        <p className="text-sm text-gray-400">Willkommen in deinem Medical Spa.</p>
      </header>

      <div className="bg-blue-500/20 border border-blue-500 rounded-2xl p-6 flex items-start gap-4">
        <Stethoscope className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-blue-50 mb-2">Coming Soon</h2>
          <p className="text-blue-100 mb-4">
            Das Medical Spa Dashboard wird derzeit entwickelt. Spezielle Features für Medical Spas wie Behandlungs-Protokolle und PatienteDaten werden bald verfügbar sein.
          </p>
          <div className="bg-blue-900/30 rounded p-4 border border-blue-500/30">
            <p className="text-sm text-blue-100">
              <strong>Geplante Features:</strong>
            </p>
            <ul className="text-sm text-blue-100 mt-2 space-y-1">
              <li>- Behandlungs-Protokolle</li>
              <li>- Patienten-Management</li>
              <li>- Compliance Tracking</li>
              <li>- Dokumentation</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Behandlungen</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Patienten</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Compliance</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-gray-500">Berichte</span>
          <p className="text-2xl font-semibold text-white">-</p>
        </div>
      </div>
    </div>
  );
}
