import React from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat } from "../../../types/livegame";
import { FoulDots } from "../utility/FoulDots";

interface PlayerQuickCardProps {
  player: PlayerStat;
  foulLimit: number;
  isSelected?: boolean;
  isSwapTarget?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  showStats?: boolean;
}

/**
 * Compact player card showing number, name, fouls, and key stats.
 * Used in lineup panels and player selection contexts.
 */
export const PlayerQuickCard: React.FC<PlayerQuickCardProps> = ({
  player,
  foulLimit,
  isSelected = false,
  isSwapTarget = false,
  onClick,
  disabled = false,
  size = "sm",
  showStats = false,
}) => {
  // Use rem-based sizes that scale with user font preferences
  // Minimum touch target of 44px
  const padding = size === "sm" ? "p-2" : "p-2.5";
  const numberSize = size === "sm" ? "text-sm" : "text-base";
  const nameSize = size === "sm" ? "text-xs" : "text-sm";
  const statSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={`${player.player?.name}, #${player.player?.number}, ${player.fouls} fouls${player.fouledOut ? ", fouled out" : ""}`}
      className={`
        ${padding}
        rounded-lg text-center transition-all w-full min-h-[44px]
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
        ${
          isSelected
            ? "bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 ring-2 ring-orange-500/30"
            : isSwapTarget
              ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-500 ring-2 ring-green-500/30"
              : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
        ${player.fouledOut ? "opacity-60" : ""}
      `}
    >
      {/* Number */}
      <div className={`font-bold text-gray-900 dark:text-white ${numberSize}`}>
        #{player.player?.number}
      </div>

      {/* Name (last name) */}
      <div
        className={`text-gray-500 dark:text-gray-400 truncate ${nameSize}`}
        title={player.player?.name}
      >
        {player.player?.name?.split(" ").pop()}
      </div>

      {/* Foul Dots */}
      <div className="flex justify-center mt-1">
        <FoulDots
          fouls={player.fouls}
          foulLimit={foulLimit}
          fouledOut={player.fouledOut}
          size={size}
        />
      </div>

      {/* Mini Stats Row (optional) */}
      {showStats && (
        <div className={`flex justify-center gap-1 mt-1 text-gray-500 dark:text-gray-400 ${statSize}`}>
          <span>{player.points}p</span>
          <span>{player.rebounds}r</span>
          <span>{player.assists}a</span>
        </div>
      )}
    </button>
  );
};

export default PlayerQuickCard;
