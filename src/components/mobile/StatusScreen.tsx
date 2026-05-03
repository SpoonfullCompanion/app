import { useState, useEffect } from 'react';
import { Volume2, VolumeX, RefreshCw, CheckCircle } from 'lucide-react';
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
  const [sent, setSent] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (!sent) return;
    const t = window.setTimeout(() => setSent(false), 3000);
    return () => window.clearTimeout(t);
  }, [sent]);

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
    if (!selectedEnergy && selectedSymptoms.size === 0) return;

    setPulseKey(k => k + 1);
    setIsSending(true);
    try {
      const energy = ENERGY_STATUSES.find(e => e.id === selectedEnergy);
      const symptoms = Array.from(selectedSymptoms)
        .map(id => SYMPTOMS.find(s => s.id === id))
        .filter(Boolean);

      let message = energy?.speech || '';
      if (symptoms.length > 0) {
        message += (message ? '. ' : '') + symptoms.map(s => s?.text).join('. ');
      }

      await onSendUpdate({
        type: 'status',
        energy: selectedEnergy ?? undefined,
        symptoms: Array.from(selectedSymptoms),
        message,
      });
      setSelectedEnergy(null);
      setSelectedSymptoms(new Set());
      setSent(true);
    } finally {
      setIsSending(false);
    }
  };

  const canSend = selectedEnergy !== null || selectedSymptoms.size > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-2">
              Status
            </p>
            <p className="text-sm text-white">
              Update your status for your helper. <br />This will not send a notification.
            </p>
          </div>
          <button
            onClick={onToggleTTS}
            className="rounded-full border border-dark-blue bg-midnight-black/90 p-3 text-off-white shadow-lg shadow-black/20 transition-all hover:border-bold-blue hover:text-bold-blue active:scale-90"
          >
            {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-off-white/80">
            Energy Level <span className="text-off-white/60 normal-case font-normal">(optional)</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {ENERGY_STATUSES.map((energy) => {
              const Icon = LucideIcons[energy.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
              const isSelected = selectedEnergy === energy.id;

              const colorClasses = {
                crashing: {
                  border: 'border-red-800/50',
                  bg: 'bg-red-900/30',
                  hover: 'hover:border-red-700/60 hover:bg-red-900/40',
                  selectedBorder: 'border-red-700',
                  selectedBg: 'bg-red-800',
                  selectedShadow: 'shadow-red-800/40'
                },
                low: {
                  border: 'border-amber-800/50',
                  bg: 'bg-amber-900/30',
                  hover: 'hover:border-amber-700/60 hover:bg-amber-900/40',
                  selectedBorder: 'border-amber-700',
                  selectedBg: 'bg-amber-800',
                  selectedShadow: 'shadow-amber-800/40'
                },
                resting: {
                  border: 'border-yellow-700/50',
                  bg: 'bg-yellow-900/30',
                  hover: 'hover:border-yellow-600/60 hover:bg-yellow-900/40',
                  selectedBorder: 'border-yellow-600',
                  selectedBg: 'bg-yellow-700',
                  selectedShadow: 'shadow-yellow-700/40'
                },
                available: {
                  border: 'border-green-800/50',
                  bg: 'bg-green-900/30',
                  hover: 'hover:border-green-700/60 hover:bg-green-900/40',
                  selectedBorder: 'border-green-700',
                  selectedBg: 'bg-green-800',
                  selectedShadow: 'shadow-green-800/40'
                }
              };

              const colors = colorClasses[energy.id as keyof typeof colorClasses];

              return (
                <button
                  key={energy.id}
                  onClick={() => handleEnergySelect(energy.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? `${colors.selectedBorder} ${colors.selectedBg} shadow-lg ${colors.selectedShadow} scale-[1.03]`
                      : `${colors.border} ${colors.bg} ${colors.hover}`
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-off-white/80">
            Symptoms <span className="text-off-white/60 normal-case font-normal">(optional)</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SYMPTOMS.map((symptom) => {
              const Icon = LucideIcons[symptom.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
              const isSelected = selectedSymptoms.has(symptom.id);
              return (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`rounded-xl border-2 p-3 text-left transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? 'border-bold-blue bg-bold-blue shadow-lg shadow-bold-blue/40 scale-[1.03]'
                      : 'border-periwinkle/30 bg-midnight-black/60 hover:border-periwinkle/50 hover:bg-midnight-black/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-off-white'}`} />}
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-off-white'}`}>
                      {symptom.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          {sent ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-full bg-green-700 px-6 py-4 font-semibold text-white shadow-xl shadow-green-900/30">
              <CheckCircle className="h-5 w-5" />
              Status updated
            </div>
          ) : (
            <button
              key={pulseKey}
              onClick={() => void handleSendStatus()}
              disabled={isSending || !canSend}
              className={`flex w-full items-center justify-center gap-2 rounded-full bg-bold-blue px-6 py-4 font-semibold text-white shadow-xl shadow-bold-blue/30 transition-all hover:bg-bold-blue/90 active:scale-95 disabled:opacity-50 ${pulseKey > 0 ? 'animate-pulse-once' : ''}`}
            >
              <RefreshCw className="h-5 w-5" />
              {isSending ? 'Updating...' : 'Update Status'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
