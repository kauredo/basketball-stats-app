import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";

interface ShotClockProps {
  seconds: number;
  isRunning: boolean;
  isWarning?: boolean;
  isViolation?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ShotClock({
  seconds,
  isRunning,
  isWarning = false,
  isViolation = false,
  size = "md",
}: ShotClockProps) {
  const opacity = useSharedValue(1);

  // Pulse animation for warning/violation states
  React.useEffect(() => {
    if (isWarning || isViolation) {
      opacity.value = withRepeat(
        withSequence(withTiming(0.5, { duration: 300 }), withTiming(1, { duration: 300 })),
        -1, // infinite
        true
      );
    } else {
      opacity.value = 1;
    }
  }, [isWarning, isViolation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isWarning || isViolation ? opacity.value : 1,
  }));

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-10 h-10", text: "text-base" },
    md: { container: "w-12 h-12", text: "text-xl" },
    lg: { container: "w-16 h-16", text: "text-2xl" },
  };

  // Color based on state
  const getBackgroundColor = () => {
    if (isViolation) return "bg-red-600";
    if (isWarning) return "bg-amber-500";
    if (isRunning) return "bg-orange-500";
    return "bg-gray-600";
  };

  const config = sizeConfig[size];

  return (
    <Animated.View
      style={animatedStyle}
      className={`${config.container} ${getBackgroundColor()} rounded-full items-center justify-center`}
    >
      <Text className={`text-white font-bold font-mono ${config.text}`}>{seconds}</Text>
    </Animated.View>
  );
}
