import React from 'react';
import { CheckCircle2, Plus, UserX, X, XCircle } from 'lucide-react';
import { FeatureGate } from '../../../components/common';
import { usePlanAccess } from '../../../hooks/usePlanAccess';
import { useNotification } from '../../../hooks/useNotification';
import { useDashboardData } from './useDashboardData';

export default function CoreDashboard({
  title,
  subtitle,
  appointmentsTitle = 'Anstehende Termine heute',
  appointmentsSubtitle = 'Alle noch ausstehenden Termine für deinen heutigen Tag.',
  newAppointmentButtonLabel = 'Neuer Termin',
  modalTitle = 'Neuer Termin',
  emptyTitle = 'Für heute stehen keine weiteren Termine an.',
  emptySubtitle = 'Zeit für eine kurze Pause oder spontane Walk-ins.'
}) {
  const { showNotification } = useNotification();
  const { currentTier } = usePlanAccess();

  const {
    stats,
    isLoadingStats,
    statsError,
    todayAppointmentsList,
    isLoadingTodayAppointments,
    todayAppointmentsError,
    updatingAppointmentId,
    services,
    isLoadingServices,
    isNewAppointmentModalOpen,
    isSubmittingNewAppointment,
    newAppointmentForm,
    formattedRevenue,
    loadDashboardStats,
    loadTodayAppointments,
    updateAppointmentStatus,
    openNewAppointmentModal,
    closeNewAppointmentModal,
    handleNewAppointmentFieldChange,
    submitNewAppointment
  } = useDashboardData();

  const formatTimeRange = (appointment) => {
    const startDate = new Date(appointment.bookingDate);
    const durationMinutes = appointment.duration || appointment.serviceId?.duration || 0;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const timeFormat = { hour: '2-digit', minute: '2-digit' };
    return `${startDate.toLocaleTimeString('de-DE', timeFormat)} - ${endDate.toLocaleTimeString('de-DE', timeFormat)}`;
  };

  const getCustomerName = (appointment) => {
    if (appointment.customerId?.firstName || appointment.customerId?.lastName) {
      return `${appointment.customerId?.firstName || ''} ${appointment.customerId?.lastName || ''}`.trim();
    }

    return appointment.customerName || 'Unbekannter Kunde';
  };

  const getStatusBadgeStyles = (status) => {
    if (status === 'confirmed' || status === 'booked') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (status === 'pending') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-zinc-50 text-zinc-700 border-zinc-200';
  };

  const getStatusLabel = (status) => {
    if (status === 'confirmed') {
      return 'Bestätigt';
    }

    if (status === 'booked') {
      return 'Gebucht';
    }

    if (status === 'pending') {
      return 'Ausstehend';
    }

    return status || 'Unbekannt';
  };

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
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </header>

      {statsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{statsError}</p>
          <button
            type="button"
            onClick={loadDashboardStats}
            className="mt-3 inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Erneut versuchen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-sm text-zinc-500">Heutige Termine</span>
            {isLoadingStats ? (
              <div className="h-8 w-20 rounded bg-zinc-200 animate-pulse" />
            ) : (
              <p className="text-2xl font-semibold text-zinc-900">{stats.todayAppointments}</p>
            )}
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-sm text-zinc-500">Heutiger Umsatz</span>
            {isLoadingStats ? (
              <div className="h-8 w-28 rounded bg-zinc-200 animate-pulse" />
            ) : (
              <p className="text-2xl font-semibold text-zinc-900">{formattedRevenue}</p>
            )}
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-sm text-zinc-500">Gesamtkunden</span>
            {isLoadingStats ? (
              <div className="h-8 w-20 rounded bg-zinc-200 animate-pulse" />
            ) : (
              <p className="text-2xl font-semibold text-zinc-900">{stats.totalCustomers}</p>
            )}
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">{appointmentsTitle}</h2>
            <p className="text-sm text-zinc-500">{appointmentsSubtitle}</p>
          </div>

          <button
            type="button"
            onClick={openNewAppointmentModal}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            {newAppointmentButtonLabel}
          </button>
        </div>

        {todayAppointmentsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{todayAppointmentsError}</p>
            <button
              type="button"
              onClick={loadTodayAppointments}
              className="mt-3 inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Erneut versuchen
            </button>
          </div>
        ) : isLoadingTodayAppointments ? (
          <div className="space-y-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="h-4 w-36 rounded bg-zinc-200 animate-pulse" />
                <div className="mt-3 h-4 w-52 rounded bg-zinc-200 animate-pulse" />
              </div>
            ))}
          </div>
        ) : todayAppointmentsList.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
            <p className="text-zinc-700 font-medium">{emptyTitle}</p>
            <p className="mt-1 text-sm text-zinc-500">{emptySubtitle}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointmentsList.map((appointment) => (
              <article
                key={appointment._id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-900">{formatTimeRange(appointment)}</p>
                  <p className="text-sm text-zinc-700">{getCustomerName(appointment)}</p>
                  <p className="text-sm text-zinc-500">{appointment.serviceId?.name || 'Dienstleistung unbekannt'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeStyles(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                      disabled={updatingAppointmentId === appointment._id}
                      className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      title="Als erledigt markieren"
                      aria-label="Als erledigt markieren"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                      disabled={updatingAppointmentId === appointment._id}
                      className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-50"
                      title="Absagen"
                      aria-label="Absagen"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => updateAppointmentStatus(appointment._id, 'no_show')}
                      disabled={updatingAppointmentId === appointment._id}
                      className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                      title="Nicht erschienen"
                      aria-label="Nicht erschienen"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

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

      {isNewAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-900/40"
            onClick={closeNewAppointmentModal}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4">
              <h3 className="text-lg font-semibold text-zinc-900">{modalTitle}</h3>
              <button
                type="button"
                onClick={closeNewAppointmentModal}
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Modal schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitNewAppointment} className="space-y-4 p-4">
              <div>
                <label htmlFor="new-appointment-customer" className="mb-1 block text-sm font-medium text-zinc-700">
                  Kundenname
                </label>
                <input
                  id="new-appointment-customer"
                  type="text"
                  value={newAppointmentForm.customerName}
                  onChange={(event) => handleNewAppointmentFieldChange('customerName', event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                  placeholder="z. B. Max Mustermann"
                  required
                />
              </div>

              <div>
                <label htmlFor="new-appointment-time" className="mb-1 block text-sm font-medium text-zinc-700">
                  Uhrzeit
                </label>
                <input
                  id="new-appointment-time"
                  type="time"
                  value={newAppointmentForm.time}
                  onChange={(event) => handleNewAppointmentFieldChange('time', event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="new-appointment-service" className="mb-1 block text-sm font-medium text-zinc-700">
                  Dienstleistung
                </label>
                <select
                  id="new-appointment-service"
                  value={newAppointmentForm.serviceId}
                  onChange={(event) => handleNewAppointmentFieldChange('serviceId', event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                  required
                >
                  {isLoadingServices ? (
                    <option value="">Lade Dienstleistungen...</option>
                  ) : services.length === 0 ? (
                    <option value="">Keine Dienstleistungen gefunden</option>
                  ) : (
                    services.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeNewAppointmentModal}
                  disabled={isSubmittingNewAppointment}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewAppointment || isLoadingServices || services.length === 0}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmittingNewAppointment ? 'Speichert...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
