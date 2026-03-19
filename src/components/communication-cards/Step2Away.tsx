import React from 'react';
import { ArrowRight } from 'lucide-react';
import StepLayout from './StepLayout';
import NeedCard from './NeedCard';
import { NEEDS } from '../../utils/communicationData';

interface Step2AwayProps {
  selectedNeeds: string[];
  onToggleNeed: (needId: string) => void;
  onNext: () => void;
  onBack?: () => void;
}

export default function Step2Away({ selectedNeeds, onToggleNeed, onNext, onBack }: Step2AwayProps) {
  return (
    <StepLayout
      heading="What do you need?"
      description="You may select more than one need. (optional)"
      currentStep={1}
      totalSteps={4}
      onBack={onBack}
      headerAction={
        <button
          onClick={onNext}
          className="px-6 py-2 text-off-white/80 hover:text-off-white font-semibold underline transition-colors"
        >
          Skip
        </button>
      }
      footer={
        <button
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-bold-blue text-off-white text-lg font-semibold rounded-lg hover:bg-periwinkle transition-colors duration-200 min-h-[64px]"
        >
          Next
          <ArrowRight className="w-6 h-6" aria-hidden="true" />
        </button>
      }
    >
      <div className="grid grid-cols-4 sm:grid-cols-3 gap-4">
        {NEEDS.map((need) => (
          <NeedCard
            key={need.id}
            label={need.label}
            icon={need.icon}
            isSelected={selectedNeeds.includes(need.id)}
            onClick={() => onToggleNeed(need.id)}
          />
        ))}
      </div>
    </StepLayout>
  );
}
