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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-900"></div>
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
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: <Calendar className="w-5 h-5 text-zinc-600" />, label: 'Heutige Termine', value: stats.upcomingCount },
    { icon: <Euro className="w-5 h-5 text-zinc-600" />, label: 'Monatsverdienst', value: `${stats.monthlyEarnings}€` },
    { icon: <Hash className="w-5 h-5 text-zinc-600" />, label: 'Gesamt-Buchungen', value: stats.totalBookings }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Willkommen{employee ? `, ${employee.name}` : ''}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Deine heutige Übersicht</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-[13px] text-zinc-500 hover:text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition"
        >
          <RefreshCw size={14} />
          Aktualisieren
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-zinc-500 font-medium">{card.label}</span>
              <div className="w-9 h-9 rounded-lg bg-zinc-50 flex items-center justify-center">
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Bookings */}
      <div className="bg-white border border-zinc-200 rounded-xl">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Heutige Termine</h2>
          <span className="text-[13px] text-zinc-400 font-medium">
            {upcomingBookings.length} Termine
          </span>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">Keine Termine für heute</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-zinc-50/50 transition">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{booking.customer}</p>
                  <p className="text-[13px] text-zinc-500">{booking.service}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="flex items-center gap-1.5 text-sm text-zinc-700 font-medium">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {booking.time}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{booking.duration}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                  booking.status === 'Bestätigt'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
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
