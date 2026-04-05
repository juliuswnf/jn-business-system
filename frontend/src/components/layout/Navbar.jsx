import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    localStorage.removeItem('jnAuthToken');
    localStorage.removeItem('jnUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tempUser');
    await logout();
    setShowUserMenu(false);
    window.location.replace('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/dashboard';
    if (user.role === 'customer') return '/customer/dashboard';
    if (user.role === 'ceo') return '/ceo/dashboard';
    if (user.role === 'employee') return '/employee/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/dashboard';
  };

  const getSettingsPath = () => {
    if (!user) return '/dashboard/settings';
    if (user.role === 'customer') return '/customer/dashboard';
    if (user.role === 'ceo') return '/ceo/settings';
    if (user.role === 'employee') return '/employee/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/dashboard/settings';
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/demo', label: 'Demo' },
    { to: '/salons', label: 'Anbieter' },
    { to: '/pricing', label: 'Preise' },
    { to: '/faq', label: 'FAQ' },
  ];

  return (
    <nav className="bg-gray-100 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-tight">JN</span>
            </div>
            <span className="text-gray-900 font-semibold text-[15px] hidden sm:block tracking-tight">
              JN Business
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link, idx) => (
              <React.Fragment key={link.to}>
                {idx > 0 && (
                  <span className="w-px h-3.5 bg-gray-200 mx-1" aria-hidden="true" />
                )}
                <Link
                  to={link.to}
                  className={`px-3.5 py-2 rounded-xl text-sm transition-colors ${
                    isActive(link.to)
                      ? 'text-gray-900 font-medium bg-gray-100'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-normal'
                  }`}
                >
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user?.role === 'customer' && (
              <Link
                to="/customer/booking"
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Buchen
              </Link>
            )}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-gray-700 font-medium hidden sm:block max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-100/50 z-50 overflow-hidden py-1">
                      <div className="px-3.5 py-2.5 border-b border-gray-100 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                      </div>
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Dashboard
                      </Link>
                      <Link
                        to={getSettingsPath()}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Einstellungen
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Abmelden
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  Anmelden
                </Link>
                <Link
                  to="/pricing"
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Starten
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive(link.to)
                    ? 'text-gray-900 font-medium bg-gray-100'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
