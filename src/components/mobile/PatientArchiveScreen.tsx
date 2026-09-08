import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Clock, Hourglass, Zap, X, ArchiveX, EyeOff, MessageCircle, CheckCircle } from 'lucide-react';
import type { AppSession, CaregiverResponse, NeedPriority, StatusUpdate } from '../../types/app';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS, stripNeedSpeechFromMessage } from '../../utils/communicationData';
import { formatDistanceToNow } from './time';
import { getPatientArchivedUpdates, unarchivePatientUpdate, getResponsesForPatient } from '../../services/backend';

interface PatientArchiveScreenProps {
  session: AppSession;
  onBack: () => void;
}

const PRIORITY_CONFIG: Record<NeedPriority, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  banner: string; stripe: string; iconClass: string;
}> = {
  when_you_can: { label: 'When you can', icon: Clock,     banner: 'bg-teal-900/60 border-teal-600/40',  stripe: 'bg-teal-500',  iconClass: 'text-teal-300'  },
  soon:         { label: 'Soon',          icon: Hourglass, banner: 'bg-amber-900/60 border-amber-600/40', stripe: 'bg-amber-400', iconClass: 'text-amber-300' },
  asap:         { label: 'Need ASAP',     icon: Zap,       banner: 'bg-red-900/70 border-red-500/50',     stripe: 'bg-red-500',   iconClass: 'text-red-300'   },
};

const energyStyles: Record<string, { pill: string; dot: string; bar: string }> = {
  crashing:  { pill: 'bg-red-950/70 border-red-600/50 text-red-200',         dot: 'bg-red-500',    bar: 'bg-red-700'    },
  low:       { pill: 'bg-amber-950/70 border-amber-600/50 text-amber-200',   dot: 'bg-amber-400',  bar: 'bg-amber-600'  },
  resting:   { pill: 'bg-yellow-950/70 border-yellow-600/50 text-yellow-200', dot: 'bg-yellow-400', bar: 'bg-yellow-600' },
  available: { pill: 'bg-green-950/70 border-green-600/50 text-green-200',    dot: 'bg-green-400',  bar: 'bg-green-600'  },
};

function ArchivedCard({
  update,
  response,
  onUnarchive,
  removing,
}: {
  update: StatusUpdate;
  response: CaregiverResponse | null;
  onUnarchive: (id: string) => void;
  removing: boolean;
}) {
  const energy = update.energyStatus ? ENERGY_STATUSES.find(e => e.id === update.energyStatus) : null;
  const needs = (update.selectedNeeds ?? []).map(id => NEEDS.find(n => n.id === id)).filter(Boolean) as typeof NEEDS;
  const symptoms = (update.selectedSymptoms ?? []).map(id => SYMPTOMS.find(s => s.id === id)).filter(Boolean) as typeof SYMPTOMS;
  const priority = update.needPriority && PRIORITY_CONFIG[update.needPriority] ? PRIORITY_CONFIG[update.needPriority] : null;
  const energyStyle = energy ? (energyStyles[energy.id] ?? energyStyles.resting) : null;
  const isNeedsOnly = !energy && needs.length > 0 && symptoms.length === 0;
  const isSeen = Boolean(response?.seenAt);
  const hasNote = Boolean(response?.message);

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border bg-midnight-black/60 shadow-lg transition-all duration-300 ${
      removing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    } border-periwinkle/20`}>
      {isNeedsOnly && <div className="h-1 bg-periwinkle" />}

      <button
        onClick={() => onUnarchive(update.id)}
        disabled={removing}
        aria-label="Remove from archive"
        className="absolute right-2 top-2 rounded-lg p-1.5 text-off-white/60 transition-all hover:text-off-white/90 active:scale-90 disabled:opacity-30 z-10"
        title="Remove from archive"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2 pr-8">
            <span className="text-xs uppercase tracking-[0.2em] text-off-white/70">
              {isNeedsOnly ? 'Needs' : 'Status'}
            </span>
            <span className="text-xs text-off-white/60">{formatDistanceToNow(update.sentAt)}</span>
          </div>

          {update.messageText && (() => {
            const stripped = stripNeedSpeechFromMessage(update.messageText, update.selectedNeeds ?? []);
            return stripped ? (
              <p className="mb-3 text-sm leading-relaxed text-off-white/80 whitespace-pre-wrap">{stripped}</p>
            ) : null;
          })()}

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

        <div className="border-t border-white/5 px-4 py-3">
          {hasNote ? (
            <div className="flex items-start gap-2.5">
              <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bold-blue" />
              <div>
                <p className="mb-0.5 text-[10px] uppercase tracking-[0.15em] text-off-white/70">Helper replied</p>
                <p className="text-sm text-off-white italic">{response!.message}</p>
              </div>
            </div>
          ) : isSeen ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-900/40 px-3 py-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              <p className="text-xs font-medium text-green-300">Helper saw this</p>
            </div>
          ) : (
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

export default function PatientArchiveScreen({ session, onBack }: PatientArchiveScreenProps) {
  const [updates, setUpdates] = React.useState<StatusUpdate[]>([]);
  const [responses, setResponses] = React.useState<Record<string, CaregiverResponse>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    const data = (await getPatientArchivedUpdates(session)).filter(u => (u.selectedNeeds ?? []).length > 0);
    setUpdates(data);
    if (data.length > 0) {
      const ids = data.map(u => u.id);
      getResponsesForPatient(ids).then(setResponses).catch(console.error);
    }
    setIsLoading(false);
  }, [session]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleUnarchive = async (updateId: string) => {
    setRemovingId(updateId);
    await unarchivePatientUpdate(session.profileId, updateId);
    setTimeout(() => {
      setUpdates(prev => prev.filter(u => u.id !== updateId));
      setRemovingId(null);
    }, 300);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="sr-only">Archive</h1>

        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Go back"
            className="rounded-full p-2 text-off-white/70 transition-colors hover:bg-white/5 hover:text-off-white active:scale-90"
          >
            <LucideIcons.ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-off-white/70 mb-0.5">Archive</p>
            <p className="text-sm text-off-white/80">Your archived updates</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LucideIcons.Loader className="h-5 w-5 animate-spin text-periwinkle/60" />
          </div>
        ) : updates.length === 0 ? (
          <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-16 text-center">
            <ArchiveX className="mx-auto mb-3 h-8 w-8 text-off-white/30" />
            <p className="text-sm text-off-white/80">Nothing archived yet</p>
            <p className="mt-1 text-xs text-off-white/70">Tap the archive icon on any update to save it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map(update => (
              <ArchivedCard
                key={update.id}
                update={update}
                response={responses[update.id] ?? null}
                onUnarchive={handleUnarchive}
                removing={removingId === update.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
