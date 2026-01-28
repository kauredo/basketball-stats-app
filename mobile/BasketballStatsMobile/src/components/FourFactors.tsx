import React from "react";
import { View, Text } from "react-native";
import Icon from "./Icon";
import { BasketballUtils } from "@basketball-stats/shared";

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
  higherIsBetter?: boolean;
}

function FactorBar({
  label,
  homeValue,
  awayValue,
  format = "percent",
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
    <View className="py-2.5">
      <Text className="text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
        {label}
      </Text>

      <View className="flex-row items-center gap-2">
        {/* Home value */}
        <Text
          className={`w-12 text-right text-sm font-semibold ${getAdvantageClass(homeValue, awayValue)}`}
        >
          {formatValue(homeValue)}
        </Text>

        {/* Bars container */}
        <View className="flex-1 flex-row items-center gap-0.5">
          {/* Home bar (grows right to left) */}
          <View className="flex-1 flex-row justify-end">
            <View className="h-3 bg-primary-500 rounded-l" style={{ width: `${homeWidth}%` }} />
          </View>

          {/* Center divider */}
          <View className="w-px h-4 bg-surface-300 dark:bg-surface-600" />

          {/* Away bar (grows left to right) */}
          <View className="flex-1">
            <View className="h-3 bg-blue-500 rounded-r" style={{ width: `${awayWidth}%` }} />
          </View>
        </View>

        {/* Away value */}
        <Text
          className={`w-12 text-left text-sm font-semibold ${getAdvantageClass(awayValue, homeValue)}`}
        >
          {formatValue(awayValue)}
        </Text>
      </View>
    </View>
  );
}

export function FourFactors({
  homeTeamName,
  awayTeamName,
  homeStats,
  awayStats,
}: FourFactorsProps) {
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
      <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden mt-4">
        <View className="flex-row items-center px-4 py-3 bg-surface-50 dark:bg-surface-700/50">
          <Icon name="stats" size={18} color="#F97316" />
          <Text className="font-semibold text-surface-900 dark:text-white text-sm ml-2">
            Four Factors
          </Text>
        </View>
        <View className="p-4">
          <Text className="text-sm text-surface-500 dark:text-surface-400 text-center">
            Four Factors analysis will appear once teams record stats
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden mt-4">
      {/* Header */}
      <View className="px-4 py-3 bg-surface-50 dark:bg-surface-700/50">
        <View className="flex-row items-center">
          <Icon name="stats" size={18} color="#F97316" />
          <Text className="font-semibold text-surface-900 dark:text-white text-sm ml-2">
            Four Factors
          </Text>
        </View>
        <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
          Key indicators of team success
        </Text>
      </View>

      <View className="px-4 pb-4">
        {/* Team headers */}
        <View className="flex-row items-center py-2">
          <Text className="w-12 text-right text-xs font-semibold text-primary-500">
            {homeTeamName}
          </Text>
          <View className="flex-1" />
          <Text className="w-12 text-left text-xs font-semibold text-blue-500">{awayTeamName}</Text>
        </View>

        <FactorBar
          label="eFG% (Shooting efficiency)"
          homeValue={homeEfg}
          awayValue={awayEfg}
          higherIsBetter={true}
        />

        <FactorBar
          label="TO Rate (Turnover %)"
          homeValue={homeTORate}
          awayValue={awayTORate}
          higherIsBetter={false}
        />

        <FactorBar
          label="OREB% (Second chances)"
          homeValue={homeOrebPct}
          awayValue={awayOrebPct}
          higherIsBetter={true}
        />

        <FactorBar
          label="FT Rate (Getting to line)"
          homeValue={homeFTRate}
          awayValue={awayFTRate}
          higherIsBetter={true}
        />

        {/* Efficiency Ratings */}
        <View className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
          <Text className="text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">
            Efficiency Ratings (pts/100 poss)
          </Text>

          <View className="flex-row gap-2">
            {/* Home Team */}
            <View className="flex-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2.5">
              <Text className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
                {homeTeamName}
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-xs text-surface-600 dark:text-surface-400">Off</Text>
                <Text className="text-xs font-semibold text-surface-900 dark:text-white">
                  {homeOffRtg.toFixed(1)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-surface-600 dark:text-surface-400">Def</Text>
                <Text className="text-xs font-semibold text-surface-900 dark:text-white">
                  {homeDefRtg.toFixed(1)}
                </Text>
              </View>
              <View className="flex-row justify-between pt-1 mt-1 border-t border-primary-200 dark:border-primary-800">
                <Text className="text-xs text-surface-600 dark:text-surface-400">Net</Text>
                <Text
                  className={`text-xs font-bold ${
                    homeOffRtg - homeDefRtg > 0
                      ? "text-green-600 dark:text-green-400"
                      : homeOffRtg - homeDefRtg < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-surface-900 dark:text-white"
                  }`}
                >
                  {homeOffRtg - homeDefRtg > 0 ? "+" : ""}
                  {(homeOffRtg - homeDefRtg).toFixed(1)}
                </Text>
              </View>
            </View>

            {/* Away Team */}
            <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5">
              <Text className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                {awayTeamName}
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-xs text-surface-600 dark:text-surface-400">Off</Text>
                <Text className="text-xs font-semibold text-surface-900 dark:text-white">
                  {awayOffRtg.toFixed(1)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-surface-600 dark:text-surface-400">Def</Text>
                <Text className="text-xs font-semibold text-surface-900 dark:text-white">
                  {awayDefRtg.toFixed(1)}
                </Text>
              </View>
              <View className="flex-row justify-between pt-1 mt-1 border-t border-blue-200 dark:border-blue-800">
                <Text className="text-xs text-surface-600 dark:text-surface-400">Net</Text>
                <Text
                  className={`text-xs font-bold ${
                    awayOffRtg - awayDefRtg > 0
                      ? "text-green-600 dark:text-green-400"
                      : awayOffRtg - awayDefRtg < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-surface-900 dark:text-white"
                  }`}
                >
                  {awayOffRtg - awayDefRtg > 0 ? "+" : ""}
                  {(awayOffRtg - awayDefRtg).toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default FourFactors;
