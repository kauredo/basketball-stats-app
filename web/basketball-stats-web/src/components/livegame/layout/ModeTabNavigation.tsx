import React from "react";
import {
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  ChartBarIcon as ChartBarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  UsersIcon as UsersIconSolid,
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
  { key: "plays", label: "Plays", icon: ClipboardDocumentListIcon, iconSolid: ClipboardDocumentListIconSolid },
  { key: "lineups", label: "Lineups", icon: UsersIcon, iconSolid: UsersIconSolid },
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
    <div className={`flex h-12 rounded-xl p-1 bg-gray-200 dark:bg-gray-800 ${className}`}>
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
              ${isActive
                ? "bg-orange-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
