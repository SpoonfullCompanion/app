import React from 'react';
import { appConfig } from '../../lib/appConfig';
import type { DemoMode } from '../../types/app';

interface LoginScreenProps {
  mode: DemoMode;
  onSignInWithPassword: (email: string, password: string) => Promise<string>;
  onSendMagicLink: (email: string) => Promise<string>;
  onContinueDemo: () => void;
  onShowSignup: () => void;
  statusMessage?: string;
}

const inputClass =
  'w-full rounded-xl border border-periwinkle/30 bg-midnight-black/60 px-4 py-3.5 text-base text-off-white placeholder-off-white/30 outline-none transition-colors focus:border-bold-blue focus:ring-2 focus:ring-bold-blue/30';

const ctaClass =
  'flex w-full items-center justify-center rounded-full bg-bold-blue px-6 py-4 font-semibold text-white shadow-xl shadow-bold-blue/30 transition-all hover:bg-bold-blue/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';

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
  const [isError, setIsError] = React.useState(false);
  const [isBusy, setIsBusy] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    setLocalStatusMessage('');
    setIsError(false);
    try {
      const message = await onSignInWithPassword(email, password);
      const isSuccessMessage = message.toLowerCase().includes('signed in') || message.toLowerCase().includes('reloading');
      setIsError(!isSuccessMessage);
      setLocalStatusMessage(message);
    } catch (error) {
      console.error('Sign in failed', error);
      setIsError(true);
      setLocalStatusMessage('Sign in failed. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    setLocalStatusMessage('');
    setIsError(false);
    try {
      const message = await onSendMagicLink(magicLinkEmail);
      const isSuccessMessage = message.toLowerCase().includes('sent') || message.toLowerCase().includes('check');
      setIsError(!isSuccessMessage);
      setLocalStatusMessage(message);
    } catch (error) {
      console.error('Magic link request failed', error);
      setIsError(true);
      setLocalStatusMessage('Failed to send magic link. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setIsError(true);
      setLocalStatusMessage('Enter your email address first.');
      return;
    }
    setIsBusy(true);
    setLocalStatusMessage('');
    setIsError(false);
    try {
      await onSendMagicLink(email);
      setIsError(false);
      setLocalStatusMessage('Password reset link sent to your email.');
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Password reset failed', error);
      setIsError(true);
      setLocalStatusMessage('Failed to send reset link. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const displayMessage = statusMessage || localStatusMessage;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] text-off-white">
      <div className="mx-auto max-w-xl px-6 py-10 pb-16">

        <div className="flex flex-col items-center mb-10 pt-4">
          <img
            src="/Spoonfull-Logo-DarkBG copy.svg"
            alt="Spoonfull"
            className="w-40 h-auto md:w-48"
          />
        </div>

        <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-1">
          Welcome back
        </p>
        <h1 className="text-3xl font-bold font-league-spartan mb-6">Sign in</h1>

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

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-off-white/80 mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
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
            <label className="block text-sm font-semibold text-off-white/80 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowForgotPassword(!showForgotPassword)}
              className="text-sm text-periwinkle underline underline-offset-2 hover:text-white transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {showForgotPassword && (
            <div className="rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-4">
              <p className="text-sm text-off-white/70 mb-3">
                We'll send a reset link to your email address.
              </p>
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                disabled={!email || isBusy || !appConfig.hasSupabase}
                className="flex w-full items-center justify-center rounded-full border border-bold-blue px-6 py-3 text-sm font-semibold text-bold-blue transition-all hover:bg-bold-blue hover:text-white active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send reset link
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={!email || !password || isBusy || !appConfig.hasSupabase}
            className={ctaClass}
          >
            {isBusy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-sm text-off-white/60">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onShowSignup}
            className="text-periwinkle underline underline-offset-2 font-semibold hover:text-white transition-colors"
          >
            Create an account
          </button>
        </p>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-periwinkle/15" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#1d1d1d] px-4 text-xs text-off-white/70 uppercase tracking-[0.2em]">
              Or
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-4">
            Passwordless sign-in
          </p>
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-off-white/80 mb-1.5" htmlFor="magic-email">
                Email address
              </label>
              <input
                id="magic-email"
                type="email"
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                placeholder="name@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={!magicLinkEmail || isBusy || !appConfig.hasSupabase}
              className={ctaClass}
            >
              {appConfig.hasSupabase ? 'Send magic link' : 'Supabase not configured'}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={onContinueDemo}
            className="text-xs text-off-white/65 underline underline-offset-2 hover:text-off-white transition-colors"
          >
            Continue in demo mode
          </button>
        </div>
      </div>
    </main>
  );
}
