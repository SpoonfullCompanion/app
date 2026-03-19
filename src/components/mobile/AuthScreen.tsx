import React from 'react';
import Button from '../Button';
import { appConfig } from '../../lib/appConfig';
import type { UserRole } from '../../types/app';

interface AuthScreenProps {
  role: UserRole;
  onBack: () => void;
  onSendMagicLink: (email: string) => Promise<string>;
  onSignInWithPassword: (email: string, password: string) => Promise<string>;
  onSignUpWithPassword: (email: string, password: string) => Promise<string>;
  onContinueDemo: () => Promise<void>;
  statusMessage?: string;
}

export default function AuthScreen({
  role,
  onBack,
  onSendMagicLink,
  onSignInWithPassword,
  onSignUpWithPassword,
  onContinueDemo,
  statusMessage = '',
}: AuthScreenProps) {
  const [magicLinkEmail, setMagicLinkEmail] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [localStatusMessage, setLocalStatusMessage] = React.useState('');
  const [isBusy, setIsBusy] = React.useState(false);

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    setLocalStatusMessage('');

    try {
      const message = await onSendMagicLink(magicLinkEmail);
      setLocalStatusMessage(message);
    } catch (error) {
      console.error('Magic link request failed', error);
      setLocalStatusMessage('Sign-in failed. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handlePasswordAuth = async (mode: 'sign_in' | 'sign_up') => {
    setIsBusy(true);
    setLocalStatusMessage('');

    try {
      const message = mode === 'sign_in'
        ? await onSignInWithPassword(username, password)
        : await onSignUpWithPassword(username, password);
      setLocalStatusMessage(message);
    } catch (error) {
      console.error('Password auth failed', error);
      setLocalStatusMessage('Sign-in failed. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-midnight-black px-4 py-8 text-off-white sm:px-6">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-dark-blue bg-dark-blue/25 p-6 shadow-xl shadow-black/20">
        <button onClick={onBack} className="text-sm font-semibold text-periwinkle underline">
          Back
        </button>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-periwinkle">{role}</p>
        <h1 className="mt-3 text-4xl font-bold font-league-spartan">Sign in or continue in demo mode</h1>
        <p className="mt-4 text-base text-off-white/75">
          Connected mode uses Supabase magic-link auth. Demo mode keeps the mobile workflow fully runnable on this Mac without credentials.
        </p>

        {appConfig.enablePasswordAuth ? (
          <div className="mt-8 rounded-2xl border border-periwinkle/40 bg-midnight-black/30 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-periwinkle">Local testing</p>
            <p className="mt-3 text-sm text-off-white/75">
              On localhost, you can use a username and password instead of repeatedly requesting magic links.
            </p>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-semibold text-off-white/90" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="pwme-demo"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full rounded-2xl border-2 border-dark-blue bg-midnight-black/60 px-4 py-4 text-lg text-off-white outline-none transition-colors focus:border-periwinkle"
              />
              <label className="block text-sm font-semibold text-off-white/90" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-2xl border-2 border-dark-blue bg-midnight-black/60 px-4 py-4 text-lg text-off-white outline-none transition-colors focus:border-periwinkle"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  className="w-full"
                  disabled={!username || !password || isBusy || !appConfig.hasSupabase}
                  onClick={() => void handlePasswordAuth('sign_in')}
                >
                  Sign in with password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!username || !password || isBusy || !appConfig.hasSupabase}
                  onClick={() => void handlePasswordAuth('sign_up')}
                >
                  Create account
                </Button>
              </div>
              <p className="text-xs text-off-white/55">
                The app maps the username to a local test email behind the scenes. Use magic links below if you want to test the real email flow.
              </p>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleMagicLink} className="mt-8 space-y-4">
          {appConfig.enablePasswordAuth ? (
            <p className="text-xs uppercase tracking-[0.25em] text-off-white/60">Use magic link instead</p>
          ) : null}
          <label className="block text-sm font-semibold text-off-white/90" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={magicLinkEmail}
            onChange={(event) => setMagicLinkEmail(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-2xl border-2 border-dark-blue bg-midnight-black/60 px-4 py-4 text-lg text-off-white outline-none transition-colors focus:border-periwinkle"
          />
          <Button
            type="submit"
            className="w-full"
            disabled={!magicLinkEmail || isBusy || !appConfig.hasSupabase}
          >
            {appConfig.hasSupabase ? 'Send magic link' : 'Supabase not configured'}
          </Button>
        </form>

        {statusMessage || localStatusMessage ? (
          <div className="mt-4 rounded-2xl border border-periwinkle/40 bg-periwinkle/10 px-4 py-3 text-sm text-off-white/85">
            {statusMessage || localStatusMessage}
          </div>
        ) : null}

        <div className="mt-8 border-t border-dark-blue pt-6">
          <Button variant="outline" className="w-full" onClick={() => void onContinueDemo()}>
            Continue in demo mode
          </Button>
        </div>
      </div>
    </main>
  );
}
