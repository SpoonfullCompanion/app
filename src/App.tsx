import React from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import LoginScreen from './components/mobile/LoginScreen';
import SignupScreen from './components/mobile/SignupScreen';
import DemoRoleScreen from './components/mobile/DemoRoleScreen';
import CaregiverHome from './components/mobile/CaregiverHome';
import PatientHome from './components/mobile/PatientHome';
import PatientPairingScreen from './components/mobile/PatientPairingScreen';
import { LoadingScreen } from './components/mobile/LoadingScreen';
import { appConfig } from './lib/appConfig';
import { isNativeApp } from './lib/nativeAuth';
import { supabase } from './lib/supabaseClient';
import type { AppSession, Pairing, CommunicationSubmission, StatusUpdate, UserRole } from './types/app';
import {
  completeAuthFromUrl,
  continueInDemo,
  createInviteCode,
  getActivePairing,
  getRecentUpdates,
  joinInviteCode,
  leavePairing,
  restoreSession,
  restoreSessionFromAuthUser,
  syncActivePairing,
  signInWithPassword,
  signUpWithPassword,
  sendMagicLink,
  sendStatusUpdate,
  signOut,
  subscribeToStatusUpdates,
  updateAvatarIcon,
  updateDisplayName,
  updateEmail,
  updatePassword,
} from './services/backend';

function App() {
  const [showSignup, setShowSignup] = React.useState(false);
  const [showDemoRoleSelection, setShowDemoRoleSelection] = React.useState(false);
  const [session, setSession] = React.useState<AppSession | null>(null);
  const [pairing, setPairing] = React.useState<Pairing | null>(null);
  const [recentUpdates, setRecentUpdates] = React.useState<StatusUpdate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authMessage, setAuthMessage] = React.useState('');
  const [pairingMessage, setPairingMessage] = React.useState('');
  const [didDismissPairingSetup, setDidDismissPairingSetup] = React.useState(false);
  const [isCreatingInviteCode, setIsCreatingInviteCode] = React.useState(false);
  const [showPairingScreen, setShowPairingScreen] = React.useState(false);
  const isDemoSession = session?.authMode === 'demo';
  const showDemoChrome = !isDemoSession;
  const showPatientHeaderChrome = appConfig.showPatientHeaderChrome && showDemoChrome;
  const pairingSubscriptionKey = pairing
    ? `${pairing.id}:${pairing.patientId}:${pairing.caregiverId ?? 'none'}:${pairing.status}`
    : 'none';

  const updatePairingState = React.useCallback((nextPairing: Pairing | null) => {
    setPairing((currentPairing) => {
      if (
        currentPairing?.id === nextPairing?.id
        && currentPairing?.patientId === nextPairing?.patientId
        && currentPairing?.caregiverId === nextPairing?.caregiverId
        && currentPairing?.status === nextPairing?.status
      ) {
        return currentPairing;
      }

      return nextPairing;
    });
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const restoredSession = await Promise.race([
          restoreSession(),
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), 4000);
          }),
        ]);

        if (!isMounted) {
          return;
        }

        setSession(restoredSession);
      } catch (error) {
        console.error('Initial session load failed', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!supabase) {
      return;
    }

    const { data } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession?.user) {
        return;
      }

      void restoreSessionFromAuthUser(authSession.user).then((restoredSession) => {
        setSession(restoredSession);
        setAuthMessage('');
      });
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (!isNativeApp() || !supabase) {
      return;
    }

    const processAuthUrl = async (url: string) => {
      const result = await completeAuthFromUrl(url);
      if (!result.ok) {
        setAuthMessage(result.message);
        return;
      }

      setSession(result.session);
      setAuthMessage('');
    };

    const listener = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      void processAuthUrl(url);
    });

    void CapacitorApp.getLaunchUrl().then((launch) => {
      if (launch?.url) {
        void processAuthUrl(launch.url);
      }
    });

    return () => {
      void listener.then((subscription) => subscription.remove());
    };
  }, []);

  React.useEffect(() => {
    if (!session) {
      setPairing(null);
      setRecentUpdates([]);
      return;
    }

    const activePairing = getActivePairing(session);
    updatePairingState(activePairing);
    setDidDismissPairingSetup(Boolean(activePairing) || session.authMode === 'demo');

    void syncActivePairing(session)
      .then((syncedPairing) => {
        updatePairingState(syncedPairing);
        if (!showPairingScreen) {
          setDidDismissPairingSetup(Boolean(syncedPairing) || session.authMode === 'demo');
        }
        return getRecentUpdates(session, syncedPairing);
      })
      .then((updates) => setRecentUpdates(updates))
      .catch((error) => console.error('Failed to load recent updates', error));

    const unsubscribe = subscribeToStatusUpdates(session, pairing ?? activePairing, setRecentUpdates);

    return () => {
      unsubscribe?.();
    };
  }, [session, pairing, pairingSubscriptionKey, showPairingScreen, updatePairingState]);

  const handleSendMagicLink = async (email: string) => {
    const result = await sendMagicLink(email);
    return result.message;
  };

  const handleContinueDemo = async (role: UserRole) => {
    const nextSession = await continueInDemo(role);
    setSession(nextSession);
    setShowDemoRoleSelection(false);
    setPairing(getActivePairing(nextSession));
    setRecentUpdates(await getRecentUpdates(nextSession, getActivePairing(nextSession)));
  };

  const handleContinueDemoFromLogin = () => {
    setShowDemoRoleSelection(true);
  };

  const finalizeConnectedAuth = (nextSession: AppSession) => {
    setSession(nextSession);
    setAuthMessage('');

    if (appConfig.enablePasswordAuth && typeof window !== 'undefined') {
      window.setTimeout(() => {
        window.location.reload();
      }, 50);
    }
  };

  const hydrateConnectedSession = async () => {
    const restoredSession = await restoreSession();

    if (!restoredSession) {
      return null;
    }

    setSession(restoredSession);
    setAuthMessage('');
    return restoredSession;
  };

  const handleSignInWithPassword = async (email: string, password: string) => {
    const result = await signInWithPassword(email, password);
    if (result.ok) {
      if (result.session) {
        finalizeConnectedAuth(result.session);
        return appConfig.enablePasswordAuth ? 'Signed in. Reloading...' : result.message;
      }

      const restoredSession = await hydrateConnectedSession();
      if (!restoredSession) {
        return 'Signed in, but the app could not restore the session. Refresh and try again.';
      }

      finalizeConnectedAuth(restoredSession);
      return appConfig.enablePasswordAuth ? 'Signed in. Reloading...' : result.message;
    }
    return result.message;
  };

  const handleSignUpWithPassword = async (email: string, password: string, role: UserRole, displayName: string, avatarIcon: string) => {
    const result = await signUpWithPassword(email, password, role, displayName, avatarIcon);
    if (result.ok) {
      if (result.session) {
        finalizeConnectedAuth(result.session);
        setShowSignup(false);
        return appConfig.enablePasswordAuth ? 'Account created. Reloading...' : result.message;
      }

      const restoredSession = await hydrateConnectedSession();
      if (!restoredSession) {
        return 'Account created. Use Sign in with password to continue.';
      }

      finalizeConnectedAuth(restoredSession);
      setShowSignup(false);
      return appConfig.enablePasswordAuth ? 'Account created. Reloading...' : result.message;
    }
    return result.message;
  };

  const handleUpdateDisplayName = async (newName: string) => {
    if (!session) return { ok: false, message: 'Not signed in.' };
    const result = await updateDisplayName(session, newName);
    if (result.ok && result.session) {
      setSession(result.session);
    }
    return result;
  };

  const handleUpdateAvatarIcon = async (iconId: string) => {
    if (!session) return { ok: false, message: 'Not signed in.' };
    const result = await updateAvatarIcon(session, iconId);
    if (result.ok && result.session) {
      setSession(result.session);
    }
    return result;
  };

  const handleUpdateEmail = async (newEmail: string) => {
    if (!session) return { ok: false, message: 'Not signed in.' };
    const result = await updateEmail(session, newEmail);
    if (result.ok && result.session) {
      setSession(result.session);
    }
    return result;
  };

  const handleUpdatePassword = async (newPassword: string) => {
    return updatePassword(newPassword);
  };

  const handleSignOut = async () => {
    await signOut();
    setSession(null);
    setPairing(null);
    setRecentUpdates([]);
    setDidDismissPairingSetup(false);
    setAuthMessage('');
    setPairingMessage('');
  };

  const handleReturnToMain = async () => {
    await signOut();
    setSession(null);
    setShowSignup(false);
    setShowDemoRoleSelection(false);
    setPairing(null);
    setRecentUpdates([]);
    setDidDismissPairingSetup(false);
    setAuthMessage('');
    setPairingMessage('');
  };

  const handleCreateInviteCode = async () => {
    if (!session) {
      return;
    }

    setIsCreatingInviteCode(true);
    const result = await createInviteCode(session);
    if (result.ok && result.pairing) {
      updatePairingState(result.pairing);
      setPairingMessage('');
    } else {
      setPairingMessage(result.message ?? 'Failed to create invite code.');
    }
    setIsCreatingInviteCode(false);
  };

  const handleJoinInviteCode = async (code: string) => {
    if (!session) {
      return 'Sign in first.';
    }

    const result = await joinInviteCode(session, code);
    if (result.ok && result.pairing) {
      updatePairingState(result.pairing);
      const updates = await getRecentUpdates(session, result.pairing);
      setRecentUpdates(updates);
    }

    return result.message ?? 'Pairing updated.';
  };

  const handleLeavePairing = async () => {
    if (!session) {
      return 'Sign in first.';
    }

    const result = await leavePairing(session, pairing);
    if (!result.ok) {
      return result.message ?? 'Unable to leave pairing.';
    }

    updatePairingState(null);
    setRecentUpdates([]);
    return 'Ready for a new invite code.';
  };

  const handleSendUpdate = async (submission: CommunicationSubmission) => {
    if (!session) {
      return;
    }

    const syncedPairing = await syncActivePairing(session);
    updatePairingState(syncedPairing);
    await sendStatusUpdate(session, syncedPairing, submission);
    setRecentUpdates(await getRecentUpdates(session, syncedPairing));
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    if (showDemoRoleSelection) {
      return (
        <DemoRoleScreen
          onSelectRole={handleContinueDemo}
          onBack={() => setShowDemoRoleSelection(false)}
        />
      );
    }

    if (showSignup) {
      return (
        <SignupScreen
          onSignUpWithPassword={handleSignUpWithPassword}
          onBack={() => setShowSignup(false)}
          statusMessage={authMessage}
        />
      );
    }

    return (
      <LoginScreen
        mode={appConfig.mode}
        onSignInWithPassword={handleSignInWithPassword}
        onSendMagicLink={handleSendMagicLink}
        onContinueDemo={handleContinueDemoFromLogin}
        onShowSignup={() => setShowSignup(true)}
        statusMessage={authMessage}
      />
    );
  }

  if (session.role === 'patient') {
    if (appConfig.mode === 'connected' && (!didDismissPairingSetup || showPairingScreen)) {
      return (
        <PatientPairingScreen
          inviteCode={pairing?.code ?? null}
          isBusy={isCreatingInviteCode}
          statusMessage={pairingMessage}
          onCreateInviteCode={handleCreateInviteCode}
          onJoinInviteCode={handleJoinInviteCode}
          onContinue={() => { setDidDismissPairingSetup(true); setShowPairingScreen(false); }}
          onSignOut={handleSignOut}
        />
      );
    }

    return (
      <PatientHome
        session={session}
        pairing={pairing}
        recentUpdates={recentUpdates}
        isConnectedMode={appConfig.mode === 'connected'}
        showHeaderChrome={showPatientHeaderChrome}
        showReturnToMain={isDemoSession}
        onSendUpdate={handleSendUpdate}
        onSignOut={handleSignOut}
        onReturnToMain={handleReturnToMain}
        onOpenPairing={() => setShowPairingScreen(true)}
        onUpdateDisplayName={handleUpdateDisplayName}
        onUpdateEmail={handleUpdateEmail}
        onUpdatePassword={handleUpdatePassword}
        onUpdateAvatarIcon={handleUpdateAvatarIcon}
      />
    );
  }

  return (
    <CaregiverHome
      session={session}
      pairing={pairing}
      recentUpdates={recentUpdates}
      isConnectedMode={appConfig.mode === 'connected'}
      showHeaderChrome={showDemoChrome}
      showReturnToMain={isDemoSession}
      onJoinInviteCode={handleJoinInviteCode}
      onLeavePairing={handleLeavePairing}
      onSignOut={handleSignOut}
      onReturnToMain={handleReturnToMain}
      onUpdateDisplayName={handleUpdateDisplayName}
      onUpdateEmail={handleUpdateEmail}
      onUpdatePassword={handleUpdatePassword}
      onUpdateAvatarIcon={handleUpdateAvatarIcon}
    />
  );
}

export default App;
