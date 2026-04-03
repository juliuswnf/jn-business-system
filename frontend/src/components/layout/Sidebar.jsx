import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Globe,
  Megaphone,
  CreditCard,
  Settings,
  ChevronDown,
  Lock,
  LogOut,
  X,
  BarChart3,
  Building2,
  Shield,
  Mail,
  Flag,
  HardDrive,
  Headphones,
  FileText,
  MessageSquare,
  ListChecks,
  Clock,
  UserCog,
  Palette,
  MapPin,
  TrendingUp,
  Package,
  Layers
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { useDashboardIndustry } from '../../hooks/useDashboardIndustry';

const Sidebar = ({ isOpen = true, onClose = null }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { canAccessTier } = usePlanAccess();
  const industry = useDashboardIndustry();
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (path) => {
    if (!path) return false;
    if (path === '/dashboard' || path === '/employee/dashboard' || path === '/ceo/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const hasTier = (tier = 'starter') => canAccessTier(tier);

  const getBranchItems = () => {
    const branches = {
      barbershop: [
        { label: 'Mitgliedschaften', path: '/dashboard/packages-memberships' },
        { label: 'Zusatzverkäufe', path: '/dashboard/marketing' },
        { label: 'Service-Pakete', path: '/dashboard/packages-memberships' }
      ],
      beauty: [
        { label: 'Service-Pakete', path: '/dashboard/packages-memberships' },
        { label: 'Zusatzverkäufe', path: '/dashboard/marketing' },
        { label: 'Behandlungs-Tracker', path: '/dashboard/workflow-projects' }
      ],
      nails: [
        { label: 'Service-Pakete', path: '/dashboard/packages-memberships' },
        { label: 'Foto-Galerie', path: '/dashboard/branding' },
        { label: 'Zusatzverkäufe', path: '/dashboard/marketing' }
      ],
      tattoo: [
        { label: 'Mehrsitzungs-Projekte', path: '/dashboard/tattoo/projects' },
        { label: 'Fortschritts-Doku', path: '/dashboard/workflow-projects' },
        { label: 'Körperstellen-Planung', path: '/dashboard/workflow-projects' },
        { label: 'Einwilligungen', path: '/dashboard/workflows' }
      ],
      medical_aesthetics: [
        { label: 'Behandlungspläne', path: '/dashboard/workflow-projects' },
        { label: 'Einwilligungen', path: '/dashboard/workflows' },
        { label: 'Vorher-/Nachher-Fotos', path: '/dashboard/workflow-projects' },
        { label: 'Nachsorge', path: '/dashboard/workflow-projects' },
        { label: 'Medikamenten-Tracking', path: '/dashboard/workflow-projects' }
      ],
      massage: [
        { label: 'Behandlungspläne', path: '/dashboard/workflow-projects' },
        { label: 'Service-Pakete', path: '/dashboard/packages-memberships' },
        { label: 'Nachsorge', path: '/dashboard/workflow-projects' }
      ],
      physiotherapy: [
        { label: 'Behandlungspläne', path: '/dashboard/workflow-projects' },
        { label: 'Fortschritts-Doku', path: '/dashboard/workflow-projects' },
        { label: 'Nachsorge', path: '/dashboard/workflow-projects' },
        { label: 'Einwilligungen', path: '/dashboard/workflows' }
      ]
    };
    return branches[industry] || [];
  };

  const navigation = useMemo(() => {
    const role = user?.role;

    if (role === 'ceo') {
      return [
        {
          key: 'overview',
          label: 'Übersicht',
          icon: LayoutDashboard,
          path: '/ceo/dashboard'
        },
        {
          key: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          children: [
            { label: 'Übersicht', path: '/ceo/analytics' },
          ]
        },
        {
          key: 'manage',
          label: 'Verwaltung',
          icon: Building2,
          children: [
            { label: 'Unternehmen', path: '/ceo/companies' },
            { label: 'Benutzer', path: '/ceo/users' },
            { label: 'Zahlungen', path: '/ceo/payments' },
            { label: 'Abonnements', path: '/ceo/subscriptions' }
          ]
        },
        {
          key: 'communication',
          label: 'Kommunikation',
          icon: Mail,
          children: [
            { label: 'E-Mail-Kampagnen', path: '/ceo/email-campaigns' },
            { label: 'Lifecycle Emails', path: '/ceo/lifecycle-emails' },
            { label: 'Support Tickets', path: '/ceo/support' }
          ]
        },
        {
          key: 'system',
          label: 'System',
          icon: Shield,
          children: [
            { label: 'Feature Flags', path: '/ceo/feature-flags' },
            { label: 'Audit Log', path: '/ceo/audit-log' },
            { label: 'Backups', path: '/ceo/backups' }
          ]
        },
        {
          key: 'settings',
          label: 'Einstellungen',
          icon: Settings,
          path: '/ceo/settings'
        }
      ];
    }

    if (role === 'employee') {
      return [
        {
          key: 'overview',
          label: 'Übersicht',
          icon: LayoutDashboard,
          path: '/employee/dashboard'
        },
        {
          key: 'schedule',
          label: 'Termine & Kalender',
          icon: Calendar,
          children: [
            { label: 'Meine Termine', path: '/dashboard/bookings' },
          ]
        },
        {
          key: 'services',
          label: 'Services',
          icon: Scissors,
          path: '/dashboard/services'
        },
        {
          key: 'help',
          label: 'Hilfe',
          icon: Headphones,
          path: '/dashboard/help'
        }
      ];
    }

    // salon_owner / admin
    const branchItems = getBranchItems();
    const items = [
      {
        key: 'overview',
        label: 'Übersicht',
        icon: LayoutDashboard,
        path: '/dashboard'
      },
      {
        key: 'schedule',
        label: 'Termine & Kalender',
        icon: Calendar,
        children: [
          { label: 'Kalender', path: '/dashboard/bookings' },
          { label: 'Warteliste', path: '/dashboard/waitlist', tier: 'professional' },
        ]
      },
      {
        key: 'clients',
        label: 'Kunden & Team',
        icon: Users,
        children: [
          { label: 'Kunden', path: '/dashboard/customers' },
          { label: 'Mitarbeiter', path: '/dashboard/employees', tier: 'professional' },
        ]
      },
      {
        key: 'services',
        label: 'Services & Produkte',
        icon: Scissors,
        children: [
          { label: 'Dienstleistungen', path: '/dashboard/services' },
          { label: 'Pakete & Mitgliedschaften', path: '/dashboard/packages-memberships', tier: 'professional' },
        ]
      },
      {
        key: 'booking',
        label: 'Online-Buchung',
        icon: Globe,
        children: [
          { label: 'Widget Setup', path: '/dashboard/widget' },
          { label: 'Live-Vorschau', path: '/dashboard/widget/live-preview' },
        ]
      },
      {
        key: 'marketing',
        label: 'Marketing',
        icon: Megaphone,
        children: [
          { label: 'Kampagnen', path: '/dashboard/marketing', tier: 'professional' },
          { label: 'SMS-Versand', path: '/dashboard/marketing/sms', tier: 'enterprise' },
          { label: 'Branding', path: '/dashboard/branding', tier: 'professional' },
        ]
      },
      {
        key: 'finance',
        label: 'Finanzen & Berichte',
        icon: CreditCard,
        children: [
          { label: 'Erfolgsmetriken', path: '/dashboard/success-metrics', tier: 'enterprise' },
          { label: 'Rechnungen', path: '/dashboard/billing/invoices', tier: 'enterprise' },
          { label: 'Standorte', path: '/dashboard/locations', tier: 'enterprise' },
        ]
      }
    ];

    if (branchItems.length > 0) {
      items.push({
        key: 'branch',
        label: 'Branchenmodule',
        icon: Layers,
        tier: 'professional',
        children: branchItems.map(b => ({ ...b, tier: 'professional' }))
      });
    }

    items.push({
      key: 'settings',
      label: 'Einstellungen',
      icon: Settings,
      path: '/dashboard/settings'
    });

    items.push({
      key: 'help',
      label: 'Hilfe & Support',
      icon: Headphones,
      path: '/dashboard/help'
    });

    return items;
  }, [user?.role, industry]);

  const handleLogout = async () => {
    localStorage.removeItem('jnAuthToken');
    localStorage.removeItem('jnUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tempUser');
    await logout();
    window.location.replace('/');
  };

  const getRoleLabel = (role) => {
    const labels = {
      salon_owner: 'Inhaber',
      employee: 'Mitarbeiter',
      ceo: 'CEO',
      admin: 'Admin'
    };
    return labels[role] || role;
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections[item.key];
    const sectionLocked = item.tier && !hasTier(item.tier);
    const isItemActive = !hasChildren && isActive(item.path);
    const hasActiveChild = hasChildren && item.children.some(c => isActive(c.path));

    if (hasChildren) {
      return (
        <div key={item.key} className="mb-0.5">
          <button
            onClick={() => !sectionLocked && toggleSection(item.key)}
            disabled={sectionLocked}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] font-medium
              transition-colors
              ${sectionLocked
                ? 'text-zinc-300 cursor-not-allowed'
                : hasActiveChild
                  ? 'text-zinc-900 bg-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }
            `}
          >
            <Icon size={17} className="shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {sectionLocked ? (
              <Lock size={13} className="shrink-0 text-zinc-300" />
            ) : (
              <ChevronDown
                size={13}
                className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {isExpanded && !sectionLocked && (
            <div className="mt-0.5 ml-5 pl-3 border-l border-zinc-200 space-y-0.5">
              {item.children.map((child, idx) => {
                const childLocked = child.tier && !hasTier(child.tier);
                const childActive = isActive(child.path);

                if (childLocked) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] text-zinc-300 cursor-not-allowed"
                    >
                      <span className="truncate">{child.label}</span>
                      <Lock size={11} className="shrink-0 ml-auto" />
                    </div>
                  );
                }

                return (
                  <Link
                    key={idx}
                    to={child.path}
                    onClick={() => onClose?.()}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px]
                      transition-colors
                      ${childActive
                        ? 'text-zinc-900 font-medium'
                        : 'text-zinc-400 hover:text-zinc-700'
                      }
                    `}
                  >
                    <span className="truncate">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Simple link item
    if (sectionLocked) {
      return (
        <div
          key={item.key}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-zinc-300 cursor-not-allowed mb-0.5"
        >
          <Icon size={17} className="shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          <Lock size={13} className="shrink-0" />
        </div>
      );
    }

    return (
      <Link
        key={item.key}
        to={item.path}
        onClick={() => onClose?.()}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium mb-0.5
          transition-colors
          ${isItemActive
            ? 'text-zinc-900 bg-zinc-100'
            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
          }
        `}
      >
        <Icon size={17} className="shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className={`
      w-[260px] bg-white border-r border-zinc-200 h-full flex flex-col
      transition-all duration-300
      ${!isOpen ? '-translate-x-full' : ''}
    `}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <span className="text-white font-bold text-sm">JN</span>
          </div>
          <span className="text-zinc-900 font-semibold text-[15px]">JN Business</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-zinc-700">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User */}
      <div className="mx-4 mb-5 px-3 py-3 bg-zinc-50 rounded-lg border border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-zinc-900 truncate">{user?.name || 'Benutzer'}</p>
            <p className="text-[11px] text-zinc-400">{getRoleLabel(user?.role)}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          {navigation.map(renderNavItem)}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-zinc-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
        >
          <LogOut size={17} />
          <span>Abmelden</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
