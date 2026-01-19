import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
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
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <Icon name="close" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Icon */}
          <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
            <Icon name="trophy" size={40} color="#F59E0B" />
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>GAME TIED</Text>

          {/* Score Display */}
          <Animated.View style={[styles.scoreContainer, scoreAnimatedStyle]}>
            <Text style={styles.score}>{awayScore}</Text>
            <Text style={styles.scoreDivider}>-</Text>
            <Text style={styles.score}>{homeScore}</Text>
          </Animated.View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {currentQuarter === 4 ? "End of Regulation" : `End of ${getOvertimeLabel()}`}
          </Text>

          {/* Start Overtime Button */}
          <TouchableOpacity
            style={styles.overtimeButton}
            onPress={handleStartOvertime}
            activeOpacity={0.8}
          >
            <View style={styles.overtimeButtonContent}>
              <Icon name="play" size={20} color="#FFFFFF" />
              <Text style={styles.overtimeButtonText}>
                START {currentQuarter >= 4 ? "OVERTIME" : `OT${currentQuarter - 3 + 1}`}
              </Text>
            </View>
            <Text style={styles.overtimeButtonSubtext}>5 minute period</Text>
          </TouchableOpacity>

          {/* End as Tie Button */}
          <TouchableOpacity style={styles.tieButton} onPress={handleEndAsTie} activeOpacity={0.8}>
            <Text style={styles.tieButtonText}>End as Tie</Text>
          </TouchableOpacity>

          {/* Info Text */}
          <Text style={styles.infoText}>Team fouls will reset for overtime</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: "#1F2937",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#F59E0B",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  score: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  scoreDivider: {
    color: "#9CA3AF",
    fontSize: 32,
    marginHorizontal: 16,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 32,
  },
  overtimeButton: {
    backgroundColor: "#F97316",
    width: "100%",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  overtimeButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overtimeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  overtimeButtonSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 4,
  },
  tieButton: {
    backgroundColor: "#374151",
    width: "100%",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  tieButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
  },
});
