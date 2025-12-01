import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CEODashboard = () => {
  const [totalSalons, setTotalSalons] = useState(0);
  const [activeSalons, setActiveSalons] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [confirmedBookings, setConfirmedBookings] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [trialSubscriptions, setTrialSubscriptions] = useState(0);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    // Hier würden die API-Calls stehen
    // Für MVP erstmal Dummy-Daten
    setTotalSalons(15);
    setActiveSalons(12);
    setTotalBookings(247);
    setConfirmedBookings(198);
    setActiveSubscriptions(10);
    setTrialSubscriptions(5);
    setRecentBookings([
      {
        id: 1,
        salon: 'Salon Müller',
        service: 'Haarschnitt',
        date: '2025-12-05 14:00',
        status: 'confirmed'
      }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CEO Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Salons gesamt</h2>
            <p className="text-3xl font-bold text-blue-600">{totalSalons}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Aktive Salons</h2>
            <p className="text-3xl font-bold text-green-600">{activeSalons}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Buchungen gesamt</h2>
            <p className="text-3xl font-bold text-purple-600">{totalBookings}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Bestätigte Buchungen</h2>
            <p className="text-3xl font-bold text-indigo-600">{confirmedBookings}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Aktive Subscriptions</h2>
            <p className="text-3xl font-bold text-yellow-600">{activeSubscriptions}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Trial Subscriptions</h2>
            <p className="text-3xl font-bold text-orange-600">{trialSubscriptions}</p>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Aktuelle Buchungen</h2>
          <div className="space-y-4">
            {recentBookings.map(booking => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{booking.service}</p>
                    <p className="text-gray-600">{booking.salon}</p>
                    <p className="text-gray-600">{booking.date}</p>
                  </div>
                  <div className="text-gray-600">{booking.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Management */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Salons verwalten</h2>
            <Link
              to="/ceo/salons"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700"
            >
              Alle Salons anzeigen
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscriptions verwalten</h2>
            <Link
              to="/ceo/subscriptions"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700"
            >
              Alle Subscriptions anzeigen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEODashboard;