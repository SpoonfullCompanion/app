import React from 'react';
import { getAvatarIcon } from '../utils/avatarIcons';

interface AvatarIconProps {
  iconId: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { circle: 'h-8 w-8',  icon: 'h-4 w-4' },
  md: { circle: 'h-11 w-11', icon: 'h-5 w-5' },
  lg: { circle: 'h-16 w-16', icon: 'h-8 w-8' },
};

export default function AvatarIcon({ iconId, size = 'md', className = '' }: AvatarIconProps) {
  const def = getAvatarIcon(iconId);
  const { circle, icon } = sizeMap[size];

  return (
    <div
      className={`${circle} shrink-0 rounded-full border border-periwinkle/30 bg-bold-blue/15 flex items-center justify-center ${className}`}
    >
      <def.Icon className={`${icon} text-periwinkle`} strokeWidth={1.5} />
    </div>
  );
}
