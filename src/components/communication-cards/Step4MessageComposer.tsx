import React from 'react';
import { MessageSquare, Copy, RotateCcw } from 'lucide-react';
import StepLayout from './StepLayout';
import { composeMessage, copyToClipboard, openSMS } from '../../utils/messageComposer';

interface Step4Props {
  selectedNeeds: string[];
  energyStatus: string | null;
  selectedSymptoms: string[];
  onReset: () => void;
  onSend: (message: string) => Promise<void>;
  onBack?: () => void;
}

export default function Step4MessageComposer({
  selectedNeeds,
  energyStatus,
  selectedSymptoms,
  onReset,
  onSend,
  onBack
}: Step4Props) {
  const [message, setMessage] = React.useState('');
  const [showCopySuccess, setShowCopySuccess] = React.useState(false);

  React.useEffect(() => {
    const composed = composeMessage(selectedNeeds, energyStatus, selectedSymptoms);
    setMessage(composed);
  }, [selectedNeeds, energyStatus, selectedSymptoms]);

  const handleCopy = async () => {
    const success = await copyToClipboard(message);
    if (success) {
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  };

  const handleSendUpdate = async () => {
    await onSend(message);
    alert('Your update has been saved and shared with your caregiver when pairing is active.');
  };

  return (
    <StepLayout
      heading="Send to helper"
      currentStep={3}
      totalSteps={4}
      onBack={onBack}
      footer={
        <div className="space-y-4">
          <button
            onClick={() => void handleSendUpdate()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-bold-blue text-off-white text-lg font-semibold rounded-lg hover:bg-periwinkle transition-colors duration-200 min-h-[64px]"
          >
            <MessageSquare className="w-6 h-6" aria-hidden="true" />
            Send update
          </button>

          <div className="flex gap-4">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-periwinkle text-periwinkle font-semibold rounded-lg hover:bg-periwinkle hover:text-off-white transition-colors duration-200 min-h-[56px]"
            >
              <Copy className="w-5 h-5" aria-hidden="true" />
              {showCopySuccess ? 'Copied!' : 'Copy text'}
            </button>

            <button
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-dark-blue text-off-white font-semibold rounded-lg hover:border-periwinkle transition-colors duration-200 min-h-[56px]"
            >
              <RotateCcw className="w-5 h-5" aria-hidden="true" />
              Start over
            </button>
          </div>

          <button
            onClick={() => openSMS(message)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-dark-blue text-off-white font-semibold rounded-lg hover:border-periwinkle transition-colors duration-200 min-h-[56px]"
          >
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
            Text instead
          </button>
        </div>
      }
    >
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-off-white/80 mb-4">
         Send this update to your paired caregiver, or use the SMS fallback if you need to text instead.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 bg-midnight-black/50 border-2 border-dark-blue rounded-lg text-off-white focus:border-periwinkle focus:outline-none resize-none overflow-y-auto"
          rows={6}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#6B7280 #1F2937'
          }}
        />
      </div>
    </StepLayout>
  );
}
