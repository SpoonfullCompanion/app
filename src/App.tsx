import React from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import LoginScreen from './components/mobile/LoginScreen';
import SignupScreen from './components/mobile/SignupScreen';
import DemoRoleScreen from './components/mobile/DemoRoleScreen';
import CaregiverHome from './components/mobile/CaregiverHome';
import PatientHome from './components/mobile/PatientHome';
import { LoadingScreen } from './components/mobile/LoadingScreen';
import { appConfig } from './lib/appConfig';
import { isNativeApp } from './lib/nativeAuth';
import { supabase } from './lib/supabaseClient';
import type { AppSession, CommunicationSubmission, StatusUpdate, UserRole } from './types/app';
import {
  completeAuthFromUrl,
  continueInDemo,
  getRecentUpdates,
  restoreSession,
  restoreSessionFromAuthUser,
  signInWithPassword,
  signUpWithPassword,
  sendMagicLink,
  sendStatusUpdate,
  savePushPreference,
  deleteAccount,
  signOut,
  subscribeToStatusUpdates,
  updateAvatarIcon,
  updateDisplayName,
  updateEmail,
  updatePassword,
} from './services/backend';
import { initPush, logoutPush, reconcilePush, setupNotificationClickHandler } from './services/push';
import NotificationOnboardingScreen, { hasSeenNotificationOnboarding } from './components/mobile/NotificationOnboardingScreen';

function App() {
  const [showSignup, setShowSignup] = React.useState(false);
  const [showDemoRoleSelection, setShowDemoRoleSelection] = React.useState(false);
  const [session, setSession] = React.useState<AppSession | null>(null);
  const sessionRef = React.useRef(session);
  const [recentUpdates, setRecentUpdates] = React.useState<StatusUpdate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authMessage, setAuthMessage] = React.useState('');
  const [pendingUpdateId, setPendingUpdateId] = React.useState<string | null>(null);
  const [showNotifOnboarding, setShowNotifOnboarding] = React.useState(false);
  const isDemoSession = session?.authMode === 'demo';
  const showDemoChrome = !isDemoSession;


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
    sessionRef.current = session;
  }, [session]);

  React.useEffect(() => {
    void initPush();
  }, []);

  // Deep-link from push notification tap → scroll to the specific need card
  React.useEffect(() => {
    void setupNotificationClickHandler((data) => {
      if (data.updateId) setPendingUpdateId(data.updateId);
    });
  }, []);

  // Re-reconcile push when the app returns to foreground (e.g. user just
  // enabled notifications in iOS Settings and switched back).
  React.useEffect(() => {
    if (!isNativeApp()) return;
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      const s = sessionRef.current;
      if (!isActive || !s || s.authMode === 'demo') return;
      void reconcilePush(s.profileId)
        .then((enabled) => savePushPreference(s.profileId, enabled))
        .catch((err) => console.error('Push reconcile on resume failed', err));
    });
    return () => { void listener.then((l) => l.remove()); };
  }, []);

  React.useEffect(() => {
    if (!session) {
      setRecentUpdates([]);
      return;
    }

    if (session.authMode !== 'demo') {
      void reconcilePush(session.profileId)
        .then((enabled) => savePushPreference(session.profileId, enabled))
        .catch((error) => console.error('Push reconcile failed', error));
    }

    // Show notification onboarding for first-time caregivers on native
    if (
      isNativeApp() &&
      session.role === 'caregiver' &&
      session.authMode !== 'demo' &&
      !hasSeenNotificationOnboarding()
    ) {
      setShowNotifOnboarding(true);
    }

    void getRecentUpdates(session)
      .then((updates) => setRecentUpdates(updates))
      .catch((error) => console.error('Failed to load recent updates', error));

    const unsubscribe = subscribeToStatusUpdates(session, setRecentUpdates);

    return () => {
      unsubscribe?.();
    };
  }, [session]);

  const handleSendMagicLink = async (email: string) => {
    const result = await sendMagicLink(email);
    return result.message;
  };

  const handleContinueDemo = async (role: UserRole) => {
    const nextSession = await continueInDemo(role);
    setSession(nextSession);
    setRecentUpdates(await getRecentUpdates(nextSession));
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
    void logoutPush();
    setSession(null);
    setRecentUpdates([]);
    setAuthMessage('');
  };

  const handleDeleteAccount = async () => {
    if (!session) return;
    await deleteAccount(session);
    void logoutPush();
    setSession(null);
    setRecentUpdates([]);
    setAuthMessage('');
  };

  const handleReturnToMain = async () => {
    await signOut();
    void logoutPush();
    setSession(null);
    setShowSignup(false);
    setShowDemoRoleSelection(false);
    setRecentUpdates([]);
    setAuthMessage('');
  };

  const handleSendUpdate = async (submission: CommunicationSubmission) => {
    if (!session) {
      return;
    }

    const update = await sendStatusUpdate(session, submission);
    setRecentUpdates((prev) => {
      const next = prev.filter((u) => u.id !== update.id);
      next.unshift(update);
      return next;
    });
    setRecentUpdates(await getRecentUpdates(session));
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
    return (
      <PatientHome
        session={session}
        recentUpdates={recentUpdates}
        onSendUpdate={handleSendUpdate}
        onSignOut={handleSignOut}
        onDeleteAccount={handleDeleteAccount}
        onUpdateDisplayName={handleUpdateDisplayName}
        onUpdateEmail={handleUpdateEmail}
        onUpdatePassword={handleUpdatePassword}
        onUpdateAvatarIcon={handleUpdateAvatarIcon}
      />
    );
  }

  if (showNotifOnboarding && session?.role === 'caregiver') {
    return (
      <NotificationOnboardingScreen
        profileId={session.profileId}
        onDone={() => setShowNotifOnboarding(false)}
      />
    );
  }

  return (
    <CaregiverHome
      session={session}
      recentUpdates={recentUpdates}
      showHeaderChrome={showDemoChrome}
      showReturnToMain={isDemoSession}
      pendingUpdateId={pendingUpdateId}
      onPendingUpdateConsumed={() => setPendingUpdateId(null)}
      onSignOut={handleSignOut}
      onReturnToMain={handleReturnToMain}
      onDeleteAccount={handleDeleteAccount}
      onUpdateDisplayName={handleUpdateDisplayName}
      onUpdateEmail={handleUpdateEmail}
      onUpdatePassword={handleUpdatePassword}
      onUpdateAvatarIcon={handleUpdateAvatarIcon}
    />
  );
}

export default App;
