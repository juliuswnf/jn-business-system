import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScissorsIcon, ClockIcon, LinkIcon, CheckCircleIcon, UsersIcon, PlayCircleIcon } from '@heroicons/react/24/outline';

/**
 * Getting Started Guide
 * Accessible from /dashboard/help or /help/getting-started
 */

const setupSteps = [
  {
    id: 1,
    title: 'Services anlegen',
    description: 'Erstelle deine Dienstleistungen mit Preisen, Dauer und Beschreibung.',
    icon: ScissorsIcon,
    link: '/dashboard/services',
    tips: [
      'Füge mindestens 3-5 Services hinzu',
      'Setze realistische Dauern für Zeitslots',
      'Nutze aussagekräftige Beschreibungen'
    ],
    completed: false,
  },
  {
    id: 2,
    title: 'Öffnungszeiten festlegen',
    description: 'Definiere, wann Kunden bei dir buchen können.',
    icon: ClockIcon,
    link: '/dashboard/settings',
    tips: [
      'Trage alle Arbeitstage ein',
      'Berücksichtige Pausenzeiten',
      'Plane Puffer zwischen Terminen ein'
    ],
    completed: false,
  },
  {
    id: 3,
    title: 'Buchungswidget einrichten',
    description: 'Kopiere den Widget-Code und füge ihn auf deiner Website ein.',
    icon: LinkIcon,
    link: '/dashboard/widget',
    tips: [
      'Teste das Widget vor dem Einbinden',
      'Passe Farben an dein Branding an',
      'Platziere es prominent auf der Startseite'
    ],
    completed: false,
  },
  {
    id: 4,
    title: 'Testbuchung durchführen',
    description: 'Buche selbst einen Termin, um den Ablauf zu testen.',
    icon: CheckCircleIcon,
    link: '/dashboard/bookings',
    tips: [
      'Nutze eine andere E-Mail-Adresse',
      'Prüfe die Bestätigungs-E-Mail',
      'Teste die Erinnerungs-E-Mail'
    ],
    completed: false,
  },
  {
    id: 5,
    title: 'Team einladen (optional)',
    description: 'Füge Mitarbeiter hinzu, die eigene Termine verwalten können.',
    icon: UsersIcon,
    link: '/dashboard/employees',
    tips: [
      'Jeder Mitarbeiter bekommt eigenen Login',
      'Rechte individuell anpassen',
      'Kalender-Sync aktivieren'
    ],
    completed: false,
  },
];

const faqs = [
  {
    question: 'Wie ändere ich meine Öffnungszeiten?',
    answer: 'Gehe zu Einstellungen → Öffnungszeiten. Dort kannst du für jeden Wochentag Start- und Endzeit festlegen. Änderungen werden sofort wirksam.'
  },
  {
    question: 'Wie funktionieren die automatischen E-Mails?',
    answer: 'Nach jeder Buchung sendet das System automatisch eine Bestätigung. 24 Stunden vor dem Termin folgt eine Erinnerung. Nach dem Termin bitten wir um eine Google-Bewertung.'
  },
  {
    question: 'Kann ich Buchungen manuell hinzufügen?',
    answer: 'Ja! Im Buchungskalender kannst du über "+ Termin" manuell Buchungen erstellen – z.B. für Telefon-Anfragen oder Stammkunden.'
  },
  {
    question: 'Wie binde ich das Widget auf meiner Website ein?',
    answer: 'Unter Widget findest du einen HTML-Code. Kopiere diesen und füge ihn in deine Website ein. Bei WordPress nutze einen HTML-Block.'
  },
  {
    question: 'Was passiert nach der Testphase?',
    answer: 'Nach 30 Tagen wählst du einen Plan und gibst deine Zahlungsdaten ein. Ohne Zahlung wird dein Account pausiert, aber nicht gelöscht.'
  },
];

const videoTutorials = [
  {
    title: 'Schnellstart in 5 Minuten',
    duration: '5:23',
    thumbnail: PlayCircleIcon,
    url: '#',
  },
  {
    title: 'Services richtig anlegen',
    duration: '3:45',
    thumbnail: ScissorsIcon,
    url: '#',
  },
  {
    title: 'Widget einbinden (WordPress)',
    duration: '4:12',
    thumbnail: LinkIcon,
    url: '#',
  },
];

export default function GettingStarted() {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(() => {
    const saved = localStorage.getItem('jn_setup_steps');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleStep = (stepId) => {
    const newCompleted = completedSteps.includes(stepId)
      ? completedSteps.filter(id => id !== stepId)
      : [...completedSteps, stepId];
    
    setCompletedSteps(newCompleted);
    localStorage.setItem('jn_setup_steps', JSON.stringify(newCompleted));
  };

  const progress = Math.round((completedSteps.length / setupSteps.length) * 100);

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="mb-10">
          <Link to="/dashboard" className="text-gray-400 hover:text-white text-sm mb-4 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Getting Started</h1>
          <p className="text-gray-400">
            Folge diesen Schritten, um dein Buchungssystem einzurichten.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Setup-Fortschritt</span>
            <span className="text-sm text-gray-400">{completedSteps.length} von {setupSteps.length} Schritten</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
              <span className="text-green-400 font-medium">Glückwunsch! Dein Setup ist abgeschlossen.</span>
            </div>
          )}
        </div>

        {/* Setup Steps */}
        <div className="space-y-4 mb-12">
          {setupSteps.map((step, index) => (
            <div
              key={step.id}
              className={`bg-gray-900 rounded-xl border transition-all ${
                completedSteps.includes(step.id)
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleStep(step.id)}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      completedSteps.includes(step.id)
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {completedSteps.includes(step.id) ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-gray-500 font-bold">{step.id}</span>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <step.icon className="w-6 h-6 text-white" />
                      <h3 className={`text-lg font-semibold ${
                        completedSteps.includes(step.id) ? 'line-through text-gray-500' : ''
                      }`}>
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-400 mb-4">{step.description}</p>

                    {/* Tips */}
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tipps</div>
                      <ul className="space-y-1">
                        {step.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                            <svg className="w-3 h-3 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={step.link}
                      className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-medium text-sm"
                    >
                      {step.title} öffnen
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Tutorials */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6">Video-Tutorials</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {videoTutorials.map((video, index) => (
              <a
                key={index}
                href={video.url}
                className="bg-gray-900 rounded-xl border border-gray-800 hover:border-zinc-600 p-6 transition-all group"
              >
                <video.thumbnail className="w-10 h-10 text-white mb-4" />
                <h3 className="font-medium mb-1 group-hover:text-white transition-colors">
                  {video.title}
                </h3>
                <span className="text-sm text-gray-500">{video.duration}</span>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6">Häufige Fragen</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between"
                >
                  <span className="font-medium">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFaq === index && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support CTA */}
        <div className="bg-zinc-900 rounded-lg p-8 text-center border border-zinc-800">
          <h3 className="text-xl font-bold mb-2">Noch Fragen?</h3>
          <p className="text-gray-400 mb-6">Unser Support-Team hilft dir gerne weiter.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:support@jn-automation.de"
              className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black hover:bg-gray-100 rounded text-sm transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              E-Mail schreiben
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
