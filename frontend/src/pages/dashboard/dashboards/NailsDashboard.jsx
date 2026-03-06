import React from 'react';
import CoreDashboard from './CoreDashboard';

export default function NailsDashboard() {
  return (
    <CoreDashboard
      title="Nagelstudio Kontrollpanel"
      subtitle="Willkommen in deinem Nagelstudio."
      appointmentsTitle="Anstehende Termine heute"
      newAppointmentButtonLabel="Neuen Termin anlegen"
      modalTitle="Neuen Termin anlegen"
      emptyTitle="Für heute stehen keine weiteren Nagelstudio-Termine an."
      emptySubtitle="Nutze die Zeit für Vorbereitung oder spontane Walk-ins."
    />
  );
}
