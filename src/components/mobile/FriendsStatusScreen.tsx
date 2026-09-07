import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ChevronLeft, Loader, Heart, Users } from 'lucide-react';
import type { AppSession, Connection, StatusUpdate } from '../../types/app';
import { getFriendStatusUpdates, getPatientConnections } from '../../services/backend';
import AvatarIcon from '../AvatarIcon';
import { formatDistanceToNow } from './time';
import { ENERGY_STATUSES, SYMPTOMS } from '../../utils/communicationData';

interface FriendsStatusScreenProps {
  session: AppSession;
  onBack: () => void;
}

const energyPillColors: Record<string, string> = {
  crashing: 'bg-red-950/80 border border-red-600/50 text-red-200',
  low:      'bg-amber-950/80 border border-amber-600/50 text-amber-200',
  resting:  'bg-yellow-950/80 border border-yellow-600/50 text-yellow-200',
  available:'bg-green-950/80 border border-green-600/50 text-green-200',
};

function FriendUpdateCard({ update }: { update: StatusUpdate }) {
  const energy = ENERGY_STATUSES.find((e) => e.id === update.energyStatus);
  const symptoms = (update.selectedSymptoms ?? [])
    .map((id) => SYMPTOMS.find((s) => s.id === id))
    .filter(Boolean) as typeof SYMPTOMS;

  return (
    <div className="rounded-xl border border-periwinkle/15 bg-midnight-black/50 px-4 py-3.5 transition-colors hover:border-periwinkle/25">
      <div className="flex items-center gap-2.5 mb-3">
        <AvatarIcon iconId={update.patientAvatarIcon ?? null} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-off-white truncate">
            {update.patientDisplayName ?? 'Friend'}
          </p>
          <p className="text-xs text-off-white/70">{formatDistanceToNow(update.sentAt)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {energy && (() => {
          const Icon = LucideIcons[energy.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
          const colorClass = energyPillColors[energy.id] ?? 'bg-bold-blue/20';
          return (
            <span className={`flex items-center gap-1 rounded-md ${colorClass} px-2.5 py-1 text-xs font-medium`}>
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {energy.label}
            </span>
          );
        })()}
        {symptoms.map((symptom) => {
          const Icon = LucideIcons[symptom.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
          return (
            <span key={symptom.id} className="flex items-center gap-1 rounded-md bg-periwinkle/10 px-2.5 py-1 text-xs text-off-white/80">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {symptom.label}
            </span>
          );
        })}
        {!energy && symptoms.length === 0 && (
          <span className="text-xs text-off-white/70">No details shared</span>
        )}
      </div>
    </div>
  );
}

export default function FriendsStatusScreen({ session, onBack }: FriendsStatusScreenProps) {
  const [friendUpdates, setFriendUpdates] = React.useState<StatusUpdate[]>([]);
  const [activeFriends, setActiveFriends] = React.useState<Connection[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [connections, updates] = await Promise.all([
        getPatientConnections(session).catch(() => [] as Connection[]),
        getFriendStatusUpdates(session).catch(() => [] as StatusUpdate[]),
      ]);
      if (cancelled) return;
      setActiveFriends(connections.filter(
        (c) => c.status === 'active' && c.connectionType === 'patient_friend',
      ));
      setFriendUpdates(updates);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="sr-only">Friends</h1>

        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Go back"
            className="rounded-full p-2 text-off-white/70 transition-colors hover:bg-white/5 hover:text-off-white active:scale-90"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-off-white/70 mb-0.5">Friends</p>
            <p className="text-sm text-off-white/80">See how your friends are doing</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-periwinkle/20 bg-bold-blue/10 px-4 py-3">
          <Heart className="h-4 w-4 text-periwinkle mt-0.5 shrink-0" />
          <p className="text-xs text-white/90 leading-relaxed">
            Friends share energy and symptom updates with each other. Needs are never shared with friends.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-5 w-5 animate-spin text-periwinkle/60" />
          </div>
        ) : activeFriends.length === 0 ? (
          <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-16 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-off-white/30" />
            <p className="text-sm text-off-white/80">No friends connected yet</p>
            <p className="mt-1 text-xs text-off-white/70">Add friends from Connections to see their status here</p>
          </div>
        ) : friendUpdates.length === 0 ? (
          <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-16 text-center">
            <Heart className="mx-auto mb-3 h-8 w-8 text-off-white/30" />
            <p className="text-sm text-off-white/80">No updates from friends yet</p>
            <p className="mt-1 text-xs text-off-white/70">When your friends share a status, you'll see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friendUpdates.map((u) => (
              <FriendUpdateCard key={u.id} update={u} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
