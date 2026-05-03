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
        className={`w-full flex items-center justify-center gap-4 p-6 rounded-xl border-3 transition-all ${
          selectedMessages.has(urgentMessage.id)
            ? 'bg-red-600 border-red-500 text-white shadow-2xl shadow-red-500/30 scale-[1.02]'
            : 'bg-red-500/90 border-red-400 text-white hover:bg-red-600 hover:shadow-2xl hover:scale-[1.02]'
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
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-off-white/80">How I feel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bodySymptomMessages.map((message) => (
            <button
              key={message.id}
              onClick={() => handlePlay(message)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                selectedMessages.has(message.id)
                  ? 'bg-bold-blue border-bold-blue text-white shadow-lg shadow-bold-blue/30 scale-[1.02]'
                  : 'border-periwinkle/30 bg-midnight-black/60 hover:border-periwinkle/50 hover:bg-midnight-black/80 hover:scale-[1.02]'
              }`}
            >
              <message.icon
                className={`flex-shrink-0 transition-colors ${
                  selectedMessages.has(message.id) ? 'text-white' : 'text-off-white'
                }`}
                size={16}
                aria-hidden="true"
              />
              <span className={`text-left text-sm font-medium leading-tight transition-colors ${
                selectedMessages.has(message.id) ? 'text-white' : 'text-off-white'
              }`}>{message.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-off-white/80">What I need</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actionRequestMessages.map((message) => (
            <button
              key={message.id}
              onClick={() => handlePlay(message)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                selectedMessages.has(message.id)
                  ? 'bg-bold-blue border-bold-blue text-white shadow-lg shadow-bold-blue/30 scale-[1.02]'
                  : 'border-periwinkle/30 bg-midnight-black/60 hover:border-periwinkle/50 hover:bg-midnight-black/80 hover:scale-[1.02]'
              }`}
            >
              <message.icon
                className={`flex-shrink-0 transition-colors ${
                  selectedMessages.has(message.id) ? 'text-white' : 'text-off-white'
                }`}
                size={16}
                aria-hidden="true"
              />
              <span className={`text-left text-sm font-medium leading-tight transition-colors ${
                selectedMessages.has(message.id) ? 'text-white' : 'text-off-white'
              }`}>{message.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-dark-blue/50">
        <label className="mb-2 block text-sm font-medium text-white">
          Type to Speak or Add Notes
        </label>
        <div className="flex gap-2">
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type a custom message or note here..."
            rows={3}
            className="flex-1 rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-3 py-2 text-sm text-white placeholder-zinc-100/60 focus:border-bold-blue focus:outline-none focus:ring-2 focus:ring-bold-blue/30 resize-none"
          />
          <button
            onClick={handleCustomSpeak}
            disabled={!customText.trim() || !ttsEnabled}
            className="rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-4 text-zinc-100 transition-all hover:border-bold-blue hover:bg-midnight-black/80 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
