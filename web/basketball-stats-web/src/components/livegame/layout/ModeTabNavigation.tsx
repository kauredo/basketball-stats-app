import React from "react";
import {
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  ChartBarIcon as ChartBarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  UsersIcon as UsersIconSolid,
  ClockIcon as ClockIconSolid,
} from "@heroicons/react/24/solid";
import { GameMode } from "../../../types/livegame";

interface Tab {
  key: GameMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { key: "court", label: "Court", icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { key: "stats", label: "Stats", icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
  {
    key: "plays",
    label: "Plays",
    icon: ClipboardDocumentListIcon,
    iconSolid: ClipboardDocumentListIconSolid,
  },
  { key: "lineups", label: "Lineups", icon: UsersIcon, iconSolid: UsersIconSolid },
  { key: "clock", label: "Clock", icon: ClockIcon, iconSolid: ClockIconSolid },
];

interface ModeTabNavigationProps {
  activeMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  className?: string;
}

/**
 * Tab navigation for switching between live game modes:
 * Court, Stats, Plays, Lineups
 *
 * Pro sports broadcast aesthetic with dramatic dark styling.
 */
export const ModeTabNavigation: React.FC<ModeTabNavigationProps> = ({
  activeMode,
  onModeChange,
  className = "",
}) => {
  return (
    <div className={`flex h-12 rounded-xl p-1 bg-surface-200 dark:bg-surface-800 ${className}`}>
      {TABS.map((tab) => {
        const isActive = activeMode === tab.key;
        const Icon = isActive ? tab.iconSolid : tab.icon;

        return (
          <button
            key={tab.key}
            onClick={() => onModeChange(tab.key)}
            className={`
              flex-1 flex items-center justify-center gap-2 rounded-lg font-semibold text-sm
              transition-all duration-200 ease-out
              ${
                isActive
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700"
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ModeTabNavigation;
