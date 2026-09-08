import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Clock, Hourglass, Zap, CheckCircle, Send, ChevronDown, ChevronUp, Archive, X, Eye, Users } from 'lucide-react';
import type { AppSession, CaregiverResponse, Connection, NeedPriority, StatusUpdate } from '../../types/app';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS, stripNeedSpeechFromMessage } from '../../utils/communicationData';
import AvatarIcon from '../AvatarIcon';
import { formatDistanceToNow } from './time';
import {
  getAllResponsesForUpdates,
  getArchivedUpdates,
  getFollowerConnections,
  getResponsesForUpdates,
  sendCaregiverResponse,
  unarchiveUpdate,
} from '../../services/backend';

const PRIORITY_CONFIG: Record<NeedPriority, {
  label: string; sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  banner: string; stripe: string; iconClass: string;
}> = {
  when_you_can: { label: 'When you can', sublabel: 'No rush',                        icon: Clock,     banner: 'bg-teal-900/60 border-teal-600/40',  stripe: 'bg-teal-500',  iconClass: 'text-teal-300'  },
  soon:         { label: 'Soon',          sublabel: 'Within the next hour',           icon: Hourglass, banner: 'bg-amber-900/60 border-amber-600/40', stripe: 'bg-amber-400', iconClass: 'text-amber-300' },
  asap:         { label: 'Need ASAP',     sublabel: "Please stop what you're doing",  icon: Zap,       banner: 'bg-red-900/70 border-red-500/50',     stripe: 'bg-red-500',   iconClass: 'text-red-300'   },
};

const energyStyles: Record<string, { pill: string; dot: string; bar: string }> = {
  crashing:  { pill: 'bg-red-950/70 border-red-600/50 text-red-200',         dot: 'bg-red-500',    bar: 'bg-red-700'    },
  low:       { pill: 'bg-amber-950/70 border-amber-600/50 text-amber-200',   dot: 'bg-amber-400',  bar: 'bg-amber-600'  },
  resting:   { pill: 'bg-yellow-950/70 border-yellow-600/50 text-yellow-200', dot: 'bg-yellow-400', bar: 'bg-yellow-600' },
  available: { pill: 'bg-green-950/70 border-green-600/50 text-green-200',    dot: 'bg-green-400',  bar: 'bg-green-600'  },
};

const QUICK_REPLIES_STATUS = ['Do you need anything?', 'Let me know if I can help', 'I am here for you'];
const QUICK_REPLIES_NEEDS = ['On it!', 'Be there soon', 'Coming in 10 minutes'];

// ─── Archived card ────────────────────────────────────────────────────────────

function ArchivedUpdateCard({
  update,
  response,
  allResponses,
  currentProfileId,
  onRespond,
  onUnarchive,
  removing,
}: {
  update: StatusUpdate;
  response: CaregiverResponse | null;
  allResponses: CaregiverResponse[];
  currentProfileId: string;
  onRespond: (updateId: string, message: string) => Promise<void>;
  onUnarchive: (updateId: string) => void;
  removing: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [customNote, setCustomNote] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const energy = update.energyStatus ? ENERGY_STATUSES.find(e => e.id === update.energyStatus) : null;
  const needs = (update.selectedNeeds ?? []).map(id => NEEDS.find(n => n.id === id)).filter(Boolean) as typeof NEEDS;
  const symptoms = (update.selectedSymptoms ?? []).map(id => SYMPTOMS.find(s => s.id === id)).filter(Boolean) as typeof SYMPTOMS;
  const priority = update.needPriority && PRIORITY_CONFIG[update.needPriority] ? PRIORITY_CONFIG[update.needPriority] : null;
  const energyStyle = energy ? (energyStyles[energy.id] ?? energyStyles.resting) : null;
  const isNeedsOnly = !energy && needs.length > 0 && symptoms.length === 0;
  const hasResponse = Boolean(response?.message);
  const isCompleted = Boolean(update.completedAt);

  const othersReplied = allResponses.filter(r => r.caregiverId !== currentProfileId && r.message?.trim());
  const othersSeen = allResponses.filter(r => r.caregiverId !== currentProfileId && r.seenAt && !r.message?.trim());

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
    <div className={`flex flex-col overflow-hidden rounded-2xl border bg-midnight-black/60 shadow-lg transition-all duration-300 ${
      removing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    } ${isCompleted ? 'border-green-700/40' : 'border-periwinkle/20'}`}>
      {isNeedsOnly && <div className="h-1 bg-periwinkle" />}

      <div className="flex-1 min-w-0">
        <div className="p-4">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-off-white/60">{formatDistanceToNow(update.sentAt)}</span>
              {isCompleted && (
                <>
                  <span className="text-off-white/30">·</span>
                  <span className="text-xs text-green-400">Completed</span>
                </>
              )}
            </div>
            <button
              onClick={() => onUnarchive(update.id)}
              aria-label="Remove from archive"
              className="rounded-lg p-1.5 text-off-white/60 transition-all hover:text-off-white/90 active:scale-90"
              title="Remove from archive"
            >
              <X className="h-5 w-5" />
            </button>
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
                      aria-label="Write a note to send"
                      className="flex-1 rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-3 py-2 text-base text-white placeholder-off-white/60 outline-none focus:border-bold-blue focus:ring-1 focus:ring-bold-blue/20"
                    />
                    <button
                      onClick={() => void handleSendNote()}
                      disabled={!customNote.trim() || sending}
                      aria-label="Send note"
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

// ─── Main archive screen ──────────────────────────────────────────────────────

interface CaregiverArchiveScreenProps {
  session: AppSession;
  refreshToken?: number;
}

export default function CaregiverArchiveScreen({ session, refreshToken }: CaregiverArchiveScreenProps) {
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [updates, setUpdates] = React.useState<StatusUpdate[]>([]);
  const [responses, setResponses] = React.useState<Record<string, CaregiverResponse>>({});
  const [allResponses, setAllResponses] = React.useState<Record<string, CaregiverResponse[]>>({});
  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(true);
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

  const activeConnections = connections.filter(c => c.status === 'active');
  const patientMap = new Map<string, { displayName: string; avatarIcon: string | null | undefined }>(
    activeConnections.map(c => [c.patientId, { displayName: c.patientDisplayName ?? 'Patient', avatarIcon: c.patientAvatarIcon }])
  );

  const allPatientIds = React.useMemo(() => {
    return [...patientMap.keys()].sort((a, b) =>
      (patientMap.get(a)?.displayName ?? '').localeCompare(patientMap.get(b)?.displayName ?? '')
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections]);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    const [conns, archived] = await Promise.all([
      getFollowerConnections(session),
      getArchivedUpdates(session),
    ]);
    setConnections(conns);
    const needsOnly = archived.filter(u => (u.selectedNeeds ?? []).length > 0);
    setUpdates(needsOnly);
    if (needsOnly.length > 0) {
      const ids = needsOnly.map(u => u.id);
      const [resps, allResps] = await Promise.all([
        getResponsesForUpdates(session.profileId, ids),
        getAllResponsesForUpdates(ids),
      ]);
      setResponses(resps);
      setAllResponses(allResps);
    }
    setIsLoading(false);
  }, [session]);

  React.useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.profileId, refreshToken]);

  // Auto-select first patient when connections load
  React.useEffect(() => {
    if (allPatientIds.length === 0) return;
    if (!selectedPatientId || !allPatientIds.includes(selectedPatientId)) {
      setSelectedPatientId(allPatientIds[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPatientIds]);

  const selectedUpdates = selectedPatientId
    ? updates.filter(u => u.patientId === selectedPatientId)
    : updates;

  const handleUnarchive = (updateId: string) => {
    setRemovingIds(prev => new Set(prev).add(updateId));
    void unarchiveUpdate(session.profileId, updateId).then(() => {
      setTimeout(() => {
        setUpdates(prev => prev.filter(u => u.id !== updateId));
        setRemovingIds(prev => {
          const next = new Set(prev);
          next.delete(updateId);
          return next;
        });
      }, 300);
    });
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="sr-only">Archive</h1>

        {/* Header */}
        <div className="mb-6">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-off-white/70">Helper</p>
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-bold-blue" />
            <p className="text-base font-semibold text-white">Archive</p>
          </div>
          <p className="mt-1 text-xs text-off-white/70">Up to 20 updates</p>
        </div>

        {/* Patient selector */}
        {allPatientIds.length > 1 && (
          <div className="relative mb-5" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen(v => !v)}
              aria-label={`Select patient, currently ${selectedPatientId ? patientMap.get(selectedPatientId)?.displayName ?? 'All patients' : 'All patients'}`}
              aria-expanded={pickerOpen}
              aria-haspopup="listbox"
              className="flex w-full items-center gap-2.5 rounded-2xl border border-periwinkle/20 bg-midnight-black/50 px-4 py-3 transition-all hover:border-periwinkle/40 active:scale-[0.99]"
            >
              <AvatarIcon iconId={selectedPatientId ? patientMap.get(selectedPatientId)?.avatarIcon : undefined} size="sm" />
              <span className="flex-1 text-left text-sm font-medium text-off-white">
                {selectedPatientId ? patientMap.get(selectedPatientId)?.displayName ?? 'Patient' : 'All patients'}
              </span>
              <ChevronDown className={`h-4 w-4 text-off-white/50 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
            </button>
            {pickerOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-periwinkle/25 bg-midnight-black/95 shadow-2xl shadow-black/60 backdrop-blur-md">
                <div className="max-h-80 overflow-y-auto py-1.5">
                  {allPatientIds.map(pid => {
                    const patient = patientMap.get(pid);
                    const isActive = pid === selectedPatientId;
                    const count = updates.filter(u => u.patientId === pid).length;
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
                        {count > 0 && (
                          <span className="text-xs text-off-white/50">{count}</span>
                        )}
                        {isActive && <CheckCircle className="h-4 w-4 text-bold-blue" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : selectedUpdates.length === 0 ? (
          <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-14 text-center">
            <Archive className="mx-auto mb-3 h-8 w-8 text-off-white/30" />
            <p className="text-sm text-off-white/80">{allPatientIds.length === 0 ? 'No connections yet' : 'No archived needs'}</p>
            <p className="mt-1 text-xs text-off-white/70">{allPatientIds.length === 0 ? 'Connect with a patient to see their updates' : 'Tap the bookmark icon on any feed card to archive it'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedUpdates.map((update, i) => (
              <div
                key={update.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <ArchivedUpdateCard
                  update={update}
                  response={responses[update.id] ?? null}
                  allResponses={allResponses[update.id] ?? []}
                  currentProfileId={session.profileId}
                  onRespond={handleRespond}
                  onUnarchive={handleUnarchive}
                  removing={removingIds.has(update.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
