import React from "react";
import { View, Text } from "react-native";
import Icon from "../Icon";

interface QuarterDisplayProps {
  currentQuarter: number;
  timeRemainingSeconds: number;
  gameStatus: "scheduled" | "active" | "paused" | "completed";
}

/**
 * Enhanced quarter display with halftime indicator.
 * Shows special halftime banner between Q2 and Q3.
 */
export function QuarterDisplay({
  currentQuarter,
  timeRemainingSeconds,
  gameStatus,
}: QuarterDisplayProps) {
  // Check if we're at halftime (end of Q2, time is 0, game is paused)
  const isHalftime = currentQuarter === 2 && timeRemainingSeconds === 0 && gameStatus === "paused";

  // Format quarter name
  const getQuarterName = () => {
    if (currentQuarter <= 4) {
      return `Q${currentQuarter}`;
    }
    return `OT${currentQuarter - 4}`;
  };

  // Get period description
  const getPeriodDescription = () => {
    switch (currentQuarter) {
      case 1:
        return "1st Quarter";
      case 2:
        return "2nd Quarter";
      case 3:
        return "3rd Quarter";
      case 4:
        return "4th Quarter";
      default:
        return `Overtime ${currentQuarter - 4}`;
    }
  };

  if (isHalftime) {
    return (
      <View className="bg-amber-500 dark:bg-amber-600 rounded-xl px-6 py-3 flex-row items-center justify-center gap-2">
        <Icon name="clock" size={20} color="#FFFFFF" />
        <Text className="text-white font-bold text-lg">HALFTIME</Text>
      </View>
    );
  }

  return (
    <View className="bg-primary-500 rounded-xl px-6 py-3 items-center">
      <Text className="text-white font-bold text-xl">{getQuarterName()}</Text>
      <Text className="text-white/80 text-xs">{getPeriodDescription()}</Text>
    </View>
  );
}

/**
 * Compact quarter badge for inline use.
 */
export function QuarterBadge({
  currentQuarter,
  timeRemainingSeconds,
  gameStatus,
}: QuarterDisplayProps) {
  const isHalftime = currentQuarter === 2 && timeRemainingSeconds === 0 && gameStatus === "paused";

  const getQuarterName = () => {
    if (currentQuarter <= 4) return `Q${currentQuarter}`;
    return `OT${currentQuarter - 4}`;
  };

  if (isHalftime) {
    return (
      <View className="bg-amber-500 rounded-full px-4 py-2 flex-row items-center gap-1">
        <Icon name="clock" size={14} color="#FFFFFF" />
        <Text className="text-white font-bold text-sm">HALF</Text>
      </View>
    );
  }

  return (
    <View className="bg-primary-500 rounded-full px-4 py-2">
      <Text className="text-white font-bold text-lg">{getQuarterName()}</Text>
    </View>
  );
}

export default QuarterDisplay;
