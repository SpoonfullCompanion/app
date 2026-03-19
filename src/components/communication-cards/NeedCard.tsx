import React from 'react';
import * as Icons from 'lucide-react';

type IconComponent = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

interface NeedCardProps {
  label: string;
  icon: string;
  isSelected?: boolean;
  onClick: () => void;
}

export default function NeedCard({ label, icon, isSelected = false, onClick }: NeedCardProps) {
  const iconMap = Icons as unknown as Record<string, IconComponent>;
  const IconComponent = iconMap[icon] || Icons.HelpCircle;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 min-h-[110px] ${
        isSelected
          ? 'bg-gradient-to-b from-bold-blue/80 to-bold-blue border-bold-blue text-off-white'
          : 'bg-dark-blue/40 border-dark-blue text-off-white hover:border-periwinkle hover:bg-midnight-black/70'
      }`}
      aria-pressed={isSelected}
    >
      <IconComponent className="w-6 h-6" aria-hidden="true" />
      <span className="text-sm font-semibold text-center leading-tight">{label}</span>
    </button>
  );
}
