import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../../utils/api';
import { CalendarIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

const CustomerDashboard = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const now = new Date();
        const upcoming = data.bookings.filter(b => new Date(b.date) >= now);
        const past = data.bookings.filter(b => new Date(b.date) < now);
        setUpcomingBookings(upcoming);
        setPastBookings(past);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!confirm('Möchten Sie diesen Termin wirklich absagen?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error cancelling booking:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meine Termine</h1>
          <p className="text-gray-600 mt-2">Willkommen zurück, {user.name}!</p>
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Bevorstehende Termine</h2>
          {loading ? (
            <div className="bg-white rounded-lg p-6 text-center">
              <p className="text-gray-500">Lade Termine...</p>
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center">
              <p className="text-gray-500">Keine bevorstehenden Termine</p>
              <Link to="/book" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                Neuen Termin buchen
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking._id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.serviceId?.name || 'Service'}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {new Date(booking.date).toLocaleDateString('de-DE')}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {new Date(booking.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelBooking(booking._id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Termin absagen"
                    >
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vergangene Termine</h2>
            <div className="space-y-4">
              {pastBookings.slice(0, 5).map((booking) => (
                <div key={booking._id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.serviceId?.name || 'Service'}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {new Date(booking.date).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      Abgeschlossen
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
