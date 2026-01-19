import React from "react";
import { ArrowPathIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { LastAction } from "../../../types/livegame";

interface LastScorerPanelProps {
  lastAction: LastAction | null;
  onRepeat?: () => void;
  onUndo?: () => void;
  disabled?: boolean;
}

/**
 * Panel showing the last scoring action with quick repeat and undo buttons.
 * Useful for hot streaks where the same player is scoring multiple times.
 */
export const LastScorerPanel: React.FC<LastScorerPanelProps> = ({
  lastAction,
  onRepeat,
  onUndo,
  disabled = false,
}) => {
  if (!lastAction) return null;

  const isScoring = ["shot2", "shot3", "freethrow"].includes(lastAction.statType);
  const madeText = lastAction.wasMade ? "Made" : "Missed";
  const pointsText = lastAction.statType === "shot3" ? "3PT" :
                     lastAction.statType === "shot2" ? "2PT" :
                     lastAction.statType === "freethrow" ? "FT" : "";

  return (
    <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2">
      <div className="flex items-center justify-between gap-2">
        {/* Last action info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Last
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            #{lastAction.playerNumber}{" "}
            {isScoring ? `${pointsText} ${madeText}` : lastAction.displayText}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1">
          {/* Repeat button - only for scoring actions */}
          {isScoring && onRepeat && (
            <button
              onClick={onRepeat}
              disabled={disabled}
              className={`
                flex items-center gap-1 px-2 py-1 rounded
                bg-orange-100 dark:bg-orange-900/30
                text-orange-700 dark:text-orange-300
                text-xs font-medium
                hover:bg-orange-200 dark:hover:bg-orange-900/50
                transition-colors
                ${disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95"}
              `}
              title="Repeat same shot for this player"
            >
              <ArrowPathIcon className="h-3 w-3" />
              <span>Again</span>
            </button>
          )}

          {/* Undo button */}
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={disabled}
              className={`
                flex items-center gap-1 px-2 py-1 rounded
                bg-gray-200 dark:bg-gray-600
                text-gray-700 dark:text-gray-300
                text-xs font-medium
                hover:bg-gray-300 dark:hover:bg-gray-500
                transition-colors
                ${disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95"}
              `}
              title="Undo last action"
            >
              <ArrowUturnLeftIcon className="h-3 w-3" />
              <span>Undo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LastScorerPanel;
