import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../utils/api';
import { useNotification } from '../../../hooks/useNotification';

const INITIAL_STATS = {
  todayAppointments: 0,
  totalRevenueToday: 0,
  totalCustomers: 0
};

const INITIAL_FORM = {
  customerName: '',
  time: '',
  serviceId: ''
};

export function useDashboardData() {
  const { showNotification } = useNotification();

  const [stats, setStats] = useState(INITIAL_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [todayAppointmentsList, setTodayAppointmentsList] = useState([]);
  const [isLoadingTodayAppointments, setIsLoadingTodayAppointments] = useState(true);
  const [todayAppointmentsError, setTodayAppointmentsError] = useState('');

  const [updatingAppointmentId, setUpdatingAppointmentId] = useState(null);

  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [isSubmittingNewAppointment, setIsSubmittingNewAppointment] = useState(false);
  const [newAppointmentForm, setNewAppointmentForm] = useState(INITIAL_FORM);

  const loadDashboardStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      setStatsError('');

      const response = await api.get('/appointments/dashboard-stats');
      const nextStats = response?.data?.stats || {};

      setStats({
        todayAppointments: nextStats.todayAppointments || 0,
        totalRevenueToday: nextStats.totalRevenueToday || 0,
        totalCustomers: nextStats.totalCustomers || 0
      });
    } catch (error) {
      setStatsError(error?.response?.data?.message || 'KPI-Daten konnten nicht geladen werden.');
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const loadTodayAppointments = useCallback(async () => {
    try {
      setIsLoadingTodayAppointments(true);
      setTodayAppointmentsError('');

      const response = await api.get('/appointments/today');
      setTodayAppointmentsList(response?.data?.appointments || []);
    } catch (error) {
      setTodayAppointmentsError(error?.response?.data?.message || 'Heutige Termine konnten nicht geladen werden.');
      setTodayAppointmentsList([]);
    } finally {
      setIsLoadingTodayAppointments(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    try {
      setIsLoadingServices(true);

      const response = await api.get('/services');
      const loadedServices = response?.data?.data || [];

      setServices(loadedServices);
      setNewAppointmentForm((prev) => {
        if (prev.serviceId) {
          return prev;
        }

        return {
          ...prev,
          serviceId: loadedServices[0]?._id || ''
        };
      });
    } catch (error) {
      setServices([]);
      showNotification(error?.response?.data?.message || 'Dienstleistungen konnten nicht geladen werden.', 'error');
    } finally {
      setIsLoadingServices(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadDashboardStats();
    loadTodayAppointments();
    loadServices();
  }, [loadDashboardStats, loadTodayAppointments, loadServices]);

  const formattedRevenue = useMemo(() => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(stats.totalRevenueToday || 0);
  }, [stats.totalRevenueToday]);

  const updateAppointmentStatus = useCallback(async (appointmentId, newStatus) => {
    if (newStatus === 'cancelled') {
      const confirmed = window.confirm('Möchtest du diesen Termin wirklich absagen?');
      if (!confirmed) {
        return;
      }
    }

    if (newStatus === 'no_show') {
      const confirmed = window.confirm('Möchtest du diesen Termin wirklich als "Nicht erschienen" markieren?');
      if (!confirmed) {
        return;
      }
    }

    try {
      setUpdatingAppointmentId(appointmentId);

      await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      showNotification('Termin erfolgreich aktualisiert.', 'success');

      await Promise.all([loadTodayAppointments(), loadDashboardStats()]);
    } catch (error) {
      showNotification(error?.response?.data?.message || 'Termin konnte nicht aktualisiert werden.', 'error');
    } finally {
      setUpdatingAppointmentId(null);
    }
  }, [loadTodayAppointments, loadDashboardStats, showNotification]);

  const openNewAppointmentModal = useCallback(() => {
    setIsNewAppointmentModalOpen(true);
  }, []);

  const closeNewAppointmentModal = useCallback(() => {
    setIsNewAppointmentModalOpen(false);
  }, []);

  const handleNewAppointmentFieldChange = useCallback((field, value) => {
    setNewAppointmentForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const submitNewAppointment = useCallback(async (event) => {
    event.preventDefault();

    if (!newAppointmentForm.serviceId) {
      showNotification('Bitte zuerst eine Dienstleistung auswählen.', 'error');
      return;
    }

    const [hours, minutes] = newAppointmentForm.time.split(':').map((part) => Number(part));
    const appointmentDate = new Date();
    appointmentDate.setHours(hours, minutes, 0, 0);

    if (Number.isNaN(appointmentDate.getTime())) {
      showNotification('Ungültige Uhrzeit.', 'error');
      return;
    }

    try {
      setIsSubmittingNewAppointment(true);

      await api.post('/appointments', {
        serviceId: newAppointmentForm.serviceId,
        customerName: newAppointmentForm.customerName.trim(),
        startTime: appointmentDate.toISOString()
      });

      setIsNewAppointmentModalOpen(false);
      setNewAppointmentForm({
        customerName: '',
        time: '',
        serviceId: services[0]?._id || ''
      });

      showNotification('Termin erfolgreich erstellt.', 'success');
      await Promise.all([loadTodayAppointments(), loadDashboardStats()]);
    } catch (error) {
      showNotification(error?.response?.data?.message || 'Termin konnte nicht erstellt werden.', 'error');
    } finally {
      setIsSubmittingNewAppointment(false);
    }
  }, [newAppointmentForm, services, loadDashboardStats, loadTodayAppointments, showNotification]);

  return {
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
  };
}
