import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "./Icon";

interface LineupPlayer {
  id: string;
  name: string;
  number: number;
}

interface LineupData {
  players: LineupPlayer[];
  playerIds: string[];
  minutesPlayed: number;
  pointsScored: number;
  pointsAllowed: number;
  plusMinus: number;
  gamesPlayed: number;
  netRating: number;
}

interface LineupStatsCardProps {
  lineups: LineupData[];
  isLoading?: boolean;
  initialRowCount?: number;
}

// Compute additional stats
function computeStats(lineup: LineupData) {
  const minutes = lineup.minutesPlayed || 1;
  const offRating = (lineup.pointsScored / minutes) * 40;
  const defRating = (lineup.pointsAllowed / minutes) * 40;
  return { offRating, defRating };
}

const LineupStatsCard: React.FC<LineupStatsCardProps> = ({
  lineups,
  isLoading,
  initialRowCount = 5,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const enrichedLineups = useMemo(() => {
    return lineups.map((lineup) => ({
      ...lineup,
      ...computeStats(lineup),
    }));
  }, [lineups]);

  // Sort by minutes played
  const sortedLineups = useMemo(() => {
    return [...enrichedLineups].sort((a, b) => b.minutesPlayed - a.minutesPlayed);
  }, [enrichedLineups]);

  const displayedLineups = isExpanded
    ? sortedLineups
    : sortedLineups.slice(0, initialRowCount);

  const hasMore = sortedLineups.length > initialRowCount;

  if (isLoading) {
    return (
      <View className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700 items-center justify-center">
        <View className="w-10 h-10 items-center justify-center">
          <ActivityIndicator color="#F97316" size="small" />
        </View>
        <Text className="text-sm text-surface-500 mt-3">Loading lineups...</Text>
      </View>
    );
  }

  if (lineups.length === 0) {
    return (
      <View className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700 items-center">
        <View className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-700 items-center justify-center mb-4">
          <Icon name="users" size={28} color="#a69f96" />
        </View>
        <Text className="text-surface-900 dark:text-white font-semibold text-base mb-1">
          No lineup data yet
        </Text>
        <Text className="text-surface-500 text-sm text-center px-4">
          Play games to see how different 5-man combinations perform
        </Text>
      </View>
    );
  }

  // Find best/worst for highlighting
  const maxNetRating = Math.max(...enrichedLineups.map((l) => l.netRating));

  return (
    <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <Icon name="users" size={18} color="#F97316" />
        <Text className="text-sm font-semibold text-surface-900 dark:text-white ml-2 flex-1">
          5-Man Lineups
        </Text>
        <Text className="text-xs text-surface-500">{lineups.length} combinations</Text>
      </View>

      {/* Column Headers */}
      <View className="flex-row px-4 py-2 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-100 dark:border-surface-800">
        <Text className="flex-1 text-[10px] font-medium text-surface-500 uppercase tracking-wider">
          Lineup
        </Text>
        <Text className="w-12 text-[10px] font-medium text-surface-500 uppercase tracking-wider text-right">
          MIN
        </Text>
        <Text className="w-12 text-[10px] font-medium text-surface-500 uppercase tracking-wider text-right">
          +/−
        </Text>
        <Text className="w-12 text-[10px] font-medium text-surface-500 uppercase tracking-wider text-right">
          NET
        </Text>
      </View>

      {/* Lineup Rows */}
      <View>
        {displayedLineups.map((lineup, index) => {
          const isTopPerformer = lineup.netRating === maxNetRating && maxNetRating > 0;

          return (
            <View
              key={lineup.playerIds.join("-")}
              className={`px-4 py-3 ${
                index < displayedLineups.length - 1
                  ? "border-b border-surface-100 dark:border-surface-800"
                  : ""
              } ${isTopPerformer ? "bg-green-500/5" : ""}`}
            >
              {/* Top row: Players */}
              <View className="flex-row items-center mb-2">
                {/* Rank */}
                <View className="w-5 h-5 rounded bg-surface-100 dark:bg-surface-700 items-center justify-center mr-2">
                  <Text className="text-[10px] font-bold text-surface-500">{index + 1}</Text>
                </View>
                {/* Player chips */}
                <View className="flex-1 flex-row flex-wrap gap-1">
                  {lineup.players.map((player) => (
                    <View
                      key={player.id}
                      className="flex-row items-center bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded"
                    >
                      <Text className="text-[10px] text-surface-400 mr-0.5">{player.number}</Text>
                      <Text className="text-[10px] font-medium text-surface-700 dark:text-surface-300">
                        {player.name.split(" ").pop()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Bottom row: Stats */}
              <View className="flex-row items-center">
                {/* Spacer for rank */}
                <View className="w-7" />

                {/* Stats grid */}
                <View className="flex-1 flex-row">
                  <View className="flex-1">
                    <Text className="text-[10px] text-surface-500 mb-0.5">OFF</Text>
                    <Text className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                      {lineup.offRating.toFixed(1)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] text-surface-500 mb-0.5">DEF</Text>
                    <Text className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                      {lineup.defRating.toFixed(1)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] text-surface-500 mb-0.5">GP</Text>
                    <Text className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                      {lineup.gamesPlayed}
                    </Text>
                  </View>
                </View>

                {/* Key stats on right */}
                <View className="flex-row items-center">
                  <View className="w-12 items-end">
                    <Text className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {lineup.minutesPlayed.toFixed(1)}
                    </Text>
                  </View>
                  <View className="w-12 items-end">
                    <Text
                      className={`text-sm font-bold ${
                        lineup.plusMinus > 0
                          ? "text-green-600"
                          : lineup.plusMinus < 0
                            ? "text-red-600"
                            : "text-surface-500"
                      }`}
                    >
                      {lineup.plusMinus > 0 ? "+" : ""}
                      {lineup.plusMinus}
                    </Text>
                  </View>
                  <View className="w-12 items-end">
                    <Text
                      className={`text-sm font-bold ${
                        lineup.netRating > 0
                          ? "text-green-600"
                          : lineup.netRating < 0
                            ? "text-red-600"
                            : "text-surface-500"
                      }`}
                    >
                      {lineup.netRating > 0 ? "+" : ""}
                      {lineup.netRating.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Show More / Show Less */}
      {hasMore && (
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          className="flex-row items-center justify-center py-3 border-t border-surface-100 dark:border-surface-800"
        >
          <Text className="text-sm font-medium text-surface-600 dark:text-surface-400 mr-1">
            {isExpanded ? "Show Less" : `Show ${sortedLineups.length - initialRowCount} More`}
          </Text>
          <Icon
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#7a746c"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default LineupStatsCard;
