import React from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat } from "../../../types/livegame";

interface BenchPlayerGridProps {
  players: PlayerStat[];
  onSelectPlayer: (playerId: Id<"players">) => void;
  isSwapTarget?: boolean;
  disabled?: boolean;
}

/**
 * Grid of bench players available for substitution.
 * Highlights when a swap is in progress to show available targets.
 */
export const BenchPlayerGrid: React.FC<BenchPlayerGridProps> = ({
  players,
  onSelectPlayer,
  isSwapTarget = false,
  disabled = false,
}) => {
  if (players.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {players.map((player) => (
        <button
          key={player.playerId}
          onClick={() => onSelectPlayer(player.playerId)}
          disabled={disabled || !isSwapTarget}
          title={player.player?.name || ""}
          className={`
            px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1
            ${
              isSwapTarget
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40 cursor-pointer active:scale-95"
                : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 cursor-default"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <span className="font-bold">#{player.player?.number}</span>
          <span>{player.player?.name?.split(" ").pop() || ""}</span>
        </button>
      ))}
    </div>
  );
};

export default BenchPlayerGrid;
