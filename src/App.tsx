import React from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import AuthScreen from './components/mobile/AuthScreen';
import CaregiverHome from './components/mobile/CaregiverHome';
import PatientHome from './components/mobile/PatientHome';
import PatientPairingScreen from './components/mobile/PatientPairingScreen';
import RoleSelectionScreen from './components/mobile/RoleSelectionScreen';
import { appConfig } from './lib/appConfig';
import { isNativeApp } from './lib/nativeAuth';
import { supabase } from './lib/supabaseClient';
import type { AppSession, Pairing, CommunicationSubmission, StatusUpdate, UserRole } from './types/app';
import {
  completeAuthFromUrl,
  continueInDemo,
  createInviteCode,
  getActivePairing,
  getLatestStatus,
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
} from './services/backend';

function App() {
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);
  const [session, setSession] = React.useState<AppSession | null>(null);
  const [pairing, setPairing] = React.useState<Pairing | null>(null);
  const [latestStatus, setLatestStatus] = React.useState<StatusUpdate | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authMessage, setAuthMessage] = React.useState('');
  const [pairingMessage, setPairingMessage] = React.useState('');
  const [didDismissPairingSetup, setDidDismissPairingSetup] = React.useState(false);
  const [isCreatingInviteCode, setIsCreatingInviteCode] = React.useState(false);
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
        setSelectedRole(restoredSession?.role ?? null);
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
        setSelectedRole(restoredSession.role);
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
      setSelectedRole(result.session.role);
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
      setLatestStatus(null);
      return;
    }

    const activePairing = getActivePairing(session);
    updatePairingState(activePairing);
    setDidDismissPairingSetup(Boolean(activePairing) || session.authMode === 'demo');

    void syncActivePairing(session)
      .then((syncedPairing) => {
        updatePairingState(syncedPairing);
        setDidDismissPairingSetup(Boolean(syncedPairing) || session.authMode === 'demo');
        return getLatestStatus(session, syncedPairing);
      })
      .then((update) => setLatestStatus(update))
      .catch((error) => console.error('Failed to load latest status', error));

    const unsubscribe = subscribeToStatusUpdates(session, pairing ?? activePairing, setLatestStatus);

    return () => {
      unsubscribe?.();
    };
  }, [session, pairing, pairingSubscriptionKey, updatePairingState]);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    if (session && session.role !== role) {
      void signOut();
      setSession(null);
      setPairing(null);
      setLatestStatus(null);
    }
  };

  const handleSendMagicLink = async (email: string) => {
    if (!selectedRole) {
      return 'Choose a role before signing in.';
    }

    const result = await sendMagicLink(email, selectedRole);
    return result.message;
  };

  const handleContinueDemo = async () => {
    if (!selectedRole) {
      return;
    }

    const nextSession = await continueInDemo(selectedRole);
    setSession(nextSession);
    setPairing(getActivePairing(nextSession));
    setLatestStatus(await getLatestStatus(nextSession, getActivePairing(nextSession)));
  };

  const finalizeConnectedAuth = (nextSession: AppSession) => {
    setSession(nextSession);
    setSelectedRole(nextSession.role);
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
    setSelectedRole(restoredSession.role);
    setAuthMessage('');
    return restoredSession;
  };

  const handleSignInWithPassword = async (email: string, password: string) => {
    if (!selectedRole) {
      return 'Choose a role before signing in.';
    }

    const result = await signInWithPassword(email, password, selectedRole);
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

  const handleSignUpWithPassword = async (email: string, password: string) => {
    if (!selectedRole) {
      return 'Choose a role before creating an account.';
    }

    const result = await signUpWithPassword(email, password, selectedRole);
    if (result.ok) {
      if (result.session) {
        finalizeConnectedAuth(result.session);
        return appConfig.enablePasswordAuth ? 'Account created. Reloading...' : result.message;
      }

      const restoredSession = await hydrateConnectedSession();
      if (!restoredSession) {
        return 'Account created. Use Sign in with password to continue.';
      }

      finalizeConnectedAuth(restoredSession);
      return appConfig.enablePasswordAuth ? 'Account created. Reloading...' : result.message;
    }
    return result.message;
  };

  const handleSignOut = async () => {
    await signOut();
    setSession(null);
    setPairing(null);
    setLatestStatus(null);
    setDidDismissPairingSetup(false);
    setAuthMessage('');
    setPairingMessage('');
  };

  const handleReturnToMain = async () => {
    await signOut();
    setSession(null);
    setSelectedRole(null);
    setPairing(null);
    setLatestStatus(null);
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
      const update = await getLatestStatus(session, result.pairing);
      setLatestStatus(update);
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
    setLatestStatus(null);
    return 'Ready for a new invite code.';
  };

  const handleSendUpdate = async (submission: CommunicationSubmission) => {
    if (!session) {
      return;
    }

    const syncedPairing = await syncActivePairing(session);
    updatePairingState(syncedPairing);
    const update = await sendStatusUpdate(session, syncedPairing, submission);
    setLatestStatus(update);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-midnight-black px-4 py-8 text-off-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-dark-blue bg-dark-blue/20 p-6">
          Loading Spoonfull mobile...
        </div>
      </main>
    );
  }

  if (!selectedRole) {
    return <RoleSelectionScreen mode={appConfig.mode} onSelectRole={handleSelectRole} />;
  }

  if (!session) {
    return (
      <AuthScreen
        role={selectedRole}
        onBack={() => setSelectedRole(null)}
        onSendMagicLink={handleSendMagicLink}
        onSignInWithPassword={handleSignInWithPassword}
        onSignUpWithPassword={handleSignUpWithPassword}
        onContinueDemo={handleContinueDemo}
        statusMessage={authMessage}
      />
    );
  }

  if (session.role === 'patient') {
    if (appConfig.mode === 'connected' && !didDismissPairingSetup) {
      return (
        <PatientPairingScreen
          inviteCode={pairing?.code ?? null}
          isBusy={isCreatingInviteCode}
          statusMessage={pairingMessage}
          onCreateInviteCode={handleCreateInviteCode}
          onContinue={() => setDidDismissPairingSetup(true)}
          onSignOut={handleSignOut}
        />
      );
    }

    return (
      <PatientHome
        session={session}
        pairing={pairing}
        isConnectedMode={appConfig.mode === 'connected'}
        showHeaderChrome={showPatientHeaderChrome}
        showReturnToMain={isDemoSession}
        onSendUpdate={handleSendUpdate}
        onSignOut={handleSignOut}
        onReturnToMain={handleReturnToMain}
        onOpenPairing={() => setDidDismissPairingSetup(false)}
      />
    );
  }

  return (
    <CaregiverHome
      session={session}
      pairing={pairing}
      latestStatus={latestStatus}
      isConnectedMode={appConfig.mode === 'connected'}
      showHeaderChrome={showDemoChrome}
      showReturnToMain={isDemoSession}
      onJoinInviteCode={handleJoinInviteCode}
      onLeavePairing={handleLeavePairing}
      onSignOut={handleSignOut}
      onReturnToMain={handleReturnToMain}
    />
  );
}

export default App;
