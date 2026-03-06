import React from 'react';
import CoreDashboard from './CoreDashboard';

export default function MedicalSpaDashboard() {
  return (
    <CoreDashboard
      title="Medical Spa Kontrollpanel"
      subtitle="Willkommen in deinem Medical Spa."
      appointmentsTitle="Anstehende Behandlungen heute"
      appointmentsSubtitle="Alle noch ausstehenden Behandlungen für deinen heutigen Tag."
      newAppointmentButtonLabel="Neue Behandlung anlegen"
      modalTitle="Neue Behandlung anlegen"
      emptyTitle="Für heute stehen keine weiteren Behandlungen an."
      emptySubtitle="Nutze die Zeit für Dokumentation und Nachsorgeplanung."
    />
  );
}
