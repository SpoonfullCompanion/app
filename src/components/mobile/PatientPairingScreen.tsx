import React from 'react';
import Button from '../Button';
import { copyToClipboard } from '../../utils/messageComposer';

interface PatientPairingScreenProps {
  inviteCode: string | null;
  isBusy: boolean;
  statusMessage?: string;
  onCreateInviteCode: () => Promise<void>;
  onContinue: () => void;
  onSignOut: () => Promise<void>;
}

export default function PatientPairingScreen({
  inviteCode,
  isBusy,
  statusMessage = '',
  onCreateInviteCode,
  onContinue,
  onSignOut,
}: PatientPairingScreenProps) {
  const [copyMessage, setCopyMessage] = React.useState('');

  const handleCopy = async () => {
    if (!inviteCode) {
      return;
    }

    const copied = await copyToClipboard(inviteCode);
    setCopyMessage(copied ? 'Invite code copied.' : 'Unable to copy invite code.');
  };

  return (
    <main className="min-h-screen bg-midnight-black px-4 py-8 text-off-white sm:px-6">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-dark-blue bg-dark-blue/25 p-6 shadow-xl shadow-black/20">
        <p className="text-xs uppercase tracking-[0.3em] text-periwinkle">Patient pairing</p>
        <h1 className="mt-3 text-4xl font-bold font-league-spartan">Create a caregiver invite code</h1>
        <p className="mt-4 text-base text-off-white/75">
          This is a one-time setup step for connected mode. After this, the app returns directly to the communication cards.
        </p>

        {inviteCode ? (
          <div className="mt-8 rounded-[1.5rem] border border-periwinkle/40 bg-midnight-black/40 p-6 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-off-white/60">Invite code</p>
            <p className="mt-3 text-5xl font-bold tracking-[0.3em] text-periwinkle">{inviteCode}</p>
            <p className="mt-4 text-sm text-off-white/70">
              Share this code with the caregiver. They will enter it in caregiver mode to pair.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button className="w-full" onClick={() => void handleCopy()}>
                Copy code
              </Button>
              <Button variant="outline" className="w-full" onClick={onContinue}>
                Continue to app
              </Button>
            </div>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => void onCreateInviteCode()}
              disabled={isBusy}
            >
              {isBusy ? 'Creating new code...' : 'Create new code'}
            </Button>
            {copyMessage ? <p className="mt-3 text-sm text-off-white/75">{copyMessage}</p> : null}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <Button className="w-full" onClick={() => void onCreateInviteCode()} disabled={isBusy}>
              {isBusy ? 'Creating invite code...' : 'Create invite code'}
            </Button>
            <Button variant="outline" className="w-full" onClick={onContinue}>
              Skip for now
            </Button>
          </div>
        )}

        {statusMessage ? <p className="mt-4 text-sm text-off-white/75">{statusMessage}</p> : null}

        <button onClick={() => void onSignOut()} className="mt-8 text-sm font-semibold text-periwinkle underline">
          Sign out
        </button>
      </div>
    </main>
  );
}
