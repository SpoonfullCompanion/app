import { User } from 'lucide-react';
import type { NavRoute } from './BottomNavigation';

interface AppHeaderProps {
  onNavigate: (route: NavRoute) => void;
  activeRoute: NavRoute;
}

export default function AppHeader({ onNavigate, activeRoute }: AppHeaderProps) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-midnight-black/90 backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <img
          src="/Spoonfull-Logo-DarkBG.svg"
          alt="Spoonfull"
          className="h-7 w-auto"
        />
        <button
          onClick={() => onNavigate('account')}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeRoute === 'account'
              ? 'border-bold-blue/60 bg-bold-blue/20 text-white'
              : 'border-white/15 bg-white/5 text-off-white/70 hover:border-white/30 hover:text-white'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          Account
        </button>
      </div>
    </header>
  );
}
