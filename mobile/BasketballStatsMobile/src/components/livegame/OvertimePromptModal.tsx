import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";

interface OvertimePromptModalProps {
  visible: boolean;
  homeScore: number;
  awayScore: number;
  currentQuarter: number;
  onStartOvertime: () => void;
  onEndAsTie: () => void;
  onDismiss: () => void;
}

export default function OvertimePromptModal({
  visible,
  homeScore,
  awayScore,
  currentQuarter,
  onStartOvertime,
  onEndAsTie,
  onDismiss,
}: OvertimePromptModalProps) {
  const pulseScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Haptic notification
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Pulsing animation for the score
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        true
      );

      // Rotating animation for icon
      iconRotate.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 150 }),
          withTiming(5, { duration: 150 }),
          withTiming(0, { duration: 150 })
        ),
        3,
        false
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated shared values are stable refs
  }, [visible]);

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
  }));

  const handleStartOvertime = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onStartOvertime();
  };

  const handleEndAsTie = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEndAsTie();
  };

  const getOvertimeLabel = () => {
    if (currentQuarter === 4) return "Overtime 1";
    return `Overtime ${currentQuarter - 3}`;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/80 justify-center items-center p-6">
        <View className="bg-surface-800 rounded-3xl p-8 w-full max-w-[340px] items-center border-2 border-amber-500">
          {/* Close Button */}
          <TouchableOpacity className="absolute top-4 right-4 p-1" onPress={onDismiss}>
            <Icon name="close" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Icon */}
          <Animated.View
            className="w-20 h-20 rounded-full bg-amber-500/20 justify-center items-center mb-4"
            style={iconAnimatedStyle}
          >
            <Icon name="trophy" size={40} color="#F59E0B" />
          </Animated.View>

          {/* Title */}
          <Text className="text-amber-500 text-[28px] font-extrabold tracking-widest mb-2">
            GAME TIED
          </Text>

          {/* Score Display */}
          <Animated.View className="flex-row items-center mb-2" style={scoreAnimatedStyle}>
            <Text
              className="text-white text-5xl font-bold"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {awayScore}
            </Text>
            <Text className="text-surface-400 text-[32px] mx-4">-</Text>
            <Text
              className="text-white text-5xl font-bold"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {homeScore}
            </Text>
          </Animated.View>

          {/* Subtitle */}
          <Text className="text-surface-400 text-sm mb-8">
            {currentQuarter === 4 ? "End of Regulation" : `End of ${getOvertimeLabel()}`}
          </Text>

          {/* Start Overtime Button */}
          <TouchableOpacity
            className="bg-primary-500 w-full rounded-2xl py-[18px] items-center mb-3"
            onPress={handleStartOvertime}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center gap-2">
              <Icon name="play" size={20} color="#FFFFFF" />
              <Text className="text-white text-lg font-bold tracking-wide">
                START {currentQuarter >= 4 ? "OVERTIME" : `OT${currentQuarter - 3 + 1}`}
              </Text>
            </View>
            <Text className="text-white/70 text-xs mt-1">5 minute period</Text>
          </TouchableOpacity>

          {/* End as Tie Button */}
          <TouchableOpacity
            className="bg-surface-700 w-full rounded-2xl py-4 items-center mb-4"
            onPress={handleEndAsTie}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold">End as Tie</Text>
          </TouchableOpacity>

          {/* Info Text */}
          <Text className="text-surface-500 text-xs text-center">
            Team fouls will reset for overtime
          </Text>
        </View>
      </View>
    </Modal>
  );
}
