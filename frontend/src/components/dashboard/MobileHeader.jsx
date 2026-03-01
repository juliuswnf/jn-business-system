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
              onClick={() => navigate('/dashboard/notifications')}
              className="relative p-2 rounded-lg touch-manipulation active:bg-gray-100"
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
              className="p-2 rounded-lg touch-manipulation active:bg-gray-100"
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
              bg-white shadow-none
              overflow-y-auto
              md:hidden
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <UserCircleIcon className="w-12 h-12 text-zinc-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-zinc-400 truncate">{user?.email || 'keine Email'}</p>
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
            <div className="sticky bottom-0 w-full border-t border-gray-200 bg-white p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 touch-manipulation active:bg-gray-100"
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
      className="w-full text-left py-3 px-4 rounded-lg text-gray-700 font-medium touch-manipulation active:bg-gray-100 transition-colors"
    >
      {children}
    </button>
  );
}

