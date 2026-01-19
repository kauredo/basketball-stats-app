import React from "react";
import {
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { GameMode } from "../../../types/livegame";

interface Tab {
  key: GameMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { key: "court", label: "Court", icon: ChartBarIcon },
  { key: "stats", label: "Stats", icon: UserGroupIcon },
  { key: "plays", label: "Plays", icon: ClipboardDocumentListIcon },
  { key: "lineups", label: "Lineups", icon: UsersIcon },
];

interface ModeTabNavigationProps {
  activeMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  className?: string;
}

/**
 * Tab navigation for switching between live game modes:
 * Court, Stats, Plays, Lineups
 */
export const ModeTabNavigation: React.FC<ModeTabNavigationProps> = ({
  activeMode,
  onModeChange,
  className = "",
}) => {
  return (
    <div className={`flex h-11 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
      {TABS.map((tab) => {
        const isActive = activeMode === tab.key;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            onClick={() => onModeChange(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md font-medium text-sm transition-all ${
              isActive
                ? "bg-orange-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ModeTabNavigation;
