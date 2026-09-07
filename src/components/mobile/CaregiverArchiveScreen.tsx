import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Clock, Hourglass, Zap, CheckCircle, Check, Send, ChevronDown, ChevronUp, MessageSquare, Archive, X } from 'lucide-react';
import type { AppSession, CaregiverResponse, NeedPriority, StatusUpdate } from '../../types/app';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS, stripNeedSpeechFromMessage } from '../../utils/communicationData';
import { formatDistanceToNow } from './time';
import {
  getArchivedUpdates,
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
  onRespond,
  onUnarchive,
  removing,
}: {
  update: StatusUpdate;
  response: CaregiverResponse | null;
  onRespond: (updateId: string, message: string) => Promise<void>;
  onUnarchive: (updateId: string) => void;
  removing: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [customNote, setCustomNote] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [checkedNeeds, setCheckedNeeds] = React.useState<Set<string>>(new Set());

  const toggleNeed = (id: string) =>
    setCheckedNeeds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const energy = update.energyStatus ? ENERGY_STATUSES.find(e => e.id === update.energyStatus) : null;
  const needs = (update.selectedNeeds ?? []).map(id => NEEDS.find(n => n.id === id)).filter(Boolean) as typeof NEEDS;
  const symptoms = (update.selectedSymptoms ?? []).map(id => SYMPTOMS.find(s => s.id === id)).filter(Boolean) as typeof SYMPTOMS;
  const priority = update.needPriority && PRIORITY_CONFIG[update.needPriority] ? PRIORITY_CONFIG[update.needPriority] : null;
  const energyStyle = energy ? (energyStyles[energy.id] ?? energyStyles.resting) : null;
  const isNeedsOnly = !energy && needs.length > 0 && symptoms.length === 0;
  const hasResponse = Boolean(response?.message);

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
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border bg-midnight-black/60 shadow-lg transition-all duration-300 ${
      removing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    } border-periwinkle/20`}>
      {isNeedsOnly && <div className="h-1 bg-periwinkle" />}

      <button
        onClick={() => onUnarchive(update.id)}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-off-white/40 transition-all hover:text-off-white/70 active:scale-90 z-10"
        title="Remove from archive"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="p-4">
          {/* Header */}
          <div className="mb-3 flex items-center gap-2 pr-8">
            <span className="text-xs uppercase tracking-[0.2em] text-off-white/70">
              {isNeedsOnly ? 'Needs' : 'Status'}
            </span>
            <span className="text-xs text-off-white/60">{formatDistanceToNow(update.sentAt)}</span>
          </div>

          {/* Message / appreciation text */}
          {update.messageText && (() => {
            const stripped = stripNeedSpeechFromMessage(update.messageText, update.selectedNeeds ?? []);
            return stripped ? (
              <p className="mb-3 text-sm leading-relaxed text-off-white/80 whitespace-pre-wrap">{stripped}</p>
            ) : null;
          })()}

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
            <div className="mb-2 space-y-1.5">
              {needs.map(need => {
                const Icon = LucideIcons[need.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                const checked = checkedNeeds.has(need.id);
                return (
                  <button
                    key={need.id}
                    onClick={() => toggleNeed(need.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98] ${
                      checked
                        ? 'border-green-600/40 bg-green-950/40'
                        : 'border-bold-blue/40 bg-bold-blue/15'
                    }`}
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      checked ? 'border-green-400 bg-green-400' : 'border-periwinkle/50 bg-transparent'
                    }`}>
                      {checked && <Check className="h-3 w-3 text-midnight-black" strokeWidth={3} />}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {Icon && <Icon className={`h-4 w-4 shrink-0 transition-colors ${checked ? 'text-green-400' : 'text-periwinkle'}`} />}
                      <span className={`text-sm font-semibold transition-colors ${checked ? 'text-green-300 line-through decoration-green-600/60' : 'text-white'}`}>
                        {need.label}
                      </span>
                    </div>
                    {checked && <span className="text-xs text-green-400 shrink-0">Done</span>}
                  </button>
                );
              })}
            </div>
          )}

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
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
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
                <div className="mt-3 space-y-2">
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
  const [updates, setUpdates] = React.useState<StatusUpdate[]>([]);
  const [responses, setResponses] = React.useState<Record<string, CaregiverResponse>>({});
  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    const archived = await getArchivedUpdates(session);
    setUpdates(archived);
    if (archived.length > 0) {
      const ids = archived.map(u => u.id);
      const resps = await getResponsesForUpdates(session.profileId, ids);
      setResponses(resps);
    }
    setIsLoading(false);
  }, [session]);

  React.useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.profileId, refreshToken]);

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
    } else {
      const now = new Date().toISOString();
      setResponses(prev => ({
        ...prev,
        [updateId]: { id: crypto.randomUUID(), statusUpdateId: updateId, caregiverId: session.profileId, message, seenAt: now, createdAt: now },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-off-white/60">Helper</p>
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-bold-blue" />
            <p className="text-base font-semibold text-white">Archive</p>
          </div>
          <p className="mt-1 text-xs text-off-white/50">Up to 20 updates</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-14 text-center">
            <Archive className="mx-auto mb-3 h-8 w-8 text-off-white/30" />
            <p className="text-sm text-off-white/70">Archive is empty</p>
            <p className="mt-1 text-xs text-off-white/50">Tap the bookmark icon on any feed card to archive it</p>
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map((update, i) => (
              <div
                key={update.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <ArchivedUpdateCard
                  update={update}
                  response={responses[update.id] ?? null}
                  onRespond={handleRespond}
                  onUnarchive={handleUnarchive}
                  removing={removingIds.has(update.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
