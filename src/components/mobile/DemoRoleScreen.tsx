import type { UserRole } from '../../types/app';

interface DemoRoleScreenProps {
  onSelectRole: (role: UserRole) => void;
  onBack: () => void;
}

export default function DemoRoleScreen({ onSelectRole, onBack }: DemoRoleScreenProps) {
  return (
    <main className="min-h-screen bg-midnight-black px-4 py-8 text-off-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-between rounded-[2rem] border border-dark-blue/80 bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.18),_rgba(29,29,29,0.92)_55%)] p-6 shadow-2xl shadow-black/30">
        <div>
          <button onClick={onBack} className="text-sm font-semibold text-periwinkle underline">
            Back to Login
          </button>
          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-periwinkle">Demo mode</p>
          <h1 className="mt-4 text-4xl font-bold font-league-spartan leading-none">Choose your role</h1>
          <p className="mt-4 max-w-xl text-base text-off-white/80">
            Select how you'll use Spoonfull in demo mode.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => onSelectRole('patient')}
            className="rounded-[1.75rem] border border-dark-blue bg-dark-blue/40 p-6 text-left transition-transform duration-200 hover:-translate-y-1 hover:border-periwinkle"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-periwinkle/90">Send your status</p>
            <h2 className="mt-3 text-3xl font-bold font-league-spartan">Patient</h2>
            <p className="mt-4 text-base text-off-white/75">
              Use the Spoonfull communication cards with persistent state, pairing, and mobile-friendly controls.
            </p>
          </button>

          <button
            onClick={() => onSelectRole('caregiver')}
            className="rounded-[1.75rem] border border-dark-blue bg-dark-blue/40 p-6 text-left transition-transform duration-200 hover:-translate-y-1 hover:border-periwinkle"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-periwinkle/90">Find out what they need</p>
            <h2 className="mt-3 text-3xl font-bold font-league-spartan">Helper</h2>
            <p className="mt-4 text-base text-off-white/75">
              Pair to a patient, follow the latest status, and enable reminders once notifications are configured.
            </p>
          </button>
        </div>

        <p className="mt-10 text-center text-sm text-off-white/60">Choose a role to continue.</p>
      </div>
    </main>
  );
}
