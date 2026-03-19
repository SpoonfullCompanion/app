import React from 'react';
import Button from '../Button';
import { appConfig } from '../../lib/appConfig';
import type { UserRole } from '../../types/app';

interface SignupScreenProps {
  onSignUpWithPassword: (email: string, password: string, role: UserRole) => Promise<string>;
  onBack: () => void;
  statusMessage?: string;
}

export default function SignupScreen({
  onSignUpWithPassword,
  onBack,
  statusMessage = '',
}: SignupScreenProps) {
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [localStatusMessage, setLocalStatusMessage] = React.useState('');
  const [isBusy, setIsBusy] = React.useState(false);

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRole) {
      return;
    }

    setIsBusy(true);
    setLocalStatusMessage('');

    try {
      const message = await onSignUpWithPassword(email, password, selectedRole);
      setLocalStatusMessage(message);
    } catch (error) {
      console.error('Sign up failed', error);
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

  if (!selectedRole) {
    return (
      <main className="min-h-screen bg-midnight-black px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-between rounded-[2rem] border border-dark-blue/80 bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.18),_rgba(29,29,29,0.92)_55%)] p-6 shadow-2xl shadow-black/30">
          <div>
            <button onClick={onBack} className="text-sm font-semibold text-periwinkle underline">
              Back to Login
            </button>
            <p className="mt-8 text-xs uppercase tracking-[0.3em] text-periwinkle">Create account</p>
            <h1 className="mt-4 text-4xl font-bold font-league-spartan leading-none">Choose your role</h1>
            <p className="mt-4 max-w-xl text-base text-white/80">
              Select how you'll use Spoonfull.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setSelectedRole('patient')}
              className="rounded-[1.75rem] border border-dark-blue bg-dark-blue/40 p-6 text-left transition-transform duration-200 hover:-translate-y-1 hover:border-periwinkle"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-periwinkle/90">Send your status</p>
              <h2 className="mt-3 text-3xl font-bold font-league-spartan">Patient</h2>
              <p className="mt-4 text-base text-white/75">
                Use the Spoonfull communication cards with persistent state, pairing, and mobile-friendly controls.
              </p>
            </button>

            <button
              onClick={() => setSelectedRole('caregiver')}
              className="rounded-[1.75rem] border border-dark-blue bg-dark-blue/40 p-6 text-left transition-transform duration-200 hover:-translate-y-1 hover:border-periwinkle"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-periwinkle/90">Find out what they need</p>
              <h2 className="mt-3 text-3xl font-bold font-league-spartan">Helper</h2>
              <p className="mt-4 text-base text-white/75">
                Pair to a patient, follow the latest status, and enable reminders once notifications are configured.
              </p>
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-white/60">Choose a role to continue.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-midnight-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-dark-blue bg-dark-blue/25 p-6 shadow-xl shadow-black/20">
        <button onClick={handleBack} className="text-sm font-semibold text-periwinkle underline">
          Back
        </button>

        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-periwinkle">
          {selectedRole === 'patient' ? 'Patient' : 'Helper'}
        </p>
        <h1 className="mt-3 text-4xl font-bold font-league-spartan">Create your account</h1>
        <p className="mt-4 text-base text-white/75">
          Set up your {selectedRole === 'patient' ? 'patient' : 'helper'} account to get started.
        </p>

        <form onSubmit={handleSignUp} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold text-white/90" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-2xl border-2 border-dark-blue bg-midnight-black/60 px-4 py-4 text-lg text-white outline-none transition-colors focus:border-periwinkle"
          />

          <label className="block text-sm font-semibold text-white/90" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-2xl border-2 border-dark-blue bg-midnight-black/60 px-4 py-4 text-lg text-white outline-none transition-colors focus:border-periwinkle"
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!email || !password || isBusy || !appConfig.hasSupabase}
          >
            Create account
          </Button>
        </form>

        {statusMessage || localStatusMessage ? (
          <div className="mt-4 rounded-2xl border border-periwinkle/40 bg-periwinkle/10 px-4 py-3 text-sm text-white/85">
            {statusMessage || localStatusMessage}
          </div>
        ) : null}
      </div>
    </main>
  );
}
