import React, { useState, useEffect } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  CheckIcon,
  UserGroupIcon,
  UserPlusIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

// Simple player interface for roster display
interface RosterPlayer {
  id: Id<"players">;
  name: string;
  number: number;
  position?: string | null;
  active?: boolean;
}

interface StartingLineupSelectorProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId?: Id<"teams">;
  awayTeamId?: Id<"teams">;
  homePlayers: RosterPlayer[];
  awayPlayers: RosterPlayer[];
  initialHomeStarters?: Id<"players">[];
  initialAwayStarters?: Id<"players">[];
  initialHomeActiveRoster?: Id<"players">[];
  initialAwayActiveRoster?: Id<"players">[];
  rosterLimit?: number; // From league settings (default 15)
  onStartersChange: (homeStarters: Id<"players">[], awayStarters: Id<"players">[]) => void;
  onActiveRosterChange?: (
    homeActiveRoster: Id<"players">[],
    awayActiveRoster: Id<"players">[]
  ) => void;
  onStartGame: () => void;
  onCreatePlayers?: (teamId: Id<"teams">, count: number) => Promise<void>;
  isStarting?: boolean;
  isLoading?: boolean;
  isCreatingPlayers?: boolean;
}

export const StartingLineupSelector: React.FC<StartingLineupSelectorProps> = ({
  homeTeamName,
  awayTeamName,
  homeTeamId,
  awayTeamId,
  homePlayers,
  awayPlayers,
  initialHomeStarters = [],
  initialAwayStarters = [],
  initialHomeActiveRoster,
  initialAwayActiveRoster,
  rosterLimit = 15,
  onStartersChange,
  onActiveRosterChange,
  onStartGame,
  onCreatePlayers,
  isStarting = false,
  isLoading = false,
  isCreatingPlayers = false,
}) => {
  const [homeStarters, setHomeStarters] = useState<Id<"players">[]>(initialHomeStarters);
  const [awayStarters, setAwayStarters] = useState<Id<"players">[]>(initialAwayStarters);
  const [homeActiveRoster, setHomeActiveRoster] = useState<Id<"players">[]>([]);
  const [awayActiveRoster, setAwayActiveRoster] = useState<Id<"players">[]>([]);
  const [overrideLimit, setOverrideLimit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize active roster with first N players (N = roster limit)
  useEffect(() => {
    const activeHomePlayers = homePlayers.filter((p) => p.active !== false);
    const activeAwayPlayers = awayPlayers.filter((p) => p.active !== false);

    // Use initial values if provided, otherwise default to first N players
    if (initialHomeActiveRoster && initialHomeActiveRoster.length > 0) {
      setHomeActiveRoster(initialHomeActiveRoster);
    } else if (homeActiveRoster.length === 0 && activeHomePlayers.length > 0) {
      setHomeActiveRoster(activeHomePlayers.slice(0, rosterLimit).map((p) => p.id));
    }

    if (initialAwayActiveRoster && initialAwayActiveRoster.length > 0) {
      setAwayActiveRoster(initialAwayActiveRoster);
    } else if (awayActiveRoster.length === 0 && activeAwayPlayers.length > 0) {
      setAwayActiveRoster(activeAwayPlayers.slice(0, rosterLimit).map((p) => p.id));
    }
  }, [homePlayers, awayPlayers, rosterLimit, initialHomeActiveRoster, initialAwayActiveRoster]);

  // Initialize starters from active roster
  useEffect(() => {
    if (homeStarters.length === 0 && homeActiveRoster.length >= 5) {
      setHomeStarters(homeActiveRoster.slice(0, 5));
    }
    if (awayStarters.length === 0 && awayActiveRoster.length >= 5) {
      setAwayStarters(awayActiveRoster.slice(0, 5));
    }
  }, [homeActiveRoster, awayActiveRoster]);

  // Notify parent of starter changes
  useEffect(() => {
    onStartersChange(homeStarters, awayStarters);
  }, [homeStarters, awayStarters, onStartersChange]);

  // Notify parent of active roster changes
  useEffect(() => {
    onActiveRosterChange?.(homeActiveRoster, awayActiveRoster);
  }, [homeActiveRoster, awayActiveRoster, onActiveRosterChange]);

  const effectiveLimit = overrideLimit ? 20 : rosterLimit;

  const toggleActiveRoster = (playerId: Id<"players">, isHome: boolean) => {
    if (isHome) {
      if (homeActiveRoster.includes(playerId)) {
        // Remove from active roster (also remove from starters if selected)
        setHomeActiveRoster(homeActiveRoster.filter((id) => id !== playerId));
        setHomeStarters(homeStarters.filter((id) => id !== playerId));
      } else if (homeActiveRoster.length < effectiveLimit) {
        setHomeActiveRoster([...homeActiveRoster, playerId]);
      }
    } else {
      if (awayActiveRoster.includes(playerId)) {
        setAwayActiveRoster(awayActiveRoster.filter((id) => id !== playerId));
        setAwayStarters(awayStarters.filter((id) => id !== playerId));
      } else if (awayActiveRoster.length < effectiveLimit) {
        setAwayActiveRoster([...awayActiveRoster, playerId]);
      }
    }
  };

  const toggleStarter = (playerId: Id<"players">, isHome: boolean) => {
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
  const allPlayers = {
    home: homePlayers.filter((p) => p.active !== false),
    away: awayPlayers.filter((p) => p.active !== false),
  };
  const hasEnoughHomePlayers = allPlayers.home.length >= 5;
  const hasEnoughAwayPlayers = allPlayers.away.length >= 5;

  const renderTeamSelector = (
    teamName: string,
    players: RosterPlayer[],
    activeRoster: Id<"players">[],
    starters: Id<"players">[],
    isHome: boolean,
    teamId?: Id<"teams">
  ) => {
    const teamPlayers = players.filter((p) => p.active !== false);
    const playersNeeded = Math.max(0, 5 - teamPlayers.length);
    const hasEnoughPlayers = teamPlayers.length >= 5;
    const isOverLimit = activeRoster.length > rosterLimit && !overrideLimit;

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        <div
          className={`shrink-0 px-4 py-3 ${
            isHome ? "bg-primary-50 dark:bg-primary-900/20" : "bg-surface-50 dark:bg-surface-700/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white">{teamName}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-500 dark:text-surface-400">
                Roster: {activeRoster.length}/{rosterLimit}
              </span>
              <span
                className={`text-sm font-medium ${
                  starters.length === 5 ? "text-green-600" : "text-primary-600"
                }`}
              >
                Starters: {starters.length}/5
              </span>
            </div>
          </div>
        </div>

        {/* Not enough players warning */}
        {!hasEnoughPlayers && !isLoading && (
          <div className="shrink-0 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
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
                    ? "Adding..."
                    : `Add ${playersNeeded} Player${playersNeeded > 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Over limit warning */}
        {isOverLimit && (
          <div className="shrink-0 px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              Over roster limit ({activeRoster.length}/{rosterLimit})
            </p>
          </div>
        )}

        <div className="flex-1 min-h-0 p-3 space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-surface-500 dark:text-surface-400">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p>Loading players...</p>
            </div>
          ) : teamPlayers.length === 0 ? (
            <div className="text-center py-8 text-surface-500 dark:text-surface-400">
              <UserGroupIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No players on this team</p>
            </div>
          ) : (
            teamPlayers.map((player) => {
              const isInActiveRoster = activeRoster.includes(player.id);
              const isStarter = starters.includes(player.id);
              const canAddToRoster = activeRoster.length < effectiveLimit;
              const canAddAsStarter = isInActiveRoster && starters.length < 5;

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isStarter
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : isInActiveRoster
                        ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10"
                        : "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 opacity-60"
                  }`}
                >
                  {/* Active roster checkbox */}
                  <button
                    onClick={() => toggleActiveRoster(player.id, isHome)}
                    disabled={!isInActiveRoster && !canAddToRoster}
                    className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      isInActiveRoster
                        ? "bg-blue-500 border-blue-500 text-white"
                        : canAddToRoster
                          ? "border-surface-300 dark:border-surface-600 hover:border-blue-400"
                          : "border-surface-300 dark:border-surface-600 opacity-50 cursor-not-allowed"
                    }`}
                    title={isInActiveRoster ? "Remove from game roster" : "Add to game roster"}
                  >
                    {isInActiveRoster && <CheckIcon className="w-4 h-4" />}
                  </button>

                  {/* Player info */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                      isStarter
                        ? "bg-green-500 text-white"
                        : isInActiveRoster
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400"
                    }`}
                  >
                    {player.number ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium truncate ${
                        isInActiveRoster
                          ? "text-surface-900 dark:text-white"
                          : "text-surface-500 dark:text-surface-400"
                      }`}
                    >
                      {player.name || "Unknown"}
                    </p>
                    {player.position && (
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {player.position}
                      </p>
                    )}
                  </div>

                  {/* Starter toggle - only for players in active roster */}
                  {isInActiveRoster && (
                    <button
                      onClick={() => toggleStarter(player.id, isHome)}
                      disabled={!isStarter && !canAddAsStarter}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isStarter
                          ? "bg-green-500 text-white"
                          : canAddAsStarter
                            ? "bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300"
                            : "bg-surface-200 dark:bg-surface-700 text-surface-400 dark:text-surface-500 cursor-not-allowed"
                      }`}
                    >
                      {isStarter ? "Starting" : "Start"}
                    </button>
                  )}
                </div>
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
      <div className="flex items-center justify-between mb-4">
        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            <UserGroupIcon className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">
              Select Game Roster & Starters
            </h2>
          </div>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Check players for game roster, then select 5 starters per team
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          title="Roster settings"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">
            Roster Settings
          </h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={overrideLimit}
              onChange={(e) => setOverrideLimit(e.target.checked)}
              className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-surface-700 dark:text-surface-300">
              Override roster limit ({rosterLimit} players per team)
            </span>
          </label>
        </div>
      )}

      {/* Team Selectors */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        {renderTeamSelector(
          awayTeamName,
          awayPlayers,
          awayActiveRoster,
          awayStarters,
          false,
          awayTeamId
        )}
        {renderTeamSelector(
          homeTeamName,
          homePlayers,
          homeActiveRoster,
          homeStarters,
          true,
          homeTeamId
        )}
      </div>

      {/* Start Game Button */}
      <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        <button
          onClick={onStartGame}
          disabled={!canStart || isStarting || !hasEnoughHomePlayers || !hasEnoughAwayPlayers}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canStart && !isStarting && hasEnoughHomePlayers && hasEnoughAwayPlayers
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-surface-300 dark:bg-surface-700 text-surface-500 dark:text-surface-400 cursor-not-allowed"
          }`}
        >
          {isStarting
            ? "Starting Game..."
            : !hasEnoughHomePlayers || !hasEnoughAwayPlayers
              ? "Not enough players on teams"
              : canStart
                ? "Start Game"
                : `Select ${5 - homeStarters.length + (5 - awayStarters.length)} more starter(s)`}
        </button>
      </div>
    </div>
  );
};

export default StartingLineupSelector;
