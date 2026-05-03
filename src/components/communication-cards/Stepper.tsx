import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
}

export default function Stepper({ currentStep, totalSteps, onBack }: StepperProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 text-off-white/60 hover:text-off-white transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      <div className="flex items-center gap-2 flex-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i <= currentStep
                ? 'bg-green-500'
                : 'bg-off-white/35'
            }`}
          />
        ))}
      </div>

      <span className="text-off-white/60 text-sm flex-shrink-0">
        {currentStep + 1} / {totalSteps}
      </span>
    </div>
  );
}
