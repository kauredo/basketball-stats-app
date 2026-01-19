import React from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat } from "../../../types/livegame";
import { FoulDots } from "../utility/FoulDots";

interface ActiveLineupPanelProps {
  teamName: string;
  teamId: Id<"teams">;
  players: PlayerStat[];
  foulLimit: number;
  onPlayerSelect?: (playerId: Id<"players">) => void;
  onSwap: (playerOut: Id<"players">, playerIn: Id<"players">) => void;
  swappingPlayer: Id<"players"> | null;
  onStartSwap: (playerId: Id<"players">) => void;
  onCancelSwap: () => void;
  disabled?: boolean;
  compact?: boolean;
  isHomeTeam?: boolean;
}

/**
 * Panel showing 5 on-court players and bench players for a team.
 * Supports substitution by selecting a player to swap out, then selecting a bench player.
 */
export const ActiveLineupPanel: React.FC<ActiveLineupPanelProps> = ({
  teamName,
  teamId,
  players,
  foulLimit,
  onPlayerSelect,
  onSwap,
  swappingPlayer,
  onStartSwap,
  onCancelSwap,
  disabled = false,
  compact = false,
  isHomeTeam = false,
}) => {
  const onCourt = players.filter((p) => p.isOnCourt && !p.fouledOut);
  const onBench = players.filter((p) => !p.isOnCourt && !p.fouledOut);
  const fouledOut = players.filter((p) => p.fouledOut);

  const isSwapping = swappingPlayer !== null;
  const swappingFromThisTeam = isSwapping && players.some((p) => p.playerId === swappingPlayer);

  const handlePlayerClick = (player: PlayerStat) => {
    if (disabled) return;

    // If we're swapping and clicking a bench player from the same team
    if (swappingFromThisTeam && !player.isOnCourt && !player.fouledOut) {
      onSwap(swappingPlayer!, player.playerId);
      return;
    }

    // If clicking an on-court player, start swap or select
    if (player.isOnCourt) {
      if (onPlayerSelect) {
        onPlayerSelect(player.playerId);
      } else {
        onStartSwap(player.playerId);
      }
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${
        compact ? "p-2" : "p-3"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold text-gray-900 dark:text-white ${compact ? "text-xs" : "text-sm"}`}>
          {teamName}
        </h3>
        {isSwapping && swappingFromThisTeam && (
          <button
            onClick={onCancelSwap}
            className="text-xs text-red-600 dark:text-red-400 font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      {/* On Court Players */}
      <div className="space-y-1 mb-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-wide">On Court</div>
        <div className={`grid ${compact ? "grid-cols-5 gap-1" : "grid-cols-5 gap-1.5"}`}>
          {onCourt.map((player) => {
            const isSelected = swappingPlayer === player.playerId;
            return (
              <button
                key={player.playerId}
                onClick={() => handlePlayerClick(player)}
                disabled={disabled}
                className={`
                  ${compact ? "p-1.5" : "p-2"}
                  rounded-lg text-center transition-all
                  ${
                    isSelected
                      ? "bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 ring-2 ring-orange-500/30"
                      : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
                `}
              >
                <div className={`font-bold text-gray-900 dark:text-white ${compact ? "text-xs" : "text-sm"}`}>
                  #{player.player?.number}
                </div>
                <div className={`text-gray-500 truncate ${compact ? "text-[8px]" : "text-[10px]"}`}>
                  {player.player?.name?.split(" ").pop()}
                </div>
                <div className="flex justify-center mt-1">
                  <FoulDots fouls={player.fouls} foulLimit={foulLimit} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bench Players */}
      {onBench.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Bench</div>
          <div className={`flex flex-wrap gap-1`}>
            {onBench.map((player) => (
              <button
                key={player.playerId}
                onClick={() => handlePlayerClick(player)}
                disabled={disabled || !swappingFromThisTeam}
                className={`
                  px-2 py-1 rounded text-xs font-medium transition-all
                  ${
                    swappingFromThisTeam
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40 cursor-pointer active:scale-95"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                #{player.player?.number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fouled Out Players */}
      {fouledOut.length > 0 && (
        <div className="space-y-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-[10px] text-red-500 uppercase tracking-wide">Fouled Out</div>
          <div className="flex flex-wrap gap-1">
            {fouledOut.map((player) => (
              <span
                key={player.playerId}
                className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 line-through"
              >
                #{player.player?.number}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveLineupPanel;
