import React from "react";
import { View, Text } from "react-native";

interface TeamFoulsDisplayProps {
  foulsThisQuarter: number;
  totalFouls?: number;
  showTotal?: boolean;
  size?: "small" | "medium";
}

export default function TeamFoulsDisplay({
  foulsThisQuarter,
  totalFouls = 0,
  showTotal = false,
  size = "small",
}: TeamFoulsDisplayProps) {
  const fontSize = size === "small" ? 10 : 12;
  const numberFontSize = size === "small" ? 12 : 14;

  return (
    <View className="flex-row items-center gap-0.5">
      <Text className="text-surface-400 dark:text-surface-400 font-medium" style={{ fontSize }}>
        TF:
      </Text>
      <Text
        className="text-surface-900 dark:text-white font-bold"
        style={{ fontSize: numberFontSize }}
      >
        {foulsThisQuarter}
      </Text>
      {showTotal && totalFouls > 0 && (
        <Text className="text-surface-500 dark:text-surface-500" style={{ fontSize: fontSize - 2 }}>
          ({totalFouls})
        </Text>
      )}
    </View>
  );
}
