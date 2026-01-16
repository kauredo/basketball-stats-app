import React from "react";
import {
  // Basic icons
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  UserPlusIcon,
  // Sports & Activity
  PlayIcon,
  PauseIcon,
  StopIcon,
  ChartBarIcon,
  TrophyIcon,
  BoltIcon,
  // Navigation
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon as SettingsIcon,
  Bars3Icon as MenuIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  // Actions
  PlusIcon,
  MinusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon as SearchIcon,
  FunnelIcon as FilterIcon,
  ArrowPathIcon as RefreshIcon,
} from "@heroicons/react/24/outline";

export type IconName =
  // Auth & User
  | "eye"
  | "eye-off"
  | "mail"
  | "lock"
  | "user"
  | "user-plus"
  // Basketball & Sports (using closest equivalents)
  | "basketball"
  | "trophy"
  | "activity"
  | "target"
  | "stats"
  // Navigation & UI
  | "home"
  | "users"
  | "games"
  | "settings"
  | "menu"
  | "back"
  | "plus"
  | "minus"
  | "edit"
  | "trash"
  | "check"
  | "x"
  // Actions
  | "play"
  | "pause"
  | "stop"
  | "refresh"
  | "search"
  | "filter"
  // Arrows & Directions
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "arrow-down"
  | "chevron-down"
  | "chevron-up";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  color?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<IconName, React.ComponentType<any>> = {
  // Auth & User
  eye: EyeIcon,
  "eye-off": EyeSlashIcon,
  mail: EnvelopeIcon,
  lock: LockClosedIcon,
  user: UserIcon,
  "user-plus": UserPlusIcon,

  // Basketball & Sports (using best available alternatives)
  basketball: BoltIcon, // Using bolt as basketball substitute
  trophy: TrophyIcon,
  activity: BoltIcon,
  target: BoltIcon, // Using bolt as target substitute
  stats: ChartBarIcon,

  // Navigation & UI
  home: HomeIcon,
  users: UsersIcon,
  games: PlayIcon, // Using play icon for games
  settings: SettingsIcon,
  menu: MenuIcon,
  back: ArrowLeftIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  edit: PencilIcon,
  trash: TrashIcon,
  check: CheckIcon,
  x: XMarkIcon,

  // Actions
  play: PlayIcon,
  pause: PauseIcon,
  stop: StopIcon,
  refresh: RefreshIcon,
  search: SearchIcon,
  filter: FilterIcon,

  // Arrows & Directions
  "arrow-left": ArrowLeftIcon,
  "arrow-right": ArrowRightIcon,
  "arrow-up": ArrowUpIcon,
  "arrow-down": ArrowDownIcon,
  "chevron-down": ChevronDownIcon,
  "chevron-up": ChevronUpIcon,
};

export default function Icon({ name, size = 24, className = "", color }: IconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent
      width={size}
      height={size}
      className={className}
      style={color ? { color } : undefined}
    />
  );
}
