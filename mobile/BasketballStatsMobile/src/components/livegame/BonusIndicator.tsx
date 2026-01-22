import React, { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
} from "react-native-reanimated";

interface BonusIndicatorProps {
  inBonus: boolean;
  inDoubleBonus: boolean;
  animate?: boolean;
}

export default function BonusIndicator({
  inBonus,
  inDoubleBonus,
  animate = true,
}: BonusIndicatorProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if ((inBonus || inDoubleBonus) && animate) {
      // Pulse animation when entering bonus
      scale.value = withSequence(
        withTiming(1.15, { duration: 150 }),
        withTiming(1, { duration: 150 }),
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      // Then subtle continuous pulse
      opacity.value = withRepeat(
        withSequence(withTiming(0.7, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated shared values are stable refs
  }, [inBonus, inDoubleBonus, animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!inBonus && !inDoubleBonus) {
    return null;
  }

  const label = inDoubleBonus ? "2X BONUS" : "BONUS";
  const backgroundColor = inDoubleBonus ? "#EF4444" : "#F59E0B";

  return (
    <Animated.View className="px-1.5 py-0.5 rounded" style={[{ backgroundColor }, animatedStyle]}>
      <Text className="text-white text-[9px] font-bold tracking-wide">{label}</Text>
    </Animated.View>
  );
}
