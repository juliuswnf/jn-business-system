import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 */
const Sidebar = ({ isOpen = true, onClose = null }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [expandedMenu, setExpandedMenu] = React.useState(null);

  const menuItems = {
    ceo: [
      { icon: FiHome, label: 'Dashboard', path: '/ceo/dashboard' },
      {
        icon: FiDollarSign,
        label: 'Analytics',
        submenu: [
          { label: 'Revenue', path: '/ceo/analytics/revenue' },
          { label: 'Bookings', path: '/ceo/analytics/bookings' },
          { label: 'Customers', path: '/ceo/analytics/customers' }
        ]
      },
      { icon: FiSettings, label: 'Settings', path: '/ceo/settings' }
    ],
    admin: [
      { icon: FiHome, label: 'Dashboard', path: '/admin/dashboard' },
      {
        icon: FiUsers,
        label: 'Management',
        submenu: [
          { label: 'Customers', path: '/admin/customers' },
          { label: 'Employees', path: '/admin/employees' },
          { label: 'Services', path: '/admin/services' }
        ]
      },
      { icon: FiCalendar, label: 'Appointments', path: '/admin/appointments' },
      { icon: FiDollarSign, label: 'Payments', path: '/admin/payments' },
      { icon: FiSettings, label: 'Settings', path: '/admin/settings' }
    ],
    employee: [
      { icon: FiHome, label: 'Dashboard', path: '/employee/dashboard' },
      { icon: FiCalendar, label: 'Schedule', path: '/employee/schedule' },
      { icon: FiCalendar, label: 'Appointments', path: '/employee/appointments' }
    ]
  };

  const currentMenuItems = menuItems[user?.role] || [];
  const isActive = (path) => location.pathname.startsWith(path);

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
    window.location.replace('/');
  };

  return (
    <div className={`
      w-64 bg-gray-900 text-white h-full flex flex-col
      transition-all duration-300
      ${!isOpen ? '-translate-x-full' : ''}
    `}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">JN Automation</Link>
          {onClose && (
            <button onClick={onClose} className="md:hidden">
              <FiX size={24} />
            </button>
          )}
        </div>
        <p className="text-gray-400 text-sm mt-1">Business Management</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-6">
        {currentMenuItems.map((item, index) => (
          <div key={index}>
            {item.submenu ? (
              <div>
                {/* Menu with submenu */}
                <button
                  onClick={() => setExpandedMenu(
                    expandedMenu === index ? null : index
                  )}
                  className={`
                    w-full flex items-center gap-3 px-6 py-3 text-left
                    transition-colors hover:bg-gray-800
                    ${expandedMenu === index ? 'bg-gray-800' : ''}
                  `}
                >
                  <item.icon size={20} />
                  <span className="flex-1">{item.label}</span>
                  <FiChevronDown
                    size={16}
                    className={`transition-transform ${
                      expandedMenu === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Submenu */}
                {expandedMenu === index && (
                  <div className="bg-gray-800 py-2">
                    {item.submenu.map((subitem, subindex) => (
                      <Link
                        key={subindex}
                        to={subitem.path}
                        onClick={() => onClose?.()}
                        className={`
                          flex items-center gap-3 px-8 py-2 text-sm
                          transition-colors hover:bg-gray-700
                          ${isActive(subitem.path) ? 'bg-blue-600 text-white' : 'text-gray-300'}
                        `}
                      >
                        <span className="w-1 h-1 bg-current rounded-full" />
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Simple menu item */
              <Link
                to={item.path}
                onClick={() => onClose?.()}
                className={`
                  flex items-center gap-3 px-6 py-3
                  transition-colors hover:bg-gray-800
                  ${isActive(item.path) ? 'bg-blue-600 text-white border-l-4 border-blue-400' : 'text-gray-300'}
                `}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-gray-700 p-6">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-4 py-2 rounded
            transition-colors bg-red-600 hover:bg-red-700 text-white
          `}
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
