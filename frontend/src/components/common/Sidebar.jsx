import React, { useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UIContext } from '../../context/UIContext';

export default function Sidebar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { sidebarOpen, closeSidebar } = useContext(UIContext);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/customer/booking', label: 'Meine Buchungen', role: 'customer' },
    { path: '/customer/settings', label: 'Einstellungen', role: 'customer' },
    { path: '/company/appointments', label: 'Termine', role: 'admin' },
    { path: '/company/customers', label: 'Kunden', role: 'admin' },
    { path: '/company/services', label: 'Services', role: 'admin' },
    { path: '/company/employees', label: 'Mitarbeiter', role: 'admin' },
    { path: '/company/payments', label: 'Zahlungen', role: 'admin' },
    { path: '/ceo/dashboard', label: '👔 CEO Kontrollpanel', role: 'ceo' },
    { path: '/ceo/companies', label: '🏢 Companies', role: 'ceo' },
    { path: '/ceo/users', label: '👥 Users', role: 'ceo' },
    { path: '/ceo/settings', label: '⚙️ System Settings', role: 'ceo' },
    { path: '/employee/dashboard', label: 'Mein Zeitplan', role: 'employee' },
  ];

  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-primary dark:bg-black border-r border-accent/20 dark:border-accent/10 z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-6 space-y-2 overflow-y-auto h-full">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-600 uppercase tracking-wider mb-4">
            Navigation
          </h3>

          {menuItems.map((item) => {
            const show = item.role === 'customer' || user.role === item.role;

            return show ? (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 rounded-lg transition duration-200 ${
                  isActive(item.path)
                    ? 'bg-accent text-primary dark:bg-accent dark:text-black font-semibold'
                    : 'text-slate-300 dark:text-slate-400 hover:text-accent dark:hover:text-accent hover:bg-secondary dark:hover:bg-slate-900/50'
                }`}
              >
                {item.label}
              </Link>
            ) : null;
          })}
        </nav>
      </div>
    </>
  );
}
