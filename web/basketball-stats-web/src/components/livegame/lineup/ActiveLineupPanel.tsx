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
 * Pro sports broadcast aesthetic.
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
    <div className={`rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm ${compact ? "p-2" : "p-4"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-1 h-6 rounded-full ${isHomeTeam ? "bg-orange-500" : "bg-blue-500"}`} />
          <h3 className={`font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wide ${compact ? "text-xs" : "text-sm"}`}>
            {teamName}
          </h3>
        </div>
        {isSwapping && swappingFromThisTeam && (
          <button
            onClick={onCancelSwap}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold px-2 py-1 rounded bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* On Court Players */}
      <div className="space-y-2 mb-3">
        <div className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-widest font-semibold">On Court</div>
        <div className={`grid ${compact ? "grid-cols-5 gap-1" : "grid-cols-5 gap-2"}`}>
          {onCourt.map((player) => {
            const isSelected = swappingPlayer === player.playerId;
            return (
              <button
                key={player.playerId}
                onClick={() => handlePlayerClick(player)}
                disabled={disabled}
                className={`
                  ${compact ? "p-1.5" : "p-2.5"}
                  rounded-xl text-center transition-all duration-200
                  ${isSelected
                    ? "ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-500/20 border-orange-300 dark:border-orange-500/50"
                    : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                  border
                  ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95 hover:scale-105"}
                `}
              >
                <div className={`font-black text-gray-900 dark:text-white ${compact ? "text-sm" : "text-base"}`}>
                  #{player.player?.number}
                </div>
                <div className={`text-gray-500 dark:text-gray-400 truncate font-medium ${compact ? "text-[8px]" : "text-[10px]"}`}>
                  {player.player?.name?.split(" ").pop()}
                </div>
                <div className="flex justify-center mt-1.5">
                  <FoulDots fouls={player.fouls} foulLimit={foulLimit} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bench Players */}
      {onBench.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-widest font-semibold">Bench</div>
          <div className="flex flex-wrap gap-1.5">
            {onBench.map((player) => (
              <button
                key={player.playerId}
                onClick={() => handlePlayerClick(player)}
                disabled={disabled || !swappingFromThisTeam}
                className={`
                  px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
                  ${swappingFromThisTeam
                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 cursor-pointer"
                    : "bg-gray-100 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
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
        <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-widest font-semibold">Fouled Out</div>
          <div className="flex flex-wrap gap-1.5">
            {fouledOut.map((player) => (
              <span
                key={player.playerId}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold line-through bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30"
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
