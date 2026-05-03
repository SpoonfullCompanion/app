import AvatarIcon from '../AvatarIcon';

interface AppHeaderProps {
  onNavigate: (route: 'account') => void;
  activeRoute: string;
  avatarIconId?: string | null;
}

export default function AppHeader({ onNavigate, activeRoute, avatarIconId }: AppHeaderProps) {
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
          className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            activeRoute === 'account'
              ? 'border-bold-blue/60 bg-bold-blue/20 text-white'
              : 'border-white/15 bg-white/5 text-off-white/70 hover:border-white/30 hover:text-white'
          }`}
        >
          <AvatarIcon iconId={avatarIconId} size="sm" className="!h-6 !w-6" />
          <span>Account</span>
        </button>
      </div>
    </header>
  );
}
