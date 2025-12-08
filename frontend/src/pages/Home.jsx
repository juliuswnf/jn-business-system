import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Online-Buchungssystem für Salons
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Kunden buchen Termine direkt über Ihre Website. 
            Automatische Erinnerungen, einfache Verwaltung, faire Preise.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-black font-medium rounded hover:bg-gray-100 transition"
            >
              30 Tage kostenlos testen
            </Link>
            <Link
              to="/demo"
              className="px-8 py-3 border border-zinc-700 text-white font-medium rounded hover:bg-zinc-900 transition"
            >
              Demo ansehen
            </Link>
          </div>
          
          <p className="text-sm text-gray-500">
            Keine Kreditkarte erforderlich · Jederzeit kündbar
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">So funktioniert es</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-zinc-800 text-white rounded flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Account erstellen</h3>
              <p className="text-gray-500 text-sm">
                Registrieren Sie sich kostenlos und richten Sie Ihr Studio in wenigen Minuten ein.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-zinc-800 text-white rounded flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Services eintragen</h3>
              <p className="text-gray-500 text-sm">
                Fügen Sie Ihre Dienstleistungen mit Preisen und Zeitdauer hinzu.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-zinc-800 text-white rounded flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Buchungen empfangen</h3>
              <p className="text-gray-500 text-sm">
                Kunden buchen über Ihre Website, Sie verwalten alles im Dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Warum JN Business System?</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Keine Provisionen</h3>
                <p className="text-gray-500">Sie zahlen nur den monatlichen Festpreis. Keine versteckten Gebühren pro Buchung.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Automatische Erinnerungen</h3>
                <p className="text-gray-500">Kunden erhalten automatisch Termin-Erinnerungen per E-Mail. Weniger No-Shows.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Einfaches Widget</h3>
                <p className="text-gray-500">Ein Code-Snippet auf Ihrer Website und Kunden können direkt buchen.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Google Bewertungen</h3>
                <p className="text-gray-500">Nach jedem Termin wird automatisch um eine Google-Bewertung gebeten.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">DSGVO-konform</h3>
                <p className="text-gray-500">Server in Deutschland, alle Daten sicher und datenschutzkonform gespeichert.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Einfache Preisgestaltung</h2>
          <p className="text-gray-500 mb-8">
            Ab 49€ pro Monat. Keine versteckten Kosten, keine Provisionen.
          </p>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 max-w-md mx-auto">
            <div className="text-4xl font-bold mb-2">ab 49€</div>
            <div className="text-gray-500 mb-6">pro Monat</div>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Online-Buchungen
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                E-Mail-Erinnerungen
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Eigenes Buchungswidget
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                30 Tage kostenlos testen
              </li>
            </ul>
            <Link
              to="/pricing"
              className="block w-full py-3 bg-white text-black font-medium rounded hover:bg-gray-100 transition text-center"
            >
              Alle Tarife ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Bereit loszulegen?</h2>
          <p className="text-gray-500 mb-8">
            Testen Sie JN Business System 30 Tage kostenlos. Keine Kreditkarte erforderlich.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-3 bg-white text-black font-medium rounded hover:bg-gray-100 transition"
          >
            Kostenlos registrieren
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
