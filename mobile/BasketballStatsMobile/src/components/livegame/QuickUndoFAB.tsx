import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  if (!action) return null;

  const statLabel = STAT_TYPE_LABELS[action.statType] || action.statType.toUpperCase();
  const madeText = action.wasMade !== undefined ? (action.wasMade ? " Made" : " Missed") : "";

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.content}>
          {/* Undo Icon */}
          <View style={styles.iconContainer}>
            <Icon name="refresh" size={18} color="#F97316" />
          </View>

          {/* Action Text */}
          <View style={styles.textContainer}>
            <Text style={styles.undoLabel}>Undo:</Text>
            <Text style={styles.actionText} numberOfLines={1}>
              #{action.playerNumber} {statLabel}{madeText}
            </Text>
          </View>

          {/* Undo Button */}
          <TouchableOpacity
            style={styles.undoButton}
            onPress={handleUndo}
            activeOpacity={0.7}
          >
            <Text style={styles.undoButtonText}>UNDO</Text>
          </TouchableOpacity>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={dismiss}
            activeOpacity={0.7}
          >
            <Icon name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <Animated.View style={styles.progressFill} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingRight: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(249, 115, 22, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  undoLabel: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  undoButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  undoButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  dismissButton: {
    padding: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#374151",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F97316",
    width: "100%",
  },
});
