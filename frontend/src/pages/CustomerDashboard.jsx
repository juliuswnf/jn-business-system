import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CustomerDashboard = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get auth token
  const getToken = () => {
    return localStorage.getItem('jnAuthToken') || localStorage.getItem('token');
  };

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const token = getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        // Fetch customer's bookings
        const res = await fetch(`${API_URL}/bookings?limit=50`, { headers });

        if (res.ok) {
          const data = await res.json();

          if (data.success && data.bookings) {
            const now = new Date();

            // Split into upcoming and past
            const upcoming = data.bookings
              .filter(b => new Date(b.bookingDate) >= now && b.status !== 'cancelled' && b.status !== 'completed')
              .map(b => ({
                id: b._id,
                salon: b.salonId?.name || 'Salon',
                service: b.serviceId?.name || 'Service',
                date: new Date(b.bookingDate).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                status: b.status
              }));

            const past = data.bookings
              .filter(b => new Date(b.bookingDate) < now || b.status === 'completed' || b.status === 'cancelled')
              .map(b => ({
                id: b._id,
                salon: b.salonId?.name || 'Salon',
                service: b.serviceId?.name || 'Service',
                date: new Date(b.bookingDate).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                status: b.status
              }));

            setUpcomingBookings(upcoming);
            setPastBookings(past);
          }
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Cancel booking handler
  const handleCancelBooking = async (bookingId) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        // Move booking to past and update status
        setUpcomingBookings(prev => prev.filter(b => b.id !== bookingId));
        const cancelledBooking = upcomingBookings.find(b => b.id === bookingId);
        if (cancelledBooking) {
          setPastBookings(prev => [{ ...cancelledBooking, status: 'cancelled' }, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  // Get status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      pending: { label: 'Ausstehend', color: 'text-yellow-600 bg-yellow-100' },
      confirmed: { label: 'Bestätigt', color: 'text-green-600 bg-green-100' },
      completed: { label: 'Abgeschlossen', color: 'text-blue-600 bg-blue-100' },
      cancelled: { label: 'Abgesagt', color: 'text-red-600 bg-red-100' }
    };
    return statusMap[status] || { label: status, color: 'text-gray-600 bg-gray-100' };
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Mein Dashboard</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <>
            {/* Upcoming Bookings */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Bevorstehende Termine</h2>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2"></div>
                  <p className="text-gray-200">Keine bevorstehenden Termine</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map(booking => (
                    <div key={booking.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/30 transition">
                      <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">{booking.service}</p>
                        <p className="text-gray-200">{booking.salon}</p>
                        <p className="text-gray-500 text-sm">{booking.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusDisplay(booking.status).color}`}>
                            {getStatusDisplay(booking.status).label}
                          </span>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition text-sm"
                          >
                            Absagen
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Bookings */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Vergangene Termine</h2>
              {pastBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-200">Keine vergangenen Termine</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastBookings.map(booking => (
                    <div key={booking.id} className="border border-gray-800 rounded-lg p-4 opacity-75">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-300">{booking.service}</p>
                          <p className="text-gray-500">{booking.salon}</p>
                          <p className="text-gray-600 text-sm">{booking.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusDisplay(booking.status).color}`}>
                          {getStatusDisplay(booking.status).label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Edit Button */}
            <div className="mt-8 text-center">
              <Link
                to="/profile"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-700 text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                Profil bearbeiten
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
