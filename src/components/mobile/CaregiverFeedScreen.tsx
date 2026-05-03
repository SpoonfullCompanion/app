import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Clock, Hourglass, Zap, CheckCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';
import type { AppSession, CaregiverResponse, NeedPriority, StatusUpdate } from '../../types/app';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS } from '../../utils/communicationData';
import { formatDistanceToNow } from './time';
import { getResponsesForUpdates, markUpdatesSeen, sendCaregiverResponse } from '../../services/backend';

interface CaregiverFeedScreenProps {
  session: AppSession;
  updates: StatusUpdate[];
}

const PRIORITY_CONFIG: Record<NeedPriority, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  when_you_can: { label: 'When you can', icon: Clock, className: 'bg-teal-700/80 border-teal-500/60 text-white' },
  soon: { label: 'Soon', icon: Hourglass, className: 'bg-amber-700/80 border-amber-500/60 text-white' },
  asap: { label: 'Need ASAP', icon: Zap, className: 'bg-red-700/80 border-red-500/60 text-white' },
};

const energyStyles: Record<string, { pill: string; glow: string; bar: string }> = {
  crashing: { pill: 'bg-red-800/50 border-red-700/60 text-white', glow: 'shadow-red-900/40', bar: 'bg-red-700' },
  low:      { pill: 'bg-orange-800/50 border-orange-700/60 text-white', glow: 'shadow-orange-900/40', bar: 'bg-orange-600' },
  resting:  { pill: 'bg-yellow-700/50 border-yellow-600/60 text-white', glow: 'shadow-yellow-900/30', bar: 'bg-yellow-600' },
  available:{ pill: 'bg-green-800/50 border-green-700/60 text-white', glow: 'shadow-green-900/40', bar: 'bg-green-600' },
};

const QUICK_REPLIES = ['Got it', 'On my way', 'Give me a few minutes', 'I\'ll be right there'];

function UpdateFeedCard({
  update,
  response,
  onRespond,
}: {
  update: StatusUpdate;
  response: CaregiverResponse | null;
  onRespond: (updateId: string, message: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [customNote, setCustomNote] = React.useState('');
  const [sending, setSending] = React.useState(false);

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
  const isSeen = Boolean(response?.seenAt);
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
    <div className={`rounded-2xl border bg-midnight-black/60 p-4 shadow-lg transition-all ${
      isSeen ? 'border-periwinkle/15' : 'border-bold-blue/50 shadow-bold-blue/10'
    } ${energyStyle?.glow ?? ''}`}>

      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-off-white/40">
            {isNeedsOnly ? 'Needs' : 'Status'}
          </span>
          {!isSeen && (
            <span className="h-1.5 w-1.5 rounded-full bg-bold-blue" />
          )}
        </div>
        <span className="text-xs text-off-white/35">
          {formatDistanceToNow(update.sentAt)}
        </span>
      </div>

      {/* Energy */}
      {energy && energyStyle && (() => {
        const Icon = LucideIcons[energy.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
        return (
          <div className="mb-3 flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold ${energyStyle.pill}`}>
              {Icon && <Icon className="h-4 w-4" />}
              {energy.label}
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

      {/* Priority */}
      {priority && (() => {
        const PriorityIcon = priority.icon;
        return (
          <div className={`mb-2 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold ${priority.className}`}>
            <PriorityIcon className="h-3 w-3" />
            {priority.label}
          </div>
        );
      })()}

      {/* Needs */}
      {needs.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {needs.map(need => {
            const Icon = LucideIcons[need.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
            return (
              <div key={need.id} className="flex items-center gap-1.5 rounded-lg bg-bold-blue/25 px-2.5 py-1 text-sm font-medium text-off-white/90">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {need.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Symptoms */}
      {symptoms.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {symptoms.map(symptom => {
            const Icon = LucideIcons[symptom.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
            return (
              <div key={symptom.id} className="flex items-center gap-1.5 rounded-lg bg-periwinkle/10 px-2.5 py-1 text-sm text-off-white/70">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {symptom.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Response area */}
      <div className="mt-3 border-t border-white/5 pt-3">
        {hasResponse ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
            <p className="text-sm text-off-white/60">
              You replied: <span className="text-off-white/80 italic">{response!.message}</span>
            </p>
          </div>
        ) : (
          <>
            {/* Quick reply bar */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleQuickReply('Got it')}
                disabled={sending}
                className="rounded-full border border-bold-blue/40 bg-bold-blue/20 px-4 py-1.5 text-sm font-medium text-off-white transition-all hover:bg-bold-blue/30 active:scale-95 disabled:opacity-50"
              >
                Got it
              </button>
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 rounded-full border border-periwinkle/30 bg-midnight-black/60 px-3 py-1.5 text-sm text-off-white/60 transition-all hover:border-periwinkle/50 hover:text-off-white/80 active:scale-95"
              >
                Note
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* Expanded reply panel */}
            {expanded && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.slice(1).map(msg => (
                    <button
                      key={msg}
                      onClick={() => void handleQuickReply(msg)}
                      disabled={sending}
                      className="rounded-lg border border-periwinkle/25 bg-periwinkle/10 px-3 py-1.5 text-xs text-off-white/80 transition-all hover:bg-periwinkle/20 active:scale-95 disabled:opacity-50"
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
                    className="flex-1 rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-3 py-2 text-sm text-white placeholder-off-white/30 outline-none focus:border-bold-blue focus:ring-1 focus:ring-bold-blue/20"
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
  );
}

export default function CaregiverFeedScreen({ session, updates }: CaregiverFeedScreenProps) {
  const [responses, setResponses] = React.useState<Record<string, CaregiverResponse>>({});

  React.useEffect(() => {
    if (!updates.length) return;

    const ids = updates.map(u => u.id);

    getResponsesForUpdates(session.profileId, ids).then(setResponses).catch(console.error);

    const unseenIds = updates
      .filter(u => !responses[u.id]?.seenAt)
      .map(u => u.id);

    if (unseenIds.length) {
      void markUpdatesSeen(session.profileId, unseenIds).then(() => {
        setResponses(prev => {
          const now = new Date().toISOString();
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
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updates, session.profileId]);

  const handleRespond = async (updateId: string, message: string) => {
    const result = await sendCaregiverResponse(session.profileId, updateId, message);
    if (result) {
      setResponses(prev => ({ ...prev, [updateId]: result }));
    } else {
      const now = new Date().toISOString();
      setResponses(prev => ({
        ...prev,
        [updateId]: {
          id: crypto.randomUUID(),
          statusUpdateId: updateId,
          caregiverId: session.profileId,
          message,
          seenAt: now,
          createdAt: now,
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">

        <div className="mb-6">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-off-white/60">Helper</p>
          <p className="text-base font-semibold text-white">Patient Updates</p>
        </div>

        {updates.length > 0 ? (
          <div className="space-y-3">
            {updates.map((update, i) => (
              <div
                key={update.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <UpdateFeedCard
                  update={update}
                  response={responses[update.id] ?? null}
                  onRespond={handleRespond}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-14 text-center">
            <p className="text-sm text-off-white/40">No updates yet</p>
            <p className="mt-1 text-xs text-off-white/25">Patient updates will appear here once paired</p>
          </div>
        )}
      </div>
    </div>
  );
}
