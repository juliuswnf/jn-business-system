import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserMenu from '../common/UserMenu';

/**
 * CustomerLayout Component
 * Layout for customer-facing pages with navigation and UserMenu
 */
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
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                <span className="text-zinc-900 font-bold text-sm">JN</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">JN Business System</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-zinc-800">
          <div className="px-4 py-2 flex gap-1 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive(link.to)
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="text-zinc-900">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-zinc-400 text-sm">
              &copy; {new Date().getFullYear()} JN Business System. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-zinc-400 hover:text-zinc-900 text-sm">Datenschutz</Link>
              <Link to="/terms" className="text-zinc-400 hover:text-zinc-900 text-sm">AGB</Link>
              <Link to="/imprint" className="text-zinc-400 hover:text-zinc-900 text-sm">Impressum</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
