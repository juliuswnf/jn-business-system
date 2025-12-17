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
            <h2 className="text-4xl font-bold mb-4">Alles, was Sie brauchen. <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">An einem Ort.</span></h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Professionelle Features, die Ihren Geschäftsalltag vereinfachen
            </p>
          </div>

          <div className="space-y-32">
            {/* Feature 1: Calendar & Bookings */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Intelligenter Terminkalender
                </div>
                <h3 className="text-4xl font-bold mb-6">Behalten Sie den Überblick über alle Termine</h3>
                <p className="text-gray-300 text-lg mb-8">
                  Sehen Sie alle Buchungen auf einen Blick. Drag & Drop zum Verschieben, automatische Kollisionserkennung und intelligente Benachrichtigungen.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Echtzeit-Synchronisation</div>
                      <div className="text-gray-400">Änderungen werden sofort auf allen Geräten angezeigt</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Mehrere Mitarbeiter</div>
                      <div className="text-gray-400">Verwalten Sie Termine für Ihr gesamtes Team</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Automatische Erinnerungen</div>
                      <div className="text-gray-400">Reduzieren Sie No-Shows um bis zu 80%</div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative">
                {/* Calendar Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-semibold">Kalender</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <button className="px-3 py-1 hover:bg-zinc-700 rounded-lg transition">←</button>
                      <span className="font-medium">17. Dezember 2025</span>
                      <button className="px-3 py-1 hover:bg-zinc-700 rounded-lg transition">→</button>
                    </div>
                  </div>
                  <div className="p-6">
                    {/* Timeline */}
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-16 text-sm text-gray-400 flex-shrink-0">09:00</div>
                        <div className="flex-1 bg-blue-500/20 border-l-4 border-blue-500 rounded-r-xl p-3">
                          <div className="font-semibold">Anna Müller</div>
                          <div className="text-sm text-gray-300">Haarschnitt • 60 Min.</div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-16 text-sm text-gray-400 flex-shrink-0">10:30</div>
                        <div className="flex-1 bg-purple-500/20 border-l-4 border-purple-500 rounded-r-xl p-3">
                          <div className="font-semibold">Lisa Schmidt</div>
                          <div className="text-sm text-gray-300">Färben • 120 Min.</div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-16 text-sm text-gray-400 flex-shrink-0">13:00</div>
                        <div className="flex-1 bg-cyan-500/20 border-l-4 border-cyan-500 rounded-r-xl p-3">
                          <div className="font-semibold">Max Weber</div>
                          <div className="text-sm text-gray-300">Styling • 45 Min.</div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-16 text-sm text-gray-400 flex-shrink-0">14:15</div>
                        <div className="flex-1 bg-green-500/20 border-l-4 border-green-500 rounded-r-xl p-3">
                          <div className="font-semibold">Sarah Klein</div>
                          <div className="text-sm text-gray-300">Beratung • 30 Min.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -z-10 -inset-4 bg-blue-500/30 blur-3xl rounded-full"></div>
              </div>
            </div>

            {/* Feature 2: Analytics */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                {/* Analytics Dashboard */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="font-semibold">Analytics</span>
                    </div>
                    <select className="bg-zinc-700 px-3 py-1 rounded-lg text-sm">
                      <option>Dieser Monat</option>
                    </select>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Revenue Chart */}
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Umsatz</div>
                      <div className="text-3xl font-bold mb-4">€12.450</div>
                      <div className="flex items-end gap-1 h-32">
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg opacity-50" style={{height: '40%'}}></div>
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg opacity-60" style={{height: '55%'}}></div>
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg opacity-70" style={{height: '70%'}}></div>
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg" style={{height: '100%'}}></div>
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg opacity-80" style={{height: '85%'}}></div>
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg opacity-60" style={{height: '60%'}}></div>
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg opacity-50" style={{height: '45%'}}></div>
                      </div>
                    </div>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-800 rounded-xl p-4">
                        <div className="text-2xl font-bold text-green-400">+23%</div>
                        <div className="text-xs text-gray-400">Buchungen</div>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-4">
                        <div className="text-2xl font-bold text-blue-400">156</div>
                        <div className="text-xs text-gray-400">Neue Kunden</div>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-4">
                        <div className="text-2xl font-bold text-purple-400">4.9</div>
                        <div className="text-xs text-gray-400">Bewertung</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -z-10 -inset-4 bg-cyan-400/30 blur-3xl rounded-full"></div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-sm font-semibold mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Detaillierte Analytics
                </div>
                <h3 className="text-4xl font-bold mb-6">Verstehen Sie Ihr Geschäft besser</h3>
                <p className="text-gray-300 text-lg mb-8">
                  Erhalten Sie wertvolle Einblicke in Umsätze, Auslastung und Kundenverhalten. Treffen Sie datenbasierte Entscheidungen.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Umsatz-Tracking</div>
                      <div className="text-gray-400">Sehen Sie Ihre Einnahmen in Echtzeit</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Beliebte Services</div>
                      <div className="text-gray-400">Welche Leistungen werden am meisten gebucht?</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Export-Funktionen</div>
                      <div className="text-gray-400">Exportieren Sie Daten für Ihre Buchhaltung</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Customer Management */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm font-semibold mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Kunden-Management
                </div>
                <h3 className="text-4xl font-bold mb-6">Bauen Sie langfristige Kundenbeziehungen auf</h3>
                <p className="text-gray-300 text-lg mb-8">
                  Speichern Sie Kundenpräferenzen, Notizen und Buchungshistorie. Personalisieren Sie jeden Besuch.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Vollständige Kundenprofile</div>
                      <div className="text-gray-400">Kontaktdaten, Präferenzen und Geschichte an einem Ort</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Notizen & Tags</div>
                      <div className="text-gray-400">Merken Sie sich wichtige Details zu jedem Kunden</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Automatische Segmentierung</div>
                      <div className="text-gray-400">Stammkunden, Neukunden, VIPs - alles automatisch</div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative">
                {/* Customer Database Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="font-semibold">Kunden</span>
                    </div>
                    <input type="text" placeholder="Suchen..." className="bg-zinc-700 px-3 py-1 rounded-lg text-sm w-40" />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-700 transition cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          AM
                        </div>
                        <div>
                          <div className="font-semibold">Anna Müller</div>
                          <div className="text-sm text-gray-400">23 Buchungen • Stammkundin</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">VIP</span>
                    </div>
                    <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-700 transition cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                          LS
                        </div>
                        <div>
                          <div className="font-semibold">Lisa Schmidt</div>
                          <div className="text-sm text-gray-400">8 Buchungen</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">Aktiv</span>
                    </div>
                    <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-700 transition cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                          MW
                        </div>
                        <div>
                          <div className="font-semibold">Max Weber</div>
                          <div className="text-sm text-gray-400">1 Buchung • vor 2 Tagen</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">Neu</span>
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
