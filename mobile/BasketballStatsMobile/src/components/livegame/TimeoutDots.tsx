import React from "react";
import { View, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

interface TimeoutDotsProps {
  total: number;
  remaining: number;
  onTimeoutTap?: () => void;
  disabled?: boolean;
  size?: "small" | "medium";
}

export default function TimeoutDots({
  total,
  remaining,
  onTimeoutTap,
  disabled = false,
  size = "small",
}: TimeoutDotsProps) {
  const dotSize = size === "small" ? 8 : 12;
  const spacing = size === "small" ? 4 : 6;

  const handlePress = () => {
    if (!disabled && remaining > 0 && onTimeoutTap) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onTimeoutTap();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || remaining === 0}
      activeOpacity={0.7}
      className="p-1"
    >
      <View className="flex-row items-center" style={{ gap: spacing }}>
        {Array.from({ length: total }).map((_, index) => {
          const isUsed = index >= remaining;
          return (
            <View
              key={index}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: isUsed ? "transparent" : "#F97316",
                borderWidth: 1,
                borderColor: isUsed ? "#6B7280" : "#F97316",
              }}
            />
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

export { TimeoutDots };
