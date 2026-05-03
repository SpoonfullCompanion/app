import * as LucideIcons from 'lucide-react';
import { Clock, Hourglass, Zap } from 'lucide-react';
import { formatDistanceToNow } from './time';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS } from '../../utils/communicationData';
import type { NeedPriority, StatusUpdate } from '../../types/app';

const PRIORITY_CONFIG: Record<NeedPriority, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  when_you_can: { label: 'When you can', icon: Clock, className: 'bg-teal-700 border-teal-500' },
  soon: { label: 'Soon', icon: Hourglass, className: 'bg-amber-700 border-amber-500' },
  asap: { label: 'Need ASAP', icon: Zap, className: 'bg-red-700 border-red-500' },
};

interface StatusSummaryCardProps {
  update: StatusUpdate | null;
  emptyMessage: string;
}

const energyPillColors: Record<string, string> = {
  crashing: 'bg-red-950/80 border border-red-600/50 text-red-200',
  low:      'bg-amber-950/80 border border-amber-600/50 text-amber-200',
  resting:  'bg-yellow-950/80 border border-yellow-600/50 text-yellow-200',
  available:'bg-green-950/80 border border-green-600/50 text-green-200',
};

export default function StatusSummaryCard({ update, emptyMessage }: StatusSummaryCardProps) {
  if (!update) {
    return (
      <div className="rounded-xl border border-dark-blue/40 bg-midnight-black/50 p-4 text-sm text-off-white/60">
        {emptyMessage}
      </div>
    );
  }

  const energy = ENERGY_STATUSES.find((item) => item.id === update.energyStatus);
  const needs = (update.selectedNeeds ?? [])
    .map((id) => NEEDS.find((n) => n.id === id))
    .filter(Boolean) as typeof NEEDS;
  const symptoms = (update.selectedSymptoms ?? [])
    .map((id) => SYMPTOMS.find((s) => s.id === id))
    .filter(Boolean) as typeof SYMPTOMS;

  return (
    <div className="rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-off-white/60">
          Latest Status
        </h2>
        <p className="text-xs text-off-white/50">{formatDistanceToNow(update.sentAt)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {update.needPriority && PRIORITY_CONFIG[update.needPriority] && (() => {
          const cfg = PRIORITY_CONFIG[update.needPriority!];
          return (
            <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-white ${cfg.className} shadow-md`}>
              <cfg.icon className="h-3.5 w-3.5" />
              {cfg.label}
            </div>
          );
        })()}
        {energy && (() => {
          const Icon = LucideIcons[energy.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
          const colorClass = energyPillColors[energy.id] ?? 'bg-bold-blue/20';
          return (
            <div className={`flex items-center gap-1.5 rounded-lg ${colorClass} px-3 py-1.5 text-sm font-medium`}>
              {Icon && <Icon className="h-4 w-4" />}
              {energy.label}
            </div>
          );
        })()}
        {needs.map((need) => {
          const Icon = LucideIcons[need.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
          return (
            <div key={need.id} className="flex items-center gap-1.5 rounded-lg bg-bold-blue/20 px-3 py-1.5 text-sm font-medium text-off-white/90">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {need.label}
            </div>
          );
        })}
        {symptoms.map((symptom) => {
          const Icon = LucideIcons[symptom.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
          return (
            <div key={symptom.id} className="flex items-center gap-1.5 rounded-lg bg-periwinkle/10 px-3 py-1.5 text-sm text-off-white/80">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {symptom.label}
            </div>
          );
        })}
        {!energy && needs.length === 0 && symptoms.length === 0 && (
          <p className="text-sm text-off-white/50">No details</p>
        )}
      </div>

      {update.helperLocation && (
        <p className="mt-3 text-xs text-off-white/50">
          Helper is <span className="text-off-white/70">{update.helperLocation}</span>
        </p>
      )}

      {update.messageText && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-off-white/80">
          {update.messageText}
        </p>
      )}
    </div>
  );
}
