import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import SEO from '../../components/SEO';

/**
 * FAQ Page - Häufig gestellte Fragen
 * Erweitert mit echten Fragen von Unternehmen
 */
const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      category: 'Für Geschäftsinhaber',
      questions: [
        {
          question: 'Wie viel kostet JN Business System?',
          answer: 'Wir bieten verschiedene Preise an: Starter (€129 pro Monat), Professional (€249 pro Monat) und Enterprise (€599 pro Monat). Jeder Plan kann 30 Tage kostenlos getestet werden ohne Kreditkarte.'
        },
        {
          question: 'Wie schnell kann ich starten?',
          answer: 'Nach der Registrierung dauert das Setup ca. 10-15 Minuten. Sie fügen Ihre Services hinzu, legen Öffnungszeiten fest und können sofort Buchungen empfangen. Kein technisches Wissen erforderlich.'
        },
        {
          question: 'Brauche ich eine Website?',
          answer: 'Nein! Sie erhalten automatisch eine eigene Buchungsseite (z.B. /s/ihr-business-name), die Sie in Social Media teilen können. Optional können Sie auch unser Booking-Widget auf Ihrer bestehenden Website einbinden.'
        },
        {
          question: 'Wie werden meine Kunden benachrichtigt?',
          answer: 'Automatische E-Mails bei Buchung, 1 Tag vor dem Termin als Erinnerung und nach dem Termin mit Bitte um Bewertung. Alles vollautomatisch.'
        },
        {
          question: 'Kann ich mehrere Mitarbeiter verwalten?',
          answer: 'Ja! Sie können beliebig viele Mitarbeiter hinzufügen. Jeder Mitarbeiter bekommt einen eigenen Login und kann seine Termine selbst verwalten. Perfekt für Teams.'
        },
        {
          question: 'Was passiert, wenn ein Kunde nicht erscheint?',
          answer: 'Sie können vergessene Termine markieren und optional eine Gebühr in den Einstellungen aktivieren. Wir zählen für Sie mit wie oft das passiert.'
        },
        {
          question: 'Kann ich Online-Zahlungen empfangen?',
          answer: 'Ja, über den Bezahldienst Stripe. Kunden können bei der Buchung direkt bezahlen. Sie erhalten Ihr Geld automatisch ausgezahlt (Stripe-Gebühren: 1,5% + €0,25 pro Zahlung).'
        },
        {
          question: 'Wie funktioniert die Testphase?',
          answer: '30 Tage kostenlos, keine Kreditkarte erforderlich. Sie haben Zugriff auf alle Funktionen. Nach der Testphase wählen Sie einen Preis oder Ihr Konto wird pausiert (keine Löschung Ihrer Daten).'
        }
      ]
    },
    {
      category: 'Für Kunden',
      questions: [
        {
          question: 'Muss ich mich registrieren, um zu buchen?',
          answer: 'Nein, Buchungen sind auch als Gast möglich. Sie geben nur Name, E-Mail und Telefonnummer an. Für ein eigenes Kundenkonto können Sie sich optional registrieren.'
        },
        {
          question: 'Wie kann ich meinen Termin ändern oder stornieren?',
          answer: 'In der Bestätigungs-E-Mail finden Sie einen Link zum Verwalten Ihres Termins. Dort können Sie umbuchen oder stornieren. Bei Stornierung weniger als 24h vorher kann eine Gebühr anfallen.'
        },
        {
          question: 'Bekomme ich eine Erinnerung?',
          answer: 'Ja, Sie erhalten 24 Stunden vor Ihrem Termin eine Erinnerungs-E-Mail mit allen Details (Datum, Uhrzeit, Adresse, Service).'
        },
        {
          question: 'Kann ich mehrere Services gleichzeitig buchen?',
          answer: 'Das hängt vom Anbieter ab. Viele Unternehmen erlauben es, mehrere Services zu kombinieren. Die Zeiten werden automatisch zusammengerechnet.'
        },
        {
          question: 'Wie sicher sind meine Daten?',
          answer: 'Sehr sicher! Alle Daten werden verschlüsselt übertragen. Wir speichern nur das Nötigste und geben niemals Daten an andere weiter. Nach deutschem Datenschutz.'
        }
      ]
    },
    {
      category: 'Technisches',
      questions: [
        {
          question: 'Funktioniert es auf dem Smartphone?',
          answer: 'Ja! Das gesamte System ist für Mobile optimiert. Sowohl Geschäftsinhaber als auch Kunden können alles bequem vom Smartphone aus nutzen.'
        },
        {
          question: 'Welche Browser werden unterstützt?',
          answer: 'Alle modernen Browser: Chrome, Firefox, Safari, Edge. Auch auf Tablets und iPads funktioniert alles einwandfrei.'
        },
        {
          question: 'Gibt es eine App?',
          answer: 'Aktuell nicht, aber unsere Web-Seite funktioniert wie eine App. Sie können sie auf Ihrem Startbildschirm speichern.'
        },
        {
          question: 'Kann ich meine Daten exportieren?',
          answer: 'Ja, Sie können jederzeit Sicherungen erstellen und Ihre Daten als Excel-Datei herunterladen. Ihre Daten gehören Ihnen!'
        },
        {
          question: 'Was passiert bei einem Ausfall?',
          answer: 'Wir garantieren 99,9% Verfügbarkeit. Unser System läuft mit automatischen Sicherungen. Bei Problemen werden Sie sofort informiert.'
        }
      ]
    },
    {
      category: 'Abrechnung & Support',
      questions: [
        {
          question: 'Kann ich monatlich kündigen?',
          answer: 'Ja, monatliche Pläne sind jederzeit kündbar. Jahrespläne laufen automatisch aus, keine automatische Verlängerung. Keine versteckten Kosten.'
        },
        {
          question: 'Gibt es einen Mengenrabatt?',
          answer: 'Ja, bei mehr als 5 Standorten (z.B. Ketten) bieten wir individuelle Enterprise-Konditionen. Kontaktieren Sie uns für ein Angebot.'
        },
        {
          question: 'Wie schnell ist der Support?',
          answer: 'Support-Anfragen werden binnen 24h beantwortet (werktags). Pro & Enterprise-Kunden haben Prioritäts-Support mit Antwortzeit unter 4h.'
        },
        {
          question: 'Gibt es Schulungen?',
          answer: 'Ja! Wir bieten kostenlose Onboarding-Calls (30min) für alle neuen Kunden an. Video-Tutorials sind im Dashboard verfügbar.'
        },
        {
          question: 'Was ist nicht im Preis enthalten?',
          answer: 'Der Plan-Preis ist all-inclusive. Einzige Extra-Kosten: Stripe-Gebühren bei Online-Zahlungen (1,5% + €0,25 pro Transaktion) - diese zahlt optional der Kunde.'
        }
      ]
    }
  ];

  return (
    <>
      <SEO
        title="FAQ - Häufig gestellte Fragen"
        description="Antworten auf alle Fragen zu JN Business System: Preise, Integration, Support, Datenschutz und mehr."
        keywords="FAQ, Häufige Fragen, Buchungssystem Hilfe, Support"
        url="/faq"
      />
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Häufig gestellte Fragen
          </h1>
          <p className="text-xl text-gray-300">
            Alles, was Sie über JN Business System wissen müssen
          </p>
        </div>

        {/* FAQ Sections */}
        {faqs.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.questions.map((faq, index) => {
                const globalIndex = `${sectionIndex}-${index}`;
                const isOpen = openIndex === globalIndex;

                return (
                  <div
                    key={index}
                    className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-800 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFAQ(globalIndex)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-zinc-800 transition-colors"
                    >
                      <span className="font-semibold text-white pr-8">
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 text-gray-300">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="bg-zinc-900 rounded-lg p-8 text-center mt-12 border border-zinc-800">
          <h3 className="text-2xl font-bold text-white mb-4">
            Noch Fragen?
          </h3>
          <p className="text-gray-300 mb-6">
            Unser Support-Team hilft Ihnen gerne weiter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@jn-business-system.de"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              E-Mail schreiben
            </a>
            <a
              href="/demo"
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-lg border-2 border-zinc-700 transition-colors"
            >
              Demo buchen
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default FAQ;
