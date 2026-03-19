import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import * as Icons from 'lucide-react';
import StepLayout from './StepLayout';
import { ENERGY_STATUSES, SYMPTOMS } from '../../utils/communicationData';

type IconComponent = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

interface Step3Props {
  energyStatus: string | null;
  selectedSymptoms: string[];
  onSelectEnergy: (statusId: string) => void;
  onToggleSymptom: (symptomId: string) => void;
  onNext: () => void;
  onBack?: () => void;
}

export default function Step3EnergySymptoms({
  energyStatus,
  selectedSymptoms,
  onSelectEnergy,
  onToggleSymptom,
  onNext,
  onBack
}: Step3Props) {
  const [isEnergyOpen, setIsEnergyOpen] = React.useState(false);
  const [isSymptomsOpen, setIsSymptomsOpen] = React.useState(true);
  const iconMap = Icons as unknown as Record<string, IconComponent>;

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onNext();
  };

  return (
    <StepLayout
      heading="How do you feel?"
      description="Select your energy level and symptoms. (optional)"
      currentStep={2}
      totalSteps={4}
      onBack={onBack}
      headerAction={
        <button
          onClick={handleNext}
          className="px-6 py-2 text-white/80 hover:text-white font-semibold underline transition-colors"
        >
          Skip
        </button>
      }
      footer={
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-bold-blue text-white text-lg font-semibold rounded-lg hover:bg-periwinkle transition-colors duration-200 min-h-[64px]"
        >
          Next
          <ArrowRight className="w-6 h-6" aria-hidden="true" />
        </button>
      }
    >
      <div className="space-y-4">
        <div className="border-2 border-dark-blue rounded-xl overflow-hidden bg-dark-blue/40">
          <button
            onClick={() => setIsSymptomsOpen(!isSymptomsOpen)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-midnight-black/50 transition-colors"
            aria-expanded={isSymptomsOpen}
          >
            <h2 className="text-xl font-semibold text-white">Symptoms</h2>
            <ChevronDown
              className={`w-6 h-6 text-white transition-transform duration-200 ${
                isSymptomsOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
          {isSymptomsOpen && (
            <div className="p-4 pt-0">
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
                {SYMPTOMS.map((symptom) => {
                  const IconComponent = iconMap[symptom.icon] || Icons.AlertCircle;
                  const isSelected = selectedSymptoms.includes(symptom.id);

                  return (
                    <button
                      key={symptom.id}
                      onClick={() => onToggleSymptom(symptom.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 min-h-[90px] ${
                        isSelected
                          ? 'bg-bold-blue border-bold-blue text-white'
                          : 'bg-midnight-black/50 border-dark-blue text-white hover:border-periwinkle hover:bg-midnight-black/70'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <IconComponent className="w-6 h-6" aria-hidden="true" />
                      <span className="text-xs font-semibold text-center leading-tight">{symptom.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-2 border-dark-blue rounded-xl overflow-hidden bg-dark-blue/40">
          <button
            onClick={() => setIsEnergyOpen(!isEnergyOpen)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-midnight-black/50 transition-colors"
            aria-expanded={isEnergyOpen}
          >
            <h2 className="text-xl font-semibold text-white">Energy status</h2>
            <ChevronDown
              className={`w-6 h-6 text-white transition-transform duration-200 ${
                isEnergyOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
          {isEnergyOpen && (
            <div className="p-4 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                {ENERGY_STATUSES.map((status) => {
                  const IconComponent = iconMap[status.icon] || Icons.Battery;
                  const isSelected = energyStatus === status.id;

                  return (
                    <button
                      key={status.id}
                      onClick={() => onSelectEnergy(status.id)}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'bg-bold-blue border-bold-blue'
                          : 'bg-midnight-black/50 border-dark-blue hover:border-periwinkle hover:bg-midnight-black/70'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <IconComponent className="w-6 h-6 text-periwinkle flex-shrink-0 mt-1" aria-hidden="true" />
                      <div className="flex-1">
                        <div className="text-base font-semibold text-white mb-1">{status.label}</div>
                        <div className="text-xs text-white/80">{status.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </StepLayout>
  );
}
