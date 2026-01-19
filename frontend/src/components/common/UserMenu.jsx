import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { captureError } from '../../utils/errorTracking';
import { useAuth } from '../../hooks/useAuth';

/**
 * UserMenu Component - Account dropdown with settings and logout
 * Shows only when user is logged in
 */
const UserMenu = () => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowMenu(false);
    
    try {
      // Call logout API to clear cookies on backend
      // IMPORTANT: Must complete before redirecting
      await logout();
      
      // Wait a tiny moment to ensure response is fully processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Logout error:', error);
      captureError(error, { context: 'UserMenuLogout' });
    }
    
    // Always redirect to home after logout completes (or fails)
    // Force a full page reload to clear all state
    window.location.href = '/';
  };

  const getSettingsLink = () => {
    if (!user) return '/dashboard/settings';
    switch (user.role) {
      case 'customer':
        return '/customer/settings';
      case 'ceo':
        return '/ceo/settings';
      default:
        return '/dashboard/settings';
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case 'customer':
        return '/customer/dashboard';
      case 'ceo':
        return '/ceo/dashboard';
      default:
        return '/dashboard';
    }
  };

  // Don't render if no user
  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        onMouseEnter={() => setShowArrow(true)}
        onMouseLeave={() => !showMenu && setShowArrow(false)}
        className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-white/5 transition"
      >
        {/* User Avatar */}
        <div className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        
        {/* Arrow - only shows on hover or when menu is open */}
        <svg 
          className={`w-4 h-4 text-gray-400 transition-all duration-200 ${
            showArrow || showMenu ? 'opacity-100' : 'opacity-0'
          } ${showMenu ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-xl border border-gray-800 shadow-xl z-50 overflow-hidden">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-800">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            
            {/* Menu Items */}
            <div className="py-1">
              <Link
                to="/"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
              
              <Link
                to={getDashboardLink()}
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>
              
              <Link
                to={getSettingsLink()}
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Einstellungen
              </Link>
            </div>
            
            {/* Logout */}
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
    </div>
  );
};

export default UserMenu;
