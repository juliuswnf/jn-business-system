import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Clean dark Navbar with full navigation
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // Clear all auth data from localStorage first
    localStorage.removeItem('jnAuthToken');
    localStorage.removeItem('jnUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tempUser');

    // Then call logout and redirect
    logout();
    setShowUserMenu(false);
    window.location.replace('/');
  };

  // Get correct dashboard path based on user role
  const getDashboardPath = () => {
    if (!user) return '/dashboard';
    if (user.role === 'customer') return '/customer/dashboard';
    if (user.role === 'ceo') return '/ceo/dashboard';
    return '/dashboard'; // salon_owner / business
  };

  const getSettingsPath = () => {
    if (!user) return '/dashboard/settings';
    if (user.role === 'customer') return '/customer/dashboard'; // customers use same page
    if (user.role === 'ceo') return '/ceo/dashboard';
    return '/dashboard/settings';
  };

  // Always show public links - UserMenu handles user-specific navigation
  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/demo', label: 'Demo' },
    { to: '/salons', label: 'Anbieter' },
    { to: '/pricing', label: 'Preise' },
    ...(!user ? [{ to: '/login', label: 'Anmelden' }] : []),
    { to: '/faq', label: 'FAQ' },
  ];

  return (
    <nav className="bg-black border-b border-zinc-800 px-4 md:px-8 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">JN</span>
          </div>
          <span className="text-white font-semibold text-lg hidden sm:block">JN Business System</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="relative">
          {user ? (
            <>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                onMouseEnter={(e) => e.currentTarget.querySelector('.dropdown-arrow').classList.remove('opacity-0')}
                onMouseLeave={(e) => !showUserMenu && e.currentTarget.querySelector('.dropdown-arrow').classList.add('opacity-0')}
                className="group flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-white/5 transition"
              >
                <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <svg
                  className={`dropdown-arrow w-4 h-4 text-gray-400 transition-all duration-200 ${showUserMenu ? 'opacity-100 rotate-180' : 'opacity-0'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-900 rounded-lg border border-zinc-800 shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Home
                      </Link>
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Übersicht
                      </Link>
                      <Link
                        to={getSettingsPath()}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Einstellungen
                      </Link>
                    </div>
                    <div className="border-t border-gray-800 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Abmelden
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <Link
              to="/pricing"
              className="px-4 py-2 bg-white text-black rounded text-sm font-medium hover:bg-gray-100 transition"
            >
              Jetzt starten
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
