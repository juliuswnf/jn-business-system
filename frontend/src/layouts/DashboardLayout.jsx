import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserMenu from '../components/common/UserMenu';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoSpinning, setLogoSpinning] = useState(false);

  const handleLogoClick = () => {
    setLogoSpinning(true);
    setTimeout(() => setLogoSpinning(false), 600);
  };

  const navItems = [
    { path: '/dashboard', label: 'Übersicht', exact: true, dataTour: 'dashboard' },
    { path: '/dashboard/bookings', label: 'Buchungen', dataTour: 'bookings' },
    { path: '/dashboard/services', label: 'Services', dataTour: 'services' },
    { path: '/dashboard/employees', label: 'Mitarbeiter' },
    { path: '/dashboard/waitlist', label: '⏳ Warteliste (NO-SHOW-KILLER)' },
    { path: '/dashboard/marketing', label: '📧 Marketing-Agent' },
    { path: '/dashboard/workflows', label: '🔄 Branchen-Workflows' },
    { path: '/dashboard/workflow-projects', label: '📋 Projekte' },
    { path: '/dashboard/packages-memberships', label: '🎁 Packages & Memberships' },
    { path: '/dashboard/tattoo/projects', label: '🎨 Tattoo Studio' },
    { path: '/dashboard/success-metrics', label: '📊 Erfolgsmetriken' },
    { path: '/dashboard/widget', label: '🔗 Widget', dataTour: 'widget' },
    { path: '/dashboard/settings', label: '⚙️ Einstellungen', dataTour: 'settings' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return currentPath === path;
    return currentPath.startsWith(path);
  };

  const getPageTitle = () => {
    const active = navItems.find(item => isActive(item.path, item.exact));
    return active?.label || 'Dashboard';
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-72 bg-zinc-900 border-r border-zinc-800 min-h-screen p-4 hidden md:block fixed">
          <div className="mb-8">
            <Link to="/dashboard" className="flex items-center gap-3" onClick={handleLogoClick}>
              <div className={`w-10 h-10 rounded-md bg-white flex items-center justify-center text-black font-bold transition-transform duration-500 ${logoSpinning ? 'rotate-[360deg]' : ''}`}>JN</div>
              <div className="text-white font-semibold">Studio</div>
            </Link>
          </div>

          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                data-tour={item.dataTour}
                className={`py-2 px-3 rounded transition ${
                  isActive(item.path, item.exact)
                    ? 'bg-white text-black font-medium'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-zinc-800 my-2" />
            <Link to="/dashboard/help" data-tour="help" className={`py-2 px-3 rounded flex items-center gap-2 transition ${
              currentPath === '/dashboard/help' ? 'bg-white text-black font-medium' : 'text-zinc-300 hover:bg-zinc-800'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hilfe & Tutorials
            </Link>
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`
          md:hidden fixed top-0 left-0 bottom-0 w-72 bg-zinc-900 border-r border-zinc-800 p-4 z-50 transform transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between mb-8">
            <Link to="/dashboard" className="flex items-center gap-3" onClick={handleNavClick}>
              <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-black font-bold">JN</div>
              <div className="text-white font-semibold">Studio</div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`py-2 px-3 rounded transition ${
                  isActive(item.path, item.exact)
                    ? 'bg-white text-black font-medium'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-zinc-800 my-2" />
            <Link
              to="/dashboard/help"
              onClick={handleNavClick}
              className={`py-2 px-3 rounded flex items-center gap-2 transition ${
                currentPath === '/dashboard/help' ? 'bg-white text-black font-medium' : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hilfe & Tutorials
            </Link>
          </nav>
        </aside>

        <div className="flex-1 md:ml-72 w-full">
          <div className="bg-black border-b border-zinc-800 p-4 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition mr-2"
              >
                <Menu className="w-5 h-5" />
              </button>

              <h2 className="text-lg sm:text-xl font-semibold truncate flex-1">{getPageTitle()}</h2>
              <UserMenu />
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
