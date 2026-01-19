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
  onToggleHeatMap?: () => void;
  allShots?: ShotLocation[];

  // Stat recording
  onStatSelect: (statType: StatType) => void;

  // Substitution
  swappingPlayer: Id<"players"> | null;
  onSwap: (playerOut: Id<"players">, playerIn: Id<"players">) => void;
  onSubIn?: (playerId: Id<"players">) => void;
  onStartSwap: (playerId: Id<"players">) => void;
  onCancelSwap: () => void;

  // Disabled state
  disabled?: boolean;
}

/**
 * Court mode content - shows the interactive court on the left (50%)
 * and team lineups with quick stats on the right (50%).
 *
 * Uses h-full to fill the available space from LiveGameLayout.
 * Pro sports broadcast aesthetic with dramatic dark styling.
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
  onToggleHeatMap,
  allShots = [],
  onStatSelect,
  swappingPlayer,
  onSwap,
  onSubIn,
  onStartSwap,
  onCancelSwap,
  disabled = false,
}) => {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 min-h-0">
      {/* Left: Court Panel (50% on desktop, full width on mobile) */}
      <div className="flex flex-col rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm min-h-0 flex-shrink">
        <div className="p-3 sm:p-4 flex-1 flex flex-col min-h-0">
          {/* Court Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-gray-900 dark:text-gray-200 font-semibold text-xs sm:text-sm uppercase tracking-wide">
              Shot Recording
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Heat Map Toggle */}
              {onToggleHeatMap && (
                <button
                  onClick={onToggleHeatMap}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-md sm:rounded-lg font-semibold border transition-colors ${
                    showHeatMap
                      ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                  }`}
                  title="Toggle heat map"
                >
                  Heat Map
                </button>
              )}
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs rounded-md sm:rounded-lg font-semibold border border-emerald-300 dark:border-emerald-500/30">
                2PT
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] sm:text-xs rounded-md sm:rounded-lg font-semibold border border-violet-300 dark:border-violet-500/30">
                3PT
              </span>
            </div>
          </div>

          {/* Interactive Court - fills available space */}
          <div className="flex-1 flex items-center justify-center min-h-0 py-1 sm:py-2">
            <div className="w-full h-full flex items-center justify-center">
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
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <p className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wide font-semibold">
                Quick Actions
              </p>
              <div className="h-px flex-1 mx-2 sm:mx-3 bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent" />
            </div>
            <QuickStatButtonGrid onStatSelect={onStatSelect} disabled={disabled} />
          </div>
        </div>
      </div>

      {/* Right: Team Lineups (50% on desktop, full width on mobile) */}
      <div className="flex flex-col gap-2 sm:gap-3 min-h-0 overflow-y-auto pb-16 sm:pb-0 flex-shrink">
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
          compact
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
          compact
        />
      </div>
    </div>
  );
};

export default CourtModeContent;
