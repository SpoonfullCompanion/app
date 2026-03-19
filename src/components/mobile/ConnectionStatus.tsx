import type { AppSession, Pairing } from '../../types/app';

interface ConnectionStatusProps {
  session: AppSession | null;
  pairing: Pairing | null;
  isConnectedMode: boolean;
  layout?: 'absolute' | 'inline';
}

function getStatus(session: AppSession | null, pairing: Pairing | null, isConnectedMode: boolean) {
  if (!isConnectedMode) {
    return {
      label: 'Demo mode',
      className: 'border-dark-blue text-off-white/75',
    };
  }

  if (!session) {
    return {
      label: 'Signed out',
      className: 'border-dark-blue text-off-white/75',
    };
  }

  if ((session.authMode === 'magic_link' || session.authMode === 'password') && !pairing) {
    return {
      label: 'Supabase connected',
      className: 'border-periwinkle/40 text-periwinkle',
    };
  }

  if (pairing?.status === 'pending') {
    return {
      label: 'Invite pending',
      className: 'border-periwinkle/40 text-periwinkle',
    };
  }

  if (pairing?.status === 'paired') {
    return {
      label: 'Paired',
      className: 'border-emerald-500/40 text-emerald-300',
    };
  }

  return {
    label: 'Connected',
    className: 'border-periwinkle/40 text-periwinkle',
  };
}

export default function ConnectionStatus({
  session,
  pairing,
  isConnectedMode,
  layout = 'absolute',
}: ConnectionStatusProps) {
  const status = getStatus(session, pairing, isConnectedMode);
  const containerClassName = layout === 'absolute'
    ? 'pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4 pt-4 sm:px-6'
    : 'flex justify-center';

  return (
    <div className={containerClassName}>
      <div
        className={`rounded-full border bg-midnight-black/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-lg shadow-black/20 ${status.className}`}
      >
        {status.label}
      </div>
    </div>
  );
}
