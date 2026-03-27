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
      category: 'Einstieg & Grundlagen',
      questions: [
        {
          question: 'Wie schnell kann ich mit dem System starten?',
          answer: 'In der Regel sind die wichtigsten Einstellungen in 10–15 Minuten erledigt: Services anlegen, Öffnungszeiten festlegen und Buchungsseite aktivieren. Danach können Kunden direkt Termine buchen.'
        },
        {
          question: 'Benötige ich eine eigene Website?',
          answer: 'Nein. Sie erhalten eine eigene Buchungsseite, die Sie sofort teilen können. Optional können Sie zusätzlich das Buchungs-Widget in Ihre bestehende Website einbinden.'
        },
        {
          question: 'Gibt es eine Testphase?',
          answer: 'Ja. Sie können das System zunächst testen und anschließend den passenden Plan wählen. Die aktuellen Konditionen finden Sie jederzeit transparent auf der Preisseite.'
        },
        {
          question: 'Muss ich technisches Wissen mitbringen?',
          answer: 'Nein. Die Oberfläche ist für den täglichen Einsatz in Studios und Dienstleistungsbetrieben ausgelegt. Die wichtigsten Funktionen sind ohne technische Vorkenntnisse nutzbar.'
        },
        {
          question: 'Für welche Branchen ist JN Business System geeignet?',
          answer: 'Das System ist für servicebasierte Unternehmen konzipiert, z. B. Beauty, Barbershop, Tattoo, Wellness oder ähnliche Terminbetriebe mit Kundenbuchungen.'
        },
      ]
    },
    {
      category: 'Buchung & Kundenkommunikation',
      questions: [
        {
          question: 'Muss ich mich registrieren, um zu buchen?',
          answer: 'Nein, Buchungen können je nach Einstellung auch ohne vollständiges Kundenkonto erfolgen. Ein Kundenkonto ist optional und vereinfacht spätere Umbuchungen und Übersicht.'
        },
        {
          question: 'Wie kann ich meinen Termin ändern oder stornieren?',
          answer: 'Über den Link in der Bestätigung können Termine verwaltet werden. Ob und bis wann kostenfrei storniert werden kann, legt der jeweilige Anbieter in seinen Regeln fest.'
        },
        {
          question: 'Bekomme ich eine Erinnerung?',
          answer: 'Ja. Erinnerungen werden automatisiert versendet, damit Termine zuverlässig wahrgenommen werden. Der genaue Zeitpunkt kann vom Anbieter konfiguriert werden.'
        },
        {
          question: 'Kann ich mehrere Services gleichzeitig buchen?',
          answer: 'Wenn der Anbieter Kombinationsbuchungen aktiviert hat, können mehrere Leistungen in einem Termin geplant werden. Die Dauer wird dabei automatisch berücksichtigt.'
        },
        {
          question: 'Wie werden Kunden nach der Buchung informiert?',
          answer: 'Nach der Buchung erhalten Kunden eine Bestätigung mit allen Details. Zusätzlich sind je nach Konfiguration Erinnerungen und Folge-Nachrichten möglich.'
        }
      ]
    },
    {
      category: 'Team, Betrieb & Zahlungen',
      questions: [
        {
          question: 'Kann ich Mitarbeiter-Zugänge vergeben?',
          answer: 'Ja. Teams können mit eigenen Logins arbeiten, sodass Termine und tägliche Abläufe dezentral bearbeitet werden können.'
        },
        {
          question: 'Wie gehe ich mit No-Shows um?',
          answer: 'Termine können als nicht erschienen markiert werden. Je nach Einstellungen sind Regeln für Storno- oder Ausfallprozesse abbildbar.'
        },
        {
          question: 'Sind Online-Zahlungen möglich?',
          answer: 'Ja. Über unterstützte Zahlungsanbieter können Zahlungen im Buchungsprozess integriert werden. Die Auszahlung erfolgt über den jeweils angebundenen Provider.'
        },
        {
          question: 'Kann ich mehrere Standorte verwalten?',
          answer: 'Ja, je nach gewähltem Plan sind Multi-Location-Funktionen verfügbar, damit mehrere Standorte zentral verwaltet werden können.'
        },
        {
          question: 'Wie transparent sind Kosten und Limits?',
          answer: 'Planumfang und verfügbare Funktionen sind klar pro Tarif ausgewiesen. So ist jederzeit ersichtlich, welche Features in Ihrem Paket enthalten sind.'
        }
      ]
    },
    {
      category: 'Datenschutz, Technik & Support',
      questions: [
        {
          question: 'Sind meine Daten sicher?',
          answer: 'Datenübertragung und Zugriff sind auf Sicherheit ausgelegt. Zusätzlich gelten die jeweils definierten Datenschutz- und Zugriffskonzepte innerhalb der Plattform.'
        },
        {
          question: 'Kann ich meine Daten exportieren?',
          answer: 'Ja. Je nach Bereich stehen Export- und Sicherungsoptionen zur Verfügung, damit Daten bei Bedarf weiterverarbeitet oder archiviert werden können.'
        },
        {
          question: 'Funktioniert das System auf Mobilgeräten?',
          answer: 'Ja. Die Anwendung ist responsiv und für aktuelle Smartphones, Tablets und Desktop-Browser optimiert.'
        },
        {
          question: 'Welche Browser werden unterstützt?',
          answer: 'Die Plattform unterstützt aktuelle Versionen von Chrome, Safari, Firefox und Edge.'
        },
        {
          question: 'Wie erreiche ich den Support?',
          answer: 'Über den Support-Bereich oder per E-Mail. Je nach Tarif können Reaktionszeiten und Support-Umfang variieren.'
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
    <div className="min-h-screen bg-white text-zinc-900 py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 mb-4">Support</p>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-4">
            Häufig gestellte Fragen
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto">
            Alles, was Sie über JN Business System wissen müssen
          </p>
        </div>

        <section className="mb-14 space-y-10">
          {faqs.map((section, sectionIndex) => (
            <div key={section.category}>
              <h2 className="text-2xl md:text-3xl font-semibold text-zinc-900 mb-4">
                {section.category}
              </h2>

              <div className="border-t border-zinc-200">
                {section.questions.map((faq, index) => {
                  const globalIndex = `${sectionIndex}-${index}`;
                  const isOpen = openIndex === globalIndex;

                  return (
                    <article key={globalIndex} className="border-b border-zinc-200">
                      <button
                        onClick={() => toggleFAQ(globalIndex)}
                        className="w-full !bg-transparent !border-0 !rounded-none px-0 py-5 text-left flex items-start justify-between gap-6 hover:bg-zinc-50/60 transition-colors"
                      >
                        <span className="font-medium text-zinc-900 leading-relaxed text-base md:text-lg">
                          {faq.question}
                        </span>

                        <span className="flex-shrink-0 mt-0.5">
                          {isOpen ? (
                            <ChevronUpIcon className="h-5 w-5 text-zinc-500" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-zinc-500" />
                          )}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="pb-6 -mt-1 max-w-3xl">
                          <div className="pl-4 border-l-2 border-zinc-200 text-zinc-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Contact CTA */}
        <div className="bg-zinc-50 rounded-2xl p-8 md:p-10 text-center mt-14 border border-zinc-200">
          <h3 className="text-2xl font-semibold text-zinc-900 mb-3">
            Noch Fragen?
          </h3>
          <p className="text-zinc-600 mb-7">
            Unser Support-Team hilft Ihnen gerne weiter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@jn-business-system.de"
              className="bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-medium py-3 px-6 rounded-lg border border-zinc-300 transition-colors"
            >
              E-Mail schreiben
            </a>
            <a
              href="/demo"
              className="bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-medium py-3 px-6 rounded-lg border border-zinc-300 transition-colors"
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
