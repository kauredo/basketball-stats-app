import React from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { PlayerStat, LineupEntry } from "../../types/livegame";
import { ActiveLineupPanel } from "./lineup/ActiveLineupPanel";

interface LineupsModeContentProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: Id<"teams">;
  awayTeamId: Id<"teams">;
  homeStats: PlayerStat[];
  awayStats: PlayerStat[];
  foulLimit: number;
  onSwap: (playerOut: Id<"players">, playerIn: Id<"players">) => void;
  onSubIn?: (playerId: Id<"players">) => void;
  swappingPlayer: Id<"players"> | null;
  onStartSwap: (playerId: Id<"players">) => void;
  onCancelSwap: () => void;
  homeLineups?: LineupEntry[];
  awayLineups?: LineupEntry[];
  disabled?: boolean;
}

/**
 * Lineups mode content - shows current lineups and lineup combinations with +/-.
 * Allows substitutions from this view.
 */
export const LineupsModeContent: React.FC<LineupsModeContentProps> = ({
  homeTeamName,
  awayTeamName,
  homeTeamId,
  awayTeamId,
  homeStats,
  awayStats,
  foulLimit,
  onSwap,
  onSubIn,
  swappingPlayer,
  onStartSwap,
  onCancelSwap,
  homeLineups = [],
  awayLineups = [],
  disabled = false,
}) => {
  return (
    <div className="h-full overflow-auto space-y-3">
      {/* Current Lineups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Away Team */}
        <ActiveLineupPanel
          teamName={awayTeamName}
          teamId={awayTeamId}
          players={awayStats}
          foulLimit={foulLimit}
          onSwap={onSwap}
          onSubIn={onSubIn}
          swappingPlayer={swappingPlayer}
          onStartSwap={onStartSwap}
          onCancelSwap={onCancelSwap}
          disabled={disabled}
        />

        {/* Home Team */}
        <ActiveLineupPanel
          teamName={homeTeamName}
          teamId={homeTeamId}
          players={homeStats}
          foulLimit={foulLimit}
          onSwap={onSwap}
          onSubIn={onSubIn}
          swappingPlayer={swappingPlayer}
          onStartSwap={onStartSwap}
          onCancelSwap={onCancelSwap}
          disabled={disabled}
          isHomeTeam
        />
      </div>

      {/* Lineup Combinations (if available) */}
      {(homeLineups.length > 0 || awayLineups.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Away Lineups */}
          <LineupCombinations
            teamName={awayTeamName}
            lineups={awayLineups}
            allPlayers={awayStats}
          />

          {/* Home Lineups */}
          <LineupCombinations
            teamName={homeTeamName}
            lineups={homeLineups}
            allPlayers={homeStats}
            isHomeTeam
          />
        </div>
      )}
    </div>
  );
};

// Sub-component for lineup combinations
interface LineupCombinationsProps {
  teamName: string;
  lineups: LineupEntry[];
  allPlayers: PlayerStat[];
  isHomeTeam?: boolean;
}

const LineupCombinations: React.FC<LineupCombinationsProps> = ({
  teamName,
  lineups,
  allPlayers,
  isHomeTeam = false,
}) => {
  if (lineups.length === 0) return null;

  // Sort by minutes played
  const sortedLineups = [...lineups].sort(
    (a, b) => b.minutesPlayed - a.minutesPlayed
  );

  const getPlayerNumber = (playerId: Id<"players">) => {
    const player = allPlayers.find((p) => p.playerId === playerId);
    return player?.player?.number ?? "?";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className={`px-3 py-2 ${
          isHomeTeam
            ? "bg-orange-50 dark:bg-orange-900/20"
            : "bg-gray-50 dark:bg-gray-700/50"
        }`}
      >
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          {teamName} Lineups
        </h3>
      </div>
      <div className="p-2 space-y-1">
        {sortedLineups.slice(0, 5).map((lineup, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded"
          >
            <div className="flex gap-1">
              {lineup.players.map((playerId) => (
                <span
                  key={playerId}
                  className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-medium"
                >
                  #{getPlayerNumber(playerId)}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500">{lineup.minutesPlayed}m</span>
              <span
                className={`font-semibold ${
                  lineup.plusMinus > 0
                    ? "text-green-600"
                    : lineup.plusMinus < 0
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {lineup.plusMinus > 0 ? "+" : ""}
                {lineup.plusMinus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineupsModeContent;
