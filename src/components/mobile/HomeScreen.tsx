import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Activity, MessageSquare, Stethoscope, Clock, Hourglass, Zap, ChevronRight, Eye, EyeOff, MessageCircle } from 'lucide-react';
import type { NavRoute } from './BottomNavigation';
import type { CaregiverResponse, NeedPriority, StatusUpdate } from '../../types/app';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS } from '../../utils/communicationData';
import { formatDistanceToNow } from './time';
import { getResponsesForPatient } from '../../services/backend';

interface HomeScreenProps {
  recentUpdates: StatusUpdate[];
  onNavigate: (route: NavRoute) => void;
}

const navigationCards = [
  {
    id: 'status' as NavRoute,
    icon: Activity,
    title: 'Status',
    description: 'Update your energy level and how you are feeling',
    isHospitalMode: false,
  },
  {
    id: 'needs' as NavRoute,
    icon: MessageSquare,
    title: 'Needs',
    description: 'Notify your helper. What do you need?',
    isHospitalMode: false,
  },
  {
    id: 'hospital' as NavRoute,
    icon: Stethoscope,
    title: 'Hospital Mode',
    description: 'Quick phrases for hospital staff and visitors',
    isHospitalMode: true,
  },
];

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
    <div className={`rounded-2xl border bg-midnight-black/60 shadow-lg transition-all ${
      isSeen ? 'border-periwinkle/20' : 'border-periwinkle/20'
    } ${energyStyle?.glow ?? ''}`}>
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
          <div className="flex flex-wrap gap-1.5">
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
      </div>

      {/* Read receipt + helper note footer */}
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
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-off-white/30" />
            <p className="text-xs text-off-white/35">Seen by helper</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <EyeOff className="h-3.5 w-3.5 text-off-white/60" />
            <p className="text-xs text-off-white/70">Not yet seen</p>
          </div>
        )}
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

        {/* Feed */}
        <div className="mb-8">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-off-white/60">
            Recent Updates
          </p>

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

        {/* Navigation cards */}
        <div className="mb-3">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-off-white/60">
            Communicate
          </p>
          <div className="space-y-3">
            {navigationCards.map(({ id, icon: Icon, title, description, isHospitalMode }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`group w-full rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${
                  isHospitalMode
                    ? 'border-periwinkle/30 bg-periwinkle/10 hover:bg-periwinkle/15 hover:border-periwinkle/50'
                    : 'border-bold-blue/40 bg-bold-blue/20 hover:bg-bold-blue/30 hover:border-bold-blue/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${isHospitalMode ? 'bg-white/5' : 'bg-white/10'}`}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h2 className="mb-0.5 text-base font-semibold text-white">
                      {title}
                    </h2>
                    <p className="text-xs leading-relaxed text-white/70">
                      {description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
