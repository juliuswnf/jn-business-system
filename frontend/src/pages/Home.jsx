import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Large with Preview */}
      <section className="min-h-[90vh] flex items-center px-6 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Text Content */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-gray-900">
                Online-Buchungssystem fÃ¼r Ihr Unternehmen
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Kunden buchen Termine direkt Ã¼ber Ihre Website.
                Automatische Erinnerungen, einfache Verwaltung, faire Preise.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-indigo-600 text-gray-900 font-medium rounded-lg hover:bg-indigo-700 transition text-center"
                >
                  30 Tage kostenlos testen
                </Link>
                <Link
                  to="/demo"
                  className="px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-center"
                >
                  Demo ansehen
                </Link>
              </div>

              <p className="text-sm text-gray-600">
                Keine Kreditkarte erforderlich Â· Jederzeit kÃ¼ndbar
              </p>
            </div>

            {/* Right: Dashboard Preview - Simple Version */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Main Dashboard Card */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Header */}
                  <div className="bg-gray-100 px-5 py-4 border-b border-gray-300 flex items-center justify-between">
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
                      <div className="bg-gray-100 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold">47</div>
                        <div className="text-xs text-gray-600">Buchungen</div>
                      </div>
                      <div className="bg-gray-100 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">â‚¬2.340</div>
                        <div className="text-xs text-gray-600">Umsatz</div>
                      </div>
                      <div className="bg-gray-100 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold">4.8</div>
                        <div className="text-xs text-gray-600">Bewertung</div>
                      </div>
                    </div>

                    {/* Bookings List */}
                    <div>
                      <div className="text-sm text-gray-400 mb-3">Heutige Termine</div>
                      <div className="space-y-2">
                        <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">MH</div>
                            <div>
                              <div className="font-medium">Maria H.</div>
                              <div className="text-sm text-gray-600">Beratung Â· 10:30 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">BestÃ¤tigt</span>
                        </div>
                        <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">SK</div>
                            <div>
                              <div className="font-medium">Sophie K.</div>
                              <div className="text-sm text-gray-600">Behandlung Â· 14:00 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">Neu</span>
                        </div>
                        <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">LM</div>
                            <div>
                              <div className="font-medium">Lisa M.</div>
                              <div className="text-sm text-gray-600">Termin Â· 16:30 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">BestÃ¤tigt</span>
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

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">So funktioniert es</h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            In nur 3 Schritten zu Ihrem eigenen Online-Buchungssystem
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gray-100 text-gray-900 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:bg-white group-hover:text-black transition-all duration-300">
                1
              </div>
              <h3 className="font-semibold text-lg mb-3">Account erstellen</h3>
              <p className="text-gray-600">
                Registrieren Sie sich kostenlos und richten Sie Ihr Studio in wenigen Minuten ein.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gray-100 text-gray-900 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:bg-white group-hover:text-black transition-all duration-300">
                2
              </div>
              <h3 className="font-semibold text-lg mb-3">Services eintragen</h3>
              <p className="text-gray-600">
                FÃ¼gen Sie Ihre Dienstleistungen mit Preisen und Zeitdauer hinzu.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gray-100 text-gray-900 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:bg-white group-hover:text-black transition-all duration-300">
                3
              </div>
              <h3 className="font-semibold text-lg mb-3">Buchungen empfangen</h3>
              <p className="text-gray-600">
                Kunden buchen Ã¼ber Ihre Website, Sie verwalten alles im Dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Warum JN Business System?</h2>
              <p className="text-gray-600 mb-8">
                Alles was Sie brauchen, um Ihr TermingeschÃ¤ft zu digitalisieren.
              </p>

              <div className="space-y-6">
                {[
                  { title: 'Keine Provisionen', desc: 'Sie zahlen nur den monatlichen Festpreis. Keine versteckten GebÃ¼hren pro Buchung.' },
                  { title: 'Automatische Erinnerungen', desc: 'Kunden erhalten automatisch Termin-Erinnerungen per E-Mail. Weniger No-Shows.' },
                  { title: 'Einfaches Widget', desc: 'Ein Code-Snippet auf Ihrer Website und Kunden kÃ¶nnen direkt buchen.' },
                  { title: 'Google Bewertungen', desc: 'Nach jedem Termin wird automatisch um eine Google-Bewertung gebeten.' },
                  { title: 'DSGVO-konform', desc: 'Server in Deutschland, alle Daten sicher und datenschutzkonform gespeichert.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center p-6 bg-gray-100/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">500+</div>
                  <div className="text-gray-600 text-sm">Aktive Unternehmen</div>
                </div>
                <div className="text-center p-6 bg-gray-100/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">50k+</div>
                  <div className="text-gray-600 text-sm">Buchungen/Monat</div>
                </div>
                <div className="text-center p-6 bg-gray-100/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">4.9</div>
                  <div className="text-gray-600 text-sm">Bewertung</div>
                </div>
                <div className="text-center p-6 bg-gray-100/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">2h</div>
                  <div className="text-gray-600 text-sm">Zeit gespart/Tag</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Einfache Preisgestaltung</h2>
          <p className="text-gray-600 mb-12">
            Ab 49â‚¬ pro Monat. Keine versteckten Kosten, keine Provisionen.
          </p>

          <div className="bg-white border border-gray-200 rounded-2xl p-10 max-w-lg mx-auto">
            <div className="text-5xl font-bold mb-2">ab 49â‚¬</div>
            <div className="text-gray-600 mb-8">pro Monat</div>
            <ul className="text-left space-y-4 mb-10">
              {['Online-Buchungen', 'E-Mail-Erinnerungen', 'Eigenes Buchungswidget', '30 Tage kostenlos testen'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/pricing"
              className="block w-full py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition text-center"
            >
              Alle Tarife ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Bereit loszulegen?</h2>
          <p className="text-gray-600 mb-8 text-lg">
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
  );
}

export default Home;
