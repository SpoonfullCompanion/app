import { useState, useEffect } from 'react';
import BottomNavigation, { type NavRoute } from './BottomNavigation';
import AppHeader from './AppHeader';
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
  onUpdateDisplayName: (newName: string) => Promise<{ ok: boolean; message: string }>;
  onUpdateEmail: (newEmail: string) => Promise<{ ok: boolean; message: string }>;
  onUpdatePassword: (newPassword: string) => Promise<{ ok: boolean; message: string }>;
  onUpdateAvatarIcon: (iconId: string) => Promise<{ ok: boolean; message: string }>;
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
  onUpdateDisplayName,
  onUpdateEmail,
  onUpdatePassword,
  onUpdateAvatarIcon,
}: PatientHomeProps) {
  const [activeRoute, setActiveRoute] = useState<NavRoute>('home');
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const handleNavigate = (route: NavRoute) => {
    setActiveRoute(route);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeRoute]);

  const handleToggleTTS = () => {
    setTtsEnabled(!ttsEnabled);
  };

  return (
    <div className="bg-midnight-black">
      <AppHeader onNavigate={handleNavigate} activeRoute={activeRoute} avatarIconId={session?.avatarIcon} />
      <div key={activeRoute} className="animate-fade-up">
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
            onNavigate={handleNavigate}
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
            onUpdateDisplayName={onUpdateDisplayName}
            onUpdateEmail={onUpdateEmail}
            onUpdatePassword={onUpdatePassword}
            onUpdateAvatarIcon={onUpdateAvatarIcon}
          />
        )}
      </div>
      <BottomNavigation activeRoute={activeRoute} onNavigate={handleNavigate} />
    </div>
  );
}
