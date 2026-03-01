import { useState } from 'react';
import { Link } from 'react-router-dom';

const BookingFlow = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '' });

  const services = [
    { id: 1, name: 'Beratung', price: 25, duration: 30 },
    { id: 2, name: 'Behandlung', price: 50, duration: 60 }
  ];

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setStep(3);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleCustomerInfoChange = (e) => {
    setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    // Hier würde der API-Call für die Buchung stehen
    setStep(5);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Termin buchen</h1>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Service auswählen</h2>
            <div className="space-y-4">
              {services.map(service => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-zinc-500">{service.price}€, {service.duration} Min.</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-zinc-900 rounded-lg hover:bg-blue-700">
                      Auswählen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date Selection */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Datum auswählen</h2>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                return (
                  <div
                    key={i}
                    onClick={() => handleDateSelect(date.toISOString().split('T')[0])}
                    className="border border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
                  >
                    <p className="font-medium text-gray-900">{date.toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Time Selection */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Uhrzeit auswählen</h2>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => {
                const hour = 10 + i;
                const time = `${hour}:00`;
                return (
                  <div
                    key={i}
                    onClick={() => handleTimeSelect(time)}
                    className="border border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
                  >
                    <p className="font-medium text-gray-900">{time}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Customer Info */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Kontaktdaten eingeben</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleCustomerInfoChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleCustomerInfoChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Telefon</label>
                <input
                  type="tel"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={handleCustomerInfoChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-blue-600 text-zinc-900 rounded-lg hover:bg-blue-700"
              >
                Buchung abschließen
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Buchung bestätigt</h2>
            <p className="text-zinc-500">Ihr Termin wurde erfolgreich gebucht. Sie erhalten eine Bestätigungs-Email.</p>
            <Link
              to="/customer/dashboard"
              className="mt-4 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-zinc-900 bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Zu meinem Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;
