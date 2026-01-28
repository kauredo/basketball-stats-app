import React from "react";
import { BasketballUtils } from "@basketball-stats/shared";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface TeamStats {
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  freeThrowsAttempted: number;
  freeThrowsMade: number;
  turnovers: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  points: number;
}

interface FourFactorsProps {
  homeTeamName: string;
  awayTeamName: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
}

interface FactorBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  format?: "percent" | "number";
  description: string;
  higherIsBetter?: boolean;
}

function FactorBar({
  label,
  homeValue,
  awayValue,
  format = "percent",
  description,
  higherIsBetter = true,
}: FactorBarProps) {
  const maxValue = Math.max(homeValue, awayValue, 0.1);
  const homeWidth = (homeValue / maxValue) * 100;
  const awayWidth = (awayValue / maxValue) * 100;

  const formatValue = (value: number) => {
    if (format === "percent") {
      return `${value.toFixed(1)}%`;
    }
    return value.toFixed(1);
  };

  const getAdvantageClass = (value: number, otherValue: number) => {
    if (value === otherValue) return "text-surface-900 dark:text-white";
    const hasAdvantage = higherIsBetter ? value > otherValue : value < otherValue;
    return hasAdvantage
      ? "text-green-600 dark:text-green-400"
      : "text-surface-600 dark:text-surface-400";
  };

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-surface-900 dark:text-white">{label}</span>
          <div className="group relative">
            <InformationCircleIcon className="w-4 h-4 text-surface-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
              <div className="bg-surface-900 dark:bg-surface-700 text-white text-xs rounded-lg py-1.5 px-2 whitespace-nowrap shadow-lg">
                {description}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Home value */}
        <span
          className={`w-14 text-right text-sm font-semibold tabular-nums ${getAdvantageClass(homeValue, awayValue)}`}
        >
          {formatValue(homeValue)}
        </span>

        {/* Bars container */}
        <div className="flex-1 flex items-center gap-1">
          {/* Home bar (grows right to left) */}
          <div className="flex-1 flex justify-end">
            <div
              className="h-4 bg-primary-500 rounded-l transition-all duration-300"
              style={{ width: `${homeWidth}%` }}
            />
          </div>

          {/* Center divider */}
          <div className="w-px h-6 bg-surface-300 dark:bg-surface-600" />

          {/* Away bar (grows left to right) */}
          <div className="flex-1">
            <div
              className="h-4 bg-blue-500 rounded-r transition-all duration-300"
              style={{ width: `${awayWidth}%` }}
            />
          </div>
        </div>

        {/* Away value */}
        <span
          className={`w-14 text-left text-sm font-semibold tabular-nums ${getAdvantageClass(awayValue, homeValue)}`}
        >
          {formatValue(awayValue)}
        </span>
      </div>
    </div>
  );
}

export const FourFactors: React.FC<FourFactorsProps> = ({
  homeTeamName,
  awayTeamName,
  homeStats,
  awayStats,
}) => {
  // Calculate Four Factors for home team
  const homeEfg =
    homeStats.fieldGoalsAttempted > 0
      ? ((homeStats.fieldGoalsMade + 0.5 * homeStats.threePointersMade) /
          homeStats.fieldGoalsAttempted) *
        100
      : 0;
  const homeTORate = BasketballUtils.turnoverRate(
    homeStats.turnovers,
    homeStats.fieldGoalsAttempted,
    homeStats.freeThrowsAttempted
  );
  const homeOrebPct = BasketballUtils.offensiveReboundPercent(
    homeStats.offensiveRebounds,
    awayStats.defensiveRebounds
  );
  const homeFTRate = BasketballUtils.freeThrowRate(
    homeStats.freeThrowsAttempted,
    homeStats.fieldGoalsAttempted
  );

  // Calculate Four Factors for away team
  const awayEfg =
    awayStats.fieldGoalsAttempted > 0
      ? ((awayStats.fieldGoalsMade + 0.5 * awayStats.threePointersMade) /
          awayStats.fieldGoalsAttempted) *
        100
      : 0;
  const awayTORate = BasketballUtils.turnoverRate(
    awayStats.turnovers,
    awayStats.fieldGoalsAttempted,
    awayStats.freeThrowsAttempted
  );
  const awayOrebPct = BasketballUtils.offensiveReboundPercent(
    awayStats.offensiveRebounds,
    homeStats.defensiveRebounds
  );
  const awayFTRate = BasketballUtils.freeThrowRate(
    awayStats.freeThrowsAttempted,
    awayStats.fieldGoalsAttempted
  );

  // Calculate possession-based metrics
  const homePoss = BasketballUtils.estimatePossessions(
    homeStats.fieldGoalsAttempted,
    homeStats.offensiveRebounds,
    homeStats.turnovers,
    homeStats.freeThrowsAttempted
  );
  const awayPoss = BasketballUtils.estimatePossessions(
    awayStats.fieldGoalsAttempted,
    awayStats.offensiveRebounds,
    awayStats.turnovers,
    awayStats.freeThrowsAttempted
  );

  const homeOffRtg = BasketballUtils.offensiveRating(homeStats.points, homePoss);
  const homeDefRtg = BasketballUtils.defensiveRating(awayStats.points, awayPoss);
  const awayOffRtg = BasketballUtils.offensiveRating(awayStats.points, awayPoss);
  const awayDefRtg = BasketballUtils.defensiveRating(homeStats.points, homePoss);

  const hasData = homeStats.fieldGoalsAttempted > 0 || awayStats.fieldGoalsAttempted > 0;

  if (!hasData) {
    return (
      <div className="surface-card p-6">
        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">Four Factors</h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-4">
          Four Factors analysis will appear once teams record stats
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
        <h3 className="font-bold text-surface-900 dark:text-white">Four Factors Analysis</h3>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
          Dean Oliver's key indicators of team success
        </p>
      </div>

      <div className="p-4">
        {/* Team headers */}
        <div className="flex items-center mb-2">
          <span className="w-14 text-right text-xs font-semibold text-primary-500">
            {homeTeamName}
          </span>
          <div className="flex-1" />
          <span className="w-14 text-left text-xs font-semibold text-blue-500">{awayTeamName}</span>
        </div>

        <div className="divide-y divide-surface-100 dark:divide-surface-700">
          <FactorBar
            label="eFG%"
            homeValue={homeEfg}
            awayValue={awayEfg}
            description="Effective FG%: Shooting efficiency (accounts for 3PT value)"
            higherIsBetter={true}
          />

          <FactorBar
            label="TO Rate"
            homeValue={homeTORate}
            awayValue={awayTORate}
            description="Turnover Rate: % of possessions ending in turnover"
            higherIsBetter={false}
          />

          <FactorBar
            label="OREB%"
            homeValue={homeOrebPct}
            awayValue={awayOrebPct}
            description="Offensive Rebound %: Second chance opportunities"
            higherIsBetter={true}
          />

          <FactorBar
            label="FT Rate"
            homeValue={homeFTRate}
            awayValue={awayFTRate}
            description="Free Throw Rate: Getting to the line (FTA/FGA)"
            higherIsBetter={true}
          />
        </div>

        {/* Efficiency Ratings Section */}
        <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
          <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
            Efficiency Ratings
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {/* Home Team */}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-2">
                {homeTeamName}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-surface-600 dark:text-surface-400">Off Rtg</span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white tabular-nums">
                    {homeOffRtg.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-surface-600 dark:text-surface-400">Def Rtg</span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white tabular-nums">
                    {homeDefRtg.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-primary-200 dark:border-primary-800">
                  <span className="text-xs text-surface-600 dark:text-surface-400">Net Rtg</span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      homeOffRtg - homeDefRtg > 0
                        ? "text-green-600 dark:text-green-400"
                        : homeOffRtg - homeDefRtg < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-surface-900 dark:text-white"
                    }`}
                  >
                    {homeOffRtg - homeDefRtg > 0 ? "+" : ""}
                    {(homeOffRtg - homeDefRtg).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Away Team */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                {awayTeamName}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-surface-600 dark:text-surface-400">Off Rtg</span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white tabular-nums">
                    {awayOffRtg.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-surface-600 dark:text-surface-400">Def Rtg</span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white tabular-nums">
                    {awayDefRtg.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-blue-200 dark:border-blue-800">
                  <span className="text-xs text-surface-600 dark:text-surface-400">Net Rtg</span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      awayOffRtg - awayDefRtg > 0
                        ? "text-green-600 dark:text-green-400"
                        : awayOffRtg - awayDefRtg < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-surface-900 dark:text-white"
                    }`}
                  >
                    {awayOffRtg - awayDefRtg > 0 ? "+" : ""}
                    {(awayOffRtg - awayDefRtg).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-surface-400 dark:text-surface-500 mt-3">
            Ratings = Points per 100 possessions (Off higher is better, Def lower is better)
          </p>
        </div>
      </div>
    </div>
  );
};

export default FourFactors;
