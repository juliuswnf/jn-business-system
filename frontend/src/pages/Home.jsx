import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="min-h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headline & CTAs */}
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Buchen. Bestätigen. Bewertungen gewinnen.
              </h1>

              <p className="text-lg text-gray-300 max-w-2xl">
                Eine simple, zuverlässige Lösung für Salons, Studios und Dienstleister — Termine verwalten, Kundenerlebnisse standardisieren und automatisch Google-Bewertungen einholen.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-black font-medium shadow-md hover:opacity-95 transition"
                >
                  Demo starten
                </Link>

                <Link
                  to="/how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-700 text-gray-200 hover:bg-white/5 transition"
                >
                  Mehr erfahren
                </Link>
              </div>

              <div className="mt-6 text-sm text-gray-400 max-w-xl">
                Kein Schnickschnack — einfache Integration, DSGVO-konforme Prozesse und klar messbarer Mehrwert für Ihr Geschäft.
              </div>
            </div>

            {/* Right: Animated widget preview */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-80 sm:w-96 bg-gradient-to-br from-gray-900 to-black/70 rounded-3xl p-6 shadow-2xl border border-gray-800 backdrop-blur-md" style={{
                  boxShadow: '0 10px 30px rgba(255,255,255,0.02), 0 2px 6px rgba(0,0,0,0.6)'
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-2 w-24 rounded-full bg-gray-800/60" />
                    <div className="h-2 w-10 rounded-full bg-gray-800/60" />
                  </div>

                  <div className="space-y-3">
                    <div className="h-12 bg-white/6 rounded-md p-3 flex items-center justify-between">
                      <div className="text-sm text-gray-200">Termin: Haarschnitt — 10:30</div>
                      <div className="text-xs text-green-400 font-medium">Bestätigt</div>
                    </div>

                    <div className="h-12 bg-white/4 rounded-md p-3 flex items-center justify-between animate-pulse">
                      <div className="text-sm text-gray-200">Kunden: Maria H.</div>
                      <div className="text-xs text-gray-400">2 Tage vorher</div>
                    </div>

                    <div className="h-12 bg-white/6 rounded-md p-3 flex items-center justify-between">
                      <div className="text-sm text-gray-200">Zahlung: erfasst</div>
                      <div className="text-xs text-gray-400">Rechnung #1234</div>
                    </div>
                  </div>
                </div>

                {/* Glow */}
                <div className="absolute -inset-1 rounded-3xl blur-3xl opacity-10" style={{
                  background: 'radial-gradient(closest-side, rgba(255,255,255,0.06), transparent)'
                }} />

                {/* Floating animation */}
                <style>{`\n                  @keyframes floatY { 0% { transform: translateY(0px);} 50% { transform: translateY(-10px);} 100% { transform: translateY(0px);} }\n                  .widget-float { animation: floatY 6s ease-in-out infinite; }\n                `}</style>

                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 widget-float pointer-events-none">
                  <div className="w-40 h-2 bg-gradient-to-r from-white/8 to-transparent rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple features / FAQ strip - dark cards */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold">Einfache Integration</h3>
            <p className="mt-2 text-sm text-gray-400">Code-Snippet oder Widget — schnell eingebunden, keine Abhängigkeiten.</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold">Automatisierte Bewertungen</h3>
            <p className="mt-2 text-sm text-gray-400">Nach dem Termin wird eine E‑Mail mit Bewertungslink verschickt.</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold">DSGVO & Sicherheit</h3>
            <p className="mt-2 text-sm text-gray-400">Verlässliche Datenverarbeitung und transparente Prozesse.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;