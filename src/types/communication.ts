export interface Need {
  id: string;
  label: string;
  icon: string;
  speech: string;
}

export interface EnergyStatus {
  id: string;
  label: string;
  icon: string;
  description: string;
  speech: string;
}

export interface Symptom {
  id: string;
  label: string;
  icon: string;
  text: string;
}

export type HelperLocation = 'in_room' | 'away' | 'hospital' | null;

export interface CommunicationState {
  helperLocation: HelperLocation;
  selectedNeeds: string[];
  energyStatus: string | null;
  selectedSymptoms: string[];
  customMessage: string;
}
