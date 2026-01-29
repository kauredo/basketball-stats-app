import React, { useState } from "react";
import { View, Text } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import Icon from "../Icon";
import {
  BasketballUtils,
  getStatColorClass,
  getGERColorClass,
  STAT_THRESHOLDS,
} from "@basketball-stats/shared";
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
 * Advanced stats display.
 * Shows TS%, eFG%, GER, PER, and A/TO for all players.
 */
export function AdvancedStats({
  homeStats,
  awayStats,
  homeTeamName,
  awayTeamName,
}: AdvancedStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort players by points (highest first)
  const sortedHome = [...homeStats].sort((a, b) => b.points - a.points);
  const sortedAway = [...awayStats].sort((a, b) => b.points - a.points);

  const renderPlayerRow = (stat: PlayerStat) => {
    const ts = BasketballUtils.trueShootingPercentage(stat);
    const efg = BasketballUtils.effectiveFieldGoalPercentage(stat);
    const ger = BasketballUtils.gameEfficiencyRating(stat);
    const per = BasketballUtils.playerEfficiencyRating(stat);
    const ato = BasketballUtils.assistToTurnoverRatio(stat);

    return (
      <View
        key={stat.playerId}
        className="flex-row items-center py-2 border-b border-surface-100 dark:border-surface-700"
      >
        <View className="w-20 flex-row items-center">
          <Text className="text-xs font-medium text-surface-900 dark:text-white">
            #{stat.player?.number}
          </Text>
          <Text className="text-xs text-surface-500 dark:text-surface-400 ml-1" numberOfLines={1}>
            {stat.player?.name?.split(" ").pop()?.substring(0, 4)}
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text
            className={`text-xs font-medium ${getStatColorClass(ts, STAT_THRESHOLDS.trueShootingPercentage.good, STAT_THRESHOLDS.trueShootingPercentage.bad)}`}
          >
            {ts.toFixed(0)}%
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text
            className={`text-xs font-medium ${getStatColorClass(efg, STAT_THRESHOLDS.effectiveFieldGoalPercentage.good, STAT_THRESHOLDS.effectiveFieldGoalPercentage.bad)}`}
          >
            {efg.toFixed(0)}%
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text className={`text-xs font-medium ${getGERColorClass(ger)}`}>
            {ger > 0 ? `+${ger}` : ger}
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text className={`text-xs font-medium ${getStatColorClass(per, 1.0, -0.5)}`}>
            {per.toFixed(1)}
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text className={`text-xs font-medium ${getStatColorClass(ato, 2.0, 0.5)}`}>
            {ato.toFixed(1)}
          </Text>
        </View>
      </View>
    );
  };

  const hasData = sortedHome.length > 0 || sortedAway.length > 0;

  return (
    <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden mt-4">
      {/* Header - Clickable to expand/collapse */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center px-4 py-3 bg-surface-50 dark:bg-surface-700/50"
      >
        <Icon name="stats" size={18} color="#F97316" />
        <Text className="font-semibold text-surface-900 dark:text-white text-sm ml-2 flex-1">
          Advanced Stats
        </Text>
        {!hasData && (
          <Text className="text-xs text-surface-400 dark:text-surface-500 mr-2">(no data yet)</Text>
        )}
        <Icon
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#7a746c"
        />
      </Pressable>

      {/* Collapsible Content */}
      {isExpanded && (
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
                <View className="w-20" />
                <View className="flex-1 items-center">
                  <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                    TS%
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                    eFG%
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                    GER
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                    PER
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                    A/TO
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
              TS% = True Shooting % | eFG% = Effective FG %
            </Text>
            <Text className="text-xs text-surface-400 dark:text-surface-500">
              GER = Game Efficiency | PER = Player Efficiency (per minute)
            </Text>
            <Text className="text-xs text-surface-400 dark:text-surface-500">
              A/TO = Assist-to-Turnover Ratio
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default AdvancedStats;
