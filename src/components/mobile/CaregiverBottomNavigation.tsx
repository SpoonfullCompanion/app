import { useState } from 'react';
import { Home, Users } from 'lucide-react';

export type CaregiverNavRoute = 'home' | 'connections' | 'account';

interface CaregiverBottomNavigationProps {
  activeRoute: CaregiverNavRoute;
  onNavigate: (route: CaregiverNavRoute) => void;
  unseenCount?: number;
  pendingConnectionCount?: number;
}

const navItems = [
  { id: 'home' as const,        label: 'Feed',        icon: Home  },
  { id: 'connections' as const, label: 'Connections', icon: Users },
];

export default function CaregiverBottomNavigation({
  activeRoute,
  onNavigate,
  unseenCount = 0,
  pendingConnectionCount = 0,
}: CaregiverBottomNavigationProps) {
  const [justTapped, setJustTapped] = useState<CaregiverNavRoute | null>(null);

  const handleTap = (id: CaregiverNavRoute) => {
    onNavigate(id);
    setJustTapped(id);
    setTimeout(() => setJustTapped(null), 400);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <nav className="flex w-full max-w-2xl items-center gap-1 rounded-2xl border border-white/10 bg-midnight-black/90 px-2 py-2 shadow-2xl shadow-black/60 backdrop-blur-xl">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeRoute === id;
          const isBouncing = justTapped === id;
          const badge = id === 'home' ? unseenCount : id === 'connections' ? pendingConnectionCount : 0;
          return (
            <button
              key={id}
              onClick={() => handleTap(id)}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-bold-blue/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${isBouncing ? 'animate-nav-bounce' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {badge > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-bold-blue text-[10px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-bold-blue' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
