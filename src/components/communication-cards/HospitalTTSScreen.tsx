import React from 'react';
import { Volume2, Phone, Brain, Zap, AlertTriangle, Moon, FileText, Shield, Pill } from 'lucide-react';
import { speak } from '../../utils/textToSpeech';

interface HospitalTTSScreenProps {
  ttsEnabled: boolean;
}

interface MessageButton {
  id: string;
  text: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const bodySymptomMessages: MessageButton[] = [
  { id: 'difficulty-thinking', text: 'I am having difficulty thinking and speaking', icon: Brain },
  { id: 'pain-movement', text: 'My pain is not controlled enough for movement', icon: Zap },
  { id: 'mast-cell', text: 'I am having a mast cell reaction', icon: AlertTriangle },
  { id: 'quiet-rest', text: 'I need quiet and rest before further activity', icon: Moon },
];

const actionRequestMessages: MessageButton[] = [
  { id: 'hospital-plan', text: 'Please see my hospital plan', icon: FileText },
  { id: 'pain-reassess', text: 'My pain is not controlled. Please reassess pain management', icon: Pill },
  { id: 'mast-cell-meds', text: 'I need my prescribed mast cell medications', icon: AlertTriangle },
  { id: 'verify-meds', text: 'Please verify my medications in the chart before making changes', icon: Shield },
];

const urgentMessage: MessageButton = {
  id: 'call-support',
  text: 'Please call and involve my support person',
  icon: Phone
};

export default function HospitalTTSScreen({ ttsEnabled }: HospitalTTSScreenProps) {
  const [selectedMessages, setSelectedMessages] = React.useState<Set<string>>(new Set());
  const [customText, setCustomText] = React.useState('');

  const handlePlay = (message: MessageButton) => {
    const wasSelected = selectedMessages.has(message.id);

    if (!wasSelected) {
      if (ttsEnabled) {
        speak(message.text);
      }
      setSelectedMessages(prev => new Set(prev).add(message.id));
    } else {
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.id);
        return newSet;
      });
    }
  };

  const handleCustomSpeak = () => {
    if (customText.trim() && ttsEnabled) {
      speak(customText);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => handlePlay(urgentMessage)}
        className={`w-full flex items-center justify-center gap-4 p-6 rounded-xl border-3 transition-all duration-200 ${
          selectedMessages.has(urgentMessage.id)
            ? 'bg-red-600 border-red-500 text-white shadow-2xl scale-[1.02]'
            : 'bg-red-500/90 border-red-400 text-white hover:bg-red-600 hover:border-red-300 shadow-lg'
        }`}
      >
        <urgentMessage.icon
          className="flex-shrink-0"
          size={32}
          aria-hidden="true"
        />
        <span className="text-xl font-bold leading-tight">{urgentMessage.text}</span>
      </button>

      <div>
        <h3 className="text-xl font-semibold text-periwinkle mb-4">How I feel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bodySymptomMessages.map((message) => (
            <button
              key={message.id}
              onClick={() => handlePlay(message)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 min-h-[80px] ${
                selectedMessages.has(message.id)
                  ? 'bg-electric-blue border-electric-blue text-midnight-black shadow-lg scale-[1.02]'
                  : 'bg-midnight-black/50 border-dark-blue text-periwinkle hover:border-periwinkle hover:bg-midnight-black/70'
              }`}
            >
              <message.icon
                className="flex-shrink-0"
                size={24}
                aria-hidden="true"
              />
              <span className="text-left font-medium leading-tight">{message.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-periwinkle mb-4">What I need</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actionRequestMessages.map((message) => (
            <button
              key={message.id}
              onClick={() => handlePlay(message)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 min-h-[80px] ${
                selectedMessages.has(message.id)
                  ? 'bg-electric-blue border-electric-blue text-midnight-black shadow-lg scale-[1.02]'
                  : 'bg-midnight-black/50 border-dark-blue text-periwinkle hover:border-periwinkle hover:bg-midnight-black/70'
              }`}
            >
              <message.icon
                className="flex-shrink-0"
                size={24}
                aria-hidden="true"
              />
              <span className="text-left font-medium leading-tight">{message.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-dark-blue/50">
        <h3 className="text-xl font-semibold text-periwinkle mb-2">Type here to speak out loud</h3>
        <div className="flex flex-col gap-3">
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-midnight-black/50 border-2 border-dark-blue text-periwinkle placeholder-periwinkle/40 focus:outline-none focus:border-electric-blue transition-colors resize-none"
          />
          <button
            onClick={handleCustomSpeak}
            disabled={!customText.trim() || !ttsEnabled}
            className="self-end px-6 py-3 rounded-xl bg-electric-blue hover:bg-electric-blue/90 disabled:bg-dark-blue/50 disabled:cursor-not-allowed text-midnight-black disabled:text-periwinkle/50 font-medium transition-colors flex items-center gap-2"
          >
            <Volume2 size={20} />
            Speak
          </button>
        </div>
      </div>
    </div>
  );
}
