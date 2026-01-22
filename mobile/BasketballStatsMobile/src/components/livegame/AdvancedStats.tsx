import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Icon from "../Icon";
import { useColorScheme } from "nativewind";
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
  const trueShootingAttempts = stat.fieldGoalsAttempted + 0.44 * stat.freeThrowsAttempted;
  if (trueShootingAttempts === 0) return 0;
  return Math.round((stat.points / (2 * trueShootingAttempts)) * 100 * 10) / 10;
}

/**
 * Calculate Effective Field Goal Percentage
 * eFG% = (FGM + 0.5 * 3PM) / FGA
 */
function effectiveFieldGoalPercentage(stat: PlayerStat): number {
  if (stat.fieldGoalsAttempted === 0) return 0;
  const effectiveFGM = stat.fieldGoalsMade + 0.5 * stat.threePointersMade;
  return Math.round((effectiveFGM / stat.fieldGoalsAttempted) * 100 * 10) / 10;
}

/**
 * Calculate Player Efficiency Rating (simplified)
 * PER = (PTS + REB + AST + STL + BLK - (FGA-FGM) - (FTA-FTM) - TO - PF) / MIN
 */
function playerEfficiencyRating(stat: PlayerStat): number {
  if (stat.minutesPlayed === 0) return 0;

  const positive = stat.points + stat.rebounds + stat.assists + stat.steals + stat.blocks;
  const negative =
    stat.fieldGoalsAttempted -
    stat.fieldGoalsMade +
    stat.freeThrowsAttempted -
    stat.freeThrowsMade +
    stat.turnovers +
    stat.fouls;

  return Math.round(((positive - negative) / stat.minutesPlayed) * 10) / 10;
}

/**
 * Advanced stats display with collapsible section.
 * Shows TS%, eFG%, and PER for players with significant playing time.
 */
export function AdvancedStats({
  homeStats,
  awayStats,
  homeTeamName,
  awayTeamName,
}: AdvancedStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Get players with any stats (points, FGA, or on court)
  const getQualifiedPlayers = (stats: PlayerStat[]) =>
    stats
      .filter((s) => s.points > 0 || s.fieldGoalsAttempted > 0 || s.rebounds > 0 || s.assists > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

  const qualifiedHome = getQualifiedPlayers(homeStats);
  const qualifiedAway = getQualifiedPlayers(awayStats);

  const renderPlayerRow = (stat: PlayerStat) => {
    const ts = trueShootingPercentage(stat);
    const efg = effectiveFieldGoalPercentage(stat);
    const per = playerEfficiencyRating(stat);

    return (
      <View
        key={stat.playerId}
        className="flex-row items-center py-2 border-b border-surface-100 dark:border-surface-700"
      >
        <View className="w-24 flex-row items-center">
          <Text className="text-xs font-medium text-surface-900 dark:text-white" numberOfLines={1}>
            #{stat.player?.number} {stat.player?.name?.split(" ").pop()}
          </Text>
        </View>
        <View className="w-16 items-center">
          <Text className={`text-xs font-medium ${ts >= 55 ? "text-green-600 dark:text-green-400" : ts <= 45 ? "text-red-600 dark:text-red-400" : "text-surface-700 dark:text-surface-300"}`}>
            {ts.toFixed(1)}%
          </Text>
        </View>
        <View className="w-16 items-center">
          <Text className={`text-xs font-medium ${efg >= 50 ? "text-green-600 dark:text-green-400" : efg <= 40 ? "text-red-600 dark:text-red-400" : "text-surface-700 dark:text-surface-300"}`}>
            {efg.toFixed(1)}%
          </Text>
        </View>
        <View className="w-12 items-center">
          <Text className={`text-xs font-medium ${per > 1.5 ? "text-green-600 dark:text-green-400" : per < 0 ? "text-red-600 dark:text-red-400" : "text-surface-700 dark:text-surface-300"}`}>
            {per.toFixed(1)}
          </Text>
        </View>
      </View>
    );
  };

  const hasData = qualifiedHome.length > 0 || qualifiedAway.length > 0;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {/* Header - Collapsible */}
      <Pressable
        style={({ pressed }) => [
          styles.header,
          isDark ? styles.headerDark : styles.headerLight,
          pressed && styles.headerPressed,
        ]}
        onPress={handleToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.headerContent}>
          <Icon name="stats" size={18} color="#F97316" />
          <Text style={[styles.headerTitle, isDark && styles.textWhite]}>
            Advanced Stats
          </Text>
          {!hasData && (
            <Text style={styles.noDataText}>
              (no data yet)
            </Text>
          )}
        </View>
        <Icon
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6B7280"
        />
      </Pressable>

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
                <View className="w-24" />
                <View className="w-16 items-center">
                  <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">TS%</Text>
                </View>
                <View className="w-16 items-center">
                  <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">eFG%</Text>
                </View>
                <View className="w-12 items-center">
                  <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">PER</Text>
                </View>
              </View>

              {/* Away Team */}
              {qualifiedAway.length > 0 && (
                <>
                  <Text className="text-xs text-surface-600 dark:text-surface-400 mt-2 mb-1 font-medium">
                    {awayTeamName}
                  </Text>
                  {qualifiedAway.map(renderPlayerRow)}
                </>
              )}

              {/* Home Team */}
              {qualifiedHome.length > 0 && (
                <>
                  <Text className="text-xs text-surface-600 dark:text-surface-400 mt-3 mb-1 font-medium">
                    {homeTeamName}
                  </Text>
                  {qualifiedHome.map(renderPlayerRow)}
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
              PER = Player Efficiency Rating (per minute)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 16,
  },
  containerLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  containerDark: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLight: {
    backgroundColor: "#F9FAFB",
  },
  headerDark: {
    backgroundColor: "rgba(55, 65, 81, 0.5)",
  },
  headerPressed: {
    opacity: 0.7,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 14,
    marginLeft: 8,
  },
  textWhite: {
    color: "#FFFFFF",
  },
  noDataText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 8,
  },
});

export default AdvancedStats;
