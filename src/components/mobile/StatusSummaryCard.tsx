import { formatDistanceToNow } from './time';
import { ENERGY_STATUSES, NEEDS, SYMPTOMS } from '../../utils/communicationData';
import type { StatusUpdate } from '../../types/app';

interface StatusSummaryCardProps {
  update: StatusUpdate | null;
  emptyMessage: string;
}

function resolveLabels(ids: string[], collection: { id: string; label: string }[]) {
  return ids
    .map((id) => collection.find((item) => item.id === id)?.label)
    .filter((value): value is string => Boolean(value));
}

export default function StatusSummaryCard({ update, emptyMessage }: StatusSummaryCardProps) {
  if (!update) {
    return (
      <div className="rounded-3xl border border-dark-blue bg-dark-blue/30 p-5 text-off-white/80">
        {emptyMessage}
      </div>
    );
  }

  const needs = resolveLabels(update.selectedNeeds, NEEDS);
  const symptoms = resolveLabels(update.selectedSymptoms, SYMPTOMS);
  const energyLabel = ENERGY_STATUSES.find((item) => item.id === update.energyStatus)?.label ?? 'Not set';

  return (
    <div className="rounded-3xl border border-periwinkle/40 bg-dark-blue/30 p-5 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-periwinkle">Latest status</p>
          <h3 className="mt-2 text-2xl font-bold text-off-white">{energyLabel}</h3>
        </div>
        <p className="text-sm text-off-white/70">{formatDistanceToNow(update.sentAt)}</p>
      </div>

      <div className="mt-5 space-y-4 text-off-white">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60">Helper location</p>
          <p className="mt-1 text-lg font-semibold">{update.helperLocation ?? 'Not set'}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60">Needs</p>
          <p className="mt-1 text-base">{needs.length > 0 ? needs.join(', ') : 'No needs selected'}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60">Symptoms</p>
          <p className="mt-1 text-base">{symptoms.length > 0 ? symptoms.join(', ') : 'No symptoms selected'}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60">Message</p>
          <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-off-white/90">
            {update.messageText}
          </p>
        </div>
      </div>
    </div>
  );
}
