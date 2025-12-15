import { Link } from 'react-router-dom';

function LoginSelection() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Anmelden</h1>
          <p className="text-lg text-gray-400">Wählen Sie den passenden Login für Ihr Konto</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Link to="/login/customer" className="card hover:card-hover p-8 transition">
            <h2 className="text-2xl font-semibold mb-2">Kunde</h2>
            <p className="text-gray-400 mb-6">Termine ansehen und verwalten</p>
            <div className="mt-6">
              <div className="btn-primary text-sm">Kundenlogin</div>
            </div>
          </Link>

          <Link to="/login/business" className="card hover:card-hover p-8 transition">
            <h2 className="text-2xl font-semibold mb-2">Saloninhaber</h2>
            <p className="text-gray-400 mb-6">Dashboard, Mitarbeiter & Buchungen verwalten</p>
            <div className="mt-6">
              <div className="btn-outline text-sm">Business-Login</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginSelection;
