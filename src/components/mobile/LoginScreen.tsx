import React from 'react';
import Button from '../Button';
import { appConfig } from '../../lib/appConfig';
import type { UserRole, DemoMode } from '../../types/app';

interface LoginScreenProps {
  mode: DemoMode;
  onSignInWithPassword: (email: string, password: string) => Promise<string>;
  onSendMagicLink: (email: string) => Promise<string>;
  onContinueDemo: () => void;
  onShowSignup: () => void;
  statusMessage?: string;
}

export default function LoginScreen({
  mode,
  onSignInWithPassword,
  onSendMagicLink,
  onContinueDemo,
  onShowSignup,
  statusMessage = '',
}: LoginScreenProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [magicLinkEmail, setMagicLinkEmail] = React.useState('');
  const [localStatusMessage, setLocalStatusMessage] = React.useState('');
  const [isBusy, setIsBusy] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    setLocalStatusMessage('');

    try {
      const message = await onSignInWithPassword(email, password);
      setLocalStatusMessage(message);
    } catch (error) {
      console.error('Sign in failed', error);
      setLocalStatusMessage('Sign in failed. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

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

  const handleForgotPassword = async () => {
    if (!email) {
      setLocalStatusMessage('Enter your email address first.');
      return;
    }

    setIsBusy(true);
    setLocalStatusMessage('');

    try {
      const message = await onSendMagicLink(email);
      setLocalStatusMessage('Password reset link sent to your email.');
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Password reset failed', error);
      setLocalStatusMessage('Failed to send reset link. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-midnight-black px-4 py-8 text-off-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center rounded-[2rem] border border-dark-blue/80 bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.18),_rgba(29,29,29,0.92)_55%)] p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/Spoonfull-Logo-DarkBG copy.svg"
            alt="Spoonfull"
            className="w-44 h-auto md:w-52"
          />
        </div>
        <div>
           <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-4">
            Sign In
          </p>
        </div>

        <form onSubmit={handleSignIn} className="mt-5 space-y-2">
          <div>
            <label className="block text-sm font-semibold text-off-white/90 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full rounded-2xl border-2 border-dark-blue bg-midnight-black/60 px-4 py-4 text-lg text-off-white outline-none transition-colors focus:border-periwinkle"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-off-white/90 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              className="w-full rounded-2xl border-2 border-dark-blue bg-midnight-black/60 px-4 py-4 text-lg text-off-white outline-none transition-colors focus:border-periwinkle"
            />
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowForgotPassword(!showForgotPassword)}
              className="text-sm text-periwinkle underline font-bold"
            >
              Forgot password?
            </button>
          </div>

          {showForgotPassword && (
            <div className="rounded-2xl border border-periwinkle/40 bg-periwinkle/10 p-4">
              <p className="text-sm text-off-white/85 mb-3">
                We'll send you a password reset link to your email address.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!email || isBusy || !appConfig.hasSupabase}
                onClick={handleForgotPassword}
              >
                Send reset link
              </Button>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={!email || !password || isBusy || !appConfig.hasSupabase}
            >
              Sign in
            </Button>
          </div>
        </form>

         <p className="mt-.5 text-sm text-off-white/70">
           <button
             type="button"
             onClick={onShowSignup}
             className="text-periwinkle underline font-bold"
           >
             Create an account.
           </button>
         </p>

        <div className="relative my-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark-blue/40"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.18),_rgba(29,29,29,0.92)_55%)] px-4 text-sm text-off-white/60 uppercase tracking-[0.15em]">
              Or
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-4">
            Quick link to email
          </p>

          <form onSubmit={handleMagicLink} className="space-y-4">
            <label className="block text-sm font-semibold text-off-white/90" htmlFor="magic-email">
              Send me a magic link
            </label>
            <input
              id="magic-email"
              type="email"
              value={magicLinkEmail}
              onChange={(event) => setMagicLinkEmail(event.target.value)}
              placeholder="name@example.com"
              autoCapitalize="none"
              autoCorrect="off"
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
        </div>

        {statusMessage || localStatusMessage ? (
          <div className="mt-4 rounded-2xl border border-periwinkle/40 bg-periwinkle/10 px-4 py-3 text-sm text-off-white/85">
            {statusMessage || localStatusMessage}
          </div>
        ) : null}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onContinueDemo}
            className="text-xs text-off-white/50 underline"
          >
            Continue in demo mode
          </button>
        </div>
      </div>
    </main>
  );
}
