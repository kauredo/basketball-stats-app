import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import { Id } from "../../../../../convex/_generated/dataModel";

export interface LastAction {
  playerId: Id<"players">;
  playerNumber: number;
  playerName: string;
  statType: string;
  wasMade?: boolean;
  displayText: string;
  timestamp: number;
}

interface QuickUndoFABProps {
  action: LastAction | null;
  onUndo: (action: LastAction) => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

const STAT_TYPE_LABELS: Record<string, string> = {
  shot2: "2PT",
  shot3: "3PT",
  freethrow: "FT",
  rebound: "REB",
  offensiveRebound: "OREB",
  defensiveRebound: "DREB",
  assist: "AST",
  steal: "STL",
  block: "BLK",
  turnover: "TO",
  foul: "FOUL",
};

export default function QuickUndoFAB({
  action,
  onUndo,
  onDismiss,
  autoDismissMs = 8000,
}: QuickUndoFABProps) {
  const translateY = useSharedValue(100);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (action) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Show animation
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });

      // Auto-dismiss after autoDismissMs
      timeoutRef.current = setTimeout(() => {
        dismiss();
      }, autoDismissMs);
    } else {
      // Hide immediately
      translateY.value = 100;
      opacity.value = 0;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [action, autoDismissMs]);

  const dismiss = () => {
    translateY.value = withSpring(100, { damping: 15 });
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(onDismiss, 200);
  };

  const handleUndo = () => {
    if (!action) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onUndo(action);
    dismiss();
  };

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
      // Also allow swipe down
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationX > 80) {
        // Swipe right to dismiss
        translateX.value = withTiming(400, { duration: 200 });
        runOnJS(dismiss)();
      } else if (event.translationY > 60) {
        // Swipe down to dismiss
        runOnJS(dismiss)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  if (!action) return null;

  const statLabel = STAT_TYPE_LABELS[action.statType] || action.statType.toUpperCase();
  const madeText = action.wasMade !== undefined ? (action.wasMade ? " Made" : " Missed") : "";

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View
        className="absolute bottom-24 left-4 right-4 bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden shadow-2xl border border-surface-200 dark:border-surface-700"
        style={animatedStyle}
      >
        <View className="flex-row items-center p-3 pr-2">
          {/* Undo Icon */}
          <View className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-500/20 justify-center items-center mr-2.5">
            <Icon name="refresh" size={18} color="#F97316" />
          </View>

          {/* Action Text */}
          <View className="flex-1 flex-row items-center gap-1">
            <Text className="text-surface-500 dark:text-surface-400 text-[13px]">Undo:</Text>
            <Text
              className="text-surface-900 dark:text-white text-[14px] font-semibold flex-1"
              numberOfLines={1}
            >
              #{action.playerNumber} {statLabel}
              {madeText}
            </Text>
          </View>

          {/* Undo Button */}
          <TouchableOpacity
            className="bg-orange-500 px-3.5 py-2 rounded-lg mr-2"
            onPress={handleUndo}
            activeOpacity={0.7}
          >
            <Text className="text-white text-xs font-bold">UNDO</Text>
          </TouchableOpacity>

          {/* Dismiss Button */}
          <TouchableOpacity className="p-1" onPress={dismiss} activeOpacity={0.7}>
            <Icon name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View className="h-1 bg-surface-100 dark:bg-surface-800">
          <View className="h-full bg-orange-500 w-full" />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
