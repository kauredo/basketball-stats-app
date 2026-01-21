import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, useColorScheme, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import type { Id } from "../../../../../convex/_generated/dataModel";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const dismissIconColor = isDark ? "#a69f96" : "#7a746c"; // surface-500/600
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  const translateY = useSharedValue(100);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const progressWidth = useSharedValue(100); // Percentage for progress bar
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (action) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset and show animation
      progressWidth.value = 100;
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });

      // Animate progress bar from 100% to 0%
      progressWidth.value = withTiming(0, {
        duration: autoDismissMs,
        easing: Easing.linear,
      });

      // Auto-dismiss after autoDismissMs
      timeoutRef.current = setTimeout(() => {
        dismiss();
      }, autoDismissMs);
    } else {
      // Hide immediately
      translateY.value = 100;
      opacity.value = 0;
      progressWidth.value = 100;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dismiss uses Reanimated shared values which are stable refs
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

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!action) return null;

  const statLabel = STAT_TYPE_LABELS[action.statType] || action.statType.toUpperCase();
  const madeText = action.wasMade !== undefined ? (action.wasMade ? " Made" : " Missed") : "";

  // Position: centered horizontally, near bottom but above safe area
  // In landscape, position more towards center-bottom to avoid buttons
  const positionClass = isLandscape
    ? "absolute bottom-4 left-1/2 -translate-x-1/2 w-80"
    : "absolute bottom-6 left-4 right-4";

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View
        className={`${positionClass} bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden shadow-2xl border border-surface-200 dark:border-surface-700`}
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

          {/* Undo Button - min 44px touch target */}
          <TouchableOpacity
            className="bg-orange-500 px-4 py-3 rounded-lg mr-1 min-h-[44px] justify-center"
            onPress={handleUndo}
            activeOpacity={0.7}
          >
            <Text className="text-white text-xs font-bold">UNDO</Text>
          </TouchableOpacity>

          {/* Dismiss Button - min 44px touch target */}
          <TouchableOpacity
            className="p-3 min-w-[44px] min-h-[44px] items-center justify-center"
            onPress={dismiss}
            activeOpacity={0.7}
          >
            <Icon name="close" size={18} color={dismissIconColor} />
          </TouchableOpacity>
        </View>

        {/* Animated Progress Bar */}
        <View className="h-1 bg-surface-100 dark:bg-surface-800">
          <Animated.View className="h-full bg-orange-500" style={progressBarStyle} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
