import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Clock, Hourglass, Zap, MessageSquare, X, ArchiveX, EyeOff, MessageCircle, CheckCircle2 } from 'lucide-react';
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
    <div className={`flex overflow-hidden rounded-2xl border bg-midnight-black/60 shadow-lg transition-all duration-300 ${
      removing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    } border-periwinkle/20`}>
      {isNeedsOnly && <div className="w-1 shrink-0 bg-periwinkle" />}

      <div className="flex-1 min-w-0">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-off-white/70">
              {isNeedsOnly ? 'Needs' : 'Status'}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-off-white/60">{formatDistanceToNow(update.sentAt)}</span>
              <button
                onClick={() => onUnarchive(update.id)}
                disabled={removing}
                className="text-off-white/30 transition-colors hover:text-off-white/70 active:scale-90 disabled:opacity-30"
                title="Remove from archive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
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

          {isNeedsOnly && (
            priority ? (() => {
              const PriorityIcon = priority.icon;
              return (
                <div className={`mb-3 flex items-center gap-3 overflow-hidden rounded-lg border ${priority.banner}`}>
                  <div className={`w-1 self-stretch shrink-0 ${priority.stripe}`} />
                  <PriorityIcon className={`h-5 w-5 shrink-0 ${priority.iconClass}`} />
                  <div className="py-2 pr-3">
                    <p className="text-sm font-bold text-white leading-none">{priority.label}</p>
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
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
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
    const data = await getPatientArchivedUpdates(session);
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6">

        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-full p-2 text-off-white/60 transition-colors hover:bg-white/5 hover:text-off-white active:scale-90"
          >
            <LucideIcons.ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-0.5">Archive</p>
            <p className="text-sm text-off-white/60">Your archived updates</p>
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
            <p className="mt-1 text-xs text-off-white/50">Tap the archive icon on any update to save it here</p>
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
    </div>
  );
}
