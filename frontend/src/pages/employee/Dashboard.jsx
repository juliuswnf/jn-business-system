import React, { useState, useEffect } from 'react';
import { authAPI, bookingAPI, employeeAPI, api } from '../../utils/api';
import { captureError } from '../../utils/errorTracking';

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
    // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically

    try {
      // Fetch employee profile
      const profileRes = await api.get('/auth/profile');
      if (profileRes.data.success) {
        const profileData = profileRes.data;
        setEmployee({
          name: profileData.user?.name || 'Mitarbeiter',
          role: profileData.user?.role || 'employee',
          email: profileData.user?.email || ''
        });
      }

      // Fetch today's bookings for this employee
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
      }

      // Try to fetch employee stats if available
      try {
        // ? SECURITY FIX: Use central api instance
        const statsRes = await api.get('/employees/my-stats');
        if (statsRes.data) {
          const statsData = statsRes.data;
          if (statsData.success) {
            setStats(prev => ({
              ...prev,
              monthlyEarnings: statsData.stats?.monthlyEarnings || 0,
              totalBookings: statsData.stats?.totalBookings || 0
            }));
          }
        }
      } catch {
        // Stats endpoint may not exist yet - that's okay
        // Employee stats not available - not an error
      }

    } catch (err) {
      captureError(err, { context: 'fetchEmployeeData' });
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, label, value, color }) => (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-700 transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-200 text-sm mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`text-4xl p-4 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 sticky top-0 z-40 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Mein Dashboard</h1>
              <p className="text-gray-200 text-sm">
                Willkommen zurück{employee ? `, ${employee.name}` : ''}!
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm capitalize">{employee?.role || 'Mitarbeiter'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-200 mt-4">Lade Daten...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-center">
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <StatCard icon="" label="Heutige Termine" value={stats.upcomingCount} color="bg-blue-900" />
            <StatCard icon="" label="Monatsverdienst" value={`${stats.monthlyEarnings}€`} color="bg-green-900" />
            <StatCard icon="" label="Gesamt-Buchungen" value={stats.totalBookings} color="bg-zinc-800" />
          </div>

          {/* Today's Bookings */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Heutige Termine</h2>
              <span className="px-3 py-1 rounded-full bg-zinc-800 text-gray-300 text-sm font-medium">
                {upcomingBookings.length} Termine
              </span>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-200">Keine Termine für heute</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{booking.customer}</p>
                        <p className="text-gray-200 text-sm">{booking.service}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                          <span>{booking.time}</span>
                          <span>{booking.duration}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'Bestätigt'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-700 transition">
              <h3 className="text-xl font-bold mb-3">Zeitplan verwalten</h3>
              <p className="text-gray-200 mb-4">Verfügbarkeit und freie Tage einstellen</p>
              <button className="w-full px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition">
                Zeitplan öffnen
              </button>
            </div>

            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-700 transition">
              <h3 className="text-xl font-bold mb-3">Aktualisieren</h3>
              <p className="text-gray-200 mb-4">Termine neu laden</p>
              <button
                onClick={fetchData}
                className="w-full px-4 py-2 border border-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-800 transition"
              >
                Daten aktualisieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
