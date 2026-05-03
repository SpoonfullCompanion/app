import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Activity, MessageSquare, Stethoscope, Clock, Hourglass, Zap, ChevronRight, EyeOff, MessageCircle, CheckCircle2 } from 'lucide-react';
import type { NavRoute } from './BottomNavigation';
import type { CaregiverResponse, NeedPriority, StatusUpdate } from '../../types/app';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS } from '../../utils/communicationData';
import { formatDistanceToNow } from './time';
import { getResponsesForPatient } from '../../services/backend';

interface HomeScreenProps {
  recentUpdates: StatusUpdate[];
  onNavigate: (route: NavRoute) => void;
}

const PRIORITY_CONFIG: Record<NeedPriority, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  when_you_can: { label: 'When you can', icon: Clock, className: 'bg-teal-700/80 border-teal-500/60 text-white' },
  soon: { label: 'Soon', icon: Hourglass, className: 'bg-amber-700/80 border-amber-500/60 text-white' },
  asap: { label: 'Need ASAP', icon: Zap, className: 'bg-red-700/80 border-red-500/60 text-white' },
};

const energyStyles: Record<string, { pill: string; dot: string; bar: string; stripe: string }> = {
  crashing:  { pill: 'bg-red-950/70 border-red-600/50 text-red-200',      dot: 'bg-red-500',    bar: 'bg-red-700',    stripe: 'bg-red-600' },
  low:       { pill: 'bg-orange-950/70 border-orange-600/50 text-orange-200', dot: 'bg-orange-400', bar: 'bg-orange-600', stripe: 'bg-orange-500' },
  resting:   { pill: 'bg-yellow-950/70 border-yellow-600/50 text-yellow-200', dot: 'bg-yellow-400', bar: 'bg-yellow-600', stripe: 'bg-yellow-500' },
  available: { pill: 'bg-green-950/70 border-green-600/50 text-green-200',  dot: 'bg-green-400',  bar: 'bg-green-600',  stripe: 'bg-green-500' },
};

function UpdateCard({ update, response }: { update: StatusUpdate; response: CaregiverResponse | null }) {
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
  const hasNote = Boolean(response?.message);

  return (
    <div className="flex overflow-hidden rounded-2xl border border-periwinkle/20 bg-midnight-black/60 shadow-lg">
      {/* Left color stripe keyed to energy level */}
      <div className={`w-1 shrink-0 ${energyStyle?.stripe ?? 'bg-white/60'}`} />

      <div className="flex-1 min-w-0">
        <div className="p-4">
          {/* Header row */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-off-white/40">
              {isNeedsOnly ? 'Needs' : 'Status'}
            </span>
            <span className="text-xs text-off-white/35">
              {formatDistanceToNow(update.sentAt)}
            </span>
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

          {/* Needs — solid bold-blue, clearly action-oriented */}
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

          {/* Symptoms — muted, informational */}
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {symptoms.map(symptom => {
                const Icon = LucideIcons[symptom.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                return (
                  <div key={symptom.id} className="flex items-center gap-1.5 rounded-lg bg-periwinkle/10 px-2.5 py-1 text-sm text-off-white/60">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {symptom.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Read receipt footer */}
        <div className="border-t border-white/5 px-4 py-3">
          {hasNote ? (
            <div className="flex items-start gap-2.5">
              <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bold-blue" />
              <div>
                <p className="mb-0.5 text-[10px] uppercase tracking-[0.15em] text-off-white/40">Helper replied</p>
                <p className="text-sm text-off-white/80 italic">{response!.message}</p>
              </div>
            </div>
          ) : isSeen ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-900/40 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              <p className="text-xs font-medium text-green-300">Helper saw this</p>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
              <EyeOff className="h-3.5 w-3.5 text-off-white/40" />
              <p className="text-xs text-off-white/50">Waiting for helper...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomeScreen({ recentUpdates, onNavigate }: HomeScreenProps) {
  const [responses, setResponses] = React.useState<Record<string, CaregiverResponse>>({});

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Recent updates section */}
        <div className="mb-8">
          <div className="mb-4">
            <p className="text-sm font-semibold text-off-white/80">Recent Updates</p>
            <p className="text-xs text-off-white/40">What you sent your helper</p>
          </div>

          {recentUpdates.length > 0 ? (
            <div className="space-y-3">
              {recentUpdates.map((update) => (
                <UpdateCard key={update.id} update={update} response={responses[update.id] ?? null} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-10 text-center">
              <p className="text-sm text-off-white/40">No updates sent yet</p>
              <p className="mt-1 text-xs text-off-white/25">Use Status or Needs below to communicate</p>
            </div>
          )}
        </div>

        {/* Action cards section */}
        <div className="mb-3">
          <div className="mb-4">
            <p className="text-sm font-semibold text-off-white/80">Communicate</p>
            <p className="text-xs text-off-white/40">Tap a card to send a message</p>
          </div>

          <div className="space-y-3">
            {/* Needs card — primary action, visually prominent */}
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
                  <p className="text-sm leading-relaxed text-white/75">Tell your helper what you need right now</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/50 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            {/* Status card */}
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
                  <p className="text-xs leading-relaxed text-white/65">Update your energy level and how you are feeling</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            {/* Hospital mode card */}
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
                  <p className="text-xs leading-relaxed text-white/65">Quick phrases for hospital staff and visitors</p>
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
