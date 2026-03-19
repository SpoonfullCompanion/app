import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import StepLayout from './StepLayout';
import NeedCard from './NeedCard';
import { NEEDS } from '../../utils/communicationData';
import { speak, isSpeechSupported } from '../../utils/textToSpeech';

interface Step2InRoomProps {
  onBack?: () => void;
}

export default function Step2InRoom({ onBack }: Step2InRoomProps) {
  const [customText, setCustomText] = React.useState('');
  const [selectedNeeds, setSelectedNeeds] = React.useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNeedClick = (needId: string, speech: string) => {
    const wasSelected = selectedNeeds.has(needId);

    if (!wasSelected) {
      if (soundEnabled) {
        speak(speech);
      }
      setSelectedNeeds(prev => new Set(prev).add(needId));
    } else {
      setSelectedNeeds(prev => {
        const newSet = new Set(prev);
        newSet.delete(needId);
        return newSet;
      });
    }
  };

  const handleCustomSpeak = () => {
    if (customText.trim() && soundEnabled) {
      speak(customText);
    }
  };

  return (
    <StepLayout
      heading={
        <div className="flex items-center justify-between w-full">
          <span>What do you need?</span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              soundEnabled
                ? 'bg-bold-blue/20 text-off-white hover:bg-bold-blue/30'
                : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
            }`}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span className="text-sm font-medium">
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </span>
          </button>
        </div>
      }
      description="Tap each need to speak out loud."
      currentStep={1}
      totalSteps={2}
      onBack={onBack}
    >
      <div className="space-y-8">
        {!isSpeechSupported() && (
          <div className="p-4 bg-bold-blue/20 border border-bold-blue rounded-lg text-off-white text-sm">
            Text-to-speech is not supported in your browser. Please try a different browser.
          </div>
        )}

        <div className="grid grid-cols-4 sm:grid-cols-3 gap-4">
          {NEEDS.map((need) => (
            <NeedCard
              key={need.id}
              label={need.label}
              icon={need.icon}
              isSelected={selectedNeeds.has(need.id)}
              onClick={() => handleNeedClick(need.id, need.speech)}
            />
          ))}
        </div>

        <div className="pt-4 border-t border-dark-blue/50">
          <h3 className="text-xl font-semibold text-off-white mb-2">Type here to speak out loud</h3>
          <div className="flex flex-col gap-3">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-dark-blue/40 border-2 border-dark-blue text-off-white placeholder-gray-400 focus:outline-none focus:border-periwinkle transition-colors resize-none"
            />
            <button
              onClick={handleCustomSpeak}
              disabled={!customText.trim()}
              className="self-end px-6 py-3 rounded-xl bg-gradient-to-b from-bold-blue/80 to-bold-blue hover:bg-periwinkle disabled:bg-gray-600 disabled:cursor-not-allowed text-off-white font-medium transition-colors flex items-center gap-2"
            >
              <Volume2 size={20} />
              Speak
            </button>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
