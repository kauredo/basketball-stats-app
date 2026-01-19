import React from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { InteractiveCourt } from "./court/InteractiveCourt";
import { ActiveLineupPanel } from "./lineup/ActiveLineupPanel";
import { QuickStatButtonGrid } from "./stats/QuickStatButtonGrid";
import { PlayerStat, StatType, ShotLocation } from "../../types/livegame";

interface CourtModeContentProps {
  // Team data
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: Id<"teams">;
  awayTeamId: Id<"teams">;
  homeStats: PlayerStat[];
  awayStats: PlayerStat[];
  foulLimit: number;

  // Court interactions
  onCourtClick: (x: number, y: number, is3pt: boolean, zoneName: string) => void;
  recentShots: ShotLocation[];
  showHeatMap?: boolean;
  allShots?: ShotLocation[];

  // Stat recording
  onStatSelect: (statType: StatType) => void;

  // Substitution
  swappingPlayer: Id<"players"> | null;
  onSwap: (playerOut: Id<"players">, playerIn: Id<"players">) => void;
  onStartSwap: (playerId: Id<"players">) => void;
  onCancelSwap: () => void;

  // Disabled state
  disabled?: boolean;
}

/**
 * Court mode content - shows the interactive court on the left (40%)
 * and team lineups with quick stats on the right (60%).
 *
 * Uses h-full to fill the available space from LiveGameLayout.
 */
export const CourtModeContent: React.FC<CourtModeContentProps> = ({
  homeTeamName,
  awayTeamName,
  homeTeamId,
  awayTeamId,
  homeStats,
  awayStats,
  foulLimit,
  onCourtClick,
  recentShots,
  showHeatMap = false,
  allShots = [],
  onStatSelect,
  swappingPlayer,
  onSwap,
  onStartSwap,
  onCancelSwap,
  disabled = false,
}) => {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-3">
      {/* Left: Court Panel (40%) */}
      <div className="lg:col-span-5 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-3 flex-1 flex flex-col min-h-0">
          {/* Court Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-900 dark:text-white font-semibold text-sm">
              Tap Court to Record Shot
            </h3>
            <div className="flex gap-1">
              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                2PT
              </span>
              <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                3PT
              </span>
            </div>
          </div>

          {/* Interactive Court */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="w-full max-w-[300px]">
              <InteractiveCourt
                onCourtClick={onCourtClick}
                disabled={disabled}
                recentShots={recentShots}
                showHeatMap={showHeatMap}
                allShots={allShots}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 text-xs mb-2">Quick Stats</p>
            <QuickStatButtonGrid onStatSelect={onStatSelect} disabled={disabled} />
          </div>
        </div>
      </div>

      {/* Right: Team Lineups (60%) */}
      <div className="lg:col-span-7 flex flex-col gap-3 min-h-0 overflow-auto">
        {/* Away Team */}
        <ActiveLineupPanel
          teamName={awayTeamName}
          teamId={awayTeamId}
          players={awayStats}
          foulLimit={foulLimit}
          onSwap={onSwap}
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
          swappingPlayer={swappingPlayer}
          onStartSwap={onStartSwap}
          onCancelSwap={onCancelSwap}
          disabled={disabled}
          isHomeTeam
        />
      </div>
    </div>
  );
};

export default CourtModeContent;
