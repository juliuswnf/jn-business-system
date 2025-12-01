import React, { useState } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { FiClock, FiStar, FiUser, FiCheck } from 'react-icons/fi';

/**
 * CUSTOMER BOOKING - Angemeldeter Kunde
 * Route: /customer/booking
 */
export default function Booking() {
  const [isLoggedIn] = useState(true); // TRUE = Kunde ist angemeldet
  const [customerProfile] = useState({
    name: 'Max Mustermann',
    email: 'max@beispiel.de',
    phone: '+49 123 456789'
  });

  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    service: '',
    date: '',
    time: '',
    employee: '',
    note: '',
  });

  const { showNotification } = useNotification();

  const services = [
    { id: 1, name: 'Haarschnitt', duration: '30 min', price: '25€' },
    { id: 2, name: 'Haarfarbe', duration: '90 min', price: '50€' },
    { id: 3, name: 'Styling', duration: '45 min', price: '35€' },
    { id: 4, name: 'Frisur & Makeup', duration: '120 min', price: '75€' },
  ];

  const employees = [
    { id: 1, name: 'Sarah Johnson', rating: 4.9, appointments: 15 },
    { id: 2, name: 'Emma Wilson', rating: 4.8, appointments: 12 },
    { id: 3, name: 'Lisa Anderson', rating: 4.7, appointments: 8 },
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (import.meta.env.DEV) console.log('Customer Booking:', bookingData);
    // use site-wide notification hook instead of alert
    showNotification('Termin bestätigt. Eine Bestätigung wurde per E‑Mail versandt.', 'success');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header mit User Info */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Neuen Termin buchen</h1>
              <p className="text-gray-400 text-sm">Schnell und einfach</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Angemeldet als:</p>
              <p className="font-semibold">{customerProfile.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition ${
                  step <= bookingStep ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 transition ${step < bookingStep ? 'bg-white' : 'bg-gray-800'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Service</span>
            <span>Zeit</span>
            <span>Bestätigung</span>
          </div>
        </div>

        {/* Step 1: Service Selection */}
        {bookingStep === 1 && (
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Welcher Service interessiert dich?</h2>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setBookingData(prev => ({ ...prev, service: service.name }))}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    bookingData.service === service.name
                      ? 'border-purple-600 bg-purple-900 bg-opacity-20'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800 bg-opacity-50'
                  }`}
                >
                  <h3 className="font-semibold mb-2">{service.name}</h3>
                  <div className="flex justify-between text-sm text-gray-300">
                    <span className="flex items-center gap-2"><FiClock className="text-gray-400" /> {service.duration}</span>
                    <span className="text-purple-400 font-bold">{service.price}</span>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-bold mb-4 mt-8">Bevorzugten Friseur wählen</h3>
            <div className="space-y-3 mb-6">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setBookingData(prev => ({ ...prev, employee: emp.name }))}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    bookingData.employee === emp.name
                      ? 'border-white bg-white/5'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800 bg-opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.appointments} Termine</p>
                    </div>
                    <div className="flex items-center text-sm text-gray-300 gap-2">
                      <FiStar className="text-yellow-400" />
                      <span>{emp.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setBookingStep(2)}
              disabled={!bookingData.service || !bookingData.employee}
              className="w-full px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
            >
              Weiter
            </button>
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {bookingStep === 2 && (
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Wann möchtest du kommen?</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Datum wählen *</label>
              <input
                type="date"
                name="date"
                value={bookingData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-600 focus:outline-none transition"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Verfügbare Zeiten *</label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setBookingData(prev => ({ ...prev, time: slot }))}
                    className={`py-2 px-3 rounded-lg font-medium transition ${
                      bookingData.time === slot
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notizen (optional)</label>
              <textarea
                name="note"
                value={bookingData.note}
                onChange={handleInputChange}
                placeholder="z.B. Besondere Wünsche, Allergien, etc."
                rows="3"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-600 focus:outline-none transition"
              />
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setBookingStep(1)}
                className="flex-1 px-6 py-3 border border-gray-600 hover:bg-gray-800 rounded-full font-semibold transition"
              >
                Zurück
              </button>
              <button
                onClick={() => setBookingStep(3)}
                disabled={!bookingData.date || !bookingData.time}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
              >
                Zur Übersicht
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {bookingStep === 3 && (
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Termin-Übersicht</h2>
            
              <div className="space-y-4 mb-8 p-6 bg-gray-800 bg-opacity-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-300">Kunde:</span>
                <span className="font-semibold">{customerProfile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Service:</span>
                <span className="font-semibold">{bookingData.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Friseur:</span>
                <span className="font-semibold">{bookingData.employee}</span>
              </div>
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Termin:</span>
                  <span>{bookingData.date} um {bookingData.time} Uhr</span>
                </div>
              </div>
              {bookingData.note && (
                <div className="mt-4 p-3 bg-gray-700 rounded">
                  <p className="text-sm text-gray-300">Notiz: {bookingData.note}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setBookingStep(2)}
                className="flex-1 px-6 py-3 border border-gray-600 hover:bg-gray-800 rounded-full font-semibold transition"
              >
                Ändern
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 transition shadow-md"
              >
                Termin buchen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}