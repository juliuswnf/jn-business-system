import React, { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { FiClock, FiStar, FiUser, FiCheck } from 'react-icons/fi';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * CUSTOMER BOOKING - Angemeldeter Kunde
 * Route: /customer/booking
 */
export default function Booking() {
  const [isLoggedIn] = useState(true); // TRUE = Kunde ist angemeldet
  const [customerProfile, setCustomerProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);

  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    service: '',
    serviceId: '',
    date: '',
    time: '',
    employee: '',
    employeeId: '',
    note: '',
  });

  const { showNotification } = useNotification();

  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [salonName, setSalonName] = useState('');

  // Default time slots (will be replaced by API data if available)
  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  // Get auth token
  const getToken = () => {
    return localStorage.getItem('jnAuthToken') || localStorage.getItem('token');
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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
      // Fetch customer profile
      const profileRes = await fetch(`${API_URL}/auth/profile`, { headers });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.user) {
          setCustomerProfile({
            name: profileData.user.name || 'Kunde',
            email: profileData.user.email || '',
            phone: profileData.user.phone || ''
          });
        }
      }

      // Fetch services - try salon-specific first, then general
      let servicesData = [];
      try {
        const servicesRes = await fetch(`${API_URL}/salons/services`, { headers });
        if (servicesRes.ok) {
          const data = await servicesRes.json();
          if (data.success && data.services) {
            servicesData = data.services.map(s => ({
              id: s._id,
              name: s.name,
              duration: `${s.duration || 30} min`,
              price: `${s.price || 0}€`
            }));
          }
          if (data.salonName) {
            setSalonName(data.salonName);
          }
        }
      } catch {
        // Try alternative endpoint
        const servicesRes = await fetch(`${API_URL}/services`, { headers });
        if (servicesRes.ok) {
          const data = await servicesRes.json();
          if (data.success && data.services) {
            servicesData = data.services.map(s => ({
              id: s._id,
              name: s.name,
              duration: `${s.duration || 30} min`,
              price: `${s.price || 0}€`
            }));
          }
        }
      }
      
      // Also try to get salon info directly
      if (!salonName) {
        try {
          const salonRes = await fetch(`${API_URL}/salons/info`, { headers });
          if (salonRes.ok) {
            const salonData = await salonRes.json();
            if (salonData.success && salonData.salon?.name) {
              setSalonName(salonData.salon.name);
            }
          }
        } catch {
          // Fallback salon name
          setSalonName('Ihr Friseursalon');
        }
      }
      
      setServices(servicesData.length > 0 ? servicesData : [
        { id: 'default', name: 'Standard Service', duration: '30 min', price: '25€' }
      ]);

      // Fetch employees
      try {
        const employeesRes = await fetch(`${API_URL}/employees`, { headers });
        if (employeesRes.ok) {
          const data = await employeesRes.json();
          if (data.success && data.employees) {
            setEmployees(data.employees.map(e => ({
              id: e._id,
              name: e.name,
              rating: 4.5,
              appointments: 0
            })));
          }
        }
      } catch {
        console.log('Employees endpoint not available');
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available time slots when date changes
  useEffect(() => {
    if (bookingData.date && bookingData.serviceId) {
      fetchAvailableSlots();
    }
  }, [bookingData.date, bookingData.serviceId]);

  const fetchAvailableSlots = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/bookings/available-slots?date=${bookingData.date}&serviceId=${bookingData.serviceId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.slots) {
          setAvailableSlots(data.slots);
        }
        if (data.bookedSlots) {
          setBookedSlots(data.bookedSlots);
        }
        return;
      }
    } catch (error) {
      console.log('Available slots endpoint not available');
    }
    // Fallback to default slots
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
    const token = getToken();
    if (!token) {
      showNotification('Bitte melden Sie sich an', 'error');
      return;
    }

    try {
      const bookingDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
      
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceId: bookingData.serviceId,
          employeeId: bookingData.employeeId || undefined,
          bookingDate: bookingDateTime.toISOString(),
          customerName: customerProfile.name,
          customerEmail: customerProfile.email,
          customerPhone: customerProfile.phone,
          notes: bookingData.note
        })
      });

      if (res.ok) {
        showNotification('Termin bestätigt. Eine Bestätigung wurde per E‑Mail versandt.', 'success');
        // Reset form
        setBookingStep(1);
        setBookingData({
          service: '',
          serviceId: '',
          date: '',
          time: '',
          employee: '',
          employeeId: '',
          note: '',
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

  const timeSlots = availableSlots.length > 0 ? availableSlots : defaultTimeSlots;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-400 mt-4">Lade Buchungsoptionen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header mit User Info */}
      <div className="border-b border-zinc-800 bg-black sticky top-0 z-40">
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
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Service' },
              { step: 2, label: 'Zeit' },
              { step: 3, label: 'Bestätigung' }
            ].map(({ step, label }, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition ${
                    step <= bookingStep ? 'bg-white text-black' : 'bg-zinc-800 text-gray-400'
                  }`}>
                    {step}
                  </div>
                  <span className={`text-sm mt-2 ${step <= bookingStep ? 'text-white' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1 mx-4 -mt-6 transition ${step < bookingStep ? 'bg-white' : 'bg-zinc-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Service Selection */}
        {bookingStep === 1 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Welcher Service interessiert dich?</h2>
            
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
                    <span className="flex items-center gap-2"><FiClock className="text-gray-400" /> {service.duration}</span>
                    <span className="text-white font-bold">{service.price}</span>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-bold mb-4 mt-8">Bevorzugten Friseur wählen</h3>
            {employees.length === 0 ? (
              <p className="text-gray-400 mb-6">Keine Mitarbeiter verfügbar - Wir weisen Ihnen einen Friseur zu.</p>
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
                      <div>
                        <p className="font-semibold">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.appointments} Termine</p>
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
            )}

            <button
              onClick={() => setBookingStep(2)}
              disabled={!bookingData.service}
              className="w-full px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
            >
              Weiter
            </button>
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {bookingStep === 2 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
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
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-zinc-500 focus:outline-none transition"
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
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Termin-Übersicht</h2>
            
              <div className="space-y-4 mb-8 p-6 bg-zinc-800 bg-opacity-50 rounded-lg">
              {salonName && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Salon:</span>
                  <span className="font-semibold">{salonName}</span>
                </div>
              )}
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
