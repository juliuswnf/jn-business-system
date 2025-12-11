import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { FiClock, FiStar, FiInfo } from 'react-icons/fi';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * PUBLIC BOOKING - Ohne Anmeldung
 * Unterstützt zwei Formate:
 * - /s/:slug (Route Parameter)
 * - /booking/public?salon=xyz (Query Parameter)
 */
export default function PublicBooking() {
  const [searchParams] = useSearchParams();
  const { slug } = useParams();
  // Support both route param (/s/:slug) and query param (?salon=xyz)
  const salonSlug = slug || searchParams.get('salon');
  
  const [loading, setLoading] = useState(true);
  const [salonInfo, setSalonInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    service: '',
    serviceId: '',
    date: '',
    time: '',
    employee: '',
    employeeId: '',
  });

  const { showNotification } = useNotification();

  // Default time slots (fallback)
  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  // Fetch salon data on mount
  useEffect(() => {
    if (salonSlug) {
      fetchSalonData();
    } else {
      setLoading(false);
    }
  }, [salonSlug]);

  const fetchSalonData = async () => {
    setLoading(true);
    try {
      // Fetch salon info and services via public widget API
      const res = await fetch(`${API_URL}/widget/${salonSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSalonInfo(data.salon || { name: 'Salon' });
          
          // Map services
          if (data.services) {
            setServices(data.services.map(s => ({
              id: s._id,
              name: s.name,
              duration: `${s.duration || 30} min`,
              price: `${s.price || 0}€`
            })));
          }
          
          // Map employees if available
          if (data.employees) {
            setEmployees(data.employees.map(e => ({
              id: e._id,
              name: e.name,
              rating: e.rating || 4.5
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching salon data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available slots when date changes
  useEffect(() => {
    if (bookingData.date && bookingData.serviceId && salonSlug) {
      fetchAvailableSlots();
    }
  }, [bookingData.date, bookingData.serviceId]);

  const fetchAvailableSlots = async () => {
    try {
      const res = await fetch(
        `${API_URL}/widget/${salonSlug}/available-slots?date=${bookingData.date}&serviceId=${bookingData.serviceId}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.slots) {
          setAvailableSlots(data.slots);
          return;
        }
      }
    } catch (error) {
      console.log('Available slots not available, using defaults');
    }
    setAvailableSlots(defaultTimeSlots);
  };

  const timeSlots = availableSlots.length > 0 ? availableSlots : defaultTimeSlots;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceSelect = (service) => {
    setBookingData(prev => ({ 
      ...prev, 
      service: service.name,
      serviceId: service.id
    }));
  };

  const handleEmployeeSelect = (emp) => {
    setBookingData(prev => ({ 
      ...prev, 
      employee: emp.name,
      employeeId: emp.id
    }));
  };

  const handleSubmit = async () => {
    try {
      // ✅ AUDIT FIX: Send date and time separately for timezone handling
      const res = await fetch(`${API_URL}/widget/${salonSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: bookingData.serviceId,
          employeeId: bookingData.employeeId || undefined,
          bookingDate: {
            date: bookingData.date, // "2025-12-15"
            time: bookingData.time  // "14:00"
          },
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone
        })
      });

      if (res.ok) {
        showNotification('Termin bestätigt. Ein Bestätigungslink wurde an ' + bookingData.customerEmail + ' gesendet.', 'success');
        // Reset form
        setBookingStep(1);
        setBookingData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          service: '',
          serviceId: '',
          date: '',
          time: '',
          employee: '',
          employeeId: '',
        });
      } else {
        const data = await res.json();
        showNotification(data.message || 'Fehler beim Buchen', 'error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      showNotification('Fehler beim Buchen des Termins', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Lade Salon-Daten...</p>
        </div>
      </div>
    );
  }

  if (!salonSlug) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Kein Salon angegeben. Bitte verwenden Sie einen gültigen Buchungslink.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - NO LOGIN OPTIONS */}
      <div className="border-b border-zinc-800 bg-black sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold mb-1">Termin buchen</h1>
          <p className="text-gray-400 text-sm">
            {salonInfo?.name ? `Bei ${salonInfo.name}` : 'Jetzt einen Termin im Salon reservieren'}
          </p>
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
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
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
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-zinc-500 focus:outline-none transition"
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
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-zinc-500 focus:outline-none transition"
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
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-zinc-500 focus:outline-none transition"
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
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Service wählen</h2>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {services.length === 0 ? (
                <p className="text-gray-400 col-span-2">Keine Services verfügbar</p>
              ) : (
                services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      bookingData.service === service.name
                        ? 'border-white bg-zinc-800'
                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                    }`}
                  >
                    <h3 className="font-semibold mb-2">{service.name}</h3>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span className="flex items-center gap-2"><FiClock className="text-gray-400" /> {service.duration}</span>
                      <span className="text-white font-bold">{service.price}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <h3 className="text-xl font-bold mb-4 mt-8">Friseur wählen</h3>
            {employees.length === 0 ? (
              <p className="text-gray-400 mb-6">Mitarbeiter wird automatisch zugewiesen</p>
            ) : (
              <div className="space-y-3 mb-6">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => handleEmployeeSelect(emp)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      bookingData.employee === emp.name
                        ? 'border-white bg-white/5'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800 bg-opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{emp.name}</span>
                      {emp.rating > 0 && (
                        <div className="flex items-center text-sm text-gray-300 gap-2">
                          <FiStar className="text-yellow-400" /> {emp.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setBookingStep(1)}
                className="flex-1 px-6 py-3 border border-gray-600 hover:bg-gray-800 rounded-full font-semibold transition"
              >
                Zurück
              </button>
              <button
                onClick={() => setBookingStep(3)}
                disabled={!bookingData.service}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
              >
                Zeit wählen
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time Selection */}
        {bookingStep === 3 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Datum & Uhrzeit</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Datum wählen *</label>
              <input
                type="date"
                name="date"
                value={bookingData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-zinc-500 focus:outline-none transition"
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
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
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
                className="flex-1 px-6 py-3 bg-white text-black disabled:bg-zinc-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Bestätigung
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {bookingStep === 4 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
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
                className="flex-1 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition"
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
