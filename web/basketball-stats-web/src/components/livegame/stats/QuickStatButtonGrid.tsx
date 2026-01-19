import React from "react";
import { StatType } from "../../../types/livegame";

interface QuickStatButtonGridProps {
  onStatSelect: (statType: StatType) => void;
  disabled?: boolean;
  compact?: boolean;
}

interface StatButton {
  key: StatType;
  label: string;
  lightBg: string;
  darkBg: string;
  lightText: string;
  darkText: string;
  colSpan?: number;
}

const STAT_BUTTONS: StatButton[] = [
  {
    key: "rebound",
    label: "REB",
    lightBg: "bg-blue-600 hover:bg-blue-700",
    darkBg: "dark:bg-blue-600 dark:hover:bg-blue-700",
    lightText: "text-white",
    darkText: "dark:text-white",
  },
  {
    key: "assist",
    label: "AST",
    lightBg: "bg-violet-600 hover:bg-violet-700",
    darkBg: "dark:bg-violet-600 dark:hover:bg-violet-700",
    lightText: "text-white",
    darkText: "dark:text-white",
  },
  {
    key: "steal",
    label: "STL",
    lightBg: "bg-cyan-600 hover:bg-cyan-700",
    darkBg: "dark:bg-cyan-600 dark:hover:bg-cyan-700",
    lightText: "text-white",
    darkText: "dark:text-white",
  },
  {
    key: "block",
    label: "BLK",
    lightBg: "bg-teal-600 hover:bg-teal-700",
    darkBg: "dark:bg-teal-600 dark:hover:bg-teal-700",
    lightText: "text-white",
    darkText: "dark:text-white",
  },
  {
    key: "turnover",
    label: "TO",
    lightBg: "bg-amber-500 hover:bg-amber-600",
    darkBg: "dark:bg-amber-500 dark:hover:bg-amber-600",
    lightText: "text-white",
    darkText: "dark:text-white",
  },
  {
    key: "foul",
    label: "FOUL",
    lightBg: "bg-red-600 hover:bg-red-700",
    darkBg: "dark:bg-red-600 dark:hover:bg-red-700",
    lightText: "text-white",
    darkText: "dark:text-white",
  },
  {
    key: "freethrow",
    label: "FREE THROW",
    lightBg: "bg-emerald-600 hover:bg-emerald-700",
    darkBg: "dark:bg-emerald-600 dark:hover:bg-emerald-700",
    lightText: "text-white",
    darkText: "dark:text-white",
    colSpan: 2,
  },
];

/**
 * Grid of quick stat buttons for recording non-shot stats.
 * Used in the Court mode below the interactive court.
 * Touch-friendly with minimum 44px touch targets.
 */
export const QuickStatButtonGrid: React.FC<QuickStatButtonGridProps> = ({
  onStatSelect,
  disabled = false,
  compact = false,
}) => {
  return (
    <div className={`grid grid-cols-4 ${compact ? "gap-1" : "gap-1.5 sm:gap-2"}`}>
      {STAT_BUTTONS.map((btn) => (
        <button
          key={btn.key}
          onClick={() => onStatSelect(btn.key)}
          disabled={disabled}
          className={`
            ${compact ? "py-2 min-h-[40px]" : "py-2.5 sm:py-3 min-h-[44px] sm:min-h-[48px]"}
            ${btn.lightBg} ${btn.darkBg} ${btn.lightText} ${btn.darkText}
            rounded-lg sm:rounded-xl font-bold transition-all duration-200
            ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"}
            active:scale-95 touch-manipulation
            disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600
            shadow-sm hover:shadow
            select-none
          `}
          style={{
            gridColumn: btn.colSpan ? `span ${btn.colSpan}` : undefined,
            letterSpacing: "0.05em",
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};

export default QuickStatButtonGrid;
