import React from 'react';
import CaregiverBottomNavigation, { type CaregiverNavRoute } from './CaregiverBottomNavigation';
import CaregiverFeedScreen from './CaregiverFeedScreen';
import CaregiverConnectionsScreen from './CaregiverConnectionsScreen';
import CaregiverAccountScreen from './CaregiverAccountScreen';
import AppHeader from './AppHeader';
import type { AppSession, Pairing, StatusUpdate } from '../../types/app';
import { getFollowerConnections } from '../../services/backend';

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
  onUpdateDisplayName: (newName: string) => Promise<{ ok: boolean; message: string }>;
  onUpdateEmail: (newEmail: string) => Promise<{ ok: boolean; message: string }>;
  onUpdatePassword: (newPassword: string) => Promise<{ ok: boolean; message: string }>;
  onUpdateAvatarIcon: (iconId: string) => Promise<{ ok: boolean; message: string }>;
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
  onUpdateDisplayName,
  onUpdateEmail,
  onUpdatePassword,
  onUpdateAvatarIcon,
}: CaregiverHomeProps) {
  const [activeRoute, setActiveRoute] = React.useState<CaregiverNavRoute>('home');
  const [unseenCount, setUnseenCount] = React.useState(0);
  const [pendingConnectionCount, setPendingConnectionCount] = React.useState(0);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeRoute]);

  // Clear badges when navigating to respective tabs
  React.useEffect(() => {
    if (activeRoute === 'home') setUnseenCount(0);
    if (activeRoute === 'connections') setPendingConnectionCount(0);
  }, [activeRoute]);

  // Poll pending connection count for nav badge
  const refreshPendingCount = React.useCallback(() => {
    if (!session) return;
    getFollowerConnections(session).then((conns) => {
      const pending = conns.filter((c) => c.status === 'pending').length;
      setPendingConnectionCount(pending);
    }).catch(() => {});
  }, [session]);

  React.useEffect(() => {
    refreshPendingCount();
    const id = window.setInterval(refreshPendingCount, 15_000);
    return () => window.clearInterval(id);
  }, [refreshPendingCount]);

  if (!session) return null;

  return (
    <div className="bg-midnight-black">
      <AppHeader onNavigate={setActiveRoute} activeRoute={activeRoute} avatarIconId={session?.avatarIcon} />
      <div key={activeRoute} className="animate-fade-up">
        {activeRoute === 'home' && (
          <CaregiverFeedScreen
            session={session}
            legacyUpdates={recentUpdates}
            onNavigateToConnections={() => setActiveRoute('connections')}
          />
        )}
        {activeRoute === 'connections' && (
          <CaregiverConnectionsScreen
            session={session}
            onConnectionsChanged={refreshPendingCount}
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
            onUpdateDisplayName={onUpdateDisplayName}
            onUpdateEmail={onUpdateEmail}
            onUpdatePassword={onUpdatePassword}
            onUpdateAvatarIcon={onUpdateAvatarIcon}
          />
        )}
      </div>
      <CaregiverBottomNavigation
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
        unseenCount={activeRoute === 'home' ? 0 : unseenCount}
        pendingConnectionCount={activeRoute === 'connections' ? 0 : pendingConnectionCount}
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
