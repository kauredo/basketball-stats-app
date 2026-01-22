import React from "react";
import { View, Text, ScrollView } from "react-native";

interface ScoreByPeriod {
  [key: string]: { home: number; away: number };
}

interface QuarterBreakdownProps {
  homeTeamName: string;
  awayTeamName: string;
  scoreByPeriod?: ScoreByPeriod;
  currentQuarter: number;
  homeScore: number;
  awayScore: number;
}

/**
 * Quarter-by-quarter scoring breakdown table.
 * Adapted from web version for React Native.
 * Handles the object format from convex: { q1: { home, away }, q2: { home, away }, ... }
 */
export function QuarterBreakdown({
  homeTeamName,
  awayTeamName,
  scoreByPeriod = {},
  currentQuarter,
  homeScore,
  awayScore,
}: QuarterBreakdownProps) {
  const quarters = Math.max(4, currentQuarter);
  const quarterLabels = Array.from({ length: quarters }, (_, i) =>
    i < 4 ? `Q${i + 1}` : `OT${i - 3}`
  );

  // Get score for a specific period from the object
  const getQuarterScore = (quarterIndex: number, team: "home" | "away"): number | null => {
    const periodKey = quarterIndex < 4 ? `q${quarterIndex + 1}` : `ot${quarterIndex - 3}`;
    const periodData = scoreByPeriod[periodKey];
    return periodData ? periodData[team] : null;
  };

  // Calculate period scores (difference from previous period cumulative)
  const homeQuarterScores = quarterLabels.map((_, i) => getQuarterScore(i, "home"));
  const awayQuarterScores = quarterLabels.map((_, i) => getQuarterScore(i, "away"));

  return (
    <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden mb-4">
      {/* Header */}
      <View className="px-3 py-2 bg-surface-50 dark:bg-surface-700/50">
        <Text className="font-semibold text-surface-900 dark:text-white text-sm">
          Score by Quarter
        </Text>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="min-w-full">
          {/* Header Row */}
          <View className="flex-row border-b border-surface-100 dark:border-surface-700">
            <View className="w-24 px-3 py-2">
              <Text className="text-xs text-surface-500 dark:text-surface-400 uppercase font-medium">
                Team
              </Text>
            </View>
            {quarterLabels.map((label, i) => (
              <View key={i} className="w-10 py-2 items-center">
                <Text
                  className={`text-xs font-medium uppercase ${
                    i + 1 === currentQuarter
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-surface-500 dark:text-surface-400"
                  }`}
                >
                  {label}
                </Text>
              </View>
            ))}
            <View className="w-12 py-2 items-center px-2">
              <Text className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase">
                T
              </Text>
            </View>
          </View>

          {/* Away Team Row */}
          <View className="flex-row border-b border-surface-100 dark:border-surface-700">
            <View className="w-24 px-3 py-2">
              <Text
                className="text-sm font-medium text-surface-900 dark:text-white"
                numberOfLines={1}
              >
                {awayTeamName}
              </Text>
            </View>
            {quarterLabels.map((_, i) => (
              <View key={i} className="w-10 py-2 items-center">
                <Text
                  className={`text-sm ${
                    i + 1 === currentQuarter
                      ? "font-semibold text-surface-900 dark:text-white"
                      : "text-surface-600 dark:text-surface-400"
                  }`}
                >
                  {awayQuarterScores[i] ?? "-"}
                </Text>
              </View>
            ))}
            <View className="w-12 py-2 items-center px-2">
              <Text className="text-sm font-bold text-surface-900 dark:text-white">
                {awayScore}
              </Text>
            </View>
          </View>

          {/* Home Team Row */}
          <View className="flex-row bg-primary-50/30 dark:bg-primary-900/10">
            <View className="w-24 px-3 py-2">
              <Text
                className="text-sm font-medium text-surface-900 dark:text-white"
                numberOfLines={1}
              >
                {homeTeamName}
              </Text>
            </View>
            {quarterLabels.map((_, i) => (
              <View key={i} className="w-10 py-2 items-center">
                <Text
                  className={`text-sm ${
                    i + 1 === currentQuarter
                      ? "font-semibold text-surface-900 dark:text-white"
                      : "text-surface-600 dark:text-surface-400"
                  }`}
                >
                  {homeQuarterScores[i] ?? "-"}
                </Text>
              </View>
            ))}
            <View className="w-12 py-2 items-center px-2">
              <Text className="text-sm font-bold text-surface-900 dark:text-white">
                {homeScore}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default QuarterBreakdown;
