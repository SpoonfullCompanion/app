import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Activity, MessageSquare, Stethoscope, Clock, Hourglass, Zap, ChevronRight, EyeOff, MessageCircle, CheckCircle2, Users, Archive, SendHorizontal as SendHorizonal } from 'lucide-react';
import type { NavRoute } from './BottomNavigation';
import type { AppSession, CaregiverResponse, Connection, NeedPriority, StatusUpdate } from '../../types/app';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS } from '../../utils/communicationData';
import { formatDistanceToNow } from './time';
import { getResponsesForPatient, getPatientConnections, getActiveHelpers, archivePatientUpdate, getPatientArchivedUpdateIds } from '../../services/backend';

interface HomeScreenProps {
  session: AppSession | null;
  recentUpdates: StatusUpdate[];
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

function UpdateCard({ update, responses, onArchive, archiving, helperMap }: {
  update: StatusUpdate;
  responses: CaregiverResponse[];
  onArchive: (id: string) => void;
  archiving: boolean;
  helperMap: Map<string, string>;
}) {
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

  const replied = responses.filter(r => r.message);
  const seenOnly = responses.filter(r => r.seenAt && !r.message);
  const anyActivity = responses.length > 0;

  return (
    <div className="flex overflow-hidden rounded-2xl border border-periwinkle/20 bg-midnight-black/60 shadow-lg">
      {isNeedsOnly && <div className="w-1 shrink-0 bg-periwinkle" />}

      <div className="flex-1 min-w-0">
        <div className="p-4">
          {/* Header row */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-off-white/70">
              {isNeedsOnly ? 'Needs' : 'Status'}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-off-white/60">
                {formatDistanceToNow(update.sentAt)}
              </span>
              <button
                onClick={() => onArchive(update.id)}
                disabled={archiving}
                className="text-off-white/55 transition-colors hover:text-off-white/90 active:scale-90 disabled:opacity-30"
                title="Archive"
              >
                <Archive className="h-3.5 w-3.5" />
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

          {/* Priority banner (needs-only) */}
          {isNeedsOnly && (
            priority ? (() => {
              const PriorityIcon = priority.icon;
              return (
                <div className={`mb-3 flex items-center gap-3 overflow-hidden rounded-lg border ${priority.banner}`}>
                  <div className={`w-1 self-stretch shrink-0 ${priority.stripe}`} />
                  <PriorityIcon className={`h-5 w-5 shrink-0 ${priority.iconClass}`} />
                  <div className="py-2 pr-3">
                    <p className="text-sm font-bold text-white leading-none">{priority.label}</p>
                    <p className="mt-0.5 text-xs text-white/80">{priority.sublabel}</p>
                  </div>
                </div>
              );
            })() : (
              <div className="mb-3 flex items-center gap-3 overflow-hidden rounded-lg border bg-periwinkle/10 border-periwinkle/25">
                <div className="w-1 self-stretch shrink-0 bg-periwinkle/50" />
                <MessageSquare className="h-5 w-5 shrink-0 text-periwinkle/70" />
                <div className="py-2 pr-3">
                  <p className="text-sm font-bold text-white leading-none">Need request</p>
                </div>
              </div>
            )
          )}

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

          {/* Sent to — only for need updates with explicit targeting */}
          {isNeedsOnly && update.targetedFollowerIds && update.targetedFollowerIds.length > 0 && (() => {
            const names = update.targetedFollowerIds
              .map((id) => helperMap.get(id))
              .filter(Boolean) as string[];
            const label = names.length > 0 ? names.join(', ') : 'Selected helpers';
            return (
              <div className="mb-2 flex items-center gap-1.5 text-xs text-off-white/55">
                <SendHorizonal className="h-3 w-3 shrink-0" />
                <span>Sent to: {label}</span>
              </div>
            );
          })()}

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
          {update.messageText && (
            <p className="text-sm leading-relaxed text-off-white/75 whitespace-pre-wrap">
              {update.messageText}
            </p>
          )}
        </div>

        {/* Helper response footer — shown on all update types */}
        <div className="border-t border-white/5 px-4 py-3 space-y-2">
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
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              <p className="text-xs font-medium text-green-300">
                Seen by {seenOnly.map(r => r.caregiverDisplayName ?? 'Helper').join(', ')}
              </p>
            </div>
          )}
          {!anyActivity && (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
              <EyeOff className="h-3.5 w-3.5 text-off-white/60" />
              <p className="text-xs text-off-white/70">Waiting for helper...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomeScreen({ session, recentUpdates, onNavigate }: HomeScreenProps) {
  const [responses, setResponses] = React.useState<Record<string, CaregiverResponse[]>>({});
  const [hasActiveConnections, setHasActiveConnections] = React.useState<boolean | null>(null);
  const [archivedIds, setArchivedIds] = React.useState<Set<string>>(new Set());
  const [archivingId, setArchivingId] = React.useState<string | null>(null);
  const [helpers, setHelpers] = React.useState<Connection[]>([]);

  // Map of follower profile ID -> display name for "Sent to" labels
  const helperMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const h of helpers) {
      m.set(h.followerId, h.followerDisplayName ?? 'Helper');
    }
    return m;
  }, [helpers]);

  const fetchResponses = React.useCallback(() => {
    if (!recentUpdates.length) return;
    const ids = recentUpdates.map(u => u.id);
    getResponsesForPatient(ids).then(setResponses).catch(console.error);
  }, [recentUpdates]);

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
      .then((conns) => setHasActiveConnections(conns.some(c => c.status === 'active')))
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

  const visibleUpdates = recentUpdates.filter(u => !archivedIds.has(u.id));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">

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

        {/* Recent updates section */}
        <div className="mb-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-off-white/80">Recent Updates</p>
              <p className="text-xs text-off-white/70">What you sent your helper</p>
            </div>
            <button
              onClick={() => onNavigate('archive' as NavRoute)}
              className="text-xs text-off-white/65 hover:text-off-white/90 transition-colors"
            >
              View archive
            </button>
          </div>

          {visibleUpdates.length > 0 ? (
            <div className="space-y-3">
              {visibleUpdates.map((update) => (
                <UpdateCard
                  key={update.id}
                  update={update}
                  responses={responses[update.id] ?? []}
                  onArchive={handleArchive}
                  archiving={archivingId === update.id}
                  helperMap={helperMap}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-10 text-center">
              <p className="text-sm text-off-white/80">No updates sent yet</p>
              <p className="mt-1 text-xs text-off-white/60">Use Status or Needs below to communicate</p>
            </div>
          )}
        </div>

        {/* Action cards */}
        <div className="mb-3">
          <div className="mb-4">
            <p className="text-sm font-semibold text-off-white/80">Communicate</p>
            <p className="text-xs text-off-white/70">Tap a card to send a message</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('needs')}
              className="group relative w-full overflow-hidden rounded-xl border-2 border-bold-blue bg-bold-blue/20 p-5 text-left transition-all active:scale-[0.98] hover:bg-bold-blue/30"
            >
              <span className="pointer-events-none absolute inset-0 rounded-xl border-2 border-bold-blue animate-needs-pulse" />
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-bold-blue p-3 shrink-0">
                  <MessageSquare className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h2 className="mb-0.5 text-lg font-bold text-white">Needs</h2>
                  <p className="text-sm leading-relaxed text-white/90">Tell your helper what you need right now</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/50 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('status')}
              className="group w-full rounded-xl border border-bold-blue/40 bg-bold-blue/15 p-4 text-left transition-all active:scale-[0.98] hover:bg-bold-blue/25 hover:border-bold-blue/60"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2.5 shrink-0">
                  <Activity className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h2 className="mb-0.5 text-base font-semibold text-white">Status</h2>
                  <p className="text-xs leading-relaxed text-white/85">Update your energy level and how you are feeling</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('hospital')}
              className="group w-full rounded-xl border border-periwinkle/30 bg-periwinkle/10 p-4 text-left transition-all active:scale-[0.98] hover:bg-periwinkle/15 hover:border-periwinkle/50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/5 p-2.5 shrink-0">
                  <Stethoscope className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h2 className="mb-0.5 text-base font-semibold text-white">Hospital Mode</h2>
                  <p className="text-xs leading-relaxed text-white/85">Quick phrases for hospital staff and visitors</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
