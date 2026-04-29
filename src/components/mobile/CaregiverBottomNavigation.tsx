import { Home, User } from 'lucide-react';

export type CaregiverNavRoute = 'home' | 'account';

interface CaregiverBottomNavigationProps {
  activeRoute: CaregiverNavRoute;
  onNavigate: (route: CaregiverNavRoute) => void;
  unseenCount?: number;
}

const navItems = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'account' as const, label: 'Account', icon: User },
];

export default function CaregiverBottomNavigation({
  activeRoute,
  onNavigate,
  unseenCount = 0,
}: CaregiverBottomNavigationProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-dark-blue/70 bg-midnight-black/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-around px-2 py-2">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeRoute === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? 'text-bold-blue'
                  : 'text-off-white/60 hover:text-off-white/80'
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                {id === 'home' && unseenCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-bold-blue text-[10px] font-bold text-white">
                    {unseenCount > 9 ? '9+' : unseenCount}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
