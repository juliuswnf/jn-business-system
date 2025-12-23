import { Link, useSearchParams } from 'react-router-dom';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  BriefcaseIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';

function LoginSelection() {
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';

  const loginOptions = [
    {
      id: 'customer',
      title: 'Kunde',
      description: 'Termine ansehen, buchen und verwalten',
      icon: UserIcon,
      link: `/login/customer${redirectQuery}`,
      gradient: 'from-blue-500 to-cyan-400',
      bgGradient: 'from-blue-500/10 to-cyan-400/10',
      borderColor: 'border-blue-500/30',
      hoverBorder: 'hover:border-blue-500/60',
    },
    {
      id: 'business',
      title: 'Business Inhaber',
      description: 'Dashboard, Mitarbeiter & Buchungen verwalten',
      icon: BuildingOfficeIcon,
      link: `/login/business${redirectQuery}`,
      gradient: 'from-purple-500 to-pink-400',
      bgGradient: 'from-purple-500/10 to-pink-400/10',
      borderColor: 'border-purple-500/30',
      hoverBorder: 'hover:border-purple-500/60',
      popular: true,
    },
    {
      id: 'employee',
      title: 'Mitarbeiter',
      description: 'Zugang zum Mitarbeiter-Dashboard',
      icon: BriefcaseIcon,
      link: `/login/employee${redirectQuery}`,
      gradient: 'from-emerald-500 to-teal-400',
      bgGradient: 'from-emerald-500/10 to-teal-400/10',
      borderColor: 'border-emerald-500/30',
      hoverBorder: 'hover:border-emerald-500/60',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-6xl w-full">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6">
              <StarIcon className="w-8 h-8 text-white" />
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Willkommen zurück
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
              Wählen Sie den passenden Login für Ihr Konto
            </p>
          </div>

          {/* Login Options Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {loginOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Link
                  key={option.id}
                  to={option.link}
                  className={`group relative overflow-hidden rounded-2xl border-2 ${option.borderColor} ${option.hoverBorder} bg-gradient-to-br ${option.bgGradient} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-${option.gradient.split(' ')[0]}/20`}
                >
                  {/* Popular Badge */}
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-400 text-black text-xs font-bold rounded-full shadow-lg">
                        <StarIcon className="w-3 h-3" />
                        BELIEBT
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-8 relative z-10">
                    {/* Icon */}
                    <div className={`mb-6 w-16 h-16 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-black" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-gray-100 transition-colors">
                      {option.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                      {option.description}
                    </p>

                    {/* CTA */}
                    <div className={`inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${option.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                      <span>Jetzt anmelden</span>
                      <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                </Link>
              );
            })}
          </div>

          {/* Additional Links */}
          <div className="text-center space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <Link 
                to="/register" 
                className="hover:text-white transition-colors font-medium"
              >
                Noch kein Konto? Jetzt registrieren
              </Link>
              <span className="text-gray-600">•</span>
              <Link 
                to="/forgot-password" 
                className="hover:text-white transition-colors"
              >
                Passwort vergessen?
              </Link>
              <span className="text-gray-600">•</span>
              <Link 
                to="/pricing" 
                className="hover:text-white transition-colors"
              >
                Preise ansehen
              </Link>
            </div>

            {/* Back to Home */}
            <div className="pt-6">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                <ArrowRightIcon className="w-4 h-4 rotate-180" />
                Zurück zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginSelection;
