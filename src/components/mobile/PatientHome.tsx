import { useState } from 'react';
import BottomNavigation, { type NavRoute } from './BottomNavigation';
import HomeScreen from './HomeScreen';
import StatusScreen from './StatusScreen';
import NeedsScreen from './NeedsScreen';
import HospitalScreen from './HospitalScreen';
import AccountScreen from './AccountScreen';
import type { AppSession, Pairing, CommunicationSubmission, StatusUpdate } from '../../types/app';

interface PatientHomeProps {
  session: AppSession | null;
  pairing: Pairing | null;
  recentUpdates: StatusUpdate[];
  isConnectedMode: boolean;
  showHeaderChrome: boolean;
  showReturnToMain: boolean;
  onSendUpdate: (submission: CommunicationSubmission) => Promise<void>;
  onSignOut: () => Promise<void>;
  onReturnToMain: () => Promise<void>;
  onOpenPairing: () => void;
}

export default function PatientHome({
  session,
  pairing,
  recentUpdates,
  isConnectedMode,
  showHeaderChrome,
  showReturnToMain,
  onSendUpdate,
  onSignOut,
  onReturnToMain,
  onOpenPairing,
}: PatientHomeProps) {
  const [activeRoute, setActiveRoute] = useState<NavRoute>('home');
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const handleNavigate = (route: NavRoute) => {
    setActiveRoute(route);
  };

  const handleToggleTTS = () => {
    setTtsEnabled(!ttsEnabled);
  };

  return (
    <div className="bg-midnight-black">
      {activeRoute === 'home' && (
        <HomeScreen
          recentUpdates={recentUpdates}
          onNavigate={handleNavigate}
        />
      )}
      {activeRoute === 'status' && (
        <StatusScreen
          ttsEnabled={ttsEnabled}
          onToggleTTS={handleToggleTTS}
          onSendUpdate={onSendUpdate}
        />
      )}
      {activeRoute === 'needs' && (
        <NeedsScreen
          ttsEnabled={ttsEnabled}
          onToggleTTS={handleToggleTTS}
          onSendUpdate={onSendUpdate}
          profileId={session?.profileId || ''}
        />
      )}
      {activeRoute === 'hospital' && (
        <HospitalScreen
          ttsEnabled={ttsEnabled}
          onToggleTTS={handleToggleTTS}
        />
      )}
      {activeRoute === 'account' && (
        <AccountScreen
          session={session}
          onSignOut={onSignOut}
          onOpenPairing={onOpenPairing}
        />
      )}
      <BottomNavigation activeRoute={activeRoute} onNavigate={handleNavigate} />
    </div>
  );
}
