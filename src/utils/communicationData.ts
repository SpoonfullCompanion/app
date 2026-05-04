import { Need, EnergyStatus, Symptom } from '../types/communication';

export const NEEDS: Need[] = [
  { id: 'help', label: 'Help', icon: 'LifeBuoy', speech: 'I need help' },
  { id: 'thirsty', label: 'Thirsty', icon: 'Droplets', speech: 'I am thirsty' },
  { id: 'hungry', label: 'Hungry', icon: 'UtensilsCrossed', speech: 'I am hungry' },
  { id: 'meds', label: 'Meds', icon: 'Pill', speech: 'I need my medication' },
  { id: 'dnd', label: 'Do Not Disturb', icon: 'Ban', speech: 'Do not disturb' },
  { id: 'mobility', label: 'Mobility', icon: 'Armchair', speech: 'I need help getting around' },
  { id: 'toilet', label: 'Toilet', icon: 'CircleDot', speech: 'I need to use the toilet' },
  { id: 'no_interact', label: "Can't Interact", icon: 'BellOff', speech: 'I cannot interact right now' },
  { id: 'hot', label: 'Too Hot', icon: 'ThermometerSun', speech: 'I am too hot' },
  { id: 'cold', label: 'Too Cold', icon: 'ThermometerSnowflake', speech: 'I am too cold' },
  { id: 'bright', label: 'Too Bright', icon: 'Lightbulb', speech: 'It is too bright' },
  { id: 'loud', label: 'Too Loud', icon: 'Volume2', speech: 'It is too loud' },
];

export const ENERGY_STATUSES: EnergyStatus[] = [
  {
    id: 'crashing',
    label: 'Crashing',
    icon: 'BatteryWarning',
    description: "I'm in PEM and need stillness.",
    speech: "I'm in PEM and need stillness."
  },
  {
    id: 'low',
    label: 'Low Energy',
    icon: 'BatteryLow',
    description: "I'm below baseline.",
    speech: "I'm below baseline."
  },
  {
    id: 'resting',
    label: 'Resting',
    icon: 'Bed',
    description: "I'm okay but quiet right now.",
    speech: "I'm okay but quiet right now."
  },
  {
    id: 'available',
    label: 'Available',
    icon: 'Zap',
    description: 'I can interact a bit today.',
    speech: 'I can interact a bit today.'
  },
];

export const stripNeedSpeechFromMessage = (message: string, selectedNeeds: string[]): string => {
  let result = message;
  for (const id of selectedNeeds) {
    const need = NEEDS.find(n => n.id === id);
    if (!need) continue;
    const escaped = need.speech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Remove "speech. " (with trailing space/period) or standalone "speech" at boundaries
    result = result.replace(new RegExp(`${escaped}\\. ?`, 'gi'), '');
    result = result.replace(new RegExp(`${escaped}`, 'gi'), '');
  }
  // Clean up leftover leading/trailing punctuation and whitespace
  return result.trim().replace(/^[.\s]+/, '').trim();
};

export const SYMPTOMS: Symptom[] = [
  { id: 'pain', label: 'Pain', icon: 'Zap', text: 'I am in pain' },
  { id: 'headache', label: 'Head hurts', icon: 'Brain', text: 'My head hurts' },
  { id: 'dizzy', label: 'Dizzy', icon: 'RotateCcw', text: 'I am dizzy' },
  { id: 'unwell', label: 'Unwell', icon: 'Meh', text: 'I do not feel well' },
  { id: 'low_mood', label: 'Low Mood', icon: 'Frown', text: 'My mood is low' },
  { id: 'resting', label: 'Fatigue', icon: 'Bed', text: 'I am fatigued' },
  { id: 'sensory', label: 'Sensory Sensitive', icon: 'Ear', text: "I'm having sensory sensitivity" },
  { id: 'weakness', label: 'Weakness', icon: 'BatteryWarning', text: 'I am feeling weak' },
  { id: 'confused', label: 'Confused', icon: 'HelpCircle', text: 'I am confused' },
  { id: 'no_think', label: "Difficulty Thinking", icon: 'Cloud', text: "It's hard to think" },
  { id: 'no_speak', label: "Difficulty Speaking", icon: 'VolumeX', text: "It's hard to speak" },
  { id: 'no_move', label: "Difficulty Moving", icon: 'UserX', text: "It's hard to move" },
];
