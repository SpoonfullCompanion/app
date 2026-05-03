import React from 'react';
import CaregiverBottomNavigation, { type CaregiverNavRoute } from './CaregiverBottomNavigation';
import CaregiverFeedScreen from './CaregiverFeedScreen';
import CaregiverAccountScreen from './CaregiverAccountScreen';
import AppHeader from './AppHeader';
import type { AppSession, Pairing, StatusUpdate } from '../../types/app';

interface CaregiverHomeProps {
  session: AppSession | null;
  pairing: Pairing | null;
  recentUpdates: StatusUpdate[];
  isConnectedMode: boolean;
  showHeaderChrome: boolean;
  showReturnToMain: boolean;
  onJoinInviteCode: (code: string) => Promise<string>;
  onLeavePairing: () => Promise<string>;
  onSignOut: () => Promise<void>;
  onReturnToMain: () => Promise<void>;
}

export default function CaregiverHome({
  session,
  pairing,
  recentUpdates,
  showHeaderChrome,
  showReturnToMain,
  onJoinInviteCode,
  onLeavePairing,
  onSignOut,
  onReturnToMain,
}: CaregiverHomeProps) {
  const [activeRoute, setActiveRoute] = React.useState<CaregiverNavRoute>('home');

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeRoute]);

  if (!session) return null;

  return (
    <div className="bg-midnight-black">
      <AppHeader onNavigate={setActiveRoute} activeRoute={activeRoute} />
      {activeRoute === 'home' && (
        <CaregiverFeedScreen
          session={session}
          updates={recentUpdates}
        />
      )}
      {activeRoute === 'account' && (
        <CaregiverAccountScreen
          session={session}
          pairing={pairing}
          showHeaderChrome={showHeaderChrome}
          onJoinInviteCode={onJoinInviteCode}
          onLeavePairing={onLeavePairing}
          onSignOut={onSignOut}
        />
      )}
      <CaregiverBottomNavigation
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
      />

      {showReturnToMain && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-16 z-30 flex justify-center px-4"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => void onReturnToMain()}
            className="pointer-events-auto rounded-full border border-dark-blue bg-midnight-black/95 px-5 py-3 text-sm font-semibold text-periwinkle shadow-lg shadow-black/30 backdrop-blur"
          >
            Main screen
          </button>
        </div>
      )}
    </div>
  );
}
