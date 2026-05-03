import type { LucideIcon } from 'lucide-react';
import {
  Leaf,
  Moon,
  Sun,
  Star,
  Heart,
  Flower2,
  Bird,
  Fish,
  Rabbit,
  Cat,
  Dog,
  Turtle,
  Snail,
  Squirrel,
  Feather,
  Waves,
  Mountain,
  Trees,
  CloudRain,
  Snowflake,
} from 'lucide-react';

export interface AvatarIconDef {
  id: string;
  label: string;
  Icon: LucideIcon;
}

export const AVATAR_ICONS: AvatarIconDef[] = [
  { id: 'leaf',      label: 'Leaf',       Icon: Leaf },
  { id: 'moon',      label: 'Moon',       Icon: Moon },
  { id: 'sun',       label: 'Sun',        Icon: Sun },
  { id: 'star',      label: 'Star',       Icon: Star },
  { id: 'heart',     label: 'Heart',      Icon: Heart },
  { id: 'flower',    label: 'Flower',     Icon: Flower2 },
  { id: 'bird',      label: 'Bird',       Icon: Bird },
  { id: 'fish',      label: 'Fish',       Icon: Fish },
  { id: 'rabbit',    label: 'Rabbit',     Icon: Rabbit },
  { id: 'cat',       label: 'Cat',        Icon: Cat },
  { id: 'dog',       label: 'Dog',        Icon: Dog },
  { id: 'turtle',    label: 'Turtle',     Icon: Turtle },
  { id: 'snail',     label: 'Snail',      Icon: Snail },
  { id: 'squirrel',  label: 'Squirrel',   Icon: Squirrel },
  { id: 'feather',   label: 'Feather',    Icon: Feather },
  { id: 'waves',     label: 'Waves',      Icon: Waves },
  { id: 'mountain',  label: 'Mountain',   Icon: Mountain },
  { id: 'trees',     label: 'Trees',      Icon: Trees },
  { id: 'rain',      label: 'Rain',       Icon: CloudRain },
  { id: 'snowflake', label: 'Snowflake',  Icon: Snowflake },
];

export const DEFAULT_AVATAR_ICON_ID = 'leaf';

export function getAvatarIcon(id: string | null | undefined): AvatarIconDef {
  return AVATAR_ICONS.find((a) => a.id === id) ?? AVATAR_ICONS[0];
}
