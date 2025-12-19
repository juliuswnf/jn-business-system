import { Link, useSearchParams } from 'react-router-dom';

function LoginSelection() {
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Anmelden</h1>
          <p className="text-lg text-gray-300">Wählen Sie den passenden Login für Ihr Konto</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Link to={`/login/customer${redirectQuery}`} className="card hover:card-hover p-8 transition" aria-label="Kundenlogin - Termine ansehen und verwalten">
            <h2 className="text-2xl font-semibold mb-2">Kunde</h2>
            <p className="text-gray-300 mb-6">Termine ansehen und verwalten</p>
            <div className="mt-6">
              <div className="btn-primary text-sm">Login</div>
            </div>
          </Link>

          <Link to={`/login/business${redirectQuery}`} className="card hover:card-hover p-8 transition" aria-label="Business-Login für Saloninhaber - Dashboard und Buchungen verwalten">
            <h2 className="text-2xl font-semibold mb-2">Business Inhaber</h2>
            <p className="text-gray-300 mb-6">Dashboard, Mitarbeiter & Buchungen verwalten</p>
            <div className="mt-6">
              <div className="btn-outline text-sm">Login</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginSelection;
