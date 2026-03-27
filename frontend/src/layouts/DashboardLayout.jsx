import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import StripeConnectAlert from '../components/Dashboard/StripeConnectAlert';
import MobileBottomNav from '../components/Dashboard/MobileBottomNav';
import MobileHeader from '../components/Dashboard/MobileHeader';
import { useIsMobile } from '../hooks/useMediaQuery';

export default function DashboardLayout({ children }) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-white">
      {!isMobile && <Navbar />}

      <div className="flex">
        {!isMobile && (
          <aside className="fixed left-0 top-[73px] bottom-0 w-64 bg-white border-r border-zinc-200 z-20">
            <Sidebar />
          </aside>
        )}

        <div className={`${isMobile ? '' : 'md:ml-64'} flex-1`}>
          {isMobile && <MobileHeader />}
          <main
            className={`
              min-h-screen
              ${isMobile ? 'pt-16 pb-20' : 'pt-0 pb-4'}
            `}
          >
            <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">
              <StripeConnectAlert />
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
