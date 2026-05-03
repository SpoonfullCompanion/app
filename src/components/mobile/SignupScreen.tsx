import React from 'react';
import { appConfig } from '../../lib/appConfig';
import type { UserRole } from '../../types/app';
import { UserRound, HeartHandshake, ChevronLeft } from 'lucide-react';
import { checkDisplayNameAvailable } from '../../services/backend';

interface SignupScreenProps {
  onSignUpWithPassword: (email: string, password: string, role: UserRole, displayName: string) => Promise<string>;
  onBack: () => void;
  statusMessage?: string;
}

const inputClass =
  'w-full rounded-xl border border-periwinkle/30 bg-midnight-black/60 px-4 py-3.5 text-base text-off-white placeholder-off-white/30 outline-none transition-colors focus:border-bold-blue focus:ring-2 focus:ring-bold-blue/30';

const ctaClass =
  'flex w-full items-center justify-center rounded-full bg-bold-blue px-6 py-4 font-semibold text-white shadow-xl shadow-bold-blue/30 transition-all hover:bg-bold-blue/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';

export default function SignupScreen({
  onSignUpWithPassword,
  onBack,
  statusMessage = '',
}: SignupScreenProps) {
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [displayNameError, setDisplayNameError] = React.useState('');
  const [localStatusMessage, setLocalStatusMessage] = React.useState('');
  const [isError, setIsError] = React.useState(false);
  const [isBusy, setIsBusy] = React.useState(false);

  const handleDisplayNameBlur = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    const available = await checkDisplayNameAvailable(trimmed);
    setDisplayNameError(available ? '' : 'That display name is already taken.');
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRole) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setDisplayNameError('Display name is required.');
      return;
    }

    setIsBusy(true);
    setLocalStatusMessage('');
    setIsError(false);
    try {
      const message = await onSignUpWithPassword(email, password, selectedRole, trimmedName);
      const isSuccessMessage =
        message.toLowerCase().includes('signed up') ||
        message.toLowerCase().includes('reloading') ||
        message.toLowerCase().includes('created');
      setIsError(!isSuccessMessage);
      setLocalStatusMessage(message);
    } catch (error) {
      console.error('Sign up failed', error);
      setIsError(true);
      setLocalStatusMessage('Sign up failed. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleBack = () => {
    if (selectedRole) {
      setSelectedRole(null);
    } else {
      onBack();
    }
  };

  const displayMessage = statusMessage || localStatusMessage;

  if (!selectedRole) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] text-off-white">
        <div className="mx-auto max-w-xl px-6 py-10">

          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-periwinkle underline-offset-2 hover:text-white transition-colors mb-8"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to sign in
          </button>

          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-1">
            Get started
          </p>
          <h1 className="text-3xl font-bold font-league-spartan mb-2">Choose your role</h1>
          <p className="text-sm text-off-white/60 mb-8">
            Select how you'll use Spoonfull to continue.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setSelectedRole('patient')}
              className="group rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-6 text-left transition-all duration-200 hover:border-bold-blue hover:bg-bold-blue/10 active:scale-[0.98]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-periwinkle/30 bg-midnight-black/60 group-hover:border-bold-blue/60">
                <UserRound className="h-5 w-5 text-periwinkle group-hover:text-bold-blue" />
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-off-white/50 mb-2">Send your status</p>
              <h2 className="text-2xl font-bold font-league-spartan text-white mb-3">Patient</h2>
              <p className="text-sm text-off-white/65 leading-relaxed">
                Communicate your energy, symptoms, and needs to your helper in real time.
              </p>
            </button>

            <button
              onClick={() => setSelectedRole('caregiver')}
              className="group rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-6 text-left transition-all duration-200 hover:border-bold-blue hover:bg-bold-blue/10 active:scale-[0.98]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-periwinkle/30 bg-midnight-black/60 group-hover:border-bold-blue/60">
                <HeartHandshake className="h-5 w-5 text-periwinkle group-hover:text-bold-blue" />
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-off-white/50 mb-2">Find out what they need</p>
              <h2 className="text-2xl font-bold font-league-spartan text-white mb-3">Helper</h2>
              <p className="text-sm text-off-white/65 leading-relaxed">
                Pair with a patient and follow their latest status with notifications.
              </p>
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-off-white/40">
            Choose a role to continue setting up your account.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] text-off-white">
      <div className="mx-auto max-w-xl px-6 py-10">

        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-periwinkle underline-offset-2 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-1">
          {selectedRole === 'patient' ? 'Patient account' : 'Helper account'}
        </p>
        <h1 className="text-3xl font-bold font-league-spartan mb-2">Create your account</h1>
        <p className="text-sm text-off-white/60 mb-8">
          Set up your {selectedRole === 'patient' ? 'patient' : 'helper'} account to get started.
        </p>

        {displayMessage && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${
              isError
                ? 'border-red-500/50 bg-red-500/15 text-red-200'
                : 'border-periwinkle/30 bg-periwinkle/10 text-off-white/85'
            }`}
          >
            {displayMessage}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-off-white/80 mb-1.5" htmlFor="signup-display-name">
              Display name
            </label>
            <input
              id="signup-display-name"
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setDisplayNameError(''); }}
              onBlur={() => void handleDisplayNameBlur()}
              placeholder="How others will see you"
              autoCapitalize="words"
              autoCorrect="off"
              className={`${inputClass} ${displayNameError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : ''}`}
            />
            {displayNameError && (
              <p className="mt-1.5 text-xs text-red-400">{displayNameError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-off-white/80 mb-1.5" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoCapitalize="none"
              autoCorrect="off"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-off-white/80 mb-1.5" htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={!email || !password || !displayName.trim() || !!displayNameError || isBusy || !appConfig.hasSupabase}
            className={ctaClass}
          >
            {isBusy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  );
}
