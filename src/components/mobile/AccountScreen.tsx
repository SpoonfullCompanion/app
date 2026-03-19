import { User, Mail, Link2, LogOut, Construction } from 'lucide-react';

interface AccountScreenProps {
  session: { user: { email?: string } } | null;
  onSignOut: () => Promise<void>;
  onOpenPairing: () => void;
}

export default function AccountScreen({ session, onSignOut, onOpenPairing }: AccountScreenProps) {
  return (
    <div className="min-h-screen bg-midnight-black pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-periwinkle">Account</h1>
          <p className="text-sm text-periwinkle/70">Manage your profile and settings</p>
        </div>

        <div className="mb-6 rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
          <div className="flex items-center gap-3">
            <Construction className="h-5 w-5 text-periwinkle/60" />
            <div>
              <p className="text-sm font-medium text-periwinkle">Coming Soon</p>
              <p className="text-xs text-periwinkle/60">
                Additional account features are being developed
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-periwinkle/60" />
              <div className="flex-1">
                <p className="text-xs text-periwinkle/60">Email</p>
                <p className="font-medium text-periwinkle">
                  {session?.user?.email || 'Not available'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenPairing}
            className="w-full rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4 text-left transition-colors hover:border-bold-blue hover:bg-bold-blue/10"
          >
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-periwinkle" />
              <div className="flex-1">
                <p className="font-medium text-periwinkle">Pairing Code</p>
                <p className="text-xs text-periwinkle/60">
                  Get your invite code for caregivers
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => void onSignOut()}
            className="w-full rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4 text-left transition-colors hover:border-red-500 hover:bg-red-500/10"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-red-400" />
              <div className="flex-1">
                <p className="font-medium text-red-400">Sign Out</p>
                <p className="text-xs text-periwinkle/60">
                  Log out of your account
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 space-y-3 rounded-xl border border-dark-blue/30 bg-midnight-black/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-periwinkle/60">
            Planned Features
          </p>
          <div className="space-y-2 text-sm text-periwinkle/70">
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Display name customization</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Email preferences and notifications</span>
            </div>
            <div className="flex items-start gap-2">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Advanced pairing management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
