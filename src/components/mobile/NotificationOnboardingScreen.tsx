import React from 'react';
import { Bell, BellRing, ArrowRight, Loader2 } from 'lucide-react';
import { enablePush } from '../../services/push';
import { savePushPreference } from '../../services/backend';
import { writeStorage } from '../../utils/storage';

interface NotificationOnboardingScreenProps {
  profileId: string;
  onDone: () => void;
}

export default function NotificationOnboardingScreen({ profileId, onDone }: NotificationOnboardingScreenProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleEnable = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await enablePush(profileId);
      if (!result.ok && result.reason === 'denied') {
        setError('You can enable notifications later from your device Settings.');
      }
      await savePushPreference(profileId, result.ok);
    } catch {
      setError('Something went wrong. You can enable notifications later from Settings.');
    } finally {
      setLoading(false);
      markOnboardingShown();
      onDone();
    }
  };

  const handleSkip = () => {
    markOnboardingShown();
    onDone();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.15),_rgba(29,29,29,0.98)_60%)] px-6">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="relative mx-auto mb-8 h-24 w-24">
          <div className="absolute inset-0 animate-ping rounded-full bg-bold-blue/10" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-bold-blue/30 bg-bold-blue/10">
            <BellRing className="h-11 w-11 text-bold-blue" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-2xl font-bold text-off-white">
          Don't miss a message
        </h1>

        {/* Body */}
        <p className="mb-2 text-sm leading-relaxed text-off-white/80">
          When your patient sends a message, Spoonfull alerts you instantly on your phone.
        </p>
        <p className="mb-8 text-sm leading-relaxed text-off-white/70">
          Without notifications enabled, you could miss their request for help.
        </p>

        {/* Enable button */}
        <button
          onClick={() => void handleEnable()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-bold-blue px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-bold-blue/20 transition-all hover:bg-bold-blue/90 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enabling...
            </>
          ) : (
            <>
              <Bell className="h-5 w-5" />
              Enable Notifications
            </>
          )}
        </button>

        {/* Skip link */}
        <button
          onClick={handleSkip}
          className="mt-4 flex items-center justify-center gap-1 text-sm text-off-white/50 transition-colors hover:text-off-white/80"
        >
          Maybe later
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        {/* Error */}
        {error && (
          <p className="mt-4 text-xs text-periwinkle">{error}</p>
        )}
      </div>
    </main>
  );
}

const ONBOARDING_KEY = 'notif-onboarding-shown';

function markOnboardingShown() {
  writeStorage(ONBOARDING_KEY, true);
}

export function hasSeenNotificationOnboarding(): boolean {
  try {
    return JSON.parse(window.localStorage.getItem(`spoonfull-mobile:${ONBOARDING_KEY}`) ?? 'false') === true;
  } catch {
    return false;
  }
}
