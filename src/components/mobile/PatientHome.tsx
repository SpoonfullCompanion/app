import React, { useState, useEffect } from 'react';
import BottomNavigation, { type NavRoute } from './BottomNavigation';
import AppHeader from './AppHeader';
import HomeScreen from './HomeScreen';
import StatusScreen from './StatusScreen';
import NeedsScreen from './NeedsScreen';
import HospitalScreen from './HospitalScreen';
import AccountScreen from './AccountScreen';
import ConnectionsScreen from './ConnectionsScreen';
import PatientArchiveScreen from './PatientArchiveScreen';
import FriendsStatusScreen from './FriendsStatusScreen';
import type { AppSession, CommunicationSubmission, StatusUpdate } from '../../types/app';
import { getPatientConnections } from '../../services/backend';

interface PatientHomeProps {
  session: AppSession | null;
  recentUpdates: StatusUpdate[];
  onSendUpdate: (submission: CommunicationSubmission) => Promise<void>;
  onSignOut: () => Promise<void>;
  onUpdateDisplayName: (newName: string) => Promise<{ ok: boolean; message: string }>;
  onUpdateEmail: (newEmail: string) => Promise<{ ok: boolean; message: string }>;
  onUpdatePassword: (newPassword: string) => Promise<{ ok: boolean; message: string }>;
  onUpdateAvatarIcon: (iconId: string) => Promise<{ ok: boolean; message: string }>;
}

export default function PatientHome({
  session,
  recentUpdates,
  onSendUpdate,
  onSignOut,
  onUpdateDisplayName,
  onUpdateEmail,
  onUpdatePassword,
  onUpdateAvatarIcon,
}: PatientHomeProps) {
  const [activeRoute, setActiveRoute] = useState<NavRoute>('home');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [pendingConnectionCount, setPendingConnectionCount] = useState(0);

  // Poll for pending connection requests to show badge
  useEffect(() => {
    if (!session || session.authMode === 'demo') return;
    const refresh = () => {
      getPatientConnections(session).then((conns) => {
        setPendingConnectionCount(conns.filter((c) => c.status === 'pending').length);
      }).catch(() => {});
    };
    refresh();
    const id = window.setInterval(refresh, 15_000);
    return () => window.clearInterval(id);
  }, [session]);

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
            session={session}
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
            session={session}
            onNavigate={handleNavigate}
            onSent={() => handleNavigate('home')}
          />
        )}
        {activeRoute === 'hospital' && (
          <HospitalScreen
            ttsEnabled={ttsEnabled}
            onToggleTTS={handleToggleTTS}
          />
        )}
        {activeRoute === 'connections' && session && (
          <ConnectionsScreen session={session} />
        )}
        {activeRoute === 'archive' && session && (
          <PatientArchiveScreen session={session} onBack={() => handleNavigate('home')} />
        )}
        {activeRoute === 'friends-status' && session && (
          <FriendsStatusScreen session={session} onBack={() => handleNavigate('home')} />
        )}
        {activeRoute === 'account' && (
          <AccountScreen
            session={session}
            onNavigate={handleNavigate}
            onSignOut={onSignOut}
            onUpdateDisplayName={onUpdateDisplayName}
            onUpdateEmail={onUpdateEmail}
            onUpdatePassword={onUpdatePassword}
            onUpdateAvatarIcon={onUpdateAvatarIcon}
          />
        )}
      </div>
      <BottomNavigation
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        pendingConnectionCount={pendingConnectionCount}
      />
    </div>
  );
}
