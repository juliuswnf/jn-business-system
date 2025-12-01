import React, { useState } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { FiClock, FiStar, FiInfo } from 'react-icons/fi';
/**
 * PUBLIC BOOKING - Ohne Anmeldung
 * Link den Salon teilt: /booking/public?salon=xyz
 */
export default function PublicBooking() {
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    service: '',
    date: '',
    time: '',
    employee: '',
  });

  const { showNotification } = useNotification();

  const services = [
    { id: 1, name: 'Haarschnitt', duration: '30 min', price: '25€' },
    { id: 2, name: 'Haarfarbe', duration: '90 min', price: '50€' },
    { id: 3, name: 'Styling', duration: '45 min', price: '35€' },
    { id: 4, name: 'Frisur & Makeup', duration: '120 min', price: '75€' },
  ];

  const employees = [
    { id: 1, name: 'Sarah Johnson', rating: 4.9 },
    { id: 2, name: 'Emma Wilson', rating: 4.8 },
    { id: 3, name: 'Lisa Anderson', rating: 4.7 },
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
    if (import.meta.env.DEV) console.log('Guest Booking:', bookingData);
    showNotification('Termin bestätigt. Ein Bestätigungslink wurde an ' + bookingData.customerEmail + ' gesendet.', 'success');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - NO LOGIN OPTIONS */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold mb-1">Termin buchen</h1>
          <p className="text-gray-400 text-sm">Jetzt einen Termin im Salon reservieren</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition ${
                  step <= bookingStep ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`flex-1 h-1 mx-2 transition ${step < bookingStep ? 'bg-white' : 'bg-gray-800'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Daten</span>
            <span>Service</span>
            <span>Zeit</span>
            <span>Bestätigung</span>
          </div>
        </div>

        {/* Step 1: Customer Data */}
        {bookingStep === 1 && (
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Deine Kontaktdaten</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vollständiger Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={bookingData.customerName}
                  onChange={handleInputChange}
                  placeholder="Max Mustermann"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-600 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">E-Mail Adresse *</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={bookingData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="email@beispiel.de"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-600 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Telefonnummer *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={bookingData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="+49 XXX XXXXXXX"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-600 focus:outline-none transition"
                  required
                />
              </div>

              <div className="p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg text-sm text-blue-200 flex items-start gap-3">
                <FiInfo className="mt-1" />
                <div><span className="font-semibold">Tipp:</span> Mit deiner E‑Mail kannst du später ein Profil anlegen und Termine einsehen.</div>
              </div>
            </div>

            <button
              onClick={() => setBookingStep(2)}
              disabled={!bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone}
              className="w-full mt-6 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
            >
              Weiter
            </button>
          </div>
        )}

        {/* Step 2: Service Selection */}
        {bookingStep === 2 && (
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Service wählen</h2>
            
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

            <h3 className="text-xl font-bold mb-4 mt-8">Friseur wählen</h3>
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
                    <span className="font-semibold">{emp.name}</span>
                    <div className="flex items-center text-sm text-gray-300 gap-2"><FiStar className="text-yellow-400" /> {emp.rating.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setBookingStep(1)}
                className="flex-1 px-6 py-3 border border-gray-600 hover:bg-gray-800 rounded-full font-semibold transition"
              >
                Zurück
              </button>
              <button
                onClick={() => setBookingStep(3)}
                disabled={!bookingData.service || !bookingData.employee}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
              >
                Zeit wählen
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time Selection */}
        {bookingStep === 3 && (
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Datum & Uhrzeit</h2>
            
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

            <div className="flex gap-4">
              <button
                onClick={() => setBookingStep(2)}
                className="flex-1 px-6 py-3 border border-gray-600 hover:bg-gray-800 rounded-lg font-semibold transition"
              >
                Zurück
              </button>
              <button
                onClick={() => setBookingStep(4)}
                disabled={!bookingData.date || !bookingData.time}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition"
              >
                Bestätigung
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {bookingStep === 4 && (
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Buchung bestätigen</h2>
            
            <div className="space-y-4 mb-8 p-6 bg-gray-800 bg-opacity-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-300">Name:</span>
                <span className="font-semibold">{bookingData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">E-Mail:</span>
                <span className="font-semibold">{bookingData.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Telefon:</span>
                <span className="font-semibold">{bookingData.customerPhone}</span>
              </div>
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Service:</span>
                  <span className="font-semibold">{bookingData.service}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Friseur:</span>
                  <span className="font-semibold">{bookingData.employee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Datum & Zeit:</span>
                  <span className="font-semibold">{bookingData.date} um {bookingData.time}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setBookingStep(3)}
                className="flex-1 px-6 py-3 border border-gray-600 hover:bg-gray-800 rounded-lg font-semibold transition"
              >
                Ändern
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition"
              >
                Termin buchen ✅
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}