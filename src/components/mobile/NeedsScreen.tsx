import { Volume2, VolumeX, Send } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { NEEDS } from '../../utils/communicationData';
import { speak } from '../../utils/textToSpeech';
import type { CommunicationSubmission } from '../../types/app';

interface NeedsScreenProps {
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  onSendUpdate: (submission: CommunicationSubmission) => Promise<void>;
}

export default function NeedsScreen({ ttsEnabled, onToggleTTS, onSendUpdate }: NeedsScreenProps) {
  const handleNeedClick = async (needId: string) => {
    const need = NEEDS.find(n => n.id === needId);
    if (!need) return;

    if (ttsEnabled) {
      speak(need.speech);
    }

    await onSendUpdate({
      type: 'need',
      need: needId,
      message: need.speech,
    });
  };

  return (
    <div className="min-h-screen bg-midnight-black pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-periwinkle">Needs</h1>
            <p className="text-sm text-periwinkle/70">Tap to speak or send</p>
          </div>
          <button
            onClick={onToggleTTS}
            className="rounded-full border border-dark-blue bg-midnight-black/90 p-3 text-periwinkle shadow-lg shadow-black/20 transition-colors hover:border-electric-blue hover:text-electric-blue"
          >
            {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NEEDS.map((need) => {
            const Icon = LucideIcons[need.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
            return (
              <button
                key={need.id}
                onClick={() => void handleNeedClick(need.id)}
                className="group rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4 text-center transition-all hover:scale-[1.02] hover:border-electric-blue hover:bg-electric-blue hover:shadow-lg hover:shadow-electric-blue/20 active:scale-95"
              >
                <div className="mb-2 flex justify-center">
                  {Icon && (
                    <Icon className="h-8 w-8 text-periwinkle transition-colors group-hover:text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-periwinkle transition-colors group-hover:text-white">
                  {need.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-dark-blue/30 bg-midnight-black/50 p-4">
          <div className="flex items-start gap-3">
            <Send className="mt-0.5 h-5 w-5 shrink-0 text-periwinkle/60" />
            <div>
              <p className="mb-1 text-sm font-medium text-periwinkle">Quick Communication</p>
              <p className="text-xs leading-relaxed text-periwinkle/60">
                Each tap sends a message to your caregiver and can speak it aloud if sound is enabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
