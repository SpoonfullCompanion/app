import * as LucideIcons from 'lucide-react';
import { formatDistanceToNow } from './time';
import { ENERGY_STATUSES, SYMPTOMS } from '../../utils/communicationData';
import type { StatusUpdate } from '../../types/app';

const energyPillColors: Record<string, string> = {
  crashing:  'bg-red-950/70 border-red-600/50 text-red-200',
  low:       'bg-amber-950/70 border-amber-600/50 text-amber-200',
  resting:   'bg-yellow-950/70 border-yellow-600/50 text-yellow-200',
  available: 'bg-green-950/70 border-green-600/50 text-green-200',
};

const energyDotColors: Record<string, string> = {
  crashing: 'bg-red-500',
  low: 'bg-amber-400',
  resting: 'bg-yellow-400',
  available: 'bg-green-400',
};

interface LatestStatusSummaryProps {
  update: StatusUpdate | null;
}

export default function LatestStatusSummary({ update }: LatestStatusSummaryProps) {
  if (!update) {
    return (
      <div className="rounded-xl border border-dark-blue/30 bg-midnight-black/40 px-4 py-3 text-center">
        <p className="text-xs text-off-white/50">No status yet</p>
      </div>
    );
  }

  const energy = ENERGY_STATUSES.find(e => e.id === update.energyStatus);
  const symptoms = (update.selectedSymptoms ?? [])
    .map(id => SYMPTOMS.find(s => s.id === id))
    .filter(Boolean) as typeof SYMPTOMS;

  const EnergyIcon = energy
    ? LucideIcons[energy.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>
    : null;
  const pillClass = energy ? (energyPillColors[energy.id] ?? 'bg-bold-blue/20 border-bold-blue/40 text-off-white') : '';
  const dotClass = energy ? (energyDotColors[energy.id] ?? 'bg-bold-blue') : '';

  return (
    <div className="rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-off-white/50">
          Latest Status
        </p>
        <p className="text-[10px] text-off-white/40">{formatDistanceToNow(update.sentAt)}</p>
      </div>

      {energy && EnergyIcon && (
        <div className="mb-2 flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${pillClass}`}>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
            {EnergyIcon && <EnergyIcon className="h-3.5 w-3.5" />}
            {energy.label}
          </div>
        </div>
      )}

      {symptoms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {symptoms.map(symptom => {
            const Icon = LucideIcons[symptom.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
            return (
              <div key={symptom.id} className="flex items-center gap-1 rounded-lg bg-periwinkle/10 px-2 py-0.5 text-xs text-off-white/80">
                {Icon && <Icon className="h-3 w-3" />}
                {symptom.label}
              </div>
            );
          })}
        </div>
      )}

      {!energy && symptoms.length === 0 && (
        <p className="text-xs text-off-white/50">No details</p>
      )}
    </div>
  );
}
