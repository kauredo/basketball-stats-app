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
  color: string;
  hoverColor: string;
  colSpan?: number;
}

const STAT_BUTTONS: StatButton[] = [
  { key: "rebound", label: "REB", color: "bg-blue-600", hoverColor: "hover:bg-blue-700" },
  { key: "assist", label: "AST", color: "bg-purple-600", hoverColor: "hover:bg-purple-700" },
  { key: "steal", label: "STL", color: "bg-cyan-600", hoverColor: "hover:bg-cyan-700" },
  { key: "block", label: "BLK", color: "bg-cyan-600", hoverColor: "hover:bg-cyan-700" },
  { key: "turnover", label: "TO", color: "bg-amber-600", hoverColor: "hover:bg-amber-700" },
  { key: "foul", label: "FOUL", color: "bg-red-600", hoverColor: "hover:bg-red-700" },
  { key: "freethrow", label: "FREE THROW", color: "bg-green-600", hoverColor: "hover:bg-green-700", colSpan: 2 },
];

/**
 * Grid of quick stat buttons for recording non-shot stats.
 * Used in the Court mode below the interactive court.
 */
export const QuickStatButtonGrid: React.FC<QuickStatButtonGridProps> = ({
  onStatSelect,
  disabled = false,
  compact = false,
}) => {
  return (
    <div className={`grid grid-cols-4 ${compact ? "gap-1" : "gap-1.5"}`}>
      {STAT_BUTTONS.map((btn) => (
        <button
          key={btn.key}
          onClick={() => onStatSelect(btn.key)}
          disabled={disabled}
          className={`
            ${compact ? "py-1.5" : "py-2"}
            ${btn.color} ${btn.hoverColor}
            disabled:bg-gray-300 dark:disabled:bg-gray-700
            text-white rounded-lg font-bold transition-colors
            ${compact ? "text-[10px]" : "text-xs"}
            ${btn.colSpan ? `col-span-${btn.colSpan}` : ""}
            active:scale-95 touch-manipulation
          `}
          style={btn.colSpan ? { gridColumn: `span ${btn.colSpan}` } : undefined}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};

export default QuickStatButtonGrid;
