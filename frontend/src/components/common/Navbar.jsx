import React, { useContext, useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { UIContext } from '../../context/UIContext';
import { authAPI } from '../../utils/api';

export default function Navbar() {
  const { toggleSidebar, sidebarOpen } = useContext(UIContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Logout API failed:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tempUser');
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full bg-primary dark:bg-black/95 backdrop-blur-xl border-b border-accent/20 dark:border-accent/10 z-50">
      <div className="max-w-full px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-accent hover:text-accent-light transition p-2"
            title="Toggle menu"
          >
            {sidebarOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            <div className="text-2xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent transition group-hover:scale-105">
              JN
            </div>
            <span className="hidden sm:block text-white font-semibold text-sm">Business</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {token ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-slate-300 dark:text-slate-300 hover:text-accent dark:hover:text-accent hover:bg-secondary dark:hover:bg-slate-900/50 transition duration-200"
              >
                <span className="text-sm hidden sm:inline">{user.name || 'Account'}</span>
                <ChevronDownIcon className={`w-4 h-4 transition duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-secondary dark:bg-slate-900 border border-accent/20 dark:border-accent/10 rounded-lg shadow-lg shadow-accent/10 overflow-hidden animate-slide-in">
                  {user.role === 'ceo' && (
                    <Link
                      to="/ceo/dashboard"
                      className="block px-4 py-3 text-slate-300 dark:text-slate-400 hover:text-accent dark:hover:text-accent hover:bg-primary/50 dark:hover:bg-slate-800 border-b border-accent/10 dark:border-accent/5 transition duration-200"
                    >
                      👑 CEO Dashboard
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      className="block px-4 py-3 text-slate-300 dark:text-slate-400 hover:text-accent dark:hover:text-accent hover:bg-primary/50 dark:hover:bg-slate-800 border-b border-accent/10 dark:border-accent/5 transition duration-200"
                    >
                      🏢 Company Dashboard
                    </Link>
                  )}
                  <Link
                    to="/customer/settings"
                    className="block px-4 py-3 text-slate-300 dark:text-slate-400 hover:text-accent dark:hover:text-accent hover:bg-primary/50 dark:hover:bg-slate-800 border-b border-accent/10 dark:border-accent/5 transition duration-200"
                  >
                    ⚙️ Settings
                  </Link>
                  <Link
                    to="/sessions"
                    className="block px-4 py-3 text-slate-300 dark:text-slate-400 hover:text-accent dark:hover:text-accent hover:bg-primary/50 dark:hover:bg-slate-800 border-b border-accent/10 dark:border-accent/5 transition duration-200"
                  >
                    🔐 Sessions
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-red-400 dark:text-red-400 hover:text-red-300 dark:hover:text-red-300 hover:bg-primary/50 dark:hover:bg-slate-800 transition duration-200"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 sm:px-4 py-2 text-accent hover:text-accent-light transition duration-200 font-medium text-sm sm:text-base"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 sm:px-6 py-2 bg-accent hover:bg-accent-light text-primary font-semibold rounded-lg transition duration-200 shadow-lg shadow-accent/20 text-sm sm:text-base"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
