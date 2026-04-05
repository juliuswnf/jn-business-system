import { Link } from 'react-router-dom';
import { useState } from 'react';

const Login = () => {
  const [clickCount, setClickCount] = useState(0);

  // Triple-click on logo to access CEO login
  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 3) {
      window.location.href = '/_.admin';
      setClickCount(0);
    }

    // Reset after 2 seconds
    setTimeout(() => setClickCount(0), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-50 border border-gray-100 rounded-2xl">
        <div className="text-center">
          <h1
            className="text-2xl font-semibold tracking-tight text-gray-900 mb-2 cursor-default select-none"
            onClick={handleLogoClick}
          >
            Willkommen bei JN Business System
          </h1>
          <p className="text-gray-700">
            Business Management für alle Branchen
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/login/customer"
            className="block w-full px-6 py-4 bg-white text-black text-center font-medium rounded-xl hover:bg-gray-100 transition"
          >
            Ich bin Kunde
          </Link>

          <Link
            to="/login/business"
            className="block w-full px-6 py-4 border border-gray-200 text-center font-medium rounded-xl text-gray-900 hover:bg-gray-100 transition"
          >
            Unternehmens-Login
          </Link>

          <Link
            to="/login/employee"
            className="block w-full px-6 py-4 border border-gray-200 text-center font-medium rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
          >
            Mitarbeiter Login
          </Link>
        </div>

        <div className="text-center text-sm text-gray-400">
          <p>
            Kein Account? <Link to="/register" className="text-gray-900 hover:underline">Jetzt registrieren</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
