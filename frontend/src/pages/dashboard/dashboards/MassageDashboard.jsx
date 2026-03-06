import React from 'react';
import CoreDashboard from './CoreDashboard';

export default function MassageDashboard() {
  return (
    <CoreDashboard
      title="Massage Kontrollpanel"
      subtitle="Willkommen in deiner Massagepraxis."
      appointmentsTitle="Anstehende Behandlungen heute"
      appointmentsSubtitle="Alle noch ausstehenden Behandlungen für deinen heutigen Tag."
      newAppointmentButtonLabel="Neue Behandlung anlegen"
      modalTitle="Neue Behandlung anlegen"
      emptyTitle="Für heute stehen keine weiteren Behandlungen an."
      emptySubtitle="Nutze die Zeit für Dokumentation oder spontane Walk-ins."
    />
  );
}
