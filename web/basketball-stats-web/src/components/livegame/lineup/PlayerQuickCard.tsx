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
  const padding = size === "sm" ? "p-1.5" : "p-2";
  const numberSize = size === "sm" ? "text-xs" : "text-sm";
  const nameSize = size === "sm" ? "text-[8px]" : "text-[10px]";
  const statSize = size === "sm" ? "text-[7px]" : "text-[9px]";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${padding}
        rounded-lg text-center transition-all w-full
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
      <div className={`text-gray-500 truncate ${nameSize}`}>
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
        <div className={`flex justify-center gap-1 mt-1 text-gray-500 ${statSize}`}>
          <span>{player.points}p</span>
          <span>{player.rebounds}r</span>
          <span>{player.assists}a</span>
        </div>
      )}
    </button>
  );
};

export default PlayerQuickCard;
