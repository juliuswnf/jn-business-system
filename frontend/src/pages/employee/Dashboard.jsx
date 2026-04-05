import React, { useState, useEffect } from 'react';
import { authAPI, bookingAPI, employeeAPI, api } from '../../utils/api';
import { captureError } from '../../utils/errorTracking';
import { Calendar, Euro, Hash, Clock, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [employee, setEmployee] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [stats, setStats] = useState({
    upcomingCount: 0,
    monthlyEarnings: 0,
    totalBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const profileRes = await api.get('/auth/profile');
      if (profileRes.data.success) {
        const profileData = profileRes.data;
        setEmployee({
          name: profileData.user?.name || 'Mitarbeiter',
          role: profileData.user?.role || 'employee',
          email: profileData.user?.email || ''
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const bookingsRes = await api.get(`/bookings?date=${today}&limit=20`);
      if (bookingsRes.data.success && bookingsRes.data.bookings) {
        const bookingsData = bookingsRes.data;
        const formattedBookings = bookingsData.bookings.map(b => ({
          id: b._id,
          customer: b.customerName || b.customerEmail || 'Kunde',
          service: b.serviceId?.name || 'Service',
          time: new Date(b.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          duration: b.serviceId?.duration ? `${b.serviceId.duration} min` : '30 min',
          status: b.status === 'confirmed' ? 'Bestätigt' : b.status === 'pending' ? 'Ausstehend' : b.status
        }));
        setUpcomingBookings(formattedBookings);
        setStats(prev => ({ ...prev, upcomingCount: formattedBookings.length }));
      }

      try {
        const statsRes = await api.get('/employees/my-stats');
        if (statsRes.data?.success) {
          const statsData = statsRes.data;
          setStats(prev => ({
            ...prev,
            monthlyEarnings: statsData.stats?.monthlyEarnings || 0,
            totalBookings: statsData.stats?.totalBookings || 0
          }));
        }
      } catch {
        // Stats endpoint may not exist yet
      }

    } catch (err) {
      captureError(err, { context: 'fetchEmployeeData' });
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-zinc-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center max-w-md mx-auto">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-medium transition"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: <Calendar className="w-4 h-4 text-gray-500" />, label: 'Heutige Termine', value: stats.upcomingCount },
    { icon: <Euro className="w-4 h-4 text-gray-500" />, label: 'Monatsverdienst', value: `${stats.monthlyEarnings}€` },
    { icon: <Hash className="w-4 h-4 text-gray-500" />, label: 'Gesamt-Buchungen', value: stats.totalBookings }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Willkommen{employee ? `, ${employee.name}` : ''}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Deine heutige Übersicht</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-500 hover:text-gray-700 bg-white border border-gray-100 rounded-2xl hover:border-gray-300 transition-colors"
        >
          <RefreshCw size={13} />
          Aktualisieren
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-400 font-medium leading-tight">{card.label}</span>
              <div className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900 tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Bookings */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Heutige Termine</h2>
          <span className="text-[13px] text-gray-400 font-medium">
            {upcomingBookings.length} Termine
          </span>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="text-center py-14">
            <Calendar className="w-9 h-9 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Keine Termine für heute</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="flex items-start justify-between gap-3 px-4 py-4 hover:bg-gray-50/60 transition-colors min-h-[56px]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{booking.customer}</p>
                  <p className="text-[13px] text-gray-400 mt-0.5">{booking.service}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="flex items-center gap-1 text-sm text-gray-700 font-medium">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {booking.time}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{booking.duration}</p>
                </div>
                <span className={`shrink-0 self-start mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                  booking.status === 'Bestätigt'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
