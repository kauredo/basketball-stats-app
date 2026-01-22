import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "./Icon";

interface PairPlayer {
  id: string;
  name: string;
  number: number;
}

interface PairData {
  player1: PairPlayer;
  player2: PairPlayer;
  player1Id: string;
  player2Id: string;
  minutesTogether: number;
  plusMinus: number;
  gamesPlayed: number;
  netRating: number;
}

interface PairStatsCardProps {
  pairs: PairData[];
  isLoading?: boolean;
  initialRowCount?: number;
}

// Compute additional stats
function computeStats(pair: PairData) {
  const minutes = pair.minutesTogether || 1;
  const pmPerMin = pair.plusMinus / minutes;
  return { pmPerMin };
}

// Get chemistry level for visual indicator
function getChemistryDots(netRating: number): { filled: number; color: string } {
  if (netRating >= 15) return { filled: 5, color: "#22c55e" };
  if (netRating >= 5) return { filled: 4, color: "#22c55e" };
  if (netRating >= -5) return { filled: 3, color: "#a69f96" };
  if (netRating >= -15) return { filled: 2, color: "#f59e0b" };
  return { filled: 1, color: "#ef4444" };
}

const PairStatsCard: React.FC<PairStatsCardProps> = ({ pairs, isLoading, initialRowCount = 5 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const enrichedPairs = useMemo(() => {
    return pairs.map((pair) => ({
      ...pair,
      ...computeStats(pair),
    }));
  }, [pairs]);

  // Sort by minutes together
  const sortedPairs = useMemo(() => {
    return [...enrichedPairs].sort((a, b) => b.minutesTogether - a.minutesTogether);
  }, [enrichedPairs]);

  const displayedPairs = isExpanded ? sortedPairs : sortedPairs.slice(0, initialRowCount);

  const hasMore = sortedPairs.length > initialRowCount;

  if (isLoading) {
    return (
      <View className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700 items-center justify-center">
        <View className="w-10 h-10 items-center justify-center">
          <ActivityIndicator color="#F97316" size="small" />
        </View>
        <Text className="text-sm text-surface-500 mt-3">Loading chemistry data...</Text>
      </View>
    );
  }

  if (pairs.length === 0) {
    return (
      <View className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700 items-center">
        <View className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-700 items-center justify-center mb-4">
          <Icon name="user" size={28} color="#a69f96" />
        </View>
        <Text className="text-surface-900 dark:text-white font-semibold text-base mb-1">
          No chemistry data yet
        </Text>
        <Text className="text-surface-500 text-sm text-center px-4">
          Play games to discover which player pairs have the best synergy
        </Text>
      </View>
    );
  }

  // Find best pair for highlighting
  const maxNetRating = Math.max(...enrichedPairs.map((p) => p.netRating));

  return (
    <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <Icon name="user" size={18} color="#F97316" />
        <Text className="text-sm font-semibold text-surface-900 dark:text-white ml-2 flex-1">
          Player Chemistry
        </Text>
        <Text className="text-xs text-surface-500">{pairs.length} pairs</Text>
      </View>

      {/* Pair Rows */}
      <View>
        {displayedPairs.map((pair, index) => {
          const chemistry = getChemistryDots(pair.netRating);
          const isBestPair = pair.netRating === maxNetRating && maxNetRating > 5;

          return (
            <View
              key={`${pair.player1Id}-${pair.player2Id}`}
              className={`px-4 py-3 ${
                index < displayedPairs.length - 1
                  ? "border-b border-surface-100 dark:border-surface-800"
                  : ""
              } ${isBestPair ? "bg-green-500/5" : ""}`}
            >
              {/* Top row: Rank + Players + Best badge */}
              <View className="flex-row items-center mb-2">
                <View className="w-5 h-5 rounded bg-surface-100 dark:bg-surface-700 items-center justify-center mr-2">
                  <Text className="text-[10px] font-bold text-surface-500">{index + 1}</Text>
                </View>

                <View className="flex-row items-center flex-wrap flex-1">
                  <View className="flex-row items-center bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded">
                    <Text className="text-[10px] text-surface-400 mr-0.5">
                      {pair.player1.number}
                    </Text>
                    <Text className="text-[10px] font-medium text-surface-700 dark:text-surface-300">
                      {pair.player1.name.split(" ").pop()}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-surface-400 mx-1">+</Text>
                  <View className="flex-row items-center bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded">
                    <Text className="text-[10px] text-surface-400 mr-0.5">
                      {pair.player2.number}
                    </Text>
                    <Text className="text-[10px] font-medium text-surface-700 dark:text-surface-300">
                      {pair.player2.name.split(" ").pop()}
                    </Text>
                  </View>

                  {isBestPair && (
                    <View className="ml-1.5 px-1.5 py-0.5 rounded-full bg-green-500/10">
                      <Text className="text-[8px] font-bold text-green-600 uppercase">Best</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Bottom row: Chemistry + Stats */}
              <View className="flex-row items-center">
                {/* Spacer for rank alignment */}
                <View className="w-7" />

                {/* Chemistry dots with label */}
                <View className="flex-row items-center mr-4">
                  <Text className="text-[10px] text-surface-500 mr-2">Chem</Text>
                  <View className="flex-row items-center">
                    {[...Array(5)].map((_, i) => (
                      <View
                        key={i}
                        className="w-1.5 h-1.5 rounded-full mx-0.5"
                        style={{
                          backgroundColor: i < chemistry.filled ? chemistry.color : "#e8e4df",
                        }}
                      />
                    ))}
                  </View>
                </View>

                {/* Stats */}
                <View className="flex-1 flex-row justify-end items-center">
                  <View className="items-end mr-3">
                    <Text className="text-[10px] text-surface-500">MIN</Text>
                    <Text className="text-sm text-surface-700 dark:text-surface-300">
                      {pair.minutesTogether.toFixed(1)}
                    </Text>
                  </View>
                  <View className="items-end mr-3">
                    <Text className="text-[10px] text-surface-500">+/−</Text>
                    <Text
                      className={`text-sm font-bold ${
                        pair.plusMinus > 0
                          ? "text-green-600"
                          : pair.plusMinus < 0
                            ? "text-red-600"
                            : "text-surface-500"
                      }`}
                    >
                      {pair.plusMinus > 0 ? "+" : ""}
                      {pair.plusMinus}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-surface-500">NET</Text>
                    <Text
                      className={`text-sm font-bold ${
                        pair.netRating > 0
                          ? "text-green-600"
                          : pair.netRating < 0
                            ? "text-red-600"
                            : "text-surface-500"
                      }`}
                    >
                      {pair.netRating > 0 ? "+" : ""}
                      {pair.netRating.toFixed(1)}
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
            {isExpanded ? "Show Less" : `Show ${sortedPairs.length - initialRowCount} More`}
          </Text>
          <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#7a746c" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PairStatsCard;
