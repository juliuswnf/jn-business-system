import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BusinessOwnerDashboard = () => {
  const [todaysBookings, setTodaysBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [widgetCode, setWidgetCode] = useState('');

  useEffect(() => {
    // Hier würden die API-Calls stehen
    // Für MVP erstmal Dummy-Daten
    setTodaysBookings([
      {
        id: 1,
        customer: 'Max Mustermann',
        service: 'Haarschnitt',
        time: '14:00',
        status: 'confirmed'
      }
    ]);
    setUpcomingBookings([
      {
        id: 2,
        customer: 'Anna Schmidt',
        service: 'Färben',
        time: '16:00',
        status: 'confirmed'
      }
    ]);
    setServices([
      {
        id: 1,
        name: 'Haarschnitt',
        price: 25,
        duration: 30
      }
    ]);
    setWidgetCode('<iframe src="https://yourapp.com/widget/salon-mueller" width="100%" height="600px" style="border: none;"></iframe>');
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mein Salon Dashboard</h1>

        {/* Today's Bookings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Heutige Termine</h2>
          <div className="space-y-4">
            {todaysBookings.map(booking => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{booking.customer}</p>
                    <p className="text-gray-600">{booking.service}</p>
                    <p className="text-gray-600">{booking.time}</p>
                  </div>
                  <div className="text-gray-600">{booking.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Kommende Termine</h2>
          <div className="space-y-4">
            {upcomingBookings.map(booking => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{booking.customer}</p>
                    <p className="text-gray-600">{booking.service}</p>
                    <p className="text-gray-600">{booking.time}</p>
                  </div>
                  <div className="text-gray-600">{booking.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Services verwalten</h2>
          <div className="space-y-4">
            {services.map(service => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-gray-600">{service.price}€, {service.duration} Min.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Bearbeiten
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              Service hinzufügen
            </button>
          </div>
        </div>

        {/* Widget Code */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Widget Code generieren</h2>
          <div className="space-y-4">
            <textarea
              readOnly
              value={widgetCode}
              className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
            />
            <button
              onClick={() => copyToClipboard(widgetCode)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Code kopieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessOwnerDashboard;