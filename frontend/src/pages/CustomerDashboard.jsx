import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CustomerDashboard = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setUpcomingBookings] = useState([]);

  useEffect(() => {
    // Hier würde der API-Call für Buchungen stehen
    // Für MVP erstmal Dummy-Daten
    setUpcomingBookings([
      {
        id: 1,
        salon: 'Salon Müller',
        service: 'Haarschnitt',
        date: '2025-12-05 14:00',
        status: 'confirmed'
      }
    ]);
    setUpcomingBookings([
      {
        id: 2,
        salon: 'Salon Müller',
        service: 'Haarschnitt',
        date: '2025-11-28 10:00',
        status: 'completed'
      }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mein Dashboard</h1>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bevorstehende Termine</h2>
          <div className="space-y-4">
            {upcomingBookings.map(booking => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{booking.service}</p>
                    <p className="text-gray-600">{booking.salon}</p>
                    <p className="text-gray-600">{booking.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Umbuchen
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Absagen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vergangene Termine</h2>
          <div className="space-y-4">
            {pastBookings.map(booking => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{booking.service}</p>
                    <p className="text-gray-600">{booking.salon}</p>
                    <p className="text-gray-600">{booking.date}</p>
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Edit Button */}
        <div className="mt-8 text-center">
          <Link
            to="/profile"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Profil bearbeiten
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
