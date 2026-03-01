import React, { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * DashboardLayout Component
 * Main layout wrapper for dashboard pages
 * Includes sidebar, navbar, and responsive design
 * 
 * Props:
 * - children: Page content
 * - title: Page title (shown in navbar)
 * - breadcrumbs: Navigation breadcrumbs
 */
const DashboardLayout = ({
  children,
  title = 'Dashboard',
  breadcrumbs = []
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-white bg-opacity-50 md:hidden z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full z-50 md:hidden
        transition-transform duration-300
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          title={title}
          breadcrumbs={breadcrumbs}
          onMenuClick={toggleMobileSidebar}
          sidebarCollapsed={!sidebarOpen}
          onSidebarToggle={toggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
