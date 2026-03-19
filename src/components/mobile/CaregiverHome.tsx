import React from 'react';
import Button from '../Button';
import ConnectionStatus from './ConnectionStatus';
import StatusSummaryCard from './StatusSummaryCard';
import type { AppSession, Pairing, StatusUpdate } from '../../types/app';
import { getNotificationStatus, requestLocalNotificationPermission, scheduleLocalReminder } from '../../services/notifications';

interface CaregiverHomeProps {
  session: AppSession | null;
  pairing: Pairing | null;
  latestStatus: StatusUpdate | null;
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
  latestStatus,
  isConnectedMode,
  showHeaderChrome,
  showReturnToMain,
  onJoinInviteCode,
  onLeavePairing,
  onSignOut,
  onReturnToMain,
}: CaregiverHomeProps) {
  const [code, setCode] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [notificationMessage, setNotificationMessage] = React.useState('');

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    const resultMessage = await onJoinInviteCode(code);
    setMessage(resultMessage);
  };

  const handleEnableReminders = async () => {
    const status = await getNotificationStatus();
    if (!status.localNotificationsAvailable) {
      setNotificationMessage('Local reminders are available once the app is running in a native Capacitor build.');
      return;
    }

    const granted = await requestLocalNotificationPermission();
    if (!granted) {
      setNotificationMessage('Notification permission was not granted.');
      return;
    }

    await scheduleLocalReminder();
    setNotificationMessage(
      status.pushConfigured
        ? 'Local reminder scheduled. Remote push will work after OneSignal credentials are added.'
        : 'Local reminder scheduled. Remote push is still disabled because VITE_ONESIGNAL_APP_ID is not set.',
    );
  };

  const handleLeavePairing = async () => {
    const resultMessage = await onLeavePairing();
    setMessage(resultMessage);
    setNotificationMessage('');
    setCode('');
  };

  return (
    <main className="min-h-screen bg-midnight-black px-4 py-6 text-white sm:px-6">
      {showHeaderChrome ? (
        <ConnectionStatus session={session} pairing={pairing} isConnectedMode={isConnectedMode} />
      ) : null}
      <div className={`mx-auto max-w-4xl space-y-6 ${showReturnToMain ? 'pb-24' : ''}`}>
        <section className={`rounded-[2rem] border border-dark-blue bg-dark-blue/25 p-6 ${showHeaderChrome ? 'pt-14' : 'pt-6'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-periwinkle">Caregiver mode</p>
              <h1 className="mt-3 text-4xl font-bold font-league-spartan">Latest patient update</h1>
              <p className="mt-3 max-w-2xl text-white/75">
                Pair to a patient with an invite code, keep the last update visible offline, and enable reminders in context.
              </p>
            </div>
            {showHeaderChrome ? (
              <button onClick={() => void onSignOut()} className="text-sm font-semibold text-periwinkle underline">
                Sign out
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-dark-blue bg-midnight-black/40 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Pair to patient</p>
              {pairing ? (
                <div className="mt-3 space-y-3">
                  <p className="text-3xl font-bold tracking-[0.25em] text-periwinkle">{pairing.code}</p>
                  <p className="text-sm text-white/70">You are paired and will receive the latest status here.</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => void handleEnableReminders()}>
                      Enable reminders
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => void handleLeavePairing()}>
                      Use different code
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleJoin} className="mt-3 space-y-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    placeholder="Invite code"
                    className="w-full rounded-2xl border-2 border-dark-blue bg-midnight-black/60 px-4 py-4 text-center text-2xl tracking-[0.35em] text-white outline-none transition-colors focus:border-periwinkle"
                  />
                  <Button type="submit" className="w-full">
                    Join patient
                  </Button>
                </form>
              )}

              {message ? <p className="mt-3 text-sm text-white/70">{message}</p> : null}
              {notificationMessage ? <p className="mt-3 text-sm text-white/70">{notificationMessage}</p> : null}
            </div>

            <StatusSummaryCard
              update={latestStatus}
              emptyMessage="Once the patient sends an update, it will appear here. Demo mode seeds local updates so you can validate the caregiver UI immediately."
            />
          </div>
        </section>
      </div>
      {showReturnToMain ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => void onReturnToMain()}
            className="pointer-events-auto rounded-full border border-dark-blue bg-midnight-black/95 px-5 py-3 text-sm font-semibold text-periwinkle shadow-lg shadow-black/30 backdrop-blur"
          >
            Main screen
          </button>
        </div>
      ) : null}
    </main>
  );
}
