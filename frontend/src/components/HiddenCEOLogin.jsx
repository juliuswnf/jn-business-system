import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HiddenCEOLogin = () => {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        setShowLogin(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleLogin = () => {
    // Hier würde der Login-Code stehen
    navigate('/ceo/dashboard');
  };

  if (!showLogin) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 shadow-sm max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">CEO Login</h2>
        <p className="text-gray-600 mb-4">Bitte geben Sie Ihr Passwort ein:</p>
        <input
          type="password"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
          placeholder="Passwort"
        />
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-blue-600 text-zinc-900 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default HiddenCEOLogin;
