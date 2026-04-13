import React from 'react';
import { CheckCircle2, Plus, UserX, X, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlanAccess } from '../../../hooks/usePlanAccess';
import { useDashboardData } from './useDashboardData';

const STATUS_BADGE_STYLES = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  booked: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200'
};

const STATUS_LABELS = {
  confirmed: 'Bestätigt',
  booked: 'Gebucht',
  pending: 'Ausstehend'
};

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
  const { currentTier, canAccessTier } = usePlanAccess();

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

  const getStatusBadgeStyles = (status) => STATUS_BADGE_STYLES[status] || 'bg-gray-50 text-gray-700 border-gray-200';

  const getStatusLabel = (status) => STATUS_LABELS[status] || status || 'Unbekannt';

  const quickActions = [
    { label: 'Termine verwalten', desc: 'Alle Buchungen', to: '/dashboard/bookings', tier: 'starter' },
    { label: 'Mitgliedschaften', desc: 'Pakete & Abo-Modelle', to: '/dashboard/packages-memberships', tier: 'professional' },
    { label: 'Zusatzverkäufe', desc: 'Upsell & Kampagnen', to: '/dashboard/marketing', tier: 'professional' },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </header>

      {statsError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm text-red-600">{statsError}</p>
          <button
            type="button"
            onClick={loadDashboardStats}
            className="mt-3 inline-flex items-center rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[13px] text-gray-400 font-medium mb-3">Heutige Termine</p>
            {isLoadingStats ? (
              <div className="h-8 w-16 rounded-xl bg-gray-100 animate-pulse" />
            ) : (
              <p className="text-3xl font-semibold text-gray-900 tracking-tight">{stats.todayAppointments}</p>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[13px] text-gray-400 font-medium mb-3">Heutiger Umsatz</p>
            {isLoadingStats ? (
              <div className="h-8 w-24 rounded-xl bg-gray-100 animate-pulse" />
            ) : (
              <p className="text-3xl font-semibold text-gray-900 tracking-tight">{formattedRevenue}</p>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[13px] text-gray-400 font-medium mb-3">Gesamtkunden</p>
            {isLoadingStats ? (
              <div className="h-8 w-16 rounded-xl bg-gray-100 animate-pulse" />
            ) : (
              <p className="text-3xl font-semibold text-gray-900 tracking-tight">{stats.totalCustomers}</p>
            )}
          </div>
        </div>
      )}

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{appointmentsTitle}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{appointmentsSubtitle}</p>
          </div>

          <button
            type="button"
            onClick={openNewAppointmentModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-gray-900 transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            {newAppointmentButtonLabel}
          </button>
        </div>

        <div className="p-6">
        {todayAppointmentsError ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-red-600">{todayAppointmentsError}</p>
            <button
              type="button"
              onClick={loadTodayAppointments}
              className="mt-3 inline-flex items-center rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        ) : isLoadingTodayAppointments ? (
          <div className="space-y-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="rounded-xl bg-gray-50 p-4">
                <div className="h-4 w-32 rounded-xl bg-gray-200 animate-pulse" />
                <div className="mt-2.5 h-4 w-48 rounded-xl bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>
        ) : todayAppointmentsList.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-8 text-center">
            <p className="text-gray-600 font-medium text-sm">{emptyTitle}</p>
            <p className="mt-1.5 text-[13px] text-gray-400">{emptySubtitle}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayAppointmentsList.map((appointment) => (
              <article
                key={appointment._id}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-gray-900">{formatTimeRange(appointment)}</p>
                  <p className="text-sm text-gray-700">{getCustomerName(appointment)}</p>
                  <p className="text-[13px] text-gray-400">{appointment.serviceId?.name || 'Dienstleistung unbekannt'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeStyles(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                      disabled={updatingAppointmentId === appointment._id}
                      className="inline-flex items-center rounded-xl border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                      title="Als erledigt markieren"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                      disabled={updatingAppointmentId === appointment._id}
                      className="inline-flex items-center rounded-xl border border-red-100 bg-red-50 p-1.5 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      title="Absagen"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => updateAppointmentStatus(appointment._id, 'no_show')}
                      disabled={updatingAppointmentId === appointment._id}
                      className="inline-flex items-center rounded-xl border border-amber-100 bg-amber-50 p-1.5 text-amber-500 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                      title="Nicht erschienen"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Schnellaktionen</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Premium-Funktionen bleiben sichtbar und sind je nach Plan freigeschaltet.
          </p>
        </div>

        <div className="p-6">
          <div className="grid gap-3 md:grid-cols-3">
            {quickActions.map((action) => {
              const locked = !canAccessTier(action.tier);
              if (locked) {
                return (
                  <div
                    key={action.label}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm cursor-not-allowed"
                  >
                    <div>
                      <p className="font-medium text-gray-300">{action.label}</p>
                      <p className="text-[12px] text-gray-300">{action.desc}</p>
                    </div>
                    <XCircle className="h-4 w-4 text-gray-200 shrink-0" />
                  </div>
                );
              }
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{action.label}</p>
                    <p className="text-[12px] text-gray-400">{action.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {isNewAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeNewAppointmentModal}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/50">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">{modalTitle}</h3>
              <button
                type="button"
                onClick={closeNewAppointmentModal}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitNewAppointment} className="space-y-4 p-5">
              <div>
                <label htmlFor="new-appointment-customer" className="mb-1.5 block text-[13px] font-medium text-gray-700">
                  Kundenname
                </label>
                <input
                  id="new-appointment-customer"
                  type="text"
                  value={newAppointmentForm.customerName}
                  onChange={(event) => handleNewAppointmentFieldChange('customerName', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-colors"
                  placeholder="z. B. Max Mustermann"
                  required
                />
              </div>

              <div>
                <label htmlFor="new-appointment-time" className="mb-1.5 block text-[13px] font-medium text-gray-700">
                  Uhrzeit
                </label>
                <input
                  id="new-appointment-time"
                  type="time"
                  value={newAppointmentForm.time}
                  onChange={(event) => handleNewAppointmentFieldChange('time', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="new-appointment-service" className="mb-1.5 block text-[13px] font-medium text-gray-700">
                  Dienstleistung
                </label>
                <select
                  id="new-appointment-service"
                  value={newAppointmentForm.serviceId}
                  onChange={(event) => handleNewAppointmentFieldChange('serviceId', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-colors"
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

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeNewAppointmentModal}
                  disabled={isSubmittingNewAppointment}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewAppointment || isLoadingServices || services.length === 0}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-900 disabled:opacity-50 transition-colors"
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
