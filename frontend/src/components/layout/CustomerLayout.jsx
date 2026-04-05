import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const CustomerLayout = ({ children }) => {
  const location = useLocation();

  const navLinks = [
    { to: '/customer/dashboard', label: 'Meine Termine' },
    { to: '/customer/booking', label: 'Neuer Termin' },
    { to: '/customer/support', label: 'Support' },
    { to: '/customer/settings', label: 'Einstellungen' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-white">
      {/* Shared Navbar — same on every page */}
      <Navbar />

      {/* Customer sub-navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide py-0">
            {navLinks.map((link, idx) => (
              <React.Fragment key={link.to}>
                {idx > 0 && (
                  <span className="w-px h-3.5 bg-gray-200 mx-1 shrink-0" aria-hidden="true" />
                )}
                <Link
                  to={link.to}
                  className={`px-3.5 py-3.5 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px min-h-[44px] flex items-center ${
                    isActive(link.to)
                      ? 'text-gray-900 font-medium border-gray-900'
                      : 'text-gray-500 hover:text-gray-900 font-normal border-transparent hover:border-gray-300'
                  }`}
                >
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="text-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} JN Business System. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-gray-400 hover:text-gray-900 text-sm">Datenschutz</Link>
              <Link to="/terms" className="text-gray-400 hover:text-gray-900 text-sm">AGB</Link>
              <Link to="/imprint" className="text-gray-400 hover:text-gray-900 text-sm">Impressum</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
