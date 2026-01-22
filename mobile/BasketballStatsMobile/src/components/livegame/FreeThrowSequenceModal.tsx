import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import type { Id } from "../../../../../convex/_generated/dataModel";

export interface FreeThrowSequence {
  playerId: Id<"players">;
  playerName: string;
  playerNumber: number;
  totalAttempts: number;
  isOneAndOne: boolean;
}

interface FreeThrowSequenceModalProps {
  visible: boolean;
  onClose: () => void;
  sequence: FreeThrowSequence | null;
  onFreeThrowResult: (
    playerId: Id<"players">,
    made: boolean,
    attemptNumber: number,
    totalAttempts: number,
    isOneAndOne: boolean
  ) => Promise<{ sequenceContinues: boolean }>;
}

export default function FreeThrowSequenceModal({
  visible,
  onClose,
  sequence,
  onFreeThrowResult,
}: FreeThrowSequenceModalProps) {
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animation values
  const translateX = useSharedValue(0);
  const _scale = useSharedValue(1);
  const madeButtonScale = useSharedValue(1);
  const missedButtonScale = useSharedValue(1);

  useEffect(() => {
    if (visible && sequence) {
      setCurrentAttempt(1);
      setResults(new Array(sequence.totalAttempts).fill(null));
    }
  }, [visible, sequence]);

  const handleResult = async (made: boolean) => {
    if (!sequence || isProcessing) return;

    setIsProcessing(true);

    // Animate button press
    if (made) {
      madeButtonScale.value = withSequence(
        withSpring(0.9, { damping: 15 }),
        withSpring(1, { damping: 15 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      missedButtonScale.value = withSequence(
        withSpring(0.9, { damping: 15 }),
        withSpring(1, { damping: 15 })
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const response = await onFreeThrowResult(
        sequence.playerId,
        made,
        currentAttempt,
        sequence.totalAttempts,
        sequence.isOneAndOne
      );

      // Update results
      const newResults = [...results];
      newResults[currentAttempt - 1] = made;
      setResults(newResults);

      // Handle 1-and-1: if first FT missed, sequence ends
      if (sequence.isOneAndOne && currentAttempt === 1 && !made) {
        // Sequence ends on miss
        setTimeout(() => {
          onClose();
        }, 500);
        return;
      }

      if (response.sequenceContinues) {
        // Animate to next attempt
        translateX.value = withSequence(
          withTiming(-20, { duration: 100 }),
          withTiming(0, { duration: 200 })
        );
        setCurrentAttempt((prev) => prev + 1);
      } else {
        // Sequence complete
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error("Failed to record free throw:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < -50) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX < -100) {
        // Swipe to dismiss
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        translateX.value = withTiming(-400, { duration: 200 });
        setTimeout(onClose, 200);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const madeButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: madeButtonScale.value }],
  }));

  const missedButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: missedButtonScale.value }],
  }));

  if (!visible || !sequence) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/70 justify-center items-center p-6">
        <GestureDetector gesture={swipeGesture}>
          <Animated.View
            className="bg-surface-800 rounded-3xl p-6 w-full max-w-[360px]"
            style={animatedContainerStyle}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold tracking-wide">FREE THROWS</Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Icon name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Player Info */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-primary-500 justify-center items-center mb-2">
                <Text className="text-white text-xl font-bold">#{sequence.playerNumber}</Text>
              </View>
              <Text className="text-white text-lg font-semibold">{sequence.playerName}</Text>
            </View>

            {/* Progress Indicator */}
            <View className="items-center mb-8">
              <Text className="text-surface-400 text-sm mb-3">
                Attempt {currentAttempt} of {sequence.totalAttempts}
                {sequence.isOneAndOne && " (1-and-1)"}
              </Text>
              <View className="flex-row gap-3">
                {results.map((result, index) => (
                  <View
                    key={index}
                    className={`w-7 h-7 rounded-full justify-center items-center border-2 ${
                      result === true
                        ? "bg-green-500 border-green-500"
                        : result === false
                          ? "bg-red-500 border-red-500"
                          : index === currentAttempt - 1
                            ? "bg-surface-700 border-primary-500 border-[3px]"
                            : "bg-surface-700 border-surface-600"
                    }`}
                  >
                    {result === true && <Icon name="check" size={12} color="#FFFFFF" />}
                    {result === false && <Text className="text-white text-xs font-bold">X</Text>}
                  </View>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-4 mb-4">
              <Animated.View className="flex-1" style={madeButtonAnimatedStyle}>
                <TouchableOpacity
                  className="h-20 rounded-2xl justify-center items-center bg-green-500"
                  onPress={() => handleResult(true)}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-lg font-bold">MADE</Text>
                  <Text className="text-white/80 text-sm mt-0.5">+1 PT</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View className="flex-1" style={missedButtonAnimatedStyle}>
                <TouchableOpacity
                  className="h-20 rounded-2xl justify-center items-center bg-red-500"
                  onPress={() => handleResult(false)}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-lg font-bold">MISSED</Text>
                  <View className="mt-1">
                    <Icon name="x" size={24} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Cancel Option */}
            <TouchableOpacity className="items-center py-3" onPress={onClose}>
              <Text className="text-surface-400 text-sm">Cancel Free Throws</Text>
            </TouchableOpacity>

            {/* Swipe Hint */}
            <Text className="text-surface-500 text-[11px] text-center mt-2">
              Swipe left to dismiss
            </Text>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}
