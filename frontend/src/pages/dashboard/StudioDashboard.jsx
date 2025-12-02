import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Star, Briefcase, Plus, ArrowRight, Clock, Settings } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { salonAPI, bookingAPI } from '../../utils/api';

export default function StudioDashboard() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    avgRating: 0,
    activeServices: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [studioName, setStudioName] = useState('Mein Studio');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, bookingsResponse] = await Promise.all([
        salonAPI.getDashboard().catch(() => ({ data: {} })),
        bookingAPI.getAll({ limit: 5, sort: '-createdAt' }).catch(() => ({ data: { data: [] } }))
      ]);

      if (statsResponse.data) {
        setStats({
          todayBookings: statsResponse.data.todayBookings || 0,
          weekBookings: statsResponse.data.weekBookings || 0,
          avgRating: statsResponse.data.avgRating || 4.8,
          activeServices: statsResponse.data.activeServices || 0
        });
        if (statsResponse.data.studioName) {
          setStudioName(statsResponse.data.studioName);
        }
      }

      const bookings = bookingsResponse.data?.data || bookingsResponse.data?.bookings || [];
      setRecentBookings(bookings.slice(0, 5));

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      showNotification('Fehler beim Laden der Dashboard-Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-blue-500/20 text-blue-400',
      cancelled: 'bg-red-500/20 text-red-400'
    };
    const labels = {
      confirmed: 'Bestätigt',
      pending: 'Ausstehend',
      completed: 'Abgeschlossen',
      cancelled: 'Storniert'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-zinc-700 text-zinc-300'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
          Willkommen, {studioName}
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          Hier ist deine Übersicht für heute
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 hover:border-zinc-700 transition">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mb-1">Buchungen heute</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{stats.todayBookings}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 hover:border-zinc-700 transition">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mb-1">Diese Woche</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{stats.weekBookings}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 hover:border-zinc-700 transition">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mb-1">Bewertung</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{stats.avgRating.toFixed(1)}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 hover:border-zinc-700 transition">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mb-1">Aktive Services</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{stats.activeServices}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 md:p-6 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-white">Letzte Buchungen</h2>
            <Link 
              to="/dashboard/bookings" 
              className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition"
            >
              Alle anzeigen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-800">
            {recentBookings.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">Noch keine Buchungen</p>
                <p className="text-zinc-500 text-sm mt-1">Buchungen erscheinen hier automatisch</p>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking._id} className="p-4 md:p-5 hover:bg-zinc-800/50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {booking.customerName || booking.customer?.name || 'Kunde'}
                      </p>
                      <p className="text-sm text-zinc-400 truncate">
                        {booking.serviceName || booking.service?.name || 'Service'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-right">
                        <p className="text-sm text-white flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {booking.date ? new Date(booking.date).toLocaleDateString('de-DE') : '-'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {booking.time || booking.startTime || '-'}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Schnellaktionen</h2>
          
          <div className="space-y-3">
            <Link
              to="/dashboard/services"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition">
                <Plus className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">Neuer Service</p>
                <p className="text-xs text-zinc-400">Service hinzufügen</p>
              </div>
            </Link>

            <Link
              to="/dashboard/employees"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white">Mitarbeiter</p>
                <p className="text-xs text-zinc-400">Team verwalten</p>
              </div>
            </Link>

            <Link
              to="/dashboard/widget"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition">
                <Briefcase className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">Widget Setup</p>
                <p className="text-xs text-zinc-400">Buchungs-Widget einrichten</p>
              </div>
            </Link>

            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition">
                <Settings className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-medium text-white">Einstellungen</p>
                <p className="text-xs text-zinc-400">Studio konfigurieren</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
