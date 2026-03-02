import React from 'react';
import { Scissors } from 'lucide-react';
import { FeatureGate } from '../../../components/common';
import { useNotification } from '../../../hooks/useNotification';
import { usePlanAccess } from '../../../hooks/usePlanAccess';

export default function BarberDashboard() {
  const { showNotification } = useNotification();
  const { currentTier } = usePlanAccess();

  const openAppointments = () => {
    showNotification('Terminübersicht wird geöffnet.', 'success');
  };

  const openMemberships = () => {
    showNotification('Mitgliedschaften werden geöffnet.', 'success');
  };

  const openUpsells = () => {
    showNotification('Zusatzverkäufe werden geöffnet.', 'success');
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900">Barbershop Kontrollpanel</h1>
        <p className="text-sm text-zinc-500">Willkommen in deinem Barbershop.</p>
      </header>

      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex items-start gap-4">
        <Scissors className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-orange-900 mb-2">In Entwicklung</h2>
          <p className="text-orange-800 mb-4">
            Das Barbershop Kontrollpanel wird derzeit entwickelt. Spezielle Funktionen für Barbershops werden bald verfügbar sein.
          </p>
          <div className="bg-orange-100/50 rounded p-4 border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>Geplante Funktionen:</strong>
            </p>
            <ul className="text-sm text-orange-800 mt-2 space-y-1">
              <li>- Mitgliedschaften</li>
              <li>- Zusatzverkäufe (Upsells)</li>
              <li>- Pakete</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Mitgliedschaften</span>
          <p className="text-2xl font-semibold text-zinc-900">-</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Pakete</span>
          <p className="text-2xl font-semibold text-zinc-900">-</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Kunden</span>
          <p className="text-2xl font-semibold text-zinc-900">-</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 opacity-50">
          <span className="text-sm text-zinc-500">Umsatz</span>
          <p className="text-2xl font-semibold text-zinc-900">-</p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Schnellaktionen</h2>
          <p className="text-sm text-zinc-500">
            Premium-Funktionen bleiben sichtbar und sind je nach Plan freigeschaltet.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <FeatureGate
            currentTier={currentTier}
            requiredTier="starter"
            featureLabel="Terminverwaltung"
            onAllowed={openAppointments}
          >
            Termine verwalten
          </FeatureGate>

          <FeatureGate
            currentTier={currentTier}
            requiredTier="professional"
            featureLabel="Mitgliedschaften"
            onAllowed={openMemberships}
          >
            Mitgliedschaften
          </FeatureGate>

          <FeatureGate
            currentTier={currentTier}
            requiredTier="professional"
            featureLabel="Zusatzverkäufe"
            onAllowed={openUpsells}
          >
            Zusatzverkäufe
          </FeatureGate>
        </div>
      </section>
    </div>
  );
}
