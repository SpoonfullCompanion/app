import { useState } from 'react';
import { Volume2, VolumeX, RefreshCw } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ENERGY_STATUSES, SYMPTOMS } from '../../utils/communicationData';
import { speak } from '../../utils/textToSpeech';
import type { CommunicationSubmission, StatusUpdate } from '../../types/app';
import { formatDistanceToNow } from './time';

interface StatusScreenProps {
  latestStatus: StatusUpdate | null;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  onSendUpdate: (submission: CommunicationSubmission) => Promise<void>;
}

export default function StatusScreen({ latestStatus, ttsEnabled, onToggleTTS, onSendUpdate }: StatusScreenProps) {
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(latestStatus?.energyStatus ?? null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set(latestStatus?.selectedSymptoms ?? []));
  const [isSending, setIsSending] = useState(false);

  const handleEnergySelect = (energyId: string) => {
    if (selectedEnergy === energyId) {
      setSelectedEnergy(null);
    } else {
      setSelectedEnergy(energyId);
      const energy = ENERGY_STATUSES.find(e => e.id === energyId);
      if (energy && ttsEnabled) {
        speak(energy.speech);
      }
    }
  };

  const toggleSymptom = (symptomId: string) => {
    const newSymptoms = new Set(selectedSymptoms);
    if (newSymptoms.has(symptomId)) {
      newSymptoms.delete(symptomId);
    } else {
      newSymptoms.add(symptomId);
      const symptom = SYMPTOMS.find(s => s.id === symptomId);
      if (symptom && ttsEnabled) {
        speak(symptom.text);
      }
    }
    setSelectedSymptoms(newSymptoms);
  };

  const handleSendStatus = async () => {
    if (!selectedEnergy) return;

    setIsSending(true);
    try {
      const energy = ENERGY_STATUSES.find(e => e.id === selectedEnergy);
      const symptoms = Array.from(selectedSymptoms)
        .map(id => SYMPTOMS.find(s => s.id === id))
        .filter(Boolean);

      let message = energy?.speech || '';
      if (symptoms.length > 0) {
        message += '. ' + symptoms.map(s => s?.text).join('. ');
      }

      await onSendUpdate({
        type: 'status',
        energy: selectedEnergy,
        symptoms: Array.from(selectedSymptoms),
        message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const canSend = selectedEnergy !== null;

  const currentEnergy = latestStatus?.energyStatus ? ENERGY_STATUSES.find(e => e.id === latestStatus.energyStatus) : null;
  const currentSymptoms = (latestStatus?.selectedSymptoms ?? [])
    .map(id => SYMPTOMS.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-32">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-2">
              Status
            </p>
            <p className="text-sm text-white">
              Update your status for your helper.
            </p>
          </div>
          <button
            onClick={onToggleTTS}
            className="rounded-full border border-dark-blue bg-midnight-black/90 p-3 text-periwinkle shadow-lg shadow-black/20 transition-colors hover:border-bold-blue hover:text-bold-blue"
          >
            {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>

        {latestStatus && (
          <div className="mb-6 rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-periwinkle/60">
                Current Status
              </h2>
              <p className="text-xs text-periwinkle/50">
                {formatDistanceToNow(latestStatus.sentAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {currentEnergy && (
                <div className="flex items-center gap-1.5 rounded-lg bg-bold-blue/20 px-3 py-1.5 text-sm font-medium text-periwinkle">
                  {(() => {
                    const Icon = LucideIcons[currentEnergy.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                    return Icon && <Icon className="h-4 w-4" />;
                  })()}
                  {currentEnergy.label}
                </div>
              )}
              {currentSymptoms.map((symptom) => {
                const Icon = LucideIcons[symptom.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                return (
                  <div key={symptom.id} className="flex items-center gap-1.5 rounded-lg bg-periwinkle/10 px-3 py-1.5 text-sm text-periwinkle/80">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {symptom.label}
                  </div>
                );
              })}
              {!currentEnergy && currentSymptoms.length === 0 && (
                <p className="text-sm text-periwinkle/50">No status set</p>
              )}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-periwinkle/80">
            Energy Level
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {ENERGY_STATUSES.map((energy) => {
              const Icon = LucideIcons[energy.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
              const isSelected = selectedEnergy === energy.id;
              return (
                <button
                  key={energy.id}
                  onClick={() => handleEnergySelect(energy.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? 'border-bold-blue bg-bold-blue shadow-lg shadow-bold-blue/30 scale-[1.02]'
                      : 'border-periwinkle/30 bg-midnight-black/60 hover:border-periwinkle/50 hover:bg-midnight-black/80 hover:scale-[1.02]'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {Icon && <Icon className={`h-5 w-5 transition-colors ${
                      isSelected ? 'text-white' : 'text-periwinkle'
                    }`} />}
                    <span className={`font-semibold transition-colors ${
                      isSelected ? 'text-white' : 'text-periwinkle'
                    }`}>
                      {energy.label}
                    </span>
                  </div>
                  <p className={`text-xs transition-colors ${
                    isSelected ? 'text-white/90' : 'text-periwinkle/70'
                  }`}>
                    {energy.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-periwinkle/80">
            Symptoms (Optional)
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SYMPTOMS.map((symptom) => {
              const Icon = LucideIcons[symptom.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
              const isSelected = selectedSymptoms.has(symptom.id);
              return (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    isSelected
                      ? 'border-bold-blue bg-bold-blue shadow-lg shadow-bold-blue/30 scale-[1.02]'
                      : 'border-periwinkle/30 bg-midnight-black/60 hover:border-periwinkle/50 hover:bg-midnight-black/80 hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className={`h-4 w-4 transition-colors ${
                      isSelected ? 'text-white' : 'text-periwinkle'
                    }`} />}
                    <span className={`text-sm font-medium transition-colors ${
                      isSelected ? 'text-white' : 'text-periwinkle'
                    }`}>
                      {symptom.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {canSend && (
          <div className="fixed inset-x-0 bottom-20 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="mx-auto max-w-2xl">
              <button
                onClick={() => void handleSendStatus()}
                disabled={isSending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-bold-blue px-6 py-4 font-semibold text-white shadow-xl shadow-bold-blue/30 transition-all hover:bg-bold-blue/90 disabled:opacity-50"
              >
                <RefreshCw className="h-5 w-5" />
                {isSending ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
