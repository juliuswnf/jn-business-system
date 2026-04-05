import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

export default function MobileHeader() {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const notificationCount = 3;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 md:hidden">
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="font-bold text-xl touch-manipulation active:opacity-70"
          >
            JN Business
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/dashboard/help')}
              className="relative p-2 rounded-xl touch-manipulation active:bg-gray-100"
            >
              <BellIcon className="w-6 h-6 text-gray-700" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl touch-manipulation active:bg-gray-100"
            >
              {showMenu ? <XMarkIcon className="w-6 h-6 text-gray-700" /> : <Bars3Icon className="w-6 h-6 text-gray-700" />}
            </button>
          </div>
        </div>
      </header>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-50 bg-white bg-opacity-40 md:hidden"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="
              fixed right-0 top-0 bottom-0 z-50
              w-72 max-w-[85vw]
              bg-white border-l border-gray-100 shadow-xl
              overflow-y-auto
              md:hidden
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <UserCircleIcon className="w-12 h-12 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'keine Email'}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <MenuButton onClick={() => { navigate('/dashboard/services'); setShowMenu(false); }}>
                Services
              </MenuButton>
              <MenuButton onClick={() => { navigate('/dashboard/employees'); setShowMenu(false); }}>
                Mitarbeiter
              </MenuButton>
              <MenuButton onClick={() => { navigate('/dashboard/widget'); setShowMenu(false); }}>
                Widget
              </MenuButton>
              <MenuButton onClick={() => { navigate('/dashboard/settings'); setShowMenu(false); }}>
                Einstellungen
              </MenuButton>
            </div>
            <div className="sticky bottom-0 w-full bg-white border-t border-gray-100 p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium !bg-red-600 !text-white hover:!bg-red-700 border-0 ring-0 outline-none focus:ring-0 focus:outline-none appearance-none touch-manipulation"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Abmelden
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MenuButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left py-3 px-4 rounded-xl text-gray-700 font-medium touch-manipulation active:bg-gray-50 transition-colors"
    >
      {children}
    </button>
  );
}

