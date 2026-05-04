import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Clock, Hourglass, Zap, CheckCircle, Send, ChevronDown, ChevronUp, MessageSquare, Users, RefreshCw, Archive, Eye, SendHorizontal as SendHorizonal } from 'lucide-react';
import type { AppSession, CaregiverResponse, Connection, NeedPriority, StatusUpdate } from '../../types/app';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS, stripNeedSpeechFromMessage } from '../../utils/communicationData';
import { formatDistanceToNow } from './time';
import {
  archiveUpdate,
  getAllResponsesForUpdates,
  getArchivedUpdateIds,
  getFollowerConnections,
  getResponsesForUpdates,
  getUpdatesForConnectedPatients,
  markUpdatesSeen,
  sendCaregiverResponse,
  unarchiveUpdate,
} from '../../services/backend';
import AvatarIcon from '../AvatarIcon';

interface CaregiverFeedScreenProps {
  session: AppSession;
  /** Updates passed from App.tsx subscription; used as fallback when no connections exist. */
  legacyUpdates: StatusUpdate[];
  onNavigateToConnections?: () => void;
  onArchiveChanged?: () => void;
}

const PRIORITY_CONFIG: Record<NeedPriority, {
  label: string; sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  banner: string; stripe: string; iconClass: string;
}> = {
  when_you_can: { label: 'When you can',  sublabel: 'No rush',                        icon: Clock,     banner: 'bg-teal-900/60 border-teal-600/40',  stripe: 'bg-teal-500',  iconClass: 'text-teal-300'  },
  soon:         { label: 'Soon',           sublabel: 'Within the next hour',           icon: Hourglass, banner: 'bg-amber-900/60 border-amber-600/40', stripe: 'bg-amber-400', iconClass: 'text-amber-300' },
  asap:         { label: 'Need ASAP',      sublabel: "Please stop what you're doing",  icon: Zap,       banner: 'bg-red-900/70 border-red-500/50',     stripe: 'bg-red-500',   iconClass: 'text-red-300'   },
};

const energyStyles: Record<string, { pill: string; dot: string; bar: string }> = {
  crashing:  { pill: 'bg-red-950/70 border-red-600/50 text-red-200',         dot: 'bg-red-500',    bar: 'bg-red-700'    },
  low:       { pill: 'bg-amber-950/70 border-amber-600/50 text-amber-200',   dot: 'bg-amber-400',  bar: 'bg-amber-600'  },
  resting:   { pill: 'bg-yellow-950/70 border-yellow-600/50 text-yellow-200', dot: 'bg-yellow-400', bar: 'bg-yellow-600' },
  available: { pill: 'bg-green-950/70 border-green-600/50 text-green-200',    dot: 'bg-green-400',  bar: 'bg-green-600'  },
};

const QUICK_REPLIES_STATUS = ['Do you need anything?', 'Let me know if I can help', 'I am here for you'];
const QUICK_REPLIES_NEEDS = ['On it!', 'Be there soon', 'Coming in 10 minutes'];

// ─── Update card ─────────────────────────────────────────────────────────────

function UpdateFeedCard({
  update,
  response,
  allResponses,
  currentProfileId,
  helperDisplayNames,
  isArchived,
  onRespond,
  onToggleArchive,
}: {
  update: StatusUpdate;
  response: CaregiverResponse | null;
  allResponses: CaregiverResponse[];
  currentProfileId: string;
  helperDisplayNames: Map<string, string>;
  isArchived: boolean;
  onRespond: (updateId: string, message: string) => Promise<void>;
  onToggleArchive: (updateId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [customNote, setCustomNote] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const isResolved = Boolean(update.resolvedAt);

  const energy = update.energyStatus ? ENERGY_STATUSES.find(e => e.id === update.energyStatus) : null;
  const needs = (update.selectedNeeds ?? []).map(id => NEEDS.find(n => n.id === id)).filter(Boolean) as typeof NEEDS;
  const symptoms = (update.selectedSymptoms ?? []).map(id => SYMPTOMS.find(s => s.id === id)).filter(Boolean) as typeof SYMPTOMS;
  const priority = update.needPriority && PRIORITY_CONFIG[update.needPriority] ? PRIORITY_CONFIG[update.needPriority] : null;
  const energyStyle = energy ? (energyStyles[energy.id] ?? energyStyles.resting) : null;
  const isNeedsOnly = !energy && needs.length > 0 && symptoms.length === 0;
  const isSeen = Boolean(response?.seenAt);
  const hasResponse = Boolean(response?.message);

  // Other caregivers' responses (excluding this caregiver's own row)
  const othersReplied = allResponses.filter(r => r.caregiverId !== currentProfileId && r.message?.trim());
  const othersSeen = allResponses.filter(r => r.caregiverId !== currentProfileId && r.seenAt && !r.message?.trim());

  // "Sent to" names for targeted updates
  const sentToNames = (update.targetedFollowerIds ?? [])
    .map(id => helperDisplayNames.get(id))
    .filter(Boolean) as string[];

  const handleQuickReply = async (msg: string) => {
    setSending(true);
    await onRespond(update.id, msg);
    setSending(false);
    setExpanded(false);
  };

  const handleSendNote = async () => {
    if (!customNote.trim()) return;
    setSending(true);
    await onRespond(update.id, customNote.trim());
    setSending(false);
    setCustomNote('');
    setExpanded(false);
  };

  return (
    <div className={`flex overflow-hidden rounded-2xl border bg-midnight-black/60 shadow-lg transition-all ${
      isResolved ? 'border-green-700/40 opacity-70' : isSeen ? 'border-periwinkle/20' : 'border-bold-blue/50 shadow-bold-blue/10'
    }`}>
      {isNeedsOnly && <div className="w-1 shrink-0 bg-periwinkle" />}

      <div className="flex-1 min-w-0">
        <div className="p-4">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-off-white/70">
                  {isNeedsOnly ? 'Needs' : 'Status'}
                </span>
                {!isSeen && <span className="h-1.5 w-1.5 rounded-full bg-bold-blue" />}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-xs text-off-white/60">{formatDistanceToNow(update.sentAt)}</span>
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
                onClick={() => onToggleArchive(update.id)}
                className={`rounded-lg p-1.5 transition-all active:scale-90 ${
                  isArchived ? 'text-bold-blue' : 'text-off-white/50 hover:text-off-white'
                }`}
                title={isArchived ? 'Remove from archive' : 'Archive'}
              >
                <Archive className="h-5 w-5" />
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
                      style={{ width: energy.id === 'crashing' ? '15%' : energy.id === 'low' ? '35%' : energy.id === 'resting' ? '60%' : '90%' }}
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

          {/* Message / appreciation text */}
          {update.messageText && (() => {
            const stripped = stripNeedSpeechFromMessage(update.messageText, update.selectedNeeds ?? []);
            return stripped ? (
              <p className="mt-2 mb-1 text-sm leading-relaxed text-off-white/80 whitespace-pre-wrap">{stripped}</p>
            ) : null;
          })()}

          {/* Symptoms */}
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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

          {/* Sent to — visible when update was targeted to specific helpers */}
          {sentToNames.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-off-white/50">
              <SendHorizonal className="h-3 w-3 shrink-0" />
              <span>Sent to: {sentToNames.join(', ')}</span>
            </div>
          )}

        </div>

        {/* Response area */}
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
          {hasResponse ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
              <p className="text-sm text-off-white/80">
                You replied: <span className="text-off-white italic">{response!.message}</span>
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="flex items-center gap-1 rounded-full border border-periwinkle/30 bg-midnight-black/60 px-3 py-1.5 text-sm text-off-white/80 transition-all hover:border-periwinkle/50 hover:text-off-white active:scale-95"
                >
                  Respond
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>

              {expanded && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(isNeedsOnly ? QUICK_REPLIES_NEEDS : QUICK_REPLIES_STATUS).map(msg => (
                      <button
                        key={msg}
                        onClick={() => void handleQuickReply(msg)}
                        disabled={sending}
                        className="rounded-lg border border-periwinkle/25 bg-periwinkle/10 px-3 py-1.5 text-xs text-off-white transition-all hover:bg-periwinkle/20 active:scale-95 disabled:opacity-50"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customNote}
                      onChange={e => setCustomNote(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') void handleSendNote(); }}
                      placeholder="Write a note…"
                      className="flex-1 rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-3 py-2 text-sm text-white placeholder-off-white/50 outline-none focus:border-bold-blue focus:ring-1 focus:ring-bold-blue/20"
                    />
                    <button
                      onClick={() => void handleSendNote()}
                      disabled={!customNote.trim() || sending}
                      className="flex items-center justify-center rounded-lg bg-bold-blue px-3 py-2 text-white transition-all hover:bg-bold-blue/90 active:scale-95 disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Other helpers' responses */}
          {(othersReplied.length > 0 || othersSeen.length > 0) && (
            <div className="border-t border-white/5 pt-2.5 space-y-1.5">
              {othersReplied.map(r => (
                <div key={r.id} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-periwinkle/60" />
                  <p className="text-xs text-off-white/60">
                    <span className="font-medium text-off-white/75">{r.caregiverDisplayName ?? 'Helper'}</span> replied:{' '}
                    <span className="italic">{r.message}</span>
                  </p>
                </div>
              ))}
              {othersSeen.length > 0 && (
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 shrink-0 text-off-white/40" />
                  <p className="text-xs text-off-white/50">
                    Seen by {othersSeen.map(r => r.caregiverDisplayName ?? 'Helper').join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Patient section header ───────────────────────────────────────────────────

function PatientSectionHeader({
  displayName,
  avatarIcon,
  unseenCount,
}: {
  displayName: string;
  avatarIcon: string | null | undefined;
  unseenCount: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-6 first:mt-0">
      <AvatarIcon iconId={avatarIcon} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-off-white truncate">{displayName}</p>
      </div>
      {unseenCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bold-blue px-1.5 text-[10px] font-bold text-white">
          {unseenCount}
        </span>
      )}
    </div>
  );
}

// ─── Main feed ────────────────────────────────────────────────────────────────

export default function CaregiverFeedScreen({ session, legacyUpdates, onNavigateToConnections, onArchiveChanged }: CaregiverFeedScreenProps) {
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [updates, setUpdates] = React.useState<StatusUpdate[]>([]);
  const [responses, setResponses] = React.useState<Record<string, CaregiverResponse>>({});
  const [allResponses, setAllResponses] = React.useState<Record<string, CaregiverResponse[]>>({});
  const [archivedIds, setArchivedIds] = React.useState<Set<string>>(new Set());
  const [removingFromFeed, setRemovingFromFeed] = React.useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const loadFeed = React.useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const [conns, freshUpdates, archived] = await Promise.all([
        getFollowerConnections(session),
        getUpdatesForConnectedPatients(session, 30),
        getArchivedUpdateIds(session.profileId),
      ]);
      setConnections(conns);
      setArchivedIds(archived);
      const archivedSet = new Set(archived);
      const visibleUpdates = (freshUpdates.length > 0 ? freshUpdates : legacyUpdates)
        .filter(u => !archivedSet.has(u.id));
      setUpdates(visibleUpdates);
    } catch {
      setUpdates(legacyUpdates);
    } finally {
      setIsRefreshing(false);
      setHasLoaded(true);
    }
  }, [session, legacyUpdates]);

  // Initial load
  React.useEffect(() => {
    void loadFeed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.profileId]);

  // Refresh when legacyUpdates change (realtime push from App.tsx)
  React.useEffect(() => {
    if (hasLoaded) void loadFeed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyUpdates]);

  // Mark seen + fetch responses whenever updates change
  React.useEffect(() => {
    if (!updates.length) return;
    const ids = updates.map(u => u.id);

    getResponsesForUpdates(session.profileId, ids).then(fetched => {
      setResponses(prev => {
        const next = { ...fetched };
        for (const id of ids) {
          if (prev[id]?.seenAt && !next[id]?.seenAt) {
            next[id] = { ...next[id], ...prev[id] };
          }
        }
        return next;
      });
    }).catch(console.error);

    getAllResponsesForUpdates(ids).then(setAllResponses).catch(console.error);

    const unseenIds = ids.filter(id => !responses[id]?.seenAt);
    if (unseenIds.length) {
      const now = new Date().toISOString();
      setResponses(prev => {
        const next = { ...prev };
        for (const id of unseenIds) {
          if (!next[id]) {
            next[id] = { id: '', statusUpdateId: id, caregiverId: session.profileId, message: '', seenAt: now, createdAt: now };
          } else {
            next[id] = { ...next[id], seenAt: now };
          }
        }
        return next;
      });
      void markUpdatesSeen(session.profileId, unseenIds).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updates, session.profileId]);

  const handleToggleArchive = (updateId: string) => {
    const nowArchived = !archivedIds.has(updateId);
    setArchivedIds(prev => {
      const next = new Set(prev);
      nowArchived ? next.add(updateId) : next.delete(updateId);
      return next;
    });
    if (nowArchived) {
      // Animate out then remove from feed
      setRemovingFromFeed(prev => new Set(prev).add(updateId));
      setTimeout(() => {
        setUpdates(prev => prev.filter(u => u.id !== updateId));
        setRemovingFromFeed(prev => {
          const next = new Set(prev);
          next.delete(updateId);
          return next;
        });
      }, 300);
      void archiveUpdate(session.profileId, updateId).then(() => onArchiveChanged?.());
    } else {
      void unarchiveUpdate(session.profileId, updateId).then(() => onArchiveChanged?.());
    }
  };

  const handleRespond = async (updateId: string, message: string) => {
    const result = await sendCaregiverResponse(session.profileId, updateId, message);
    if (result) {
      setResponses(prev => ({ ...prev, [updateId]: result }));
      setAllResponses(prev => {
        const existing = (prev[updateId] ?? []).filter(r => r.caregiverId !== session.profileId);
        return { ...prev, [updateId]: [...existing, result] };
      });
    } else {
      const now = new Date().toISOString();
      const fallback: CaregiverResponse = { id: crypto.randomUUID(), statusUpdateId: updateId, caregiverId: session.profileId, message, seenAt: now, createdAt: now };
      setResponses(prev => ({ ...prev, [updateId]: fallback }));
      setAllResponses(prev => {
        const existing = (prev[updateId] ?? []).filter(r => r.caregiverId !== session.profileId);
        return { ...prev, [updateId]: [...existing, fallback] };
      });
    }
  };

  // Build patient identity map from connections
  const activeConnections = connections.filter(c => c.status === 'active');
  const patientMap = new Map<string, { displayName: string; avatarIcon: string | null | undefined }>(
    activeConnections.map(c => [c.patientId, { displayName: c.patientDisplayName ?? 'Patient', avatarIcon: c.patientAvatarIcon }])
  );

  // Map of follower ID → display name for "Sent to" labels on cards
  const helperDisplayNames = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of activeConnections) {
      m.set(c.followerId, c.followerDisplayName ?? 'Helper');
    }
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections]);

  // Determine if we have multiple distinct patients in the feed
  const patientIds = [...new Set(updates.map(u => u.patientId))];
  const isMultiPatient = patientIds.length > 1 || (patientIds.length === 1 && patientMap.has(patientIds[0]));

  // Group updates by patient, preserving chronological order across groups
  const grouped: Array<{ patientId: string; updateList: StatusUpdate[] }> = [];
  for (const pid of patientIds) {
    grouped.push({ patientId: pid, updateList: updates.filter(u => u.patientId === pid) });
  }

  const totalUnseen = updates.filter(u => !responses[u.id]?.seenAt).length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.25em] text-off-white/60">Helper</p>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-white">Patient Updates</p>
              {totalUnseen > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bold-blue px-1.5 text-[10px] font-bold text-white">
                  {totalUnseen}
                </span>
              )}
            </div>
            {isMultiPatient && patientIds.length > 1 && (
              <p className="mt-0.5 text-xs text-off-white/70">
                {patientIds.length} patients
              </p>
            )}
          </div>
          <button
            onClick={() => void loadFeed(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-full border border-periwinkle/20 px-3 py-1.5 text-xs text-off-white/70 transition-all hover:border-periwinkle/40 hover:text-off-white disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {updates.length === 0 ? (
          <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-14 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-off-white/60" />
            <p className="text-sm text-off-white/90">No updates yet</p>
            {activeConnections.length === 0 ? (
              <button
                onClick={onNavigateToConnections}
                className="mt-2 text-xs text-periwinkle underline underline-offset-2 transition-opacity hover:opacity-80"
              >
                Connect with a patient to see their updates here
              </button>
            ) : (
              <p className="mt-1 text-xs text-off-white/70">Patient updates will appear here once they send one</p>
            )}
          </div>
        ) : isMultiPatient && patientIds.length > 1 ? (
          /* Multi-patient grouped view */
          <div className="space-y-1">
            {grouped.map(({ patientId, updateList }) => {
              const patient = patientMap.get(patientId);
              const sectionUnseen = updateList.filter(u => !responses[u.id]?.seenAt).length;
              return (
                <div key={patientId}>
                  <PatientSectionHeader
                    displayName={patient?.displayName ?? 'Patient'}
                    avatarIcon={patient?.avatarIcon}
                    unseenCount={sectionUnseen}
                  />
                  <div className="space-y-3">
                    {updateList.map((update, i) => (
                      <div
                        key={update.id}
                        className="animate-slide-up overflow-hidden transition-all duration-300"
                        style={{
                          animationDelay: `${i * 40}ms`,
                          opacity: removingFromFeed.has(update.id) ? 0 : 1,
                          maxHeight: removingFromFeed.has(update.id) ? '0px' : '800px',
                          marginBottom: removingFromFeed.has(update.id) ? '0px' : undefined,
                        }}
                      >
                        <UpdateFeedCard
                          update={update}
                          response={responses[update.id] ?? null}
                          allResponses={allResponses[update.id] ?? []}
                          currentProfileId={session.profileId}
                          helperDisplayNames={helperDisplayNames}
                          isArchived={archivedIds.has(update.id)}
                          onRespond={handleRespond}
                          onToggleArchive={handleToggleArchive}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single patient — show their name once at top if known, then flat list */
          <div>
            {isMultiPatient && patientIds.length === 1 && patientMap.has(patientIds[0]) && (
              <PatientSectionHeader
                displayName={patientMap.get(patientIds[0])!.displayName}
                avatarIcon={patientMap.get(patientIds[0])!.avatarIcon}
                unseenCount={0}
              />
            )}
            <div className="space-y-3">
              {updates.map((update, i) => (
                <div
                  key={update.id}
                  className="animate-slide-up overflow-hidden transition-all duration-300"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    opacity: removingFromFeed.has(update.id) ? 0 : 1,
                    maxHeight: removingFromFeed.has(update.id) ? '0px' : '800px',
                    marginBottom: removingFromFeed.has(update.id) ? '0px' : undefined,
                  }}
                >
                  <UpdateFeedCard
                    update={update}
                    response={responses[update.id] ?? null}
                    allResponses={allResponses[update.id] ?? []}
                    currentProfileId={session.profileId}
                    helperDisplayNames={helperDisplayNames}
                    isArchived={archivedIds.has(update.id)}
                    onRespond={handleRespond}
                    onToggleArchive={handleToggleArchive}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
