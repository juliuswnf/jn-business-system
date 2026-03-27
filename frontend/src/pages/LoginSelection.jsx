import { Link, useSearchParams } from 'react-router-dom';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  BriefcaseIcon,
  ArrowRightIcon
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
      gradient: 'from-[#3b82f6] to-[#22d3ee]',
      bgGradient: 'from-[#3b82f6]/10 to-[#22d3ee]/10',
      borderColor: 'border-[#3b82f6]/30',
      hoverBorder: 'hover:border-[#3b82f6]/60',
      hoverShadow: 'hover:shadow-[0_20px_45px_-20px_rgba(59,130,246,0.45)]',
    },
    {
      id: 'business',
      title: 'Business Inhaber',
      description: 'Kontrollpanel, Mitarbeiter & Buchungen verwalten',
      icon: BuildingOfficeIcon,
      link: `/login/business${redirectQuery}`,
      gradient: 'from-[#a855f7] to-[#f472b6]',
      bgGradient: 'from-[#a855f7]/10 to-[#f472b6]/10',
      borderColor: 'border-[#a855f7]/30',
      hoverBorder: 'hover:border-[#a855f7]/60',
      hoverShadow: 'hover:shadow-[0_20px_45px_-20px_rgba(168,85,247,0.45)]',
    },
    {
      id: 'employee',
      title: 'Mitarbeiter',
      description: 'Zugang zum Mitarbeiter-Kontrollpanel',
      icon: BriefcaseIcon,
      link: `/login/employee${redirectQuery}`,
      gradient: 'from-[#10b981] to-[#2dd4bf]',
      bgGradient: 'from-[#10b981]/10 to-[#2dd4bf]/10',
      borderColor: 'border-[#10b981]/30',
      hoverBorder: 'hover:border-[#10b981]/60',
      hoverShadow: 'hover:shadow-[0_20px_45px_-20px_rgba(16,185,129,0.45)]',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Willkommen zurück
          </h1>
          <p className="text-xl md:text-2xl text-zinc-600 max-w-2xl mx-auto">
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
                  className={`group relative overflow-hidden rounded-2xl border-2 ${option.borderColor} ${option.hoverBorder} ${option.hoverShadow} bg-gradient-to-br ${option.bgGradient} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
                >
                  {/* Content */}
                  <div className="p-8 relative z-10">
                    {/* Icon */}
                    <div className={`mb-6 w-16 h-16 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-black" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-3 text-zinc-900 transition-colors">
                      {option.title}
                    </h2>

                    {/* Description */}
                    <p className="text-zinc-600 mb-6 text-sm leading-relaxed">
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
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
              <Link 
                to="/register" 
                className="hover:text-zinc-900 transition-colors font-medium"
              >
                Noch kein Konto? Jetzt registrieren
              </Link>
              <span className="text-zinc-500">•</span>
              <Link 
                to="/forgot-password" 
                className="hover:text-zinc-900 transition-colors"
              >
                Passwort vergessen?
              </Link>
              <span className="text-zinc-500">•</span>
              <Link 
                to="/pricing" 
                className="hover:text-zinc-900 transition-colors"
              >
                Preise ansehen
              </Link>
            </div>

            {/* Back to Home */}
            <div className="pt-6">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <ArrowRightIcon className="w-4 h-4 rotate-180" />
                Zurück zur Startseite
              </Link>
            </div>
          </div>
        </div>
    </div>
  );
}

export default LoginSelection;
