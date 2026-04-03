import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, Search, ChevronRight, Home } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import StripeConnectAlert from '../components/Dashboard/StripeConnectAlert';
import MobileBottomNav from '../components/Dashboard/MobileBottomNav';
import MobileHeader from '../components/Dashboard/MobileHeader';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useAuth } from '../hooks/useAuth';

const breadcrumbMap = {
  '/dashboard': 'Übersicht',
  '/dashboard/bookings': 'Kalender',
  '/dashboard/customers': 'Kunden',
  '/dashboard/services': 'Dienstleistungen',
  '/dashboard/employees': 'Mitarbeiter',
  '/dashboard/widget': 'Online-Buchung',
  '/dashboard/widget/live-preview': 'Live-Vorschau',
  '/dashboard/settings': 'Einstellungen',
  '/dashboard/branding': 'Branding',
  '/dashboard/marketing': 'Kampagnen',
  '/dashboard/marketing/sms': 'SMS-Versand',
  '/dashboard/success-metrics': 'Erfolgsmetriken',
  '/dashboard/billing/invoices': 'Rechnungen',
  '/dashboard/locations': 'Standorte',
  '/dashboard/waitlist': 'Warteliste',
  '/dashboard/help': 'Hilfe',
  '/dashboard/tattoo/projects': 'Tattoo-Projekte',
  '/dashboard/workflows': 'Workflows',
  '/dashboard/workflow-projects': 'Workflow-Projekte',
  '/dashboard/packages-memberships': 'Pakete & Mitgliedschaften',
  '/employee/dashboard': 'Übersicht',
  '/ceo/dashboard': 'Übersicht',
  '/ceo/analytics': 'Analytics',
  '/ceo/settings': 'Einstellungen',
  '/ceo/email-campaigns': 'E-Mail-Kampagnen',
  '/ceo/payments': 'Zahlungen',
  '/ceo/support': 'Support Tickets',
  '/ceo/audit-log': 'Audit Log',
  '/ceo/lifecycle-emails': 'Lifecycle Emails',
  '/ceo/feature-flags': 'Feature Flags',
  '/ceo/backups': 'Backups',
  '/ceo/companies': 'Unternehmen',
  '/ceo/users': 'Benutzer',
};

export default function DashboardLayout({ children }) {
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const currentLabel = breadcrumbMap[location.pathname] || 'Dashboard';
  const isHome = ['/dashboard', '/employee/dashboard', '/ceo/dashboard'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 bottom-0 w-[260px] z-30">
          <Sidebar />
        </aside>
      )}

      {/* Mobile Sidebar */}
      {isMobile && mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50">
            <Sidebar isOpen={true} onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main area */}
      <div className={`${isMobile ? '' : 'ml-[260px]'} min-h-screen flex flex-col`}>
        {/* Top bar */}
        {!isMobile ? (
          <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-zinc-100">
            <div className="flex items-center justify-between h-14 px-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <Link to={user?.role === 'ceo' ? '/ceo/dashboard' : user?.role === 'employee' ? '/employee/dashboard' : '/dashboard'} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                  <Home size={15} />
                </Link>
                {!isHome && (
                  <>
                    <ChevronRight size={14} className="text-zinc-300" />
                    <span className="text-zinc-900 font-medium">{currentLabel}</span>
                  </>
                )}
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors">
                  <Bell size={18} />
                </button>
                <Link to="/" className="text-[13px] text-zinc-400 hover:text-zinc-600 transition-colors">
                  Zur Website
                </Link>
              </div>
            </div>
          </header>
        ) : (
          <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-zinc-100">
            <div className="flex items-center justify-between h-14 px-4">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 -ml-2 text-zinc-600"
              >
                <Menu size={22} />
              </button>
              <span className="font-semibold text-zinc-900 text-[15px]">JN Business</span>
              <button className="p-2 -mr-2 text-zinc-400">
                <Bell size={20} />
              </button>
            </div>
          </header>
        )}

        {/* Content */}
        <main className={`flex-1 ${isMobile ? 'pt-14 pb-20' : ''}`}>
          <div className="px-6 py-6 max-w-[1400px] mx-auto">
            <StripeConnectAlert />
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {isMobile && <MobileBottomNav />}
    </div>
  );
}
