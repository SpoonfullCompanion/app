import { Volume2, VolumeX, Stethoscope } from 'lucide-react';
import HospitalTTSScreen from '../communication-cards/HospitalTTSScreen';

interface HospitalScreenProps {
  ttsEnabled: boolean;
  onToggleTTS: () => void;
}

export default function HospitalScreen({ ttsEnabled, onToggleTTS }: HospitalScreenProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-periwinkle">Hospital</h1>
            <p className="text-sm text-periwinkle/70">Quick phrases for staff</p>
          </div>
          <button
            onClick={onToggleTTS}
            className="rounded-full border border-dark-blue bg-midnight-black/90 p-3 text-periwinkle shadow-lg shadow-black/20 transition-colors hover:border-bold-blue hover:text-bold-blue"
          >
            {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-dark-blue/30 bg-midnight-black/50 p-4">
          <div className="flex items-start gap-3">
            <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-periwinkle/60" />
            <div>
              <p className="mb-1 text-sm font-medium text-periwinkle">Hospital Communication</p>
              <p className="text-xs leading-relaxed text-periwinkle/60">
                Pre-written phrases to communicate with hospital staff and visitors when you need to conserve energy.
              </p>
            </div>
          </div>
        </div>

        <HospitalTTSScreen ttsEnabled={ttsEnabled} />
      </div>
    </div>
  );
}
