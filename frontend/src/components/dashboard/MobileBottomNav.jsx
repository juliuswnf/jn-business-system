import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CalendarIcon as CalendarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid';

const navItems = [
  {
    to: '/dashboard',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    label: 'Home',
    exact: true
  },
  {
    to: '/dashboard/bookings',
    icon: CalendarIcon,
    iconSolid: CalendarIconSolid,
    label: 'Termine'
  },
  {
    to: '/dashboard/customers',
    icon: UserGroupIcon,
    iconSolid: UserGroupIconSolid,
    label: 'Kunden'
  },
  {
    to: '/dashboard/notifications',
    icon: BellIcon,
    iconSolid: BellIconSolid,
    label: 'Benachr.'
  },
  {
    to: '/dashboard/settings',
    icon: Cog6ToothIcon,
    iconSolid: Cog6ToothIconSolid,
    label: 'Mehr'
  }
];

export default function MobileBottomNav() {
  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white border-t border-gray-200
        md:hidden
      "
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16 max-w-screen-sm mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `
              flex flex-col items-center justify-center
              flex-1 h-full
              text-xs font-medium
              transition-colors
              touch-manipulation
              ${isActive ? 'text-blue-600' : 'text-gray-600'}
            `}
          >
            {({ isActive }) => {
              const Icon = isActive ? item.iconSolid : item.icon;
              return (
                <>
                  <Icon className="w-6 h-6 mb-0.5" />
                  <span className="text-[10px] leading-tight">{item.label}</span>
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

