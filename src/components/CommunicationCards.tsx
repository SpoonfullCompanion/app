import React from 'react';
import { HelperLocation, CommunicationState } from '../types/communication';
import Step1HelperLocation from './communication-cards/Step1HelperLocation';
import Step2InRoom from './communication-cards/Step2InRoom';
import Step2Away from './communication-cards/Step2Away';
import Step3EnergySymptoms from './communication-cards/Step3EnergySymptoms';
import Step4MessageComposer from './communication-cards/Step4MessageComposer';
import HospitalTTSScreen from './communication-cards/HospitalTTSScreen';
import type { CommunicationSubmission } from '../types/app';

interface CommunicationCardsProps {
  onStatusSent?: (submission: CommunicationSubmission) => Promise<void>;
}

export default function CommunicationCards({ onStatusSent }: CommunicationCardsProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [state, setState] = React.useState<CommunicationState>({
    helperLocation: null,
    selectedNeeds: [],
    energyStatus: null,
    selectedSymptoms: [],
    customMessage: '',
  });
  const handleLocationSelect = (location: HelperLocation) => {
    setState(prev => ({ ...prev, helperLocation: location }));

    if (location === 'in_room') {
      setCurrentStep(2);
    } else if (location === 'hospital') {
      setCurrentStep(6);
    } else if (location === 'away') {
      setCurrentStep(3);
    }
  };

  const handleToggleNeed = (needId: string) => {
    setState(prev => ({
      ...prev,
      selectedNeeds: prev.selectedNeeds.includes(needId)
        ? prev.selectedNeeds.filter(id => id !== needId)
        : [...prev.selectedNeeds, needId]
    }));
  };

  const handleSelectEnergy = (statusId: string) => {
    setState(prev => ({
      ...prev,
      energyStatus: prev.energyStatus === statusId ? null : statusId
    }));
  };

  const handleToggleSymptom = (symptomId: string) => {
    setState(prev => ({
      ...prev,
      selectedSymptoms: prev.selectedSymptoms.includes(symptomId)
        ? prev.selectedSymptoms.filter(id => id !== symptomId)
        : [...prev.selectedSymptoms, symptomId]
    }));
  };

  const handleSend = async (messageText: string) => {
    await onStatusSent?.({
      helperLocation: state.helperLocation,
      selectedNeeds: state.selectedNeeds,
      energyStatus: state.energyStatus,
      selectedSymptoms: state.selectedSymptoms,
      messageText,
    });
  };

  const handleReset = () => {
    setState({
      helperLocation: null,
      selectedNeeds: [],
      energyStatus: null,
      selectedSymptoms: [],
      customMessage: '',
    });
    setCurrentStep(1);
  };

  const handleHospitalMessagePlayed = async (message: string) => {
    void message;
  };

  const handleHospitalBack = async () => {
    setCurrentStep(1);
  };

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(1);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    } else if (currentStep === 5) {
      setCurrentStep(4);
    }
  };

  return (
    <div className="min-h-screen bg-midnight-black flex flex-col">
      <div className="flex-1">
        {currentStep === 1 && (
          <Step1HelperLocation onSelect={handleLocationSelect} />
        )}

        {currentStep === 2 && state.helperLocation === 'in_room' && (
          <Step2InRoom onBack={() => setCurrentStep(1)} />
        )}

        {currentStep === 3 && state.helperLocation === 'away' && (
          <Step2Away
            selectedNeeds={state.selectedNeeds}
            onToggleNeed={handleToggleNeed}
            onNext={() => setCurrentStep(4)}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && state.helperLocation === 'away' && (
          <Step3EnergySymptoms
            energyStatus={state.energyStatus}
            selectedSymptoms={state.selectedSymptoms}
            onSelectEnergy={handleSelectEnergy}
            onToggleSymptom={handleToggleSymptom}
            onNext={() => setCurrentStep(5)}
            onBack={handleBack}
          />
        )}

        {currentStep === 5 && state.helperLocation === 'away' && (
          <Step4MessageComposer
            selectedNeeds={state.selectedNeeds}
            energyStatus={state.energyStatus}
            selectedSymptoms={state.selectedSymptoms}
            onReset={handleReset}
            onSend={handleSend}
            onBack={handleBack}
          />
        )}

        {currentStep === 6 && state.helperLocation === 'hospital' && (
          <HospitalTTSScreen
            onBack={handleHospitalBack}
            onMessagePlayed={handleHospitalMessagePlayed}
          />
        )}
      </div>

    </div>
  );
}
