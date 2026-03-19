import React from 'react';
import { Users, UserX, Building2 } from 'lucide-react';
import StepLayout from './StepLayout';

interface Step1Props {
  onSelect: (location: 'in_room' | 'away' | 'hospital') => void;
}

export default function Step1HelperLocation({ onSelect }: Step1Props) {
  return (
    <StepLayout heading="Where is your helper?">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onSelect('in_room')}
          className="flex flex-col items-center justify-center gap-4 p-8 bg-dark-blue/40 border-2 border-dark-blue rounded-xl hover:border-periwinkle hover:bg-midnight-black/70 transition-all duration-200 min-h-[200px]"
        >
          <Users className="w-16 h-16 text-periwinkle" aria-hidden="true" />
          <span className="text-xl font-bold text-white">In the room</span>
        </button>

        <button
          onClick={() => onSelect('away')}
          className="flex flex-col items-center justify-center gap-4 p-8 bg-dark-blue/40 border-2 border-dark-blue rounded-xl hover:border-periwinkle hover:bg-midnight-black/70 transition-all duration-200 min-h-[200px]"
        >
          <UserX className="w-16 h-16 text-periwinkle" aria-hidden="true" />
          <span className="text-xl font-bold text-white">Away / Not here</span>
        </button>

        <button
          onClick={() => onSelect('hospital')}
          className="flex flex-col items-center justify-center gap-4 p-8 bg-periwinkle/20 border-2 border-dark-blue rounded-xl hover:border-periwinkle hover:bg-periwinkle/30 transition-all duration-200 min-h-[200px]"
        >
          <Building2 className="w-16 h-16 text-periwinkle" aria-hidden="true" />
          <span className="text-xl font-bold text-white">Hospital Mode</span>
        </button>
      </div>
    </StepLayout>
  );
}
