import React, { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { FiClock, FiStar } from 'react-icons/fi';
import SalonSelector from '../../components/booking/SalonSelector';
import { api } from '../../utils/api';
import { captureError } from '../../utils/errorTracking';

/**
 * CUSTOMER BOOKING - Angemeldeter Kunde
 * Route: /customer/booking
 * 4 Schritte: Salon → Service → Zeit → Bestätigung
 */
export default function Booking() {
  const { showNotification } = useNotification();

  const [customerProfile, setCustomerProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step 0 = Salon, 1 = Service, 2 = Zeit, 3 = Bestätigung
  const [bookingStep, setBookingStep] = useState(0);

  const [bookingData, setBookingData] = useState({
    salonId: '',
    salonName: '',
    salonSlug: '',
    service: '',
    serviceId: '',
    date: '',
    time: '',
    employee: '',
    employeeId: '',
    note: '',
  });

  // Service & employee state (loaded after salon selection)
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);

  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  // Initial load: fetch customer profile
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);

    try {
      // ✅ FIX: Tokens are in HTTP-only cookies, so always try to fetch profile
      // The API will return 401 if not authenticated, which is fine
      const profileRes = await api.get('/auth/profile');
      if (profileRes.data.success && profileRes.data.user) {
        const profileData = profileRes.data;
        setCustomerProfile({
          name: profileData.user.name || 'Kunde',
          email: profileData.user.email || '',
          phone: profileData.user.phone || ''
        });
      }
    } catch (error) {
      // If 401, user is not authenticated - this is expected if not logged in
      // But for customer booking page, user should be logged in
      if (error.response?.status !== 401) {
        captureError(error, { context: 'fetchInitialData' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle salon selection
  const handleSalonSelect = async (salon) => {
    setBookingData(prev => ({
      ...prev,
      salonId: salon._id,
      salonName: salon.name,
      salonSlug: salon.slug
    }));

    // ? SECURITY FIX: Use central api instance (public endpoint, no auth needed)
    // Fetch services and employees for this salon
    try {
      const res = await api.get(`/bookings/public/s/${salon.slug}`);
      if (res.data.success) {
        const data = res.data;
        setServices(data.services?.map(s => ({
          id: s._id,
          name: s.name,
          duration: `${s.duration || 30} min`,
          price: `${s.price || 0}€`,
          durationMinutes: s.duration || 30
        })) || []);

        setEmployees(data.employees?.map(e => ({
          id: e._id,
          name: e.name,
          rating: 4.5,
          appointments: 0
        })) || []);
      }
    } catch (error) {
      captureError(error, { context: 'fetchSalonDetails' });
    }

    setBookingStep(1);
  };

  // Fetch available slots when date changes
  useEffect(() => {
    if (bookingData.date && bookingData.serviceId && bookingData.salonSlug) {
      fetchAvailableSlots();
    }
  }, [bookingData.date, bookingData.serviceId]);

  const fetchAvailableSlots = async () => {
    try {
      // ? SECURITY FIX: Use central api instance (public endpoint, no auth needed)
      const res = await api.post(`/bookings/public/s/${bookingData.salonSlug}/available-slots`, {
        date: bookingData.date,
        serviceId: bookingData.serviceId,
        employeeId: bookingData.employeeId || undefined
      });

      if (res.data.success && res.data.slots) {
        const data = res.data;
        setAvailableSlots(data.slots);
        setBookedSlots(data.bookedSlots || []);
        return;
      }
    } catch (error) {
      // Using default slots
    }
    setAvailableSlots(defaultTimeSlots);
    setBookedSlots([]);
  };

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
    if (submitting) return;
    
    // ✅ FIX: Validate required fields before submitting
    if (!customerProfile.name || !customerProfile.email) {
      showNotification('Bitte stellen Sie sicher, dass Ihr Profil vollständig ist (Name und E-Mail).', 'error');
      return;
    }
    
    if (!bookingData.serviceId || !bookingData.date || !bookingData.time) {
      showNotification('Bitte füllen Sie alle erforderlichen Felder aus.', 'error');
      return;
    }
    
    setSubmitting(true);

    try {
      // ✅ SRE FIX #30: Generate idempotency key
      const idempotencyKey = `booking-${customerProfile.email}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // ? SECURITY FIX: Use central api instance (public endpoint, no auth needed)
      // ✅ AUDIT FIX: Send date and time separately for timezone handling
      const res = await api.post(`/bookings/public/s/${bookingData.salonSlug}/book`, {
        serviceId: bookingData.serviceId,
        employeeId: bookingData.employeeId || undefined,
        bookingDate: {
          date: bookingData.date, // "2025-12-15"
          time: bookingData.time  // "14:00"
        },
        customerName: customerProfile.name,
        customerEmail: customerProfile.email,
        customerPhone: customerProfile.phone,
        notes: bookingData.note,
        idempotencyKey // ✅ SRE FIX #30
      });

      // ? SECURITY FIX: Response is already parsed by axios
      const data = res.data;

      if (data?.success) {
        // ✅ SRE FIX #38: Show email warnings if any
        if (data.warnings && data.warnings.length > 0) {
          showNotification('Termin gebucht! ' + data.warnings[0], 'warning');
        } else {
          showNotification('Termin erfolgreich gebucht! Bestätigung per E-Mail.', 'success');
        }

        // Reset form
        setBookingStep(0);
        setBookingData({
          salonId: '',
          salonName: '',
          salonSlug: '',
          service: '',
          serviceId: '',
          date: '',
          time: '',
          employee: '',
          employeeId: '',
          note: '',
        });
        setServices([]);
        setEmployees([]);
      } else {
        if (res.status === 409) {
          showNotification('Dieser Termin ist leider schon vergeben. Bitte wähle eine andere Uhrzeit.', 'error');
          // Move user back to time selection and refresh slots
          setBookingData(prev => ({ ...prev, time: '' }));
          setBookingStep(2);
          fetchAvailableSlots();
        } else {
          showNotification(data?.message || `Fehler beim Buchen (HTTP ${res.status})`, 'error');
        }
      }
    } catch (error) {
      captureError(error, { context: 'createBooking' });
      showNotification('Fehler beim Buchen des Termins', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = availableSlots.length > 0 ? availableSlots : defaultTimeSlots;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-300 mt-4">Lade Buchungsoptionen...</p>
        </div>
      </div>
    );
  }

  const stepLabels = [
    { step: 0, label: 'Salon' },
    { step: 1, label: 'Service' },
    { step: 2, label: 'Zeit' },
    { step: 3, label: 'Bestätigung' }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-black sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Neuen Termin buchen</h1>
              <p className="text-gray-300 text-sm">Wähle einen Salon und buche deinen Termin</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">Angemeldet als:</p>
              <p className="font-semibold">{customerProfile.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Bar - 4 Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {stepLabels.map(({ step, label }, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition ${
                    step <= bookingStep ? 'bg-white text-black' : 'bg-zinc-800 text-gray-300'
                  }`}>
                    {step + 1}
                  </div>
                  <span className={`text-sm mt-2 ${step <= bookingStep ? 'text-white' : 'text-gray-300'}`}>
                    {label}
                  </span>
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-1 mx-4 -mt-6 transition ${step < bookingStep ? 'bg-white' : 'bg-zinc-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 0: Salon Selection */}
        {bookingStep === 0 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-2">Wähle einen Anbieter</h2>
            <p className="text-gray-300 mb-6">Suche nach einem Anbieter in deiner Nähe</p>

            <SalonSelector
              onSelect={handleSalonSelect}
              selectedSalonId={bookingData.salonId}
            />
          </div>
        )}

        {/* Step 1: Service Selection */}
        {bookingStep === 1 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <div className="mb-6">
              <p className="text-sm text-gray-300 mb-1">Ausgewählter Salon</p>
              <h3 className="text-xl font-semibold">{bookingData.salonName}</h3>
            </div>

            <h2 className="text-2xl font-bold mb-6">Welcher Service interessiert dich?</h2>

            {services.length === 0 ? (
              <p className="text-gray-300 mb-6">Keine Services verfügbar für diesen Salon.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {services.map((service) => (
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
                      <span className="flex items-center gap-2"><FiClock className="text-gray-300" /> {service.duration}</span>
                      <span className="text-white font-bold">{service.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {employees.length > 0 && (
              <>
                <h3 className="text-xl font-bold mb-4 mt-8">Bevorzugten Mitarbeiter wählen (optional)</h3>
                <div className="space-y-3 mb-6">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => handleEmployeeSelect(emp)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        bookingData.employee === emp.name
                          ? 'border-white bg-white/5'
                          : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{emp.name}</p>
                        </div>
                        {emp.rating > 0 && (
                          <div className="flex items-center text-sm text-gray-300 gap-2">
                            <FiStar className="text-yellow-400" />
                            <span>{emp.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setBookingStep(0)}
                className="flex-1 px-6 py-3 border border-zinc-600 hover:bg-zinc-800 rounded-full font-semibold transition"
              >
                Zurück
              </button>
              <button
                onClick={() => setBookingStep(2)}
                disabled={!bookingData.service}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {bookingStep === 2 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <div className="mb-6">
              <p className="text-sm text-gray-300 mb-1">{bookingData.salonName}</p>
              <p className="text-gray-300">{bookingData.service}</p>
            </div>

            <h2 className="text-2xl font-bold mb-6">Wann möchtest du kommen?</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Datum wählen *</label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {Array.from({ length: 14 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const monthName = date.toLocaleDateString('de-DE', { month: 'short' });
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setBookingData(prev => ({ ...prev, date: dateStr }))}
                      className={`py-3 px-2 rounded-lg font-medium transition flex flex-col items-center ${
                        bookingData.date === dateStr
                          ? 'bg-white text-black'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
                      }`}
                    >
                      <span className="text-xs opacity-70">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                      <span className="text-xs opacity-70">{monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Verfügbare Zeiten *</label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => !isBooked && setBookingData(prev => ({ ...prev, time: slot }))}
                      disabled={isBooked}
                      className={`py-2 px-3 rounded-lg font-medium transition ${
                        isBooked
                          ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed line-through'
                          : bookingData.time === slot
                            ? 'bg-white text-black'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
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
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-zinc-500 focus:outline-none transition"
              />
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setBookingStep(1)}
                className="flex-1 px-6 py-3 border border-zinc-600 hover:bg-zinc-800 rounded-full font-semibold transition"
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
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Termin-Übersicht</h2>

            <div className="space-y-4 mb-8 p-6 bg-zinc-800 bg-opacity-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-300">Salon:</span>
                <span className="font-semibold">{bookingData.salonName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Kunde:</span>
                <span className="font-semibold">{customerProfile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">E-Mail:</span>
                <span className="font-semibold">{customerProfile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Service:</span>
                <span className="font-semibold">{bookingData.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Mitarbeiter:</span>
                <span className="font-semibold">{bookingData.employee || 'Wird zugewiesen'}</span>
              </div>
              <div className="border-t border-zinc-700 pt-4 mt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Termin:</span>
                  <span>{new Date(bookingData.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })} um {bookingData.time} Uhr</span>
                </div>
              </div>
              {bookingData.note && (
                <div className="mt-4 p-3 bg-zinc-700 rounded">
                  <p className="text-sm text-gray-300">Notiz: {bookingData.note}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setBookingStep(2)}
                className="flex-1 px-6 py-3 border border-zinc-600 hover:bg-zinc-800 rounded-full font-semibold transition"
              >
                Ändern
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-50 transition shadow-md"
              >
                {submitting ? 'Wird gebucht...' : 'Termin buchen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
