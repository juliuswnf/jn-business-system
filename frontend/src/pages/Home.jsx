import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "JN Business System",
    "description": "Online-Buchungssystem für Unternehmen mit automatischen Terminbestätigungen und No-Show-Killer",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "29",
      "priceCurrency": "EUR",
      "priceValidUntil": "2025-12-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "120"
    }
  };

  return (
    <>
      <SEO
        title="Online-Buchungssystem für Unternehmen"
        description="Automatische Terminbuchungen für Dienstleister aller Branchen. 30 Tage kostenlos testen. No-Show-Killer inklusive."
        keywords="Online Buchungssystem, Terminvereinbarung, Business Software, Unternehmensverwaltung, No-Show-Killer"
        url="/"
        structuredData={structuredData}
      />
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Large with Preview */}
      <section className="min-h-[90vh] flex items-center px-6 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Text Content */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Online-Buchungssystem für Ihr Unternehmen
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-lg">
                Kunden buchen Termine direkt über Ihre Website.
                Automatische Erinnerungen, einfache Verwaltung, faire Preise.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition text-center"
                >
                  30 Tage kostenlos testen
                </Link>
                <Link
                  to="/demo"
                  className="px-8 py-4 border border-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-900 transition text-center"
                >
                  Demo ansehen
                </Link>
              </div>

              <p className="text-sm text-gray-300">
                Keine Kreditkarte erforderlich · Jederzeit kündbar
              </p>
            </div>

            {/* Right: Dashboard Preview - Simple Version */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Main Dashboard Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Header */}
                  <div className="bg-zinc-800 px-5 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black font-bold text-sm">JN</span>
                      </div>
                      <span className="font-medium">Mein Dashboard</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-zinc-600" />
                      <div className="w-3 h-3 rounded-full bg-zinc-600" />
                      <div className="w-3 h-3 rounded-full bg-zinc-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-5">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold">47</div>
                        <div className="text-xs text-gray-300">Buchungen</div>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">€2.340</div>
                        <div className="text-xs text-gray-300">Umsatz</div>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold">4.8</div>
                        <div className="text-xs text-gray-300">Bewertung</div>
                      </div>
                    </div>

                    {/* Bookings List */}
                    <div>
                      <div className="text-sm text-gray-200 mb-3">Heutige Termine</div>
                      <div className="space-y-2">
                        <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">MH</div>
                            <div>
                              <div className="font-medium">Maria H.</div>
                              <div className="text-sm text-gray-300">Beratung · 10:30 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Bestätigt</span>
                        </div>
                        <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">SK</div>
                            <div>
                              <div className="font-medium">Sophie K.</div>
                              <div className="text-sm text-gray-300">Behandlung · 14:00 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">Neu</span>
                        </div>
                        <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">LM</div>
                            <div>
                              <div className="font-medium">Lisa M.</div>
                              <div className="text-sm text-gray-300">Termin · 16:30 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Bestätigt</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Notification - New Booking - slides up and down */}
                <div className="absolute -top-3 -right-3 bg-white text-black rounded-xl shadow-lg p-3 animate-bounce-slow">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Neue Buchung!</div>
                      <div className="text-xs text-gray-600">vor 2 Min.</div>
                    </div>
                  </div>
                </div>

                {/* Floating Review Badge */}
                <div className="absolute -bottom-3 -left-3 bg-white text-black rounded-xl shadow-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map((i) => (
                        <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold">+12 Bewertungen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Feature Showcase */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Unsere <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Top-Features</span></h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Die wichtigsten Funktionen für Ihr Business - professionell und sofort einsatzbereit
            </p>
          </div>

          <div className="space-y-32">
            {/* Feature 1: Online Booking Widget */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Online Buchungs-Widget
                </div>
                <h3 className="text-4xl font-bold mb-6">Kunden buchen 24/7 online</h3>
                <p className="text-gray-300 text-lg mb-8">
                  Integrieren Sie unser Buchungs-Widget auf Ihrer Website mit nur einem Code-Schnipsel. Ihre Kunden können rund um die Uhr buchen - auch wenn Sie schlafen.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Einfache Integration</div>
                      <div className="text-gray-400">Kopieren Sie den Code und fügen Sie ihn auf Ihrer Website ein</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Echtzeit-Verfügbarkeit</div>
                      <div className="text-gray-400">Nur freie Termine werden angezeigt - keine Doppelbuchungen</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Vollständig anpassbar</div>
                      <div className="text-gray-400">Farben, Logo und Design - alles in Ihrem Brand-Look</div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative">
                {/* Booking Widget Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700">
                    <div className="text-center">
                      <h3 className="font-bold text-lg">Termin buchen</h3>
                      <p className="text-sm text-gray-400">Beauty Studio Müller</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Service Selection */}
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Service wählen</label>
                      <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white">
                        <option>Haarschnitt - €35 (45 Min.)</option>
                        <option>Färben - €65 (90 Min.)</option>
                        <option>Styling - €25 (30 Min.)</option>
                      </select>
                    </div>
                    {/* Date Picker */}
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Datum wählen</label>
                      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                        <div className="text-center mb-2 text-sm">Dezember 2025</div>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                          <div className="p-2 text-gray-500">Mo</div>
                          <div className="p-2 text-gray-500">Di</div>
                          <div className="p-2 text-gray-500">Mi</div>
                          <div className="p-2 text-gray-500">Do</div>
                          <div className="p-2 text-gray-500">Fr</div>
                          <div className="p-2 text-gray-500">Sa</div>
                          <div className="p-2 text-gray-500">So</div>
                          <div className="p-2 text-gray-600">15</div>
                          <div className="p-2 text-gray-600">16</div>
                          <div className="p-2 bg-blue-500 text-white rounded-lg font-semibold">17</div>
                          <div className="p-2 hover:bg-zinc-700 rounded-lg cursor-pointer">18</div>
                          <div className="p-2 hover:bg-zinc-700 rounded-lg cursor-pointer">19</div>
                          <div className="p-2 hover:bg-zinc-700 rounded-lg cursor-pointer">20</div>
                          <div className="p-2 hover:bg-zinc-700 rounded-lg cursor-pointer">21</div>
                        </div>
                      </div>
                    </div>
                    {/* Time Slots */}
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Uhrzeit wählen</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="px-4 py-2 bg-zinc-800 hover:bg-blue-500 border border-zinc-700 hover:border-blue-500 rounded-lg text-sm transition">09:00</button>
                        <button className="px-4 py-2 bg-zinc-800 hover:bg-blue-500 border border-zinc-700 hover:border-blue-500 rounded-lg text-sm transition">10:30</button>
                        <button className="px-4 py-2 bg-zinc-800 hover:bg-blue-500 border border-zinc-700 hover:border-blue-500 rounded-lg text-sm transition">13:00</button>
                      </div>
                    </div>
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition">
                      Jetzt buchen
                    </button>
                  </div>
                </div>
                <div className="absolute -z-10 -inset-4 bg-blue-500/30 blur-3xl rounded-full"></div>
              </div>
            </div>

            {/* Feature 2: Automated Reminders & Notifications */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                {/* Email/SMS Notifications */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-semibold">Benachrichtigungen</span>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">Aktiv</span>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Email Notification */}
                    <div className="bg-zinc-800 rounded-xl p-4 border-l-4 border-cyan-400">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="font-semibold text-sm">E-Mail Erinnerung</span>
                        </div>
                        <span className="text-xs text-gray-400">24h vorher</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">Hallo Anna, Ihr Termin morgen um 10:00 Uhr wurde bestätigt.</p>
                      <div className="text-xs text-gray-500">An: anna.mueller@email.de</div>
                    </div>
                    {/* SMS Notification */}
                    <div className="bg-zinc-800 rounded-xl p-4 border-l-4 border-green-500">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <span className="font-semibold text-sm">SMS Erinnerung</span>
                        </div>
                        <span className="text-xs text-gray-400">2h vorher</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">Beauty Studio: Ihr Termin heute um 10:00. Bis gleich!</p>
                      <div className="text-xs text-gray-500">An: +49 151 2345 6789</div>
                    </div>
                    {/* Push Notification */}
                    <div className="bg-zinc-800 rounded-xl p-4 border-l-4 border-purple-500">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <span className="font-semibold text-sm">Neue Buchung</span>
                        </div>
                        <span className="text-xs text-gray-400">Gerade eben</span>
                      </div>
                      <p className="text-sm text-gray-300">Lisa Schmidt hat einen Termin für morgen 14:00 Uhr gebucht.</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -z-10 -inset-4 bg-cyan-400/30 blur-3xl rounded-full"></div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-sm font-semibold mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Automatische Erinnerungen
                </div>
                <h3 className="text-4xl font-bold mb-6">80% weniger No-Shows</h3>
                <p className="text-gray-300 text-lg mb-8">
                  Das System schickt automatisch E-Mails und SMS an Ihre Kunden. 24h vorher, 2h vorher - Sie konfigurieren es einmal und vergessen es.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">E-Mail & SMS Erinnerungen</div>
                      <div className="text-gray-400">Automatisch 24h und 2h vor dem Termin</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Buchungsbestätigungen</div>
                      <div className="text-gray-400">Sofortige Bestätigung nach jeder Buchung</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Anpassbare Vorlagen</div>
                      <div className="text-gray-400">Personalisieren Sie alle Nachrichten nach Ihrem Stil</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Multi-Location Support */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm font-semibold mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Mehrere Standorte
                </div>
                <h3 className="text-4xl font-bold mb-6">Perfekt für Filial-Betriebe</h3>
                <p className="text-gray-300 text-lg mb-8">
                  Verwalten Sie alle Ihre Standorte zentral. Jede Filiale hat eigene Mitarbeiter, Services und Öffnungszeiten - aber Sie sehen alles auf einen Blick.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Zentrale Verwaltung</div>
                      <div className="text-gray-400">Ein Dashboard für alle Standorte</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Standort-spezifische Einstellungen</div>
                      <div className="text-gray-400">Jede Filiale kann eigene Preise und Services haben</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Übergreifende Auswertungen</div>
                      <div className="text-gray-400">Vergleichen Sie Umsätze und Performance aller Filialen</div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative">
                {/* Multi-Location Dashboard */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-semibold">Standorte</span>
                    </div>
                    <button className="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-lg">+ Neuer Standort</button>
                  </div>
                  <div className="p-6 space-y-3">
                    {/* Location 1 */}
                    <div className="bg-zinc-800 rounded-xl p-4 hover:bg-zinc-700 transition cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                            M
                          </div>
                          <div>
                            <div className="font-semibold">München Zentrum</div>
                            <div className="text-sm text-gray-400">Marienplatz 5</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">Geöffnet</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-bold text-blue-400">12</div>
                          <div className="text-xs text-gray-400">Heute</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-bold text-cyan-400">€1.2k</div>
                          <div className="text-xs text-gray-400">Umsatz</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-bold text-green-400">3</div>
                          <div className="text-xs text-gray-400">Mitarbeiter</div>
                        </div>
                      </div>
                    </div>
                    {/* Location 2 */}
                    <div className="bg-zinc-800 rounded-xl p-4 hover:bg-zinc-700 transition cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold">
                            S
                          </div>
                          <div>
                            <div className="font-semibold">Stuttgart Süd</div>
                            <div className="text-sm text-gray-400">Königstraße 42</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">Geöffnet</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-bold text-blue-400">8</div>
                          <div className="text-xs text-gray-400">Heute</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-bold text-cyan-400">€950</div>
                          <div className="text-xs text-gray-400">Umsatz</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-bold text-green-400">2</div>
                          <div className="text-xs text-gray-400">Mitarbeiter</div>
                        </div>
                      </div>
                    </div>
                    {/* Location 3 */}
                    <div className="bg-zinc-800 rounded-xl p-4 hover:bg-zinc-700 transition cursor-pointer opacity-60">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold">
                            B
                          </div>
                          <div>
                            <div className="font-semibold">Berlin Mitte</div>
                            <div className="text-sm text-gray-400">Friedrichstraße 123</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-semibold rounded-full">Geschlossen</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -z-10 -inset-4 bg-purple-500/30 blur-3xl rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Visual Version */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">So funktioniert es</h2>
          <p className="text-gray-300 text-center mb-16 max-w-2xl mx-auto">
            In nur 3 Schritten zu Ihrem eigenen Online-Buchungssystem
          </p>

          <div className="space-y-24">
            {/* Step 1 - With Visual */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-4">
                  Schritt 1
                </div>
                <h3 className="text-3xl font-bold mb-4">Account erstellen & einrichten</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Registrieren Sie sich kostenlos und richten Sie Ihr Studio in wenigen Minuten ein. Keine technischen Kenntnisse erforderlich.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Firmenname und Kontaktdaten eingeben
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Öffnungszeiten festlegen
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Logo und Farben anpassen
                  </li>
                </ul>
              </div>
              <div className="relative">
                {/* Settings Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <span className="font-semibold">⚙️ Einstellungen</span>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Firmenname</label>
                      <input type="text" value="Mein Beauty Studio" readOnly className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Öffnungszeiten</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="time" value="09:00" readOnly className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm" />
                        <input type="time" value="18:00" readOnly className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm" />
                      </div>
                    </div>
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition">
                      Speichern
                    </button>
                  </div>
                </div>
                <div className="absolute -z-10 inset-0 bg-blue-500/20 blur-3xl"></div>
              </div>
            </div>

            {/* Step 2 - With Visual */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative">
                {/* Services Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <span className="font-semibold">💼 Services</span>
                    <button className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-lg">+ Neu</button>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Haarschnitt</div>
                        <div className="text-sm text-gray-400">45 Min.</div>
                      </div>
                      <div className="text-lg font-bold text-blue-400">€35</div>
                    </div>
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Färben</div>
                        <div className="text-sm text-gray-400">90 Min.</div>
                      </div>
                      <div className="text-lg font-bold text-blue-400">€65</div>
                    </div>
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Styling</div>
                        <div className="text-sm text-gray-400">30 Min.</div>
                      </div>
                      <div className="text-lg font-bold text-blue-400">€25</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -z-10 inset-0 bg-cyan-400/20 blur-3xl"></div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-block px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-sm font-semibold mb-4">
                  Schritt 2
                </div>
                <h3 className="text-3xl font-bold mb-4">Services anlegen</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Fügen Sie Ihre Dienstleistungen mit Preisen und Zeitdauer hinzu. Kunden sehen sofort, was Sie anbieten.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Name, Preis und Dauer festlegen
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Beschreibung und Bilder hinzufügen
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mitarbeiter zuweisen
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 - With Visual */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold mb-4">
                  Schritt 3
                </div>
                <h3 className="text-3xl font-bold mb-4">Buchungen empfangen</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Kunden buchen über Ihre Website, Sie verwalten alles im Dashboard. Automatische Bestätigungen und Erinnerungen inklusive.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Echtzei Terminkalender
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Automatische E-Mail Bestätigungen
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Kunden-Datenbank mit Historie
                  </li>
                </ul>
              </div>
              <div className="relative">
                {/* Bookings Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <span className="font-semibold">📅 Heutige Buchungen</span>
                    <span className="text-sm text-gray-400">17. Dez 2025</span>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            MK
                          </div>
                          <div>
                            <div className="font-semibold">Maria Klein</div>
                            <div className="text-sm text-gray-400">10:00 Uhr</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">Bestätigt</span>
                      </div>
                      <div className="text-sm text-gray-400">Haarschnitt • 45 Min. • €35</div>
                    </div>
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            SB
                          </div>
                          <div>
                            <div className="font-semibold">Stefan Bauer</div>
                            <div className="text-sm text-gray-400">14:30 Uhr</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">Neu</span>
                      </div>
                      <div className="text-sm text-gray-400">Färben • 90 Min. • €65</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -z-10 inset-0 bg-green-500/20 blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Warum JN Business System?</h2>
              <p className="text-gray-300 mb-8">
                Alles was Sie brauchen, um Ihr Termingeschäft zu digitalisieren.
              </p>

              <div className="space-y-6">
                {[
                  { title: 'Automatische Erinnerungen', desc: 'Kunden bekommen 2 Tage vor dem Termin eine Nachricht. Vergessene Termine werden automatisch abgesagt. Spart €544 im Monat.', highlight: true },
                  { title: 'Automatisches Marketing', desc: 'Schickt automatisch Geburtstagswünsche, erinnert alte Kunden, fragt nach Bewertungen. Bringt €4.026 zusätzlich im Monat.', highlight: true },
                  { title: 'Keine Provisionen', desc: 'Sie zahlen nur den monatlichen Festpreis. Keine versteckten Gebühren pro Buchung.' },
                  { title: 'Branchen-Workflows', desc: 'Tattoo Studios, Medical/Botox, Wellness Spas - spezialisierte Workflows für Ihre Branche.' },
                  { title: 'Preis-Berater', desc: '6 einfache Fragen beantworten und wir finden den passenden Preis für Ihr Geschäft.', highlight: false },
                  { title: 'Datenschutz & Sicherheit', desc: 'Server in Deutschland, alle Daten verschlüsselt und sicher gespeichert.', highlight: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={item.highlight ? 'w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5' : 'w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'}>
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={item.highlight ? 'font-semibold mb-1 text-blue-400' : 'font-semibold mb-1'}>{item.title}</h3>
                      <p className="text-gray-300 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 text-center">Was bringt es Ihnen?</h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2 text-blue-400">€544</div>
                  <div className="text-gray-300 text-sm">Ersparnis pro Monat</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2 text-blue-400">€4.026</div>
                  <div className="text-gray-300 text-sm">Zusatz-Umsatz pro Monat</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">4x</div>
                  <div className="text-gray-300 text-sm">Lohnt sich 4-fach</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">16x</div>
                  <div className="text-gray-300 text-sm">Lohnt sich 16-fach</div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  to="/onboarding/pricing-wizard"
                  className="inline-block px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition"
                >
                  🎯 Preis-Berater starten
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">3 Preisstufen - Eine für jeden</h2>
          <p className="text-gray-300 mb-12">
            Von Starter (€129/Mo) bis Enterprise (€599/Mo). Keine versteckten Kosten, keine Provisionen.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {/* Starter */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
              <div className="text-2xl font-bold mb-2">€129</div>
              <div className="text-gray-300 mb-4">Starter</div>
              <ul className="space-y-3 text-sm">
                {['3 Mitarbeiter', '100 Buchungen/Mo', 'NO-SHOW-KILLER Basic', 'E-Mail Support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional */}
            <div className="bg-zinc-900 border-2 border-blue-500 rounded-2xl p-6 text-left relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                BELIEBT
              </div>
              <div className="text-2xl font-bold mb-2">€249</div>
              <div className="text-gray-300 mb-4">Professional</div>
              <ul className="space-y-3 text-sm">
                {['Unlimited Staff', 'NO-SHOW-KILLER Full', 'MARKETING-AGENT (5/Mo)', '1 Branchen-Workflow'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
              <div className="text-2xl font-bold mb-2">€599</div>
              <div className="text-gray-300 mb-4">Enterprise</div>
              <ul className="space-y-3 text-sm">
                {['Unlimited Everything', 'Marketing Unlimited', 'ALLE 8 Workflows', '24/7 Support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link
            to="/pricing"
            className="inline-block px-10 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition"
          >
            Alle Features vergleichen
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Bereit loszulegen?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Testen Sie JN Business System 30 Tage kostenlos. Keine Kreditkarte erforderlich.
          </p>
          <Link
            to="/register"
            className="inline-block px-10 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition text-lg"
          >
            Kostenlos registrieren
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}

export default Home;
