import React from 'react';
import CoreDashboard from './CoreDashboard';

export default function TattooStudioDashboard() {
  return (
    <CoreDashboard
      title="Tattoo Studio Kontrollpanel"
      subtitle="Willkommen in deinem Tattoo Studio."
      appointmentsTitle="Anstehende Sessions heute"
      appointmentsSubtitle="Alle noch ausstehenden Sessions für deinen heutigen Tag."
      newAppointmentButtonLabel="Neue Session anlegen"
      modalTitle="Neue Session anlegen"
      emptyTitle="Für heute stehen keine weiteren Sessions an."
      emptySubtitle="Nutze die Zeit für Beratung, Design und Planung."
    />
  );
}
