import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Activity, MessageSquare, Stethoscope, Clock, Hourglass, Zap, ChevronRight, EyeOff, MessageCircle, CheckCircle, Users, Archive, Heart, SendHorizontal as SendHorizonal } from 'lucide-react';
import type { NavRoute } from './BottomNavigation';
import type { AppSession, CaregiverResponse, Connection, NeedPriority, StatusUpdate } from '../../types/app';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS, stripNeedSpeechFromMessage } from '../../utils/communicationData';
import { formatDistanceToNow } from './time';
import { getResponsesForPatient, getPatientConnections, getActiveHelpers, archivePatientUpdate, getPatientArchivedUpdateIds, markUpdateResolved, unmarkUpdateResolved } from '../../services/backend';
import LatestStatusSummary from './LatestStatusSummary';

interface HomeScreenProps {
  session: AppSession | null;
  recentUpdates: StatusUpdate[];
  pendingUpdateId?: string | null;
  onPendingUpdateConsumed?: () => void;
  onNavigate: (route: NavRoute) => void;
}

const PRIORITY_CONFIG: Record<NeedPriority, { label: string; sublabel: string; icon: React.ComponentType<{ className?: string }>; banner: string; stripe: string; iconClass: string }> = {
  when_you_can: {
    label: 'When you can',
    sublabel: 'No rush',
    icon: Clock,
    banner: 'bg-teal-900/60 border-teal-600/40',
    stripe: 'bg-teal-500',
    iconClass: 'text-teal-300',
  },
  soon: {
    label: 'Soon',
    sublabel: 'Within the next hour',
    icon: Hourglass,
    banner: 'bg-amber-900/60 border-amber-600/40',
    stripe: 'bg-amber-400',
    iconClass: 'text-amber-300',
  },
  asap: {
    label: 'Need ASAP',
    sublabel: 'Please stop what you\'re doing',
    icon: Zap,
    banner: 'bg-red-900/70 border-red-500/50',
    stripe: 'bg-red-500',
    iconClass: 'text-red-300',
  },
};

const energyStyles: Record<string, { pill: string; dot: string; bar: string }> = {
  crashing:  { pill: 'bg-red-950/70 border-red-600/50 text-red-200',         dot: 'bg-red-500',    bar: 'bg-red-700'    },
  low:       { pill: 'bg-amber-950/70 border-amber-600/50 text-amber-200',   dot: 'bg-amber-400',  bar: 'bg-amber-600'  },
  resting:   { pill: 'bg-yellow-950/70 border-yellow-600/50 text-yellow-200', dot: 'bg-yellow-400', bar: 'bg-yellow-600' },
  available: { pill: 'bg-green-950/70 border-green-600/50 text-green-200',    dot: 'bg-green-400',  bar: 'bg-green-600'  },
};

function UpdateCard({ update, responses, onArchive, archiving, helperMap, onMarkResolved, onUnresolve }: {
  update: StatusUpdate;
  responses: CaregiverResponse[];
  onArchive: (id: string) => void;
  archiving: boolean;
  helperMap: Map<string, string>;
  onMarkResolved: (update: StatusUpdate) => Promise<void>;
  onUnresolve: (updateId: string) => Promise<void>;
}) {
  const [resolving, setResolving] = React.useState(false);
  const isResolved = Boolean(update.completedAt);

  const handleToggleResolve = async () => {
    setResolving(true);
    if (isResolved) {
      await onUnresolve(update.id);
    } else {
      await onMarkResolved(update);
    }
    setResolving(false);
  };
  const energy = update.energyStatus
    ? ENERGY_STATUSES.find(e => e.id === update.energyStatus)
    : null;
  const needs = (update.selectedNeeds ?? [])
    .map(id => NEEDS.find(n => n.id === id))
    .filter(Boolean) as typeof NEEDS;
  const symptoms = (update.selectedSymptoms ?? [])
    .map(id => SYMPTOMS.find(s => s.id === id))
    .filter(Boolean) as typeof SYMPTOMS;
  const priority = update.needPriority && PRIORITY_CONFIG[update.needPriority]
    ? PRIORITY_CONFIG[update.needPriority]
    : null;
  const energyStyle = energy ? (energyStyles[energy.id] ?? energyStyles.resting) : null;
  const isNeedsOnly = !energy && needs.length > 0 && symptoms.length === 0;

  const replied = responses.filter(r => r.message?.trim());
  const seenOnly = responses.filter(r => r.seenAt && !r.message?.trim());
  const anyActivity = responses.length > 0;

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border bg-midnight-black/60 shadow-lg transition-all ${
      isResolved ? 'border-green-700/40 opacity-70' : 'border-periwinkle/20'
    }`}>
      {isNeedsOnly && <div className="h-1 bg-periwinkle" />}

      <div className="flex-1 min-w-0">
        <div className="p-4">
          {/* Header row */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-off-white/60">
                  {formatDistanceToNow(update.sentAt)}
                </span>
                {isResolved && (
                  <>
                    <span className="text-off-white/30">·</span>
                    <span className="text-xs text-green-400">Resolved</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                onClick={() => onArchive(update.id)}
                disabled={archiving}
                aria-label="Archive update"
                className="rounded-lg p-1.5 text-off-white/60 transition-colors hover:text-off-white/90 active:scale-90 disabled:opacity-30"
                title="Archive"
              >
                <Archive className="h-5 w-5" />
              </button>
              <button
                onClick={handleToggleResolve}
                disabled={resolving}
                aria-label={isResolved ? 'Mark unresolved' : 'Mark as done'}
                className={`rounded-lg p-1 transition-all active:scale-90 disabled:opacity-50 ${
                  isResolved ? 'text-green-400' : 'text-off-white/50 hover:text-green-400'
                }`}
                title={isResolved ? 'Mark unresolved' : 'Mark as done'}
              >
                <CheckCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Energy */}
          {energy && energyStyle && (() => {
            const Icon = LucideIcons[energy.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
            return (
              <div className="mb-3 flex items-center gap-3">
                <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${energyStyle.pill}`}>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${energyStyle.dot}`} />
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="text-sm font-bold tracking-wide">{energy.label}</span>
                </div>
                <div className="flex-1">
                  <div className="h-1.5 w-full rounded-full bg-white/10">
                    <div
                      className={`h-1.5 rounded-full ${energyStyle.bar}`}
                      style={{
                        width: energy.id === 'crashing' ? '15%'
                          : energy.id === 'low' ? '35%'
                          : energy.id === 'resting' ? '60%'
                          : '90%'
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Needs */}
          {needs.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {needs.map(need => {
                const Icon = LucideIcons[need.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                return (
                  <div key={need.id} className="flex items-center gap-1.5 rounded-lg bg-bold-blue px-2.5 py-1 text-sm font-semibold text-white">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {need.label}
                  </div>
                );
              })}
            </div>
          )}

          {/* Symptoms */}
          {symptoms.length > 0 && (
            <div className={`flex flex-wrap gap-1.5 ${update.messageText ? 'mb-3' : ''}`}>
              {symptoms.map(symptom => {
                const Icon = LucideIcons[symptom.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                return (
                  <div key={symptom.id} className="flex items-center gap-1.5 rounded-lg bg-periwinkle/10 px-2.5 py-1 text-sm text-off-white/80">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {symptom.label}
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom note / appreciation text */}
          {update.messageText && (() => {
            const stripped = stripNeedSpeechFromMessage(update.messageText, update.selectedNeeds ?? []);
            return stripped ? (
              <p className="text-sm leading-relaxed text-off-white/75 whitespace-pre-wrap">{stripped}</p>
            ) : null;
          })()}

          {/* Priority label (needs-only) — subtle, below content */}
          {isNeedsOnly && priority && (() => {
            const PriorityIcon = priority.icon;
            return (
              <div className="mt-3 flex items-center gap-1.5">
                <PriorityIcon className={`h-3.5 w-3.5 ${priority.iconClass}`} />
                <span className="text-xs text-off-white/60">{priority.label}</span>
              </div>
            );
          })()}
        </div>

        {/* Helper response footer — shown on all update types */}
        <div className="border-t border-white/5 px-4 py-3 space-y-2">
          {/* Sent to — only for need updates with explicit targeting */}
          {isNeedsOnly && update.targetedFollowerIds && update.targetedFollowerIds.length > 0 && (() => {
            const names = update.targetedFollowerIds
              .map((id) => helperMap.get(id))
              .filter(Boolean) as string[];
            const label = names.length > 0 ? names.join(', ') : 'Selected helpers';
            return (
              <div className="flex items-center gap-1.5 text-xs text-off-white/55">
                <SendHorizonal className="h-3 w-3 shrink-0" />
                <span>Sent to: {label}</span>
              </div>
            );
          })()}
          {replied.map(r => (
            <div key={r.id} className="flex items-start gap-2.5">
              <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bold-blue" />
              <div>
                <p className="mb-0.5 text-[10px] uppercase tracking-[0.15em] text-off-white/70">
                  {r.caregiverDisplayName ?? 'Helper'} replied
                </p>
                <p className="text-sm text-off-white italic">{r.message}</p>
              </div>
            </div>
          ))}
          {seenOnly.length > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-900/40 px-3 py-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              <p className="text-xs font-medium text-green-300">
                Seen by {seenOnly.map(r => r.caregiverDisplayName ?? 'Helper').join(', ')}
              </p>
            </div>
          )}
          {!anyActivity && (
            <div role="status" className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
              <EyeOff className="h-3.5 w-3.5 text-off-white/70" />
              <p className="text-xs text-off-white/80">Waiting for helper...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomeScreen({ session, recentUpdates: recentUpdatesProp, pendingUpdateId, onPendingUpdateConsumed, onNavigate }: HomeScreenProps) {
  const [responses, setResponses] = React.useState<Record<string, CaregiverResponse[]>>({});
  const [hasActiveConnections, setHasActiveConnections] = React.useState<boolean | null>(null);
  const [archivedIds, setArchivedIds] = React.useState<Set<string>>(new Set());
  const [archivingId, setArchivingId] = React.useState<string | null>(null);
  const [helpers, setHelpers] = React.useState<Connection[]>([]);
  const [friendCount, setFriendCount] = React.useState(0);
  const [localUpdates, setLocalUpdates] = React.useState<StatusUpdate[]>(recentUpdatesProp);

  React.useEffect(() => {
    setLocalUpdates(recentUpdatesProp);
  }, [recentUpdatesProp]);

  // Map of follower profile ID -> display name for "Sent to" labels
  const helperMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const h of helpers) {
      m.set(h.followerId, h.followerDisplayName ?? 'Helper');
    }
    return m;
  }, [helpers]);

  const fetchResponses = React.useCallback(() => {
    if (!localUpdates.length) return;
    const ids = localUpdates.map(u => u.id);
    getResponsesForPatient(ids).then(setResponses).catch(console.error);
  }, [localUpdates]);

  React.useEffect(() => {
    fetchResponses();
    const id = window.setInterval(fetchResponses, 5000);
    return () => window.clearInterval(id);
  }, [fetchResponses]);

  React.useEffect(() => {
    if (!session || session.authMode === 'demo') {
      setHasActiveConnections(true);
      return;
    }
    getPatientConnections(session)
      .then((conns) => {
        setHasActiveConnections(conns.some(c => c.status === 'active'));
        setFriendCount(conns.filter(c => c.status === 'active' && c.connectionType === 'patient_friend').length);
      })
      .catch(() => setHasActiveConnections(true));
  }, [session]);

  React.useEffect(() => {
    if (!session || session.authMode === 'demo') return;
    getActiveHelpers(session).then(setHelpers).catch(console.error);
  }, [session]);

  React.useEffect(() => {
    if (!session || session.authMode === 'demo') return;
    getPatientArchivedUpdateIds(session.profileId).then(setArchivedIds).catch(console.error);
  }, [session]);

  const handleArchive = async (updateId: string) => {
    if (!session || session.authMode === 'demo') return;
    setArchivingId(updateId);
    await archivePatientUpdate(session.profileId, updateId);
    setArchivedIds(prev => new Set([...prev, updateId]));
    setArchivingId(null);
  };

  const handleMarkResolved = async (update: StatusUpdate) => {
    if (!session || session.authMode === 'demo') return;
    setLocalUpdates(prev => prev.map(u =>
      u.id === update.id
        ? { ...u, completedAt: new Date().toISOString(), completedBy: session.profileId }
        : u
    ));
    await markUpdateResolved(update.id, session.profileId, update.patientId);
    setArchivedIds(prev => new Set([...prev, update.id]));
  };

  const handleUnresolve = async (updateId: string) => {
    if (!session || session.authMode === 'demo') return;
    setLocalUpdates(prev => prev.map(u =>
      u.id === updateId ? { ...u, completedAt: null, completedBy: null } : u
    ));
    await unmarkUpdateResolved(updateId);
  };

  const visibleUpdates = localUpdates.filter(u => !archivedIds.has(u.id));

  // Deep-link from push notification tap: scroll to and highlight the card
  React.useEffect(() => {
    if (!pendingUpdateId || !onPendingUpdateConsumed) return;
    const target = visibleUpdates.find(u => u.id === pendingUpdateId);
    if (target) {
      const id = pendingUpdateId;
      setTimeout(() => {
        const el = document.getElementById(`patient-card-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-bold-blue', 'animate-pulse');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-bold-blue', 'animate-pulse');
          }, 2500);
        }
        onPendingUpdateConsumed();
      }, 300);
    } else {
      onPendingUpdateConsumed();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUpdateId, visibleUpdates]);

  // Needs updates = any update with at least one need selected
  const needsUpdates = visibleUpdates.filter(u => (u.selectedNeeds ?? []).length > 0);

  // Latest status = most recent update that has energy or symptoms (even if it also has needs)
  const hasStatusInfo = (u: StatusUpdate) =>
    (u.energyStatus != null && u.energyStatus !== '') ||
    (u.selectedSymptoms ?? []).length > 0;
  const statusUpdates = visibleUpdates.filter(hasStatusInfo);
  const latestStatus = statusUpdates.length > 0
    ? statusUpdates.reduce((latest, u) =>
        new Date(u.sentAt) > new Date(latest.sentAt) ? u : latest
      )
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="sr-only">Home Feed</h1>

        {/* No-connections nudge */}
        {hasActiveConnections === false && (
          <button
            onClick={() => onNavigate('connections')}
            className="mb-6 flex w-full items-center gap-4 rounded-2xl border border-bold-blue/40 bg-bold-blue/10 px-4 py-4 text-left transition-all hover:bg-bold-blue/15 active:scale-[0.98]"
          >
            <div className="rounded-full bg-bold-blue/20 p-2.5 shrink-0">
              <Users className="h-5 w-5 text-bold-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Connect a helper</p>
              <p className="text-xs text-off-white/80 mt-0.5">Your updates won't reach anyone until you add a helper</p>
            </div>
            <ChevronRight className="h-4 w-4 text-bold-blue/60 shrink-0" />
          </button>
        )}

        {/* Latest Status Summary + Friends link */}
        <div className="mb-6 flex items-stretch gap-3">
          <div className="flex-1 min-w-0">
            {latestStatus ? (
              <LatestStatusSummary update={latestStatus} />
            ) : (
              <button
                onClick={() => onNavigate('status')}
                className="group flex h-full w-full items-center gap-4 rounded-xl border border-bold-blue/30 bg-bold-blue/10 px-5 py-5 text-left transition-all hover:border-bold-blue/50 hover:bg-bold-blue/15 active:scale-[0.98]"
              >
                <div className="rounded-full bg-bold-blue/20 p-3 shrink-0">
                  <Activity className="h-6 w-6 text-bold-blue" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">No recent status</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-off-white/80">Add your energy level and how you're feeling</p>
                </div>
                <ChevronRight className="h-5 w-5 text-bold-blue/50 transition-transform group-hover:translate-x-0.5 shrink-0" />
              </button>
            )}
          </div>

          {/* Friends status link */}
          {friendCount > 0 && (
            <button
              onClick={() => onNavigate('friends-status' as NavRoute)}
              className="group flex w-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-periwinkle/20 bg-midnight-black/50 px-2 py-3 text-center transition-all hover:border-periwinkle/40 hover:bg-midnight-black/70 active:scale-[0.98]"
            >
              <div className="rounded-full bg-periwinkle/15 p-2">
                <Heart className="h-4 w-4 text-periwinkle" />
              </div>
              <span className="text-xs font-medium leading-tight text-off-white/80">Friends<br />Status</span>
            </button>
          )}
        </div>

        {/* Recent needs section */}
        <div className="mb-8">
          {needsUpdates.length > 0 ? (
            <div className="space-y-3">
              {needsUpdates.map((update) => (
                <div
                  key={update.id}
                  id={`patient-card-${update.id}`}
                  className="rounded-2xl transition-all"
                >
                <UpdateCard
                  update={update}
                  responses={responses[update.id] ?? []}
                  onArchive={handleArchive}
                  archiving={archivingId === update.id}
                  helperMap={helperMap}
                  onMarkResolved={handleMarkResolved}
                  onUnresolve={handleUnresolve}
                />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-10 text-center">
              <p className="text-sm text-off-white/80">No needs sent yet</p>
              <p className="mt-1 text-xs text-off-white/60">Use Needs below to send a request to your helper</p>
            </div>
          )}

          {/* Archive link — only shown when archived updates exist */}
          {archivedIds.size > 0 && (
            <button
              onClick={() => onNavigate('archive')}
              className="group mt-3 flex w-full items-center gap-3 rounded-xl border border-dark-blue/40 bg-midnight-black/40 p-3.5 text-left transition-all hover:border-periwinkle/40 hover:bg-midnight-black/60 active:scale-[0.98]"
            >
              <Archive className="h-5 w-5 text-periwinkle shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-off-white">Archive</p>
                <p className="text-xs text-off-white/70">View your {archivedIds.size} archived update{archivedIds.size === 1 ? '' : 's'}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-off-white/30 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>

        {/* Action cards */}
        <div className="mb-3">
          <div className="mb-3">
            <p className="text-sm font-semibold text-off-white/80">Communicate</p>
            <p className="text-xs text-off-white/70">Talk to your helpers</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Needs — primary */}
            <button
              onClick={() => onNavigate('needs')}
              className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-bold-blue/50 bg-gradient-to-b from-bold-blue/25 to-bold-blue/5 p-3.5 text-center transition-all active:scale-95 hover:border-bold-blue/70 hover:from-bold-blue/35 hover:to-bold-blue/10"
            >
              <div className="relative rounded-2xl bg-bold-blue p-2.5 shadow-lg shadow-bold-blue/30">
                <MessageSquare className="h-5 w-5 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Needs</p>
                <p className="mt-0.5 text-[10px] leading-tight text-white/70">Share a request</p>
              </div>
            </button>

            {/* Status */}
            <button
              onClick={() => onNavigate('status')}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-periwinkle/25 bg-midnight-black/50 p-3.5 text-center transition-all active:scale-95 hover:border-periwinkle/50 hover:bg-midnight-black/70"
            >
              <div className="rounded-2xl bg-periwinkle/15 p-2.5">
                <Activity className="h-5 w-5 text-periwinkle" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-off-white">Status</p>
                <p className="mt-0.5 text-[10px] leading-tight text-off-white/60">Energy & symptoms</p>
              </div>
            </button>

            {/* Hospital */}
            <button
              onClick={() => onNavigate('hospital')}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-periwinkle/25 bg-midnight-black/50 p-3.5 text-center transition-all active:scale-95 hover:border-periwinkle/50 hover:bg-midnight-black/70"
            >
              <div className="rounded-2xl bg-periwinkle/15 p-2.5">
                <Stethoscope className="h-5 w-5 text-periwinkle" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-off-white">Hospital</p>
                <p className="mt-0.5 text-[10px] leading-tight text-off-white/60">Quick phrases</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
