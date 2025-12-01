import React from 'react';
import { FiMenu, FiBell } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Minimalist dark Navbar for app-wide layout
 */
const Navbar = ({ onMenuClick = null, onMenuToggle = null }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);

  return (
    <nav className="bg-black/95 backdrop-blur-sm border-b border-gray-800 px-4 md:px-8 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded hover:bg-white/3 transition"
            title="Menü"
          >
            <FiMenu size={20} className="text-gray-200" />
          </button>

          <button
            onClick={onMenuToggle}
            className="hidden md:inline-flex p-2 rounded hover:bg-white/3 transition"
            title="Sidebar"
          >
            <FiMenu size={20} className="text-gray-200" />
          </button>

          {/* Minimal brand */}
          <div className="ml-1">
            <Link to="/" className="text-sm font-semibold text-gray-100 tracking-wide">JN</Link>
          </div>
        </div>

        {/* Center: small nav links (desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/dashboard" className="text-sm text-gray-300 hover:text-white">Dashboard</Link>
          <Link to="/booking" className="text-sm text-gray-300 hover:text-white">Buchungen</Link>
          <Link to="/widgets" className="text-sm text-gray-300 hover:text-white">Widgets</Link>
        </div>

        {/* Right: notifications & user */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded hover:bg-white/3 transition"
              title="Benachrichtigungen"
            >
              <FiBell size={18} className="text-gray-200" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-black rounded-lg border border-gray-800 shadow-lg z-50">
                <div className="p-3 border-b border-gray-800">
                  <h3 className="text-sm text-gray-100">Benachrichtigungen</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-3 hover:bg-white/3 cursor-pointer border-b border-gray-800">
                    <p className="text-sm text-gray-200">Neue Buchung eingegangen</p>
                    <p className="text-xs text-gray-400">vor 2 Stunden</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 ml-2">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
