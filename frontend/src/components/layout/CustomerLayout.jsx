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
    { to: '/customer/settings', label: 'Einstellungen' },
  ];
  
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                <span className="text-black font-bold text-sm">JN</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">JN Automation</span>
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
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main>
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} JN Automation. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-gray-500 hover:text-gray-400 text-sm">Datenschutz</Link>
              <Link to="/terms" className="text-gray-500 hover:text-gray-400 text-sm">AGB</Link>
              <Link to="/imprint" className="text-gray-500 hover:text-gray-400 text-sm">Impressum</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
