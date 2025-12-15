import { useState } from 'react';
import { Link } from 'react-router-dom';

const SERVICES = [
  { id: 1, name: 'Beratung Standard', duration: 45, price: 45 },
  { id: 2, name: 'Beratung Express', duration: 30, price: 28 },
  { id: 3, name: 'Behandlung Komplett', duration: 120, price: 85 },
  { id: 4, name: 'Premium Behandlung', duration: 150, price: 120 },
  { id: 5, name: 'Basis Service', duration: 30, price: 25 },
];

const EMPLOYEES = ['Julia M.', 'Marco S.', 'Lisa K.'];

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

export default function Demo() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [done, setDone] = useState(false);

  const dates = generateDates();

  const formatDate = (d) => d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });

  const handleBook = () => setDone(true);

  const reset = () => {
    setStep(1);
    setService(null);
    setEmployee(null);
    setDate(null);
    setTime(null);
    setForm({ name: '', email: '', phone: '' });
    setDone(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-medium bg-zinc-800 px-3 py-1 rounded-full mb-4">
            Interaktive Demo
          </span>
          <h1 className="text-3xl font-bold mb-3">Testen Sie das Buchungswidget</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Genau so sehen es Ihre Kunden. Keine Registrierung nötig.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          
          {/* Widget */}
          <div className="order-2 lg:order-1">
            <div className="border border-zinc-800 rounded-lg overflow-hidden">
              
              {/* Widget Header */}
              <div className="bg-zinc-900 p-5 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold">Muster Salon</h2>
                    <p className="text-sm text-gray-500">Online Terminbuchung</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="flex border-b border-zinc-800 text-xs">
                {['Service', 'Termin', 'Daten', 'Fertig'].map((label, i) => (
                  <div 
                    key={label}
                    className={`flex-1 py-2 text-center ${
                      step > i + 1 ? 'text-gray-300 bg-zinc-900' :
                      step === i + 1 ? 'text-white bg-zinc-800' :
                      'text-gray-600'
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="p-5 bg-zinc-950 min-h-[400px]">
                
                {/* Step 1: Service */}
                {step === 1 && !done && (
                  <div>
                    <h3 className="text-sm font-medium mb-4">Behandlung wählen</h3>
                    <div className="space-y-2">
                      {SERVICES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setService(s); setStep(2); }}
                          className="w-full p-3 border border-zinc-800 rounded text-left hover:border-zinc-600 transition flex justify-between items-center"
                        >
                          <div>
                            <div className="text-sm">{s.name}</div>
                            <div className="text-xs text-gray-500">{s.duration} Min.</div>
                          </div>
                          <span className="text-sm font-medium">{s.price}€</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Date & Time */}
                {step === 2 && !done && (
                  <div>
                    <button onClick={() => setStep(1)} className="text-xs text-gray-500 hover:text-white mb-4">
                      ← Zurück
                    </button>
                    
                    {/* Employee */}
                    <div className="mb-5">
                      <h4 className="text-xs text-gray-400 mb-2">Mitarbeiter (optional)</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setEmployee(null)}
                          className={`px-3 py-1 text-xs rounded ${!employee ? 'bg-white text-black' : 'bg-zinc-800 text-gray-300'}`}
                        >
                          Egal
                        </button>
                        {EMPLOYEES.map((e) => (
                          <button
                            key={e}
                            onClick={() => setEmployee(e)}
                            className={`px-3 py-1 text-xs rounded ${employee === e ? 'bg-white text-black' : 'bg-zinc-800 text-gray-300'}`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="mb-5">
                      <h4 className="text-xs text-gray-400 mb-2">Datum</h4>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {dates.map((d, i) => (
                          <button
                            key={i}
                            onClick={() => setDate(d)}
                            className={`flex-shrink-0 px-3 py-2 rounded text-center ${
                              date?.toDateString() === d.toDateString() ? 'bg-white text-black' : 'bg-zinc-800'
                            }`}
                          >
                            <div className="text-xs text-gray-400">{d.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
                            <div className="font-medium">{d.getDate()}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time */}
                    {date && (
                      <div>
                        <h4 className="text-xs text-gray-400 mb-2">Uhrzeit</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {TIMES.map((t) => (
                            <button
                              key={t}
                              onClick={() => { setTime(t); setStep(3); }}
                              className={`py-2 text-xs rounded ${time === t ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Customer Data */}
                {step === 3 && !done && (
                  <div>
                    <button onClick={() => setStep(2)} className="text-xs text-gray-500 hover:text-white mb-4">
                      ← Zurück
                    </button>

                    {/* Summary */}
                    <div className="bg-zinc-900 p-3 rounded mb-5 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Service:</span>
                        <span>{service?.name}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Wann:</span>
                        <span>{formatDate(date)}, {time}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-zinc-800">
                        <span className="text-gray-500">Preis:</span>
                        <span className="font-medium">{service?.price}€</span>
                      </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-3 mb-5">
                      <input
                        type="text"
                        placeholder="Name *"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600"
                      />
                      <input
                        type="email"
                        placeholder="E-Mail *"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600"
                      />
                      <input
                        type="tel"
                        placeholder="Telefon (optional)"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600"
                      />
                    </div>

                    <button
                      onClick={handleBook}
                      disabled={!form.name || !form.email}
                      className="w-full py-3 bg-white text-black font-medium rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Termin buchen
                    </button>
                  </div>
                )}

                {/* Done */}
                {done && (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Termin bestätigt</h3>
                    <p className="text-sm text-gray-400 mb-6">
                      Bestätigung wurde an {form.email} gesendet.
                    </p>
                    <button
                      onClick={reset}
                      className="px-4 py-2 bg-zinc-800 rounded text-sm hover:bg-zinc-700"
                    >
                      Demo neu starten
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-center text-xs text-gray-600 mt-3">
              Demo – keine echte Buchung wird erstellt
            </p>
          </div>

          {/* Info */}
          <div className="order-1 lg:order-2 space-y-6">
            
            <div className="border border-zinc-800 rounded-lg p-5">
              <h3 className="font-semibold mb-4">So funktioniert es</h3>
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Widget einbinden', desc: 'Code-Snippet auf Ihre Website kopieren' },
                  { step: 2, title: 'Services anlegen', desc: 'Behandlungen mit Preisen definieren' },
                  { step: 3, title: 'Kunden buchen', desc: '24/7 ohne Anruf oder Wartezeit' },
                  { step: 4, title: 'Automatische E-Mails', desc: 'Bestätigung und Erinnerung' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <span className="w-6 h-6 bg-zinc-800 rounded text-xs flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { title: '5 Minuten Setup', desc: 'Sofort einsatzbereit' },
                { title: 'Mehr Google-Bewertungen', desc: 'Automatische Anfrage nach Termin' },
                { title: 'Keine Provisionen', desc: 'Fixpreis statt Prozente' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3 border border-zinc-800 rounded-lg p-4">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium">{b.title}</div>
                    <div className="text-xs text-gray-500">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-zinc-800 rounded-lg p-5 text-center">
              <h3 className="font-semibold mb-2">Bereit loszulegen?</h3>
              <p className="text-sm text-gray-400 mb-4">30 Tage kostenlos testen</p>
              <Link
                to="/register"
                className="inline-block px-5 py-2 bg-white text-black font-medium rounded text-sm hover:bg-gray-100"
              >
                Jetzt starten
              </Link>
            </div>

            <div className="border border-zinc-800 rounded-lg p-5">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-300 italic mb-3">
                "Endlich keine verpassten Anrufe mehr. Meine Kunden buchen jetzt online."
              </p>
              <div className="text-xs text-gray-500">
                Sarah K. – Kosmetikstudio München
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
