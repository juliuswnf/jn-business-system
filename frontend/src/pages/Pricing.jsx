import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfekt für kleine Betriebe',
    price: 129,
    yearlyPrice: 1188,
    yearlyMonthlyCost: 99,
    features: [
      { name: 'Mitarbeiter', value: '5', description: 'Bis zu 5 Mitarbeiter können das System nutzen' },
      { name: 'Standorte', value: '1', description: 'Für einen Unternehmens-Standort' },
      { name: 'Buchungen/Monat', value: '200', description: 'Bis zu 200 Termine pro Monat verwaltbar' },
      { name: 'Kunden', value: '500', description: 'Bis zu 500 Kundenkontakte speicherbar' },
      { name: 'Speicherplatz', value: '5 GB', description: '5 GB für Bilder und Dokumente' },
      { name: 'Online-Buchung', included: true, description: 'Kunden buchen selbständig Termine über Ihre Webseite' },
      { name: 'Öffentliche Buchungsseite', included: true, description: 'Eigene Seite, auf der Kunden Ihre Dienste sehen und buchen können' },
      { name: 'Kalender & Terminverwaltung', included: true, description: 'Alle Termine übersichtlich im Kalender verwalten' },
      { name: 'E-Mail-Benachrichtigungen', included: true, description: 'Automatische Bestätigungs- und Erinnerungs-E-Mails an Kunden' },
      { name: 'Kundendatenbank (CRM)', included: true, description: 'Alle Kundendaten sicher an einem Ort gespeichert' },
      { name: 'Zahlungsabwicklung (Stripe)', included: true, description: 'Kunden können direkt online per Kreditkarte bezahlen' },
      { name: 'Basis-Auswertungen', included: true, description: 'Einfache Übersicht über Umsätze und Termine' },
      { name: 'Google-Bewertungen', included: true, description: 'Automatisch Kunden nach Bewertungen fragen' },
      { name: 'E-Mail-Support', included: true, description: 'Support-Ticket jederzeit schreiben – Antwort werktags zwischen 10 und 16 Uhr' },
    ],
    notIncluded: [
      'SMS-Benachrichtigungen',
      'Automatisches Marketing',
      'Erweiterte Auswertungen',
      'Ausfall-Schutz (Gebühr bei Nichterscheinen)',
      'Warteliste',
      'Wiederkehrende Termine',
      'Service-Pakete & Abos',
      'Portfolio & Galerien',
      'Mehrere Standorte',
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal für wachsende Teams',
    price: 249,
    yearlyPrice: 2388,
    yearlyMonthlyCost: 199,
    popular: true,
    features: [
      { name: 'Mitarbeiter', value: '30', description: 'Bis zu 30 Mitarbeiter können das System nutzen' },
      { name: 'Standorte', value: '1', description: 'Für einen Unternehmens-Standort' },
      { name: 'Buchungen/Monat', value: '1.000', description: 'Bis zu 1.000 Termine pro Monat verwaltbar' },
      { name: 'Kunden', value: 'Unbegrenzt', description: 'Unbegrenzt viele Kundenkontakte speichern' },
      { name: 'Speicherplatz', value: '25 GB', description: '25 GB für Bilder, Galerien und Dokumente' },
      { name: 'Alles aus Starter', included: true, bold: true, description: 'Alle Funktionen vom Starter-Plan inklusive' },
      { name: 'Erweiterte Auswertungen', included: true, highlight: true, description: 'Detaillierte Übersicht über Umsätze, Ausfälle und Gewinn' },
      { name: 'Automatisches Marketing & E-Mail-Kampagnen', included: true, highlight: true, description: 'Geburtstag, Rückholung, Bewertung, Empfehlung – alles automatisch per E-Mail' },
      { name: 'Ausfall-Schutz', included: true, highlight: true, description: 'Kunden hinterlegen Kreditkarte – bei Nichterscheinen wird automatisch eine Gebühr berechnet' },
      { name: 'Warteliste', included: true, description: 'Kunden werden automatisch benachrichtigt, wenn ein Platz frei wird' },
      { name: 'Wiederkehrende Termine', included: true, description: 'Regelmäßige Termine automatisch planen (z. B. alle 4 Wochen)' },
      { name: 'Mehrere Behandlungen pro Buchung', included: true, description: 'Kunden können mehrere Behandlungen auf einmal buchen' },
      { name: 'Eigene Buchungsformulare', included: true, description: 'Zusätzliche Felder und Fragen bei der Buchung abfragen' },
      { name: 'Portfolio & Vorher-Nachher-Bilder', included: true, description: 'Galerien Ihrer Arbeit zeigen (z. B. Tattoos, Kosmetik)' },
      { name: 'Eigenes Branding', included: true, description: 'Buchungsseite in Ihren Farben und mit Ihrem Logo' },
      { name: 'Service-Pakete & Abos', included: true, description: 'Pakete (z. B. 10 Massagen) und monatliche Abos anbieten' },
      { name: 'Behandlungsverläufe', included: true, description: 'Fortschritt dokumentieren (z. B. bei Tattoo-Sitzungen)' },
      { name: 'Raum- & Geräteplanung', included: true, description: 'Räume und Geräte verwalten (z. B. Behandlungsräume)' },
      { name: 'Team-Berechtigungen', included: true, description: 'Unterschiedliche Zugriffsrechte für Mitarbeiter festlegen' },
      { name: 'Protokoll (Audit-Log)', included: true, description: 'Nachvollziehen, wer was wann geändert hat' },
      { name: 'Zwei-Faktor-Anmeldung', included: true, description: 'Zusätzliche Sicherheit beim Login für Sie und Ihr Team' },
      { name: 'Bevorzugter Support', included: true, description: 'Support-Ticket jederzeit schreiben – bevorzugte Bearbeitung werktags zwischen 10 und 16 Uhr' },
    ],
    notIncluded: [
      'SMS-Benachrichtigungen',
      'Mehrere Standorte',
      'White-Label (ohne JN-Logo)',
      'Eigene Domain',
      'API-Schnittstelle',
      'Webhooks',
      'SEPA & Rechnung',
      'HIPAA Compliance',
      'Eigene Berichte',
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Für Unternehmen mit höchsten Ansprüchen',
    price: 599,
    yearlyPrice: 5748,
    yearlyMonthlyCost: 479,
    badge: 'ALLES INKLUSIVE',
    features: [
      { name: 'Mitarbeiter', value: 'Unbegrenzt', description: 'Beliebig viele Mitarbeiter ohne Aufpreis' },
      { name: 'Standorte', value: 'Bis zu 5', description: 'Bis zu 5 Filialen gleichzeitig verwalten' },
      { name: 'Buchungen/Monat', value: 'Unbegrenzt', description: 'Keine Begrenzung bei der Anzahl der Termine' },
      { name: 'Kunden', value: 'Unbegrenzt', description: 'Unbegrenzt viele Kundenkontakte speichern' },
      { name: 'Speicherplatz', value: '100 GB', description: '100 GB für alle Ihre Dateien' },
      { name: 'Alles aus Professional', included: true, bold: true, description: 'Alle Funktionen vom Professional-Plan inklusive' },
      { name: 'SMS-Benachrichtigungen (500/Monat)', included: true, highlight: true, description: '500 SMS inklusive, +50 pro Mitarbeiter über 5. Automatische Erinnerungen 2h & 24h vor Termin.' },
      { name: 'Automatisches Marketing (Unbegrenzt)', included: true, highlight: true, description: 'Unbegrenzte E-Mail-Kampagnen, verschiedene Versionen testen, Erfolg messen' },
      { name: 'Alle Branchen-Funktionen', included: true, highlight: true, description: 'Tattoo, Medizin/Botox, Wellness, Frisör, Kosmetik, Nägel, Massage, Physiotherapie' },
      { name: 'Standort-Übersicht', included: true, description: 'Alle Standorte zentral verwalten mit einer Übersicht' },
      { name: 'Eigene Berichte', included: true, description: 'Individuelle Auswertungen nach Ihren Anforderungen erstellen' },
      { name: 'White-Label', included: true, description: 'Komplett in Ihrem Design – kein JN Business System Logo sichtbar' },
      { name: 'Eigene Domain', included: true, description: 'Buchungsseite unter Ihrer eigenen Internetadresse' },
      { name: 'Schnittstelle für Entwickler (API)', included: true, description: 'Anbindung an Ihre eigene Software möglich' },
      { name: 'Webhook-Integrationen', included: true, description: 'Automatische Benachrichtigungen an andere Programme senden' },
      { name: 'HIPAA Compliance', included: true, description: 'Medizinische Daten nach höchstem Standard verschlüsselt (AES-256-GCM)' },
      { name: 'SEPA & Rechnung', included: true, description: 'Neben Kreditkarte auch Lastschrift und Rechnung als Zahlungsart möglich' },
      { name: 'Dedizierter Account Manager', included: true, description: 'Persönlicher Ansprechpartner nur für Sie' },
      { name: 'Bevorzugter Support', included: true, description: 'Support-Ticket jederzeit schreiben – bevorzugte Bearbeitung werktags zwischen 10 und 16 Uhr' },
    ],
  },
];

const faq = [
  {
    q: 'Gibt es eine Testphase?',
    a: 'Ja, das Enterprise-Paket können Sie 14 Tage kostenlos und unverbindlich testen. Sie bekommen automatisch Zugang zu allen Enterprise-Funktionen, inklusive 50 SMS.',
  },
  {
    q: 'Kann ich den Plan später wechseln?',
    a: 'Ja, Sie können jederzeit upgraden oder downgraden. Die Abrechnung wird automatisch angepasst.',
  },
  {
    q: 'Gibt es versteckte Kosten?',
    a: 'Nein. Der angezeigte Preis ist alles, was Sie zahlen. Keine Provisionen, keine Einrichtungsgebühren. Im Enterprise-Plan können bei SMS-Überschreitung zusätzliche Kosten anfallen (ab €0,05 pro SMS über 500).'
  },
  {
    q: 'Wie funktioniert die Kündigung?',
    a: 'Sie können monatlich kündigen - ohne Mindestlaufzeit und ohne Kündigungsfrist.',
  },
  {
    q: 'Bekomme ich Hilfe bei der Einrichtung?',
    a: 'Ja, wir helfen Ihnen kostenlos bei der Einrichtung. Per Videocall oder E-Mail.',
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Calculate savings for yearly billing
  const calculateSavings = (plan) => {
    const monthlyCost = plan.price * 12;
    const yearlyCost = plan.yearlyPrice;
    return monthlyCost - yearlyCost;
  };

  return (
    <>
      <SEO
        title="Preise - Faire Preise ohne versteckte Kosten"
        description="Starter ab €129/Monat, Professional €249/Monat, Enterprise €599/Monat. 14 Tage kostenlose Testphase im Enterprise-Paket."
        keywords="Preise, Buchungssystem Kosten, Business Software Preis, Unternehmenssoftware"
        url="/pricing"
      />
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-20">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Preise</h1>
          <p className="text-gray-700 text-xl max-w-2xl mx-auto">
            Transparente Preise. Keine versteckten Kosten.
            <br />
            <span className="text-gray-900 font-medium">Sie behalten 100% Ihrer Einnahmen.</span>
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={yearly ? 'text-gray-700' : 'text-gray-900 font-medium'}>
            Monatlich
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`w-14 h-7 rounded-full relative transition-colors ${
              yearly ? 'bg-gray-900' : 'bg-gray-300'
            }`}
            aria-label="Toggle billing cycle"
          >
            <div
              className={`w-5 h-5 bg-white border border-gray-300 rounded-full absolute top-1 transition-all ${
                yearly ? 'left-8' : 'left-1'
              }`}
            />
          </button>
          <span className={yearly ? 'text-gray-900 font-medium' : 'text-gray-700'}>
            Jährlich
          </span>
          {yearly && (
            <span className="ml-2 px-3 py-1 bg-green-500/20 text-green-600 text-sm font-medium rounded-full">
              Spare bis zu €1.440
            </span>
          )}
        </div>

        {/* Enterprise Testphase Banner */}
        <div className="max-w-4xl mx-auto mb-12 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-lg font-semibold">14 Tage Enterprise-Testphase</h3>
          </div>
          <p className="text-gray-500 text-sm mb-5">
            Testen Sie alle Enterprise-Funktionen 14 Tage kostenlos – inkl. 50 SMS. Danach wählen Sie Ihren Plan.
          </p>
          <Link
            to="/register?trial=enterprise"
            className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-900 transition"
          >
            Jetzt Enterprise kostenlos testen
          </Link>
        </div>

        {/* Plans */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-2xl p-8 relative shadow-sm ${
                plan.popular
                  ? 'border-gray-900 bg-white'
                  : 'border-gray-100 bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-block text-xs font-bold bg-gray-900 text-white px-3 py-1 rounded-xl">
                    BELIEBT
                  </span>
                </div>
              )}

              {plan.badge && (
                <div className="absolute -top-4 right-4">
                  <span className="inline-block text-xs font-bold bg-gray-900 text-white px-3 py-1 rounded-xl">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight mb-2">{plan.name}</h2>
                <p className="text-gray-700 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                {yearly ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">
                        €{plan.yearlyMonthlyCost.toFixed(0)}
                      </span>
                      <span className="text-gray-700">/ Monat</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      €{plan.yearlyPrice} jährlich (spare €{calculateSavings(plan)})
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">€{plan.price}</span>
                      <span className="text-gray-700">/ Monat</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      Monatlich kündbar
                    </p>
                  </>
                )}
              </div>

              <Link
                to={`/register?plan=${plan.id}${yearly ? '&billing=yearly' : ''}`}
                className={`block w-full py-4 rounded-xl text-center font-semibold transition mb-8 ${
                  plan.popular
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                }`}
              >
                {plan.id === 'enterprise' ? 'Enterprise testen' : 'Jetzt starten'}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-3 text-sm ${
                      feature.highlight ? 'bg-gray-50 border border-gray-100 rounded-2xl p-2 -mx-2' : ''
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 text-gray-600`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="flex-1">
                      <div className={feature.bold ? 'font-semibold text-gray-900' : 'text-gray-700'}>
                        {feature.name}
                        {feature.value && (
                          <span className="ml-1 text-gray-900 font-medium">
                            ({feature.value})
                          </span>
                        )}
                        {feature.highlight && (
                          <span className="ml-2 text-xs text-gray-400 font-medium">
                            NEU
                          </span>
                        )}
                      </div>
                      {feature.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {plan.notIncluded && plan.notIncluded.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Nicht enthalten:</p>
                  <ul className="space-y-2">
                    {plan.notIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SMS Callout */}
        <div className="max-w-4xl mx-auto mb-20 bg-white border border-gray-100 rounded-2xl shadow-sm p-8 hover:border-gray-200 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Nachrichten per SMS nur in Enterprise</h3>
              <p className="text-gray-600 mb-4">
                Weniger vergessene Termine durch automatische Nachrichten 2 Stunden und 1 Tag vor dem Termin.
                Inklusive 500 Nachrichten pro Monat (mehr bei größerem Team: +50 Nachrichten pro Mitarbeiter).
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">2h & 24h Erinnerungen</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Prioritäts-System</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Überschreitung möglich (€0.05 pro Nachricht)</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Email-Fallback automatisch</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Plans Include */}
        <div className="mb-20">
          <div className="flex items-center justify-center mb-12">
            <div className="flex-1 h-px bg-gray-100"></div>
            <h2 className="text-lg font-semibold tracking-tight mx-6">In allen Plänen enthalten</h2>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Online-Buchung rund um die Uhr',
              'Automatische Termin-Erinnerungen',
              'Google-Bewertungen sammeln',
              'Kalender-Synchronisation',
              'Kundendatenbank',
              'DSGVO-konform',
              'Tägliche Backups',
              'Kostenlose Einrichtung',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-20">
          <div className="flex items-center justify-center mb-12">
            <div className="flex-1 h-px bg-gray-100"></div>
            <h2 className="text-lg font-semibold tracking-tight mx-6">Häufige Fragen</h2>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>
          <div className="space-y-2">
            {faq.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-700">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center border border-gray-100 rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-semibold mb-2">Noch Fragen?</h2>
          <p className="text-gray-700 text-sm mb-6">
            Schreiben Sie uns - wir antworten innerhalb von 24 Stunden.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="mailto:support@jn-business-system.de"
              className="px-5 py-2.5 bg-gray-900 text-white hover:bg-gray-900 rounded-xl text-sm font-medium transition"
              aria-label="Support kontaktieren per E-Mail"
            >
              E-Mail schreiben
            </a>
            <Link
              to="/demo"
              className="px-5 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition"
              aria-label="Demo-Video ansehen"
            >
              Demo ansehen
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
