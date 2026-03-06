import React from 'react';
import CoreDashboard from './CoreDashboard';

export default function BeautyDashboard() {
  return (
    <CoreDashboard
      title="Beauty Studio Kontrollpanel"
      subtitle="Willkommen in deinem Beauty Studio."
      appointmentsTitle="Anstehende Termine heute"
      newAppointmentButtonLabel="Neuen Termin anlegen"
      modalTitle="Neuen Termin anlegen"
      emptyTitle="Für heute stehen keine weiteren Beauty-Termine an."
      emptySubtitle="Nutze die Zeit für Beratung oder spontane Walk-ins."
    />
  );
}
