import React from "react";
import { View, Text } from "react-native";
import Icon from "../Icon";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface PlayerStat {
  id: string;
  playerId: Id<"players">;
  player: {
    id: Id<"players">;
    name: string;
    number: number;
    position?: string;
  } | null;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  minutesPlayed: number;
  plusMinus: number;
}

interface AdvancedStatsProps {
  homeStats: PlayerStat[];
  awayStats: PlayerStat[];
  homeTeamName: string;
  awayTeamName: string;
}

/**
 * Calculate True Shooting Percentage
 * TS% = Points / (2 * (FGA + 0.44 * FTA))
 */
function trueShootingPercentage(stat: PlayerStat): number {
  const fga = stat.fieldGoalsAttempted || 0;
  const fta = stat.freeThrowsAttempted || 0;
  const trueShootingAttempts = fga + 0.44 * fta;
  if (trueShootingAttempts === 0) return 0;
  return Math.round((stat.points / (2 * trueShootingAttempts)) * 100 * 10) / 10;
}

/**
 * Calculate Effective Field Goal Percentage
 * eFG% = (FGM + 0.5 * 3PM) / FGA
 */
function effectiveFieldGoalPercentage(stat: PlayerStat): number {
  const fga = stat.fieldGoalsAttempted || 0;
  const fgm = stat.fieldGoalsMade || 0;
  const tpm = stat.threePointersMade || 0;
  if (fga === 0) return 0;
  const effectiveFGM = fgm + 0.5 * tpm;
  return Math.round((effectiveFGM / fga) * 100 * 10) / 10;
}

/**
 * Calculate Game Efficiency Rating (simplified, game-only)
 * GER = positive stats - negative stats (not per-minute, for in-game context)
 */
function gameEfficiencyRating(stat: PlayerStat): number {
  const positive = stat.points + stat.rebounds + stat.assists + stat.steals + stat.blocks;
  const fga = stat.fieldGoalsAttempted || 0;
  const fgm = stat.fieldGoalsMade || 0;
  const fta = stat.freeThrowsAttempted || 0;
  const ftm = stat.freeThrowsMade || 0;
  const negative = fga - fgm + (fta - ftm) + stat.turnovers + stat.fouls;
  return positive - negative;
}

/**
 * Advanced stats display.
 * Shows TS%, eFG%, and GER for all players.
 */
export function AdvancedStats({
  homeStats,
  awayStats,
  homeTeamName,
  awayTeamName,
}: AdvancedStatsProps) {

  // Sort players by points (highest first)
  const sortedHome = [...homeStats].sort((a, b) => b.points - a.points);
  const sortedAway = [...awayStats].sort((a, b) => b.points - a.points);

  const getStatColorClass = (value: number, goodThreshold: number, badThreshold: number) => {
    if (value >= goodThreshold) return "text-green-600 dark:text-green-400";
    if (value <= badThreshold) return "text-red-600 dark:text-red-400";
    return "text-surface-700 dark:text-surface-300";
  };

  const getGERColorClass = (value: number) => {
    if (value > 10) return "text-green-600 dark:text-green-400";
    if (value < 0) return "text-red-600 dark:text-red-400";
    return "text-surface-700 dark:text-surface-300";
  };

  const renderPlayerRow = (stat: PlayerStat) => {
    const ts = trueShootingPercentage(stat);
    const efg = effectiveFieldGoalPercentage(stat);
    const ger = gameEfficiencyRating(stat);

    return (
      <View
        key={stat.playerId}
        className="flex-row items-center py-2 border-b border-surface-100 dark:border-surface-700"
      >
        <View className="w-24 flex-row items-center">
          <Text className="text-xs font-medium text-surface-900 dark:text-white">
            #{stat.player?.number}
          </Text>
          <Text className="text-xs text-surface-500 dark:text-surface-400 ml-1" numberOfLines={1}>
            {stat.player?.name?.split(" ").pop()}
          </Text>
        </View>
        <View className="w-14 items-center">
          <Text className={`text-xs font-medium ${getStatColorClass(ts, 55, 45)}`}>
            {ts.toFixed(1)}%
          </Text>
        </View>
        <View className="w-14 items-center">
          <Text className={`text-xs font-medium ${getStatColorClass(efg, 50, 40)}`}>
            {efg.toFixed(1)}%
          </Text>
        </View>
        <View className="w-12 items-center">
          <Text className={`text-xs font-medium ${getGERColorClass(ger)}`}>
            {ger > 0 ? `+${ger}` : ger}
          </Text>
        </View>
      </View>
    );
  };

  const hasData = sortedHome.length > 0 || sortedAway.length > 0;

  return (
    <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden mt-4">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-surface-50 dark:bg-surface-700/50">
        <Icon name="stats" size={18} color="#F97316" />
        <Text className="font-semibold text-surface-900 dark:text-white text-sm ml-2">
          Advanced Stats
        </Text>
        {!hasData && (
          <Text className="text-xs text-surface-400 dark:text-surface-500 ml-2">
            (no data yet)
          </Text>
        )}
      </View>

      <View className="px-3 pb-3">
        {!hasData ? (
          <View className="py-4 items-center">
            <Text className="text-sm text-surface-500 dark:text-surface-400">
              Advanced stats will appear once players record stats
            </Text>
          </View>
        ) : (
          <>
            {/* Legend */}
            <View className="flex-row items-center py-2 border-b border-surface-200 dark:border-surface-600">
              <View className="w-24" />
              <View className="w-14 items-center">
                <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                  TS%
                </Text>
              </View>
              <View className="w-14 items-center">
                <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                  eFG%
                </Text>
              </View>
              <View className="w-12 items-center">
                <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                  GER
                </Text>
              </View>
            </View>

            {/* Away Team */}
            {sortedAway.length > 0 && (
              <>
                <Text className="text-xs text-surface-600 dark:text-surface-400 mt-2 mb-1 font-medium">
                  {awayTeamName}
                </Text>
                {sortedAway.map(renderPlayerRow)}
              </>
            )}

            {/* Home Team */}
            {sortedHome.length > 0 && (
              <>
                <Text className="text-xs text-surface-600 dark:text-surface-400 mt-3 mb-1 font-medium">
                  {homeTeamName}
                </Text>
                {sortedHome.map(renderPlayerRow)}
              </>
            )}
          </>
        )}

        {/* Stat Definitions */}
        <View className="mt-3 pt-2 border-t border-surface-200 dark:border-surface-700">
          <Text className="text-xs text-surface-400 dark:text-surface-500">
            TS% = True Shooting % (shooting efficiency including FTs)
          </Text>
          <Text className="text-xs text-surface-400 dark:text-surface-500">
            eFG% = Effective FG % (accounts for 3PT value)
          </Text>
          <Text className="text-xs text-surface-400 dark:text-surface-500">
            GER = Game Efficiency Rating (positive stats minus negative stats)
          </Text>
        </View>
      </View>
    </View>
  );
}

export default AdvancedStats;
