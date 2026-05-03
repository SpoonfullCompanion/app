import { useState } from 'react';
import { Home, Activity, MessageSquare, Stethoscope } from 'lucide-react';

export type NavRoute = 'home' | 'status' | 'needs' | 'hospital' | 'account';

interface BottomNavigationProps {
  activeRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
}

const navItems = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'status' as const, label: 'Status', icon: Activity },
  { id: 'needs' as const, label: 'Needs', icon: MessageSquare },
  { id: 'hospital' as const, label: 'Hospital', icon: Stethoscope },
];

export default function BottomNavigation({ activeRoute, onNavigate }: BottomNavigationProps) {
  const [justTapped, setJustTapped] = useState<NavRoute | null>(null);

  const handleTap = (id: NavRoute) => {
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
          return (
            <button
              key={id}
              onClick={() => handleTap(id)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-bold-blue/20 text-bold-blue'
                  : 'text-off-white/50 hover:text-off-white/80'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isBouncing ? 'animate-nav-bounce' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
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
