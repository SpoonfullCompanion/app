import { Home, Activity, MessageSquare, Stethoscope, User } from 'lucide-react';

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
  { id: 'account' as const, label: 'Account', icon: User },
];

export default function BottomNavigation({ activeRoute, onNavigate }: BottomNavigationProps) {
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
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? 'text-electric-blue'
                  : 'text-periwinkle/60 hover:text-periwinkle'
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
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
