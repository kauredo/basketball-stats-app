import React, { useState, useEffect } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { PlayerStat } from "../../types/livegame";
import { CheckIcon, UserGroupIcon, UserPlusIcon } from "@heroicons/react/24/outline";

interface StartingLineupSelectorProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId?: Id<"teams">;
  awayTeamId?: Id<"teams">;
  homeStats: PlayerStat[];
  awayStats: PlayerStat[];
  initialHomeStarters?: Id<"players">[];
  initialAwayStarters?: Id<"players">[];
  onStartersChange: (homeStarters: Id<"players">[], awayStarters: Id<"players">[]) => void;
  onStartGame: () => void;
  onCreatePlayers?: (teamId: Id<"teams">, count: number) => Promise<void>;
  isStarting?: boolean;
  isCreatingPlayers?: boolean;
}

export const StartingLineupSelector: React.FC<StartingLineupSelectorProps> = ({
  homeTeamName,
  awayTeamName,
  homeTeamId,
  awayTeamId,
  homeStats,
  awayStats,
  initialHomeStarters = [],
  initialAwayStarters = [],
  onStartersChange,
  onStartGame,
  onCreatePlayers,
  isStarting = false,
  isCreatingPlayers = false,
}) => {
  const [homeStarters, setHomeStarters] = useState<Id<"players">[]>(initialHomeStarters);
  const [awayStarters, setAwayStarters] = useState<Id<"players">[]>(initialAwayStarters);

  // Initialize with first 5 players if no starters set
  useEffect(() => {
    if (homeStarters.length === 0 && homeStats.length > 0) {
      const defaultHomeStarters = homeStats.slice(0, 5).map((p) => p.playerId);
      setHomeStarters(defaultHomeStarters);
    }
    if (awayStarters.length === 0 && awayStats.length > 0) {
      const defaultAwayStarters = awayStats.slice(0, 5).map((p) => p.playerId);
      setAwayStarters(defaultAwayStarters);
    }
  }, [homeStats, awayStats]);

  // Notify parent of changes
  useEffect(() => {
    onStartersChange(homeStarters, awayStarters);
  }, [homeStarters, awayStarters, onStartersChange]);

  const togglePlayer = (playerId: Id<"players">, isHome: boolean) => {
    if (isHome) {
      if (homeStarters.includes(playerId)) {
        setHomeStarters(homeStarters.filter((id) => id !== playerId));
      } else if (homeStarters.length < 5) {
        setHomeStarters([...homeStarters, playerId]);
      }
    } else {
      if (awayStarters.includes(playerId)) {
        setAwayStarters(awayStarters.filter((id) => id !== playerId));
      } else if (awayStarters.length < 5) {
        setAwayStarters([...awayStarters, playerId]);
      }
    }
  };

  const canStart = homeStarters.length === 5 && awayStarters.length === 5;

  const renderTeamSelector = (
    teamName: string,
    players: PlayerStat[],
    starters: Id<"players">[],
    isHome: boolean,
    teamId?: Id<"teams">
  ) => {
    const playersNeeded = Math.max(0, 5 - players.length);
    const hasEnoughPlayers = players.length >= 5;

    return (
      <div className="flex-1 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        <div
          className={`px-4 py-3 ${
            isHome ? "bg-primary-50 dark:bg-primary-900/20" : "bg-surface-50 dark:bg-surface-700/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white">{teamName}</h3>
            <span
              className={`text-sm font-medium ${
                starters.length === 5 ? "text-green-600" : "text-primary-600"
              }`}
            >
              {starters.length}/5 selected
            </span>
          </div>
        </div>

        {/* Not enough players warning */}
        {!hasEnoughPlayers && (
          <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Need {playersNeeded} more player{playersNeeded > 1 ? "s" : ""}
              </p>
              {onCreatePlayers && teamId && (
                <button
                  onClick={() => onCreatePlayers(teamId, playersNeeded)}
                  disabled={isCreatingPlayers}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  {isCreatingPlayers
                    ? "Creating..."
                    : `Add ${playersNeeded} Player${playersNeeded > 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
          {players.length === 0 ? (
            <div className="text-center py-8 text-surface-500 dark:text-surface-400">
              <UserGroupIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No players on this team</p>
            </div>
          ) : (
            players.map((playerStat) => {
              const isSelected = starters.includes(playerStat.playerId);
              const isDisabled = !isSelected && starters.length >= 5;

              return (
                <button
                  key={playerStat.playerId}
                  onClick={() => togglePlayer(playerStat.playerId, isHome)}
                  disabled={isDisabled}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : isDisabled
                        ? "border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 opacity-50 cursor-not-allowed"
                        : "border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-surface-50 dark:hover:bg-surface-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        isSelected
                          ? "bg-green-500 text-white"
                          : "bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300"
                      }`}
                    >
                      {playerStat.player?.number ?? "?"}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-surface-900 dark:text-white">
                        {playerStat.player?.name || "Unknown"}
                      </p>
                      {playerStat.player?.position && (
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {playerStat.player.position}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && <CheckIcon className="w-6 h-6 text-green-500" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <UserGroupIcon className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">
            Select Starting Lineups
          </h2>
        </div>
        <p className="text-sm text-surface-600 dark:text-surface-400">
          Choose 5 players from each team to start the game
        </p>
      </div>

      {/* Team Selectors */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        {renderTeamSelector(awayTeamName, awayStats, awayStarters, false, awayTeamId)}
        {renderTeamSelector(homeTeamName, homeStats, homeStarters, true, homeTeamId)}
      </div>

      {/* Start Game Button */}
      <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        <button
          onClick={onStartGame}
          disabled={!canStart || isStarting}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canStart && !isStarting
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-surface-300 dark:bg-surface-700 text-surface-500 dark:text-surface-400 cursor-not-allowed"
          }`}
        >
          {isStarting
            ? "Starting Game..."
            : canStart
              ? "Start Game"
              : `Select ${5 - homeStarters.length + (5 - awayStarters.length)} more player(s)`}
        </button>
      </div>
    </div>
  );
};

export default StartingLineupSelector;
