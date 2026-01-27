import React from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { InteractiveCourt } from "./court/InteractiveCourt";
import { ActiveLineupPanel } from "./lineup/ActiveLineupPanel";
import { QuickStatButtonGrid } from "./stats/QuickStatButtonGrid";
import { PlayerStat, StatType, ShotLocation } from "../../types/livegame";
import { useIsMobile } from "../../hooks/useIsMobile";

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

  // Timeouts
  homeTimeoutsRemaining?: number;
  awayTimeoutsRemaining?: number;
  onTimeoutHome?: () => void;
  onTimeoutAway?: () => void;

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
  homeTimeoutsRemaining,
  awayTimeoutsRemaining,
  onTimeoutHome,
  onTimeoutAway,
  swappingPlayer,
  onSwap,
  onSubIn,
  onStartSwap,
  onCancelSwap,
  disabled = false,
}) => {
  // Use 1024px breakpoint (Tailwind lg) to match grid-cols behavior
  const isMobileOrTablet = useIsMobile(1024);

  // Court Panel - shared between mobile/tablet and desktop layouts
  const courtPanel = (
    <div
      className={`flex flex-col rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm min-h-0 ${
        isMobileOrTablet ? "flex-1" : "flex-shrink"
      }`}
    >
      <div className="p-3 sm:p-4 flex-1 flex flex-col min-h-0">
        {/* Court Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 flex-shrink-0">
          <h3 className="text-surface-900 dark:text-surface-200 font-semibold text-xs sm:text-sm uppercase tracking-wide">
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
                    : "bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400 border-surface-300 dark:border-surface-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
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
        <div className="flex-1 flex items-center justify-center min-h-0 py-1 sm:py-2 overflow-hidden">
          <div className="w-full h-full max-h-full flex items-center justify-center">
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
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-surface-200 dark:border-surface-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-surface-600 dark:text-surface-400 text-[10px] sm:text-xs uppercase tracking-wide font-semibold">
              Quick Actions
            </p>
            <div className="h-px flex-1 mx-2 sm:mx-3 bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
          </div>
          <QuickStatButtonGrid onStatSelect={onStatSelect} disabled={disabled} />

          {/* Timeout Buttons */}
          {(onTimeoutHome || onTimeoutAway) && (
            <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
              <div className="flex gap-2">
                {onTimeoutAway && (
                  <button
                    onClick={onTimeoutAway}
                    disabled={disabled || awayTimeoutsRemaining === 0}
                    className="flex-1 py-2.5 px-3 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-surface-200 dark:border-surface-600"
                  >
                    <span className="block text-[10px] text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-0.5">
                      {awayTeamName}
                    </span>
                    Timeout ({awayTimeoutsRemaining ?? 0})
                  </button>
                )}
                {onTimeoutHome && (
                  <button
                    onClick={onTimeoutHome}
                    disabled={disabled || homeTimeoutsRemaining === 0}
                    className="flex-1 py-2.5 px-3 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-surface-200 dark:border-surface-600"
                  >
                    <span className="block text-[10px] text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-0.5">
                      {homeTeamName}
                    </span>
                    Timeout ({homeTimeoutsRemaining ?? 0})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile/Tablet Layout: Court + Quick Stats only (no lineups)
  // Lineups are accessible via Subs tab
  if (isMobileOrTablet) {
    return <div className="h-full flex flex-col min-h-0">{courtPanel}</div>;
  }

  // Desktop Layout: Two-column with Court + Lineups (unchanged)
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 min-h-0">
      {/* Left: Court Panel (50% on desktop) */}
      {courtPanel}

      {/* Right: Team Lineups (50% on desktop) */}
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
