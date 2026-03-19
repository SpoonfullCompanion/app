import { useState } from 'react';
import { Volume2, VolumeX, Send } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ENERGY_STATUSES, SYMPTOMS } from '../../utils/communicationData';
import { speak } from '../../utils/textToSpeech';
import type { CommunicationSubmission } from '../../types/app';

interface StatusScreenProps {
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  onSendUpdate: (submission: CommunicationSubmission) => Promise<void>;
}

export default function StatusScreen({ ttsEnabled, onToggleTTS, onSendUpdate }: StatusScreenProps) {
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);

  const handleEnergySelect = (energyId: string) => {
    setSelectedEnergy(energyId);
    const energy = ENERGY_STATUSES.find(e => e.id === energyId);
    if (energy && ttsEnabled) {
      speak(energy.speech);
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

      setSelectedEnergy(null);
      setSelectedSymptoms(new Set());
    } finally {
      setIsSending(false);
    }
  };

  const canSend = selectedEnergy !== null;

  return (
    <div className="min-h-screen bg-midnight-black pb-32">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-periwinkle">Status</h1>
            <p className="text-sm text-periwinkle/70">Share how you're doing</p>
          </div>
          <button
            onClick={onToggleTTS}
            className="rounded-full border border-dark-blue bg-midnight-black/90 p-3 text-periwinkle shadow-lg shadow-black/20 transition-colors hover:border-electric-blue hover:text-electric-blue"
          >
            {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>

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
                      ? 'border-electric-blue bg-electric-blue shadow-lg shadow-electric-blue/20'
                      : 'border-electric-blue bg-electric-blue hover:shadow-lg hover:shadow-electric-blue/20'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {Icon && <Icon className="h-5 w-5 text-white" />}
                    <span className="font-semibold text-white">
                      {energy.label}
                    </span>
                  </div>
                  <p className="text-xs text-white/90">
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
                      ? 'border-electric-blue bg-electric-blue shadow-lg shadow-electric-blue/20'
                      : 'border-electric-blue bg-electric-blue hover:shadow-lg hover:shadow-electric-blue/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-white" />}
                    <span className="text-sm font-medium text-white">
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
                className="flex w-full items-center justify-center gap-2 rounded-full bg-electric-blue px-6 py-4 font-semibold text-white shadow-xl shadow-electric-blue/30 transition-all hover:bg-electric-blue/90 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
                {isSending ? 'Sending...' : 'Send Status Update'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
