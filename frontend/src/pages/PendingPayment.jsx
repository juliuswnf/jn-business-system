import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 129,
    description: 'Perfekt für kleine Betriebe',
    highlights: ['5 Mitarbeiter', '200 Buchungen/Monat', 'Online-Buchung', 'E-Mail-Benachrichtigungen'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 249,
    description: 'Ideal für wachsende Teams',
    popular: true,
    highlights: ['30 Mitarbeiter', '1.000 Buchungen/Monat', 'Automatisches Marketing', 'Ausfall-Schutz'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 599,
    description: 'Für große Unternehmen',
    highlights: ['Unbegrenzte Mitarbeiter', 'Mehrere Standorte', 'White-Label', 'API-Zugang'],
  },
];

export default function PendingPayment() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || null;

  return (
    <>
      <SEO title="Plan auswählen – JN Business System" />
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12 max-w-xl">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Konto erstellt{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-gray-600 text-lg">
            Wähle jetzt deinen Plan, um Zugriff auf dein Dashboard zu erhalten.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="w-full max-w-4xl grid md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 shadow-sm flex flex-col ${
                plan.popular ? 'border-gray-900' : 'border-gray-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-xl">
                    BELIEBT
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">€{plan.price}</span>
                <span className="text-gray-500 text-sm"> / Monat</span>
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to={`/checkout/${plan.id}`}
                className="block w-full py-3 text-center font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                {plan.name} wählen
              </Link>
            </div>
          ))}
        </div>

        {/* Full pricing comparison */}
        <p className="text-sm text-gray-500">
          <Link to="/pricing" className="text-gray-900 font-semibold hover:underline">
            Alle Features im Detail vergleichen →
          </Link>
        </p>
      </div>
    </>
  );
}
