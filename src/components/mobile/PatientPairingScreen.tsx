import React from 'react';
import { Copy, Check, Link2, LogIn } from 'lucide-react';
import { copyToClipboard } from '../../utils/messageComposer';

interface PatientPairingScreenProps {
  inviteCode: string | null;
  isBusy: boolean;
  statusMessage?: string;
  onCreateInviteCode: () => Promise<void>;
  onJoinInviteCode: (code: string) => Promise<string>;
  onContinue: () => void;
  onSignOut: () => Promise<void>;
}

export default function PatientPairingScreen({
  inviteCode,
  isBusy,
  statusMessage = '',
  onCreateInviteCode,
  onJoinInviteCode,
  onContinue,
  onSignOut,
}: PatientPairingScreenProps) {
  const [copied, setCopied] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState('');
  const [isJoining, setIsJoining] = React.useState(false);
  const [joinMessage, setJoinMessage] = React.useState('');

  const handleCopy = async () => {
    if (!inviteCode) return;
    const ok = await copyToClipboard(inviteCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    const trimmed = joinCode.trim();
    if (!trimmed) return;
    setIsJoining(true);
    setJoinMessage('');
    const msg = await onJoinInviteCode(trimmed);
    setJoinMessage(msg);
    setIsJoining(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-32">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-2">Pairing</p>
          <h1 className="text-3xl font-bold text-white">Connect with a helper</h1>
          <p className="mt-2 text-sm text-off-white/70">
            Pair your account with a helper so they can see your updates.
          </p>
        </div>

        {/* Generate invite code section */}
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-off-white/80">
          Your invite code
        </h2>

        {inviteCode ? (
          <div className="mb-8 rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-5">
            <p className="mb-1 text-xs text-off-white/50">Share this with your helper</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-4xl font-bold tracking-[0.3em] text-periwinkle">{inviteCode}</span>
              <button
                onClick={() => void handleCopy()}
                className="flex items-center gap-2 rounded-full border border-periwinkle/30 bg-midnight-black/80 px-4 py-2 text-sm font-medium text-off-white/80 transition-all hover:border-periwinkle/60 hover:text-white"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-3 text-xs text-off-white/50">
              They enter this code in helper mode to pair with you.
            </p>
            <button
              onClick={() => void onCreateInviteCode()}
              disabled={isBusy}
              className="mt-4 text-sm font-medium text-periwinkle underline underline-offset-2 disabled:opacity-50"
            >
              {isBusy ? 'Creating new code...' : 'Generate a new code'}
            </button>
          </div>
        ) : (
          <div className="mb-8 rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-5">
            <p className="text-sm text-off-white/70">
              Create a one-time code to share with your helper. They enter it to connect.
            </p>
            <button
              onClick={() => void onCreateInviteCode()}
              disabled={isBusy}
              className="mt-4 flex items-center gap-2 rounded-full bg-bold-blue px-6 py-3 font-semibold text-white shadow-lg shadow-bold-blue/30 transition-all hover:bg-bold-blue/90 disabled:opacity-50"
            >
              <Link2 className="h-4 w-4" />
              {isBusy ? 'Creating...' : 'Create invite code'}
            </button>
          </div>
        )}

        {statusMessage ? (
          <p className="mb-6 text-sm text-off-white/75">{statusMessage}</p>
        ) : null}

        {/* Enter helper's code section */}
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-off-white/80">
          Enter a helper's code
        </h2>
        <div className="mb-8 rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-5">
          <p className="mb-4 text-sm text-off-white/70">
            If your helper already generated a code, enter it here instead.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleJoin(); }}
              placeholder="A3F2K9"
              maxLength={6}
              className="flex-1 rounded-xl border border-periwinkle/30 bg-midnight-black/60 px-4 py-3 text-center text-xl font-bold tracking-[0.3em] text-off-white placeholder:text-off-white/25 focus:border-periwinkle/60 focus:outline-none"
            />
            <button
              onClick={() => void handleJoin()}
              disabled={isJoining || joinCode.trim().length === 0}
              className="flex items-center gap-2 rounded-full bg-bold-blue px-5 py-3 font-semibold text-white shadow-lg shadow-bold-blue/30 transition-all hover:bg-bold-blue/90 disabled:opacity-40"
            >
              <LogIn className="h-4 w-4" />
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </div>
          {joinMessage ? (
            <p className="mt-3 text-sm text-off-white/75">{joinMessage}</p>
          ) : null}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-6">
          <button
            onClick={onContinue}
            className="text-sm font-medium text-off-white/60 underline underline-offset-2 hover:text-off-white/90"
          >
            Skip for now
          </button>
          <button
            onClick={() => void onSignOut()}
            className="text-sm font-medium text-periwinkle underline underline-offset-2"
          >
            Sign out
          </button>
        </div>

      </div>
    </div>
  );
}
