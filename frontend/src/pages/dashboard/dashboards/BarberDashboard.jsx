import React from 'react';
import CoreDashboard from './CoreDashboard';

export default function BarberDashboard() {
  return (
    <CoreDashboard
      title="Barbershop Kontrollpanel"
      subtitle="Willkommen in deinem Barbershop."
      appointmentsTitle="Anstehende Termine heute"
      appointmentsSubtitle="Alle noch ausstehenden Termine für deinen heutigen Tag."
      newAppointmentButtonLabel="Neuer Termin"
      modalTitle="Neuer Termin"
      emptyTitle="Für heute stehen keine weiteren Termine an."
      emptySubtitle="Zeit für eine kurze Pause oder spontane Walk-ins."
    />
  );
}
