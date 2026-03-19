import ConnectionStatus from './ConnectionStatus';
import CommunicationCards from '../CommunicationCards';
import type { AppSession, Pairing, CommunicationSubmission } from '../../types/app';

interface PatientHomeProps {
  session: AppSession | null;
  pairing: Pairing | null;
  isConnectedMode: boolean;
  showHeaderChrome: boolean;
  showReturnToMain: boolean;
  onSendUpdate: (submission: CommunicationSubmission) => Promise<void>;
  onSignOut: () => Promise<void>;
  onReturnToMain: () => Promise<void>;
  onOpenPairing: () => void;
}

export default function PatientHome({
  session,
  pairing,
  isConnectedMode,
  showHeaderChrome,
  showReturnToMain,
  onSendUpdate,
  onSignOut,
  onReturnToMain,
  onOpenPairing,
}: PatientHomeProps) {
  return (
    <div className="bg-midnight-black">
      {showHeaderChrome ? (
        <div className="sticky top-0 z-30 border-b border-dark-blue/70 bg-midnight-black/95 px-4 pb-3 pt-4 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-4xl">
            <ConnectionStatus
              session={session}
              pairing={pairing}
              isConnectedMode={isConnectedMode}
              layout="inline"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={onOpenPairing}
                className="rounded-full border border-dark-blue bg-midnight-black/90 px-4 py-2 text-sm font-semibold text-periwinkle shadow-lg shadow-black/20"
              >
                Invite code
              </button>
              <button
                onClick={() => void onSignOut()}
                className="rounded-full border border-dark-blue bg-midnight-black/90 px-4 py-2 text-sm font-semibold text-periwinkle shadow-lg shadow-black/20"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className={showReturnToMain ? 'pb-24' : ''}>
        <CommunicationCards onStatusSent={onSendUpdate} />
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
    </div>
  );
}
