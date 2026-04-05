import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Home } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
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
          <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
            <div className="flex items-center justify-between h-13 px-8" style={{ height: '52px' }}>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-sm">
                <Link to={user?.role === 'ceo' ? '/ceo/dashboard' : user?.role === 'employee' ? '/employee/dashboard' : '/dashboard'} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Home size={14} />
                </Link>
                {!isHome && (
                  <>
                    <ChevronRight size={13} className="text-gray-300" />
                    <span className="text-gray-800 font-medium text-[13px]">{currentLabel}</span>
                  </>
                )}
              </div>

              {/* Right side */}
              <div className="flex items-center gap-1">
                <Link
                  to="/"
                  className="px-3 py-1.5 text-[13px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Zur Website
                </Link>
              </div>
            </div>
          </header>
        ) : (
          <header className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
            <div className="flex items-center justify-between h-14 px-4">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-600"
              >
                <Menu size={20} />
              </button>
              <span className="font-semibold text-gray-900 text-sm tracking-tight">JN Business</span>
              <div className="w-9" />
            </div>
          </header>
        )}

        {/* Content */}
        <main className={`flex-1 ${isMobile ? 'pt-14 pb-20' : ''}`}>
          <div className="px-4 py-4 md:px-8 md:py-8 max-w-[1400px] mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {isMobile && <MobileBottomNav />}
    </div>
  );
}
