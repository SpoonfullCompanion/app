import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Clock, Hourglass, Zap, CheckCircle, Send, ChevronDown, ChevronUp, MessageSquare, Users, RefreshCw, Archive, Eye, SendHorizontal as SendHorizonal, Check } from 'lucide-react';
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
  markUpdateResolved,
  markUpdatesSeen,
  sendCaregiverResponse,
  unarchiveUpdate,
  unmarkUpdateResolved,
} from '../../services/backend';
import AvatarIcon from '../AvatarIcon';
import LatestStatusSummary from './LatestStatusSummary';

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
  onToggleResolve,
}: {
  update: StatusUpdate;
  response: CaregiverResponse | null;
  allResponses: CaregiverResponse[];
  currentProfileId: string;
  helperDisplayNames: Map<string, string>;
  isArchived: boolean;
  onRespond: (updateId: string, message: string) => Promise<void>;
  onToggleArchive: (updateId: string) => void;
  onToggleResolve: (updateId: string, patientId: string) => void;
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
    <div className={`flex flex-col overflow-hidden rounded-2xl border bg-midnight-black/60 shadow-lg transition-all ${
      isResolved ? 'border-green-700/40 opacity-70' : isSeen ? 'border-periwinkle/20' : 'border-bold-blue/50 shadow-bold-blue/10'
    }`}>
      {isNeedsOnly && <div className="h-1 bg-periwinkle" />}

      <div className="flex-1 min-w-0">
        <div className="p-4">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {!isSeen && <span className="h-1.5 w-1.5 rounded-full bg-bold-blue" />}
              <span className="text-xs text-off-white/60">{formatDistanceToNow(update.sentAt)}</span>
              {isResolved && (
                <>
                  <span className="text-off-white/30">·</span>
                  <span className="text-xs text-green-400">Resolved</span>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                onClick={() => onToggleResolve(update.id, update.patientId)}
                className={`rounded-lg p-1.5 transition-all active:scale-90 ${
                  isResolved ? 'text-green-400' : 'text-off-white/50 hover:text-off-white'
                }`}
                title={isResolved ? 'Unmark resolved' : 'Mark resolved'}
              >
                {isResolved ? <CheckCircle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
              </button>
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

          {/* Inline priority label (needs-only) */}
          {isNeedsOnly && priority && (() => {
            const PriorityIcon = priority.icon;
            return (
              <div className="mb-2 flex items-center gap-1.5">
                <PriorityIcon className={`h-3.5 w-3.5 ${priority.iconClass}`} />
                <span className={`text-xs font-medium ${priority.iconClass}`}>{priority.label}</span>
                <span className="text-xs text-off-white/40">· {priority.sublabel}</span>
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
                      className="flex-1 rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-3 py-2 text-base text-white placeholder-off-white/50 outline-none focus:border-bold-blue focus:ring-1 focus:ring-bold-blue/20"
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
  latestStatus,
  onTogglePicker,
  pickerOpen,
  showSwitcher,
}: {
  displayName: string;
  avatarIcon: string | null | undefined;
  unseenCount: number;
  latestStatus: StatusUpdate | null;
  onTogglePicker?: () => void;
  pickerOpen?: boolean;
  showSwitcher?: boolean;
}) {
  return (
    <div className="flex flex-col items-center mb-5 mt-8 first:mt-0">
      <AvatarIcon iconId={avatarIcon} size="lg" />
      {showSwitcher && onTogglePicker ? (
        <button
          onClick={onTogglePicker}
          className="mt-2.5 flex items-center gap-1.5 transition-opacity hover:opacity-80 active:scale-[0.98]"
        >
          <p className="text-base font-semibold text-off-white">{displayName}</p>
          {unseenCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bold-blue px-1.5 text-[10px] font-bold text-white">
              {unseenCount}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-off-white/50 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <div className="mt-2.5 flex items-center gap-2">
          <p className="text-base font-semibold text-off-white">{displayName}</p>
          {unseenCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bold-blue px-1.5 text-[10px] font-bold text-white">
              {unseenCount}
            </span>
          )}
        </div>
      )}
      <p className="mt-0.5 text-xs text-off-white/45 tracking-wide">Patient</p>
      <div className="mt-3 w-full">
        <LatestStatusSummary update={latestStatus} />
      </div>
      <div className="mt-4 w-full h-px bg-periwinkle/10" />
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
  const [selectedPatientId, setSelectedPatientId] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

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

  const handleToggleResolve = (updateId: string, patientId: string) => {
    setUpdates(prev => prev.map(u =>
      u.id === updateId
        ? { ...u, resolvedAt: u.resolvedAt ? null : new Date().toISOString(), resolvedBy: u.resolvedAt ? null : session.profileId }
        : u
    ));
    const update = updates.find(u => u.id === updateId);
    if (update?.resolvedAt) {
      void unmarkUpdateResolved(updateId);
    } else {
      void markUpdateResolved(updateId, session.profileId, patientId).then(() => {
        setRemovingFromFeed(prev => new Set(prev).add(updateId));
        setTimeout(() => {
          setUpdates(prev => prev.filter(u => u.id !== updateId));
          setRemovingFromFeed(prev => {
            const next = new Set(prev);
            next.delete(updateId);
            return next;
          });
        }, 300);
        setArchivedIds(prev => new Set(prev).add(updateId));
        onArchiveChanged?.();
      });
    }
  };

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

  // All connected patients for the tab selector (ordered by display name)
  const allPatientIds = React.useMemo(() => {
    return [...patientMap.keys()].sort((a, b) =>
      (patientMap.get(a)?.displayName ?? '').localeCompare(patientMap.get(b)?.displayName ?? '')
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections]);

  // Map of follower ID → display name for "Sent to" labels on cards
  const helperDisplayNames = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of activeConnections) {
      m.set(c.followerId, c.followerDisplayName ?? 'Helper');
    }
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections]);

  // Status info = has energy or symptoms (featured at top as LatestStatusSummary)
  const hasStatusInfo = (u: StatusUpdate) =>
    (u.energyStatus != null && u.energyStatus !== '') ||
    (u.selectedSymptoms ?? []).length > 0;

  // Only updates with at least one need appear as cards in the feed list.
  // Status-only updates are shown once as the featured summary at the top.
  const hasNeeds = (u: StatusUpdate) => (u.selectedNeeds ?? []).length > 0;

  // Find latest update with energy/symptoms per patient (even if it also has needs)
  const latestStatusByPatient = new Map<string, StatusUpdate | null>();
  for (const u of updates.filter(hasStatusInfo)) {
    const existing = latestStatusByPatient.get(u.patientId);
    if (!existing || new Date(u.sentAt) > new Date(existing.sentAt)) {
      latestStatusByPatient.set(u.patientId, u);
    }
  }

  // Only needs-bearing updates appear as cards
  const feedCards = updates.filter(hasNeeds);

  // Determine if we have multiple distinct patients in the feed
  const patientIds = [...new Set(feedCards.map(u => u.patientId))];
  const isMultiPatient = patientIds.length > 1 || (patientIds.length === 1 && patientMap.has(patientIds[0]));

  // Auto-select first patient if none selected or selected patient disconnected
  React.useEffect(() => {
    if (allPatientIds.length === 0) return;
    if (!selectedPatientId || !allPatientIds.includes(selectedPatientId)) {
      // Prefer patient with unseen needs, otherwise first patient
      const patientWithUnseen = allPatientIds.find(pid =>
        feedCards.some(u => u.patientId === pid && !responses[u.id]?.seenAt)
      );
      setSelectedPatientId(patientWithUnseen ?? allPatientIds[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPatientIds, feedCards]);

  // Unseen count per patient (for tab badges)
  const unseenByPatient = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const u of feedCards) {
      if (!responses[u.id]?.seenAt) {
        m.set(u.patientId, (m.get(u.patientId) ?? 0) + 1);
      }
    }
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedCards, responses]);

  // Filter feed to selected patient only
  const selectedFeedCards = selectedPatientId
    ? feedCards.filter(u => u.patientId === selectedPatientId)
    : feedCards;

  const totalUnseen = feedCards.filter(u => !responses[u.id]?.seenAt).length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.25em] text-off-white/60">Helper</p>
            <p className="text-base font-semibold text-white">Patient Updates</p>
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

        {allPatientIds.length === 0 ? (
          <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-14 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-off-white/60" />
            <p className="text-sm text-off-white/90">No updates yet</p>
            <button
              onClick={onNavigateToConnections}
              className="mt-2 text-xs text-periwinkle underline underline-offset-2 transition-opacity hover:opacity-80"
            >
              Connect with a patient to see their updates here
            </button>
          </div>
        ) : selectedFeedCards.length === 0 ? (
          <div>
            {selectedPatientId && patientMap.has(selectedPatientId) && (
              <div className="relative" ref={pickerRef}>
                <PatientSectionHeader
                  displayName={patientMap.get(selectedPatientId)!.displayName}
                  avatarIcon={patientMap.get(selectedPatientId)!.avatarIcon}
                  unseenCount={0}
                  latestStatus={latestStatusByPatient.get(selectedPatientId) ?? null}
                  showSwitcher={allPatientIds.length > 1}
                  onTogglePicker={() => setPickerOpen(v => !v)}
                  pickerOpen={pickerOpen}
                />
                {pickerOpen && allPatientIds.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-periwinkle/25 bg-midnight-black/95 shadow-2xl shadow-black/60 backdrop-blur-md">
                    <div className="max-h-80 overflow-y-auto py-1.5">
                      {allPatientIds.map(pid => {
                        const patient = patientMap.get(pid);
                        const isActive = pid === selectedPatientId;
                        const unseen = unseenByPatient.get(pid) ?? 0;
                        return (
                          <button
                            key={pid}
                            onClick={() => { setSelectedPatientId(pid); setPickerOpen(false); }}
                            className={`flex w-full items-center gap-2.5 px-3 py-2.5 transition-all active:scale-[0.98] ${
                              isActive ? 'bg-bold-blue/15' : 'hover:bg-white/5'
                            }`}
                          >
                            <AvatarIcon iconId={patient?.avatarIcon} size="sm" />
                            <span className={`flex-1 text-left text-sm font-medium ${isActive ? 'text-white' : 'text-off-white/80'}`}>
                              {patient?.displayName ?? 'Patient'}
                            </span>
                            {unseen > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bold-blue px-1.5 text-[10px] font-bold text-white">
                                {unseen}
                              </span>
                            )}
                            {isActive && <Check className="h-4 w-4 text-bold-blue" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-14 text-center">
              <MessageSquare className="mx-auto mb-3 h-8 w-8 text-off-white/60" />
              <p className="text-sm text-off-white/90">No needs right now</p>
              <p className="mt-1 text-xs text-off-white/70">Needs requests from the patient will appear here</p>
            </div>
          </div>
        ) : (
          <div>
            {selectedPatientId && patientMap.has(selectedPatientId) && (
              <div className="relative" ref={pickerRef}>
                <PatientSectionHeader
                  displayName={patientMap.get(selectedPatientId)!.displayName}
                  avatarIcon={patientMap.get(selectedPatientId)!.avatarIcon}
                  unseenCount={unseenByPatient.get(selectedPatientId) ?? 0}
                  latestStatus={latestStatusByPatient.get(selectedPatientId) ?? null}
                  showSwitcher={allPatientIds.length > 1}
                  onTogglePicker={() => setPickerOpen(v => !v)}
                  pickerOpen={pickerOpen}
                />
                {pickerOpen && allPatientIds.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-periwinkle/25 bg-midnight-black/95 shadow-2xl shadow-black/60 backdrop-blur-md">
                    <div className="max-h-80 overflow-y-auto py-1.5">
                      {allPatientIds.map(pid => {
                        const patient = patientMap.get(pid);
                        const isActive = pid === selectedPatientId;
                        const unseen = unseenByPatient.get(pid) ?? 0;
                        return (
                          <button
                            key={pid}
                            onClick={() => { setSelectedPatientId(pid); setPickerOpen(false); }}
                            className={`flex w-full items-center gap-2.5 px-3 py-2.5 transition-all active:scale-[0.98] ${
                              isActive ? 'bg-bold-blue/15' : 'hover:bg-white/5'
                            }`}
                          >
                            <AvatarIcon iconId={patient?.avatarIcon} size="sm" />
                            <span className={`flex-1 text-left text-sm font-medium ${isActive ? 'text-white' : 'text-off-white/80'}`}>
                              {patient?.displayName ?? 'Patient'}
                            </span>
                            {unseen > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bold-blue px-1.5 text-[10px] font-bold text-white">
                                {unseen}
                              </span>
                            )}
                            {isActive && <Check className="h-4 w-4 text-bold-blue" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3">
              {selectedFeedCards.map((update, i) => (
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
                    onToggleResolve={handleToggleResolve}
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
