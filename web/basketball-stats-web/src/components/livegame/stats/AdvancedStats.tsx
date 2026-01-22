import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import {
  BasketballUtils,
  getStatColorClass,
  getGERColorClass,
  STAT_THRESHOLDS,
} from "@basketball-stats/shared";
import type { PlayerStat } from "../../../types/livegame";

interface AdvancedStatsProps {
  homeStats: PlayerStat[];
  awayStats: PlayerStat[];
  homeTeamName: string;
  awayTeamName: string;
}

/**
 * Advanced stats display with collapsible section.
 * Shows TS%, eFG%, and GER for all players.
 */
export const AdvancedStats: React.FC<AdvancedStatsProps> = ({
  homeStats,
  awayStats,
  homeTeamName,
  awayTeamName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort players by points (highest first)
  const sortedHome = [...homeStats].sort((a, b) => b.points - a.points);
  const sortedAway = [...awayStats].sort((a, b) => b.points - a.points);

  const renderPlayerRow = (stat: PlayerStat) => {
    const ts = BasketballUtils.trueShootingPercentage(stat);
    const efg = BasketballUtils.effectiveFieldGoalPercentage(stat);
    const ger = BasketballUtils.gameEfficiencyRating(stat);

    return (
      <tr
        key={stat.playerId}
        className="border-b border-surface-100 dark:border-surface-700 last:border-0"
      >
        <td className="py-2 pr-2">
          <span className="text-xs font-medium text-surface-900 dark:text-white">
            #{stat.player?.number}
          </span>
          <span className="text-xs text-surface-500 dark:text-surface-400 ml-1">
            {stat.player?.name?.split(" ").pop()}
          </span>
        </td>
        <td className="py-2 text-center">
          <span
            className={`text-xs font-medium ${getStatColorClass(ts, STAT_THRESHOLDS.trueShootingPercentage.good, STAT_THRESHOLDS.trueShootingPercentage.bad)}`}
          >
            {ts.toFixed(1)}%
          </span>
        </td>
        <td className="py-2 text-center">
          <span
            className={`text-xs font-medium ${getStatColorClass(efg, STAT_THRESHOLDS.effectiveFieldGoalPercentage.good, STAT_THRESHOLDS.effectiveFieldGoalPercentage.bad)}`}
          >
            {efg.toFixed(1)}%
          </span>
        </td>
        <td className="py-2 text-center">
          <span className={`text-xs font-medium ${getGERColorClass(ger)}`}>
            {ger > 0 ? `+${ger}` : ger}
          </span>
        </td>
      </tr>
    );
  };

  const hasData = sortedHome.length > 0 || sortedAway.length > 0;

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-4 h-4 text-primary-500" />
          <span className="font-semibold text-surface-900 dark:text-white text-sm">
            Advanced Stats
          </span>
          {!hasData && (
            <span className="text-xs text-surface-400 dark:text-surface-500">(no data yet)</span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-surface-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-surface-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {!hasData ? (
            <div className="py-4 text-center">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Advanced stats will appear once players record stats
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
              {/* Away Team */}
              {sortedAway.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-surface-600 dark:text-surface-400 mb-2">
                    {awayTeamName}
                  </h4>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-600">
                        <th className="text-left text-xs text-surface-500 dark:text-surface-400 font-medium py-1">
                          Player
                        </th>
                        <th className="text-center text-xs text-surface-500 dark:text-surface-400 font-medium py-1 w-16">
                          TS%
                        </th>
                        <th className="text-center text-xs text-surface-500 dark:text-surface-400 font-medium py-1 w-16">
                          eFG%
                        </th>
                        <th className="text-center text-xs text-surface-500 dark:text-surface-400 font-medium py-1 w-12">
                          GER
                        </th>
                      </tr>
                    </thead>
                    <tbody>{sortedAway.map(renderPlayerRow)}</tbody>
                  </table>
                </div>
              )}

              {/* Home Team */}
              {sortedHome.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-surface-600 dark:text-surface-400 mb-2">
                    {homeTeamName}
                  </h4>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-600">
                        <th className="text-left text-xs text-surface-500 dark:text-surface-400 font-medium py-1">
                          Player
                        </th>
                        <th className="text-center text-xs text-surface-500 dark:text-surface-400 font-medium py-1 w-16">
                          TS%
                        </th>
                        <th className="text-center text-xs text-surface-500 dark:text-surface-400 font-medium py-1 w-16">
                          eFG%
                        </th>
                        <th className="text-center text-xs text-surface-500 dark:text-surface-400 font-medium py-1 w-12">
                          GER
                        </th>
                      </tr>
                    </thead>
                    <tbody>{sortedHome.map(renderPlayerRow)}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Stat Definitions */}
          <div className="mt-4 pt-3 border-t border-surface-200 dark:border-surface-700 space-y-0.5">
            <p className="text-xs text-surface-400 dark:text-surface-500">
              TS% = True Shooting % (shooting efficiency including FTs)
            </p>
            <p className="text-xs text-surface-400 dark:text-surface-500">
              eFG% = Effective FG % (accounts for 3PT value)
            </p>
            <p className="text-xs text-surface-400 dark:text-surface-500">
              GER = Game Efficiency Rating (positive stats minus negative stats)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedStats;
