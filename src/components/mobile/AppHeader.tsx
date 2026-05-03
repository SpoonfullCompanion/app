import { User } from 'lucide-react';

interface AppHeaderProps {
  onNavigate: (route: 'account') => void;
  activeRoute: string;
}

export default function AppHeader({ onNavigate, activeRoute }: AppHeaderProps) {
  return (
    <header
      className="w-full border-b border-white/5 bg-midnight-black"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <img
          src="/Spoonfull-Logo-DarkBG.svg"
          alt="Spoonfull"
          className="h-10 w-auto"
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
