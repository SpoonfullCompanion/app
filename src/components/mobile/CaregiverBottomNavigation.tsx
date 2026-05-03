import { useState } from 'react';
import { Home } from 'lucide-react';

export type CaregiverNavRoute = 'home' | 'account';

interface CaregiverBottomNavigationProps {
  activeRoute: CaregiverNavRoute;
  onNavigate: (route: CaregiverNavRoute) => void;
  unseenCount?: number;
}

export default function CaregiverBottomNavigation({
  activeRoute,
  onNavigate,
  unseenCount = 0,
}: CaregiverBottomNavigationProps) {
  const [justTapped, setJustTapped] = useState<CaregiverNavRoute | null>(null);

  const handleTap = (id: CaregiverNavRoute) => {
    onNavigate(id);
    setJustTapped(id);
    setTimeout(() => setJustTapped(null), 400);
  };

  const isActive = activeRoute === 'home';
  const isBouncing = justTapped === 'home';

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <nav className="flex w-full max-w-2xl items-center gap-1 rounded-2xl border border-white/10 bg-midnight-black/90 px-2 py-2 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <button
          onClick={() => handleTap('home')}
          className={`relative flex flex-col items-center gap-1 rounded-xl px-6 py-2 transition-all duration-150 active:scale-95 ${
            isActive
              ? 'bg-bold-blue/20 text-bold-blue'
              : 'text-off-white/50 hover:text-off-white/80'
          }`}
        >
          <div className="relative">
            <Home
              className={`h-5 w-5 ${isBouncing ? 'animate-nav-bounce' : ''}`}
              strokeWidth={isActive ? 2.5 : 2}
            />
            {unseenCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-bold-blue text-[10px] font-bold text-white">
                {unseenCount > 9 ? '9+' : unseenCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-bold-blue' : ''}`}>
            Home
          </span>
        </button>
      </nav>
    </div>
  );
}
