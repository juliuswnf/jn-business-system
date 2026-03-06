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
  FiX,
  FiLock
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { useDashboardIndustry } from '../../hooks/useDashboardIndustry';

/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 */
const Sidebar = ({ isOpen = true, onClose = null }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentTier, canAccessTier } = usePlanAccess();
  const industry = useDashboardIndustry();
  const [expandedMenu, setExpandedMenu] = React.useState(null);

  const getBranchModules = () => {
    if (industry === 'barbershop') {
      return [
        { label: 'Mitgliedschaften', path: '/dashboard/packages-memberships', requiredTier: 'professional' },
        { label: 'Zusatzverkäufe', path: '/dashboard/marketing', requiredTier: 'professional' },
        { label: 'Service-Pakete', path: '/dashboard/packages-memberships', requiredTier: 'professional' }
      ];
    }

    if (industry === 'beauty') {
      return [
        { label: 'Service-Pakete', path: '/dashboard/packages-memberships', requiredTier: 'professional' },
        { label: 'Zusatzverkäufe', path: '/dashboard/marketing', requiredTier: 'professional' },
        { label: 'Behandlungs-Tracker', path: '/dashboard/workflow-projects', requiredTier: 'professional' }
      ];
    }

    if (industry === 'nails') {
      return [
        { label: 'Service-Pakete', path: '/dashboard/packages-memberships', requiredTier: 'professional' },
        { label: 'Foto-Galerie', path: '/dashboard/branding', requiredTier: 'professional' },
        { label: 'Zusatzverkäufe', path: '/dashboard/marketing', requiredTier: 'professional' }
      ];
    }

    if (industry === 'tattoo') {
      return [
        { label: 'Mehrsitzungs-Projekte', path: '/dashboard/tattoo/projects', requiredTier: 'professional' },
        { label: 'Fortschritts-Doku', path: '/dashboard/workflow-projects', requiredTier: 'professional' },
        { label: 'Körperstellen-Planung', path: '/dashboard/workflow-projects', requiredTier: 'professional' },
        { label: 'Einwilligungen', path: '/dashboard/workflows', requiredTier: 'professional' }
      ];
    }

    if (industry === 'medical_aesthetics') {
      return [
        { label: 'Behandlungspläne', path: '/dashboard/workflow-projects', requiredTier: 'professional' },
        { label: 'Einwilligungen', path: '/dashboard/workflows', requiredTier: 'professional' },
        { label: 'Vorher-/Nachher-Fotos', path: '/dashboard/workflow-projects', requiredTier: 'professional' },
        { label: 'Nachsorge', path: '/dashboard/workflow-projects', requiredTier: 'professional' },
        { label: 'Medikamenten-Tracking', path: '/dashboard/workflow-projects', requiredTier: 'professional' }
      ];
    }

    if (industry === 'massage') {
      return [
        { label: 'Behandlungspläne', path: '/dashboard/workflow-projects', requiredTier: 'professional' },
        { label: 'Service-Pakete', path: '/dashboard/packages-memberships', requiredTier: 'professional' },
        { label: 'Nachsorge', path: '/dashboard/workflow-projects', requiredTier: 'professional' }
      ];
    }

    if (industry === 'physiotherapy') {
      return [
        { label: 'Behandlungspläne', path: '/dashboard/workflow-projects', requiredTier: 'professional' },
        { label: 'Fortschritts-Doku', path: '/dashboard/workflow-projects', requiredTier: 'professional' },
        { label: 'Nachsorge', path: '/dashboard/workflow-projects', requiredTier: 'professional' },
        { label: 'Einwilligungen', path: '/dashboard/workflows', requiredTier: 'professional' }
      ];
    }

    return [];
  };

  const branchModules = getBranchModules();

  const menuItems = {
    ceo: [
      { icon: FiHome, label: 'Kontrollpanel', path: '/ceo/dashboard' },
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
      { icon: FiHome, label: 'Kontrollpanel', path: '/admin/dashboard' },
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
      { icon: FiHome, label: 'Kontrollpanel', path: '/employee/dashboard' },
      { icon: FiCalendar, label: 'Termine', path: '/dashboard/bookings' },
      { icon: FiSettings, label: 'Services', path: '/dashboard/services' }
    ],
    salon_owner: [
      { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
      { icon: FiCalendar, label: 'Kalender', path: '/dashboard/bookings' },
      { icon: FiSettings, label: 'Online-Buchung', path: '/dashboard/widget' },
      { icon: FiUsers, label: 'Kunden', path: '/dashboard/customers' },
      { icon: FiSettings, label: 'Dienstleistungen', path: '/dashboard/services' },
      {
        icon: FiCalendar,
        label: 'Professional Features',
        requiredTier: 'professional',
        submenu: [
          { label: 'Warteliste', path: '/dashboard/waitlist', requiredTier: 'professional' },
          { label: 'Ausfall-Schutz', path: '/dashboard/waitlist', requiredTier: 'professional' },
          { label: 'Wiederkehrende Termine', path: '/dashboard/workflow-projects', requiredTier: 'professional' },
          { label: 'Buchungsformulare', path: '/dashboard/widget', requiredTier: 'professional' },
          { label: 'Team-Rechte', path: '/dashboard/employees', requiredTier: 'professional' }
        ]
      },
      {
        icon: FiDollarSign,
        label: 'Enterprise Features',
        requiredTier: 'enterprise',
        submenu: [
          { label: 'Erweiterte Berichte', path: '/dashboard/success-metrics', requiredTier: 'enterprise' },
          { label: 'SEPA/Rechnung', path: '/dashboard/billing/invoices', requiredTier: 'enterprise' },
          { label: 'SMS-Versand', path: '/dashboard/marketing/sms', requiredTier: 'enterprise' }
        ]
      },
      {
        icon: FiSettings,
        label: 'Branchenmodule',
        requiredTier: 'professional',
        submenu: branchModules
      },
      { icon: FiSettings, label: 'Einstellungen', path: '/dashboard/settings' }
    ]
  };

  const currentMenuItems = menuItems[user?.role] || [];
  const isActive = (path) => path && location.pathname.startsWith(path);
  const hasTierAccess = (requiredTier = 'starter') => canAccessTier(requiredTier);
  const displayLabel = (label, requiredTier = 'starter') => {
    if (requiredTier === 'starter' || hasTierAccess(requiredTier)) {
      return label;
    }

    return `${label} 🔒`;
  };

  const handleLogout = async () => {
    // Clear all auth data from localStorage first
    localStorage.removeItem('jnAuthToken');
    localStorage.removeItem('jnUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tempUser');

    // Then call logout and redirect
    await logout();
    window.location.replace('/');
  };

  return (
    <div className={`
      w-64 bg-white text-zinc-900 h-full flex flex-col
      transition-all duration-300
      ${!isOpen ? '-translate-x-full' : ''}
    `}>
      {/* Header */}
      <div className="p-6 border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-zinc-900 hover:text-zinc-700 transition-colors">JN Business System</Link>
          {onClose && (
            <button onClick={onClose} className="md:hidden">
              <FiX size={24} />
            </button>
          )}
        </div>
        <p className="text-zinc-500 text-sm mt-1">Business Management</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900 font-semibold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900">{user?.name}</p>
            <p className="text-xs text-zinc-500 capitalize">{user?.role}</p>
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
                  disabled={!hasTierAccess(item.requiredTier || 'starter') || item.submenu.length === 0}
                  className={`
                    w-full flex items-center gap-3 px-6 py-3 text-left
                    transition-colors hover:bg-zinc-100
                    ${expandedMenu === index ? 'bg-zinc-100' : ''}
                    ${(!hasTierAccess(item.requiredTier || 'starter') || item.submenu.length === 0) ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  <item.icon size={20} />
                  <span className="flex-1">{displayLabel(item.label, item.requiredTier || 'starter')}</span>
                  {!hasTierAccess(item.requiredTier || 'starter') && <FiLock size={14} />}
                  <FiChevronDown
                    size={16}
                    className={`transition-transform ${
                      expandedMenu === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Submenu */}
                {expandedMenu === index && (
                  <div className="bg-zinc-50 py-2">
                    {item.submenu.map((subitem, subindex) => (
                      hasTierAccess(subitem.requiredTier || 'starter') && subitem.path ? (
                        <Link
                          key={subindex}
                          to={subitem.path}
                          onClick={() => onClose?.()}
                          className={`
                            flex items-center gap-3 px-8 py-2 text-sm
                            transition-colors hover:bg-zinc-100
                            ${isActive(subitem.path) ? 'bg-zinc-900 text-white' : 'text-zinc-700'}
                          `}
                        >
                          <span className="w-1 h-1 bg-current rounded-full" />
                          {displayLabel(subitem.label, subitem.requiredTier || 'starter')}
                        </Link>
                      ) : (
                        <button
                          key={subindex}
                          type="button"
                          className="w-full flex items-center gap-3 px-8 py-2 text-sm text-zinc-400 opacity-80 cursor-not-allowed"
                          disabled
                        >
                          <span className="w-1 h-1 bg-current rounded-full" />
                          <span className="flex-1 text-left">{displayLabel(subitem.label, subitem.requiredTier || 'starter')}</span>
                          <FiLock size={12} />
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Simple menu item */
              hasTierAccess(item.requiredTier || 'starter') && item.path ? (
                <Link
                  to={item.path}
                  onClick={() => onClose?.()}
                  className={`
                    flex items-center gap-3 px-6 py-3
                    transition-colors hover:bg-zinc-100
                    ${isActive(item.path) ? 'bg-zinc-900 text-white border-l-4 border-zinc-700' : 'text-zinc-700'}
                  `}
                >
                  <item.icon size={20} />
                  <span>{displayLabel(item.label, item.requiredTier || 'starter')}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center gap-3 px-6 py-3 text-zinc-400 opacity-80 cursor-not-allowed"
                >
                  <item.icon size={20} />
                  <span className="flex-1 text-left">{displayLabel(item.label, item.requiredTier || 'starter')}</span>
                  <FiLock size={14} />
                </button>
              )
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-zinc-200 p-6">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-4 py-2 rounded
            transition-colors bg-zinc-900 hover:bg-zinc-800 text-white
          `}
        >
          <FiLogOut size={20} />
          <span>Abmelden</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
