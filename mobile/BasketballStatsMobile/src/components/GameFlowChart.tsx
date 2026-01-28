import React, { useState } from "react";
import { View, Text, Dimensions, ScrollView, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Icon from "./Icon";

const screenWidth = Dimensions.get("window").width;

interface TimelineEvent {
  id: string;
  quarter: number;
  gameTimeElapsed: number;
  gameTimeElapsedFormatted: string;
  homeScore: number;
  awayScore: number;
  scoreDifferential: number;
  description?: string;
  points?: number;
  isHomeTeam?: boolean | null;
}

interface QuarterBoundary {
  quarter: number;
  gameTimeElapsed: number;
  label: string;
}

interface ScoringRun {
  startIndex: number;
  endIndex: number;
  team: "home" | "away";
  points: number;
  opponentPoints: number;
  quarter: number;
  description: string;
}

interface GameFlowChartProps {
  timeline: TimelineEvent[];
  quarterBoundaries: QuarterBoundary[];
  runs: ScoringRun[];
  homeTeamName: string;
  awayTeamName: string;
  summary: {
    finalHomeScore: number;
    finalAwayScore: number;
    largestLead: { home: number; away: number };
    leadChanges: number;
    timesTied: number;
  };
}

export function GameFlowChart({
  timeline,
  quarterBoundaries,
  runs,
  homeTeamName,
  awayTeamName,
  summary,
}: GameFlowChartProps) {
  const [showRuns, setShowRuns] = useState(false);

  const hasData = timeline.length > 1;

  if (!hasData) {
    return (
      <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden mt-4">
        <View className="flex-row items-center px-4 py-3 bg-surface-50 dark:bg-surface-700/50">
          <Icon name="stats" size={18} color="#F97316" />
          <Text className="font-semibold text-surface-900 dark:text-white text-sm ml-2">
            Game Flow
          </Text>
        </View>
        <View className="p-4">
          <Text className="text-sm text-surface-500 dark:text-surface-400 text-center py-4">
            Game flow chart will appear once scoring events are recorded
          </Text>
        </View>
      </View>
    );
  }

  // Prepare chart data - sample every few points to avoid overcrowding
  const sampleRate = Math.max(1, Math.floor(timeline.length / 30));
  const sampledData = timeline.filter((_, i) => i % sampleRate === 0 || i === timeline.length - 1);

  // Get score differentials for chart
  const chartData = sampledData.map((t) => t.scoreDifferential);

  // Create labels for x-axis (quarter markers)
  const labels = sampledData.map((t, i) => {
    // Show quarter labels at approximate positions
    if (i === 0) return "Start";
    const quarterStarts = quarterBoundaries.map((q) => q.gameTimeElapsed);
    const nearQuarter = quarterStarts.findIndex(
      (qs) => Math.abs(t.gameTimeElapsed - qs) < 120 // Within 2 minutes
    );
    if (nearQuarter >= 0 && i > 0) {
      // Check if this is closest to the quarter boundary
      const prevDist = Math.abs(sampledData[i - 1].gameTimeElapsed - quarterStarts[nearQuarter]);
      const currDist = Math.abs(t.gameTimeElapsed - quarterStarts[nearQuarter]);
      if (currDist < prevDist) {
        return quarterBoundaries[nearQuarter]?.label || "";
      }
    }
    return "";
  });

  // Calculate Y axis bounds
  const maxDiff = Math.max(summary.largestLead.home, summary.largestLead.away, 5);
  const yMin = -Math.ceil(maxDiff / 5) * 5;
  const yMax = Math.ceil(maxDiff / 5) * 5;

  const chartConfig = {
    backgroundColor: "transparent",
    backgroundGradientFrom: "transparent",
    backgroundGradientTo: "transparent",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 8,
    },
    propsForDots: {
      r: "0",
    },
    propsForBackgroundLines: {
      strokeDasharray: "3 3",
      stroke: "#374151",
      strokeOpacity: 0.3,
    },
    fillShadowGradient: "#f97316",
    fillShadowGradientOpacity: 0.1,
  };

  return (
    <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden mt-4">
      {/* Header */}
      <View className="px-4 py-3 bg-surface-50 dark:bg-surface-700/50">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Icon name="stats" size={18} color="#F97316" />
            <Text className="font-semibold text-surface-900 dark:text-white text-sm ml-2">
              Game Flow
            </Text>
          </View>
          {runs.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowRuns(!showRuns)}
              className={`px-2 py-1 rounded-lg ${
                showRuns
                  ? "bg-primary-100 dark:bg-primary-900/30"
                  : "bg-surface-100 dark:bg-surface-700"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  showRuns
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-surface-600 dark:text-surface-400"
                }`}
              >
                Runs
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="px-2 pb-4">
        {/* Team legend */}
        <View className="flex-row items-center justify-center gap-4 py-2">
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />
            <Text className="text-xs text-surface-600 dark:text-surface-400">
              {homeTeamName} lead
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <Text className="text-xs text-surface-600 dark:text-surface-400">
              {awayTeamName} lead
            </Text>
          </View>
        </View>

        {/* Chart */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels,
              datasets: [
                {
                  data: chartData.length > 0 ? chartData : [0],
                  color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                  strokeWidth: 2,
                },
                // Add reference lines for y-axis bounds
                {
                  data: [yMax],
                  withDots: false,
                  color: () => "transparent",
                },
                {
                  data: [yMin],
                  withDots: false,
                  color: () => "transparent",
                },
              ],
            }}
            width={Math.max(screenWidth - 48, chartData.length * 10)}
            height={180}
            chartConfig={chartConfig}
            bezier={false}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={false}
            segments={4}
            formatYLabel={(value) => {
              const num = parseInt(value, 10);
              return num > 0 ? `+${num}` : `${num}`;
            }}
            style={{
              marginLeft: -16,
              paddingRight: 0,
            }}
          />
        </ScrollView>

        {/* Summary Stats */}
        <View className="flex-row mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-primary-500">+{summary.largestLead.home}</Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400">{homeTeamName}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-blue-500">+{summary.largestLead.away}</Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400">{awayTeamName}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-surface-900 dark:text-white">
              {summary.leadChanges}
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400">Lead chg</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-surface-900 dark:text-white">
              {summary.timesTied}
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400">Ties</Text>
          </View>
        </View>

        {/* Scoring Runs */}
        {runs.length > 0 && showRuns && (
          <View className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
            <Text className="text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">
              Scoring Runs (8+ pts)
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {runs.slice(0, 6).map((run, index) => (
                <View
                  key={index}
                  className={`px-2 py-1 rounded-lg ${
                    run.team === "home"
                      ? "bg-primary-100 dark:bg-primary-900/30"
                      : "bg-blue-100 dark:bg-blue-900/30"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      run.team === "home"
                        ? "text-primary-700 dark:text-primary-300"
                        : "text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    Q{run.quarter}: {run.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export default GameFlowChart;
