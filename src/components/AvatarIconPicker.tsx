import React from 'react';
import { AVATAR_ICONS } from '../utils/avatarIcons';

interface AvatarIconPickerProps {
  selected: string;
  onChange: (id: string) => void;
}

export default function AvatarIconPicker({ selected, onChange }: AvatarIconPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2.5">
      {AVATAR_ICONS.map(({ id, label, Icon }) => {
        const isSelected = selected === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            onClick={() => onChange(id)}
            className={`flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all active:scale-95 ${
              isSelected
                ? 'border border-bold-blue bg-bold-blue/20'
                : 'border border-periwinkle/15 bg-midnight-black/40 hover:border-periwinkle/40 hover:bg-bold-blue/10'
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                isSelected ? 'bg-bold-blue/30' : 'bg-midnight-black/60'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-periwinkle/70'}`}
                strokeWidth={1.5}
              />
            </div>
            <span className={`text-[10px] leading-tight truncate w-full text-center ${isSelected ? 'text-white' : 'text-off-white/40'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
