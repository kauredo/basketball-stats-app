import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
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
import { Id } from "../../../../../convex/_generated/dataModel";

interface PlayerInfo {
  id: Id<"players">;
  name: string;
  number: number;
}

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
  const scale = useSharedValue(1);
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
      <View style={styles.overlay}>
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.container, animatedContainerStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>FREE THROWS</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Player Info */}
            <View style={styles.playerSection}>
              <View style={styles.playerAvatar}>
                <Text style={styles.playerNumber}>#{sequence.playerNumber}</Text>
              </View>
              <Text style={styles.playerName}>{sequence.playerName}</Text>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressSection}>
              <Text style={styles.attemptText}>
                Attempt {currentAttempt} of {sequence.totalAttempts}
                {sequence.isOneAndOne && " (1-and-1)"}
              </Text>
              <View style={styles.progressDots}>
                {results.map((result, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      result === true && styles.progressDotMade,
                      result === false && styles.progressDotMissed,
                      index === currentAttempt - 1 && styles.progressDotCurrent,
                    ]}
                  >
                    {result === true && <Icon name="check" size={12} color="#FFFFFF" />}
                    {result === false && <Text style={styles.missedX}>X</Text>}
                  </View>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonSection}>
              <Animated.View style={[styles.buttonWrapper, madeButtonAnimatedStyle]}>
                <TouchableOpacity
                  style={[styles.button, styles.madeButton]}
                  onPress={() => handleResult(true)}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>MADE</Text>
                  <Text style={styles.buttonSubtext}>+1 PT</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={[styles.buttonWrapper, missedButtonAnimatedStyle]}>
                <TouchableOpacity
                  style={[styles.button, styles.missedButton]}
                  onPress={() => handleResult(false)}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>MISSED</Text>
                  <View style={styles.missedIcon}>
                    <Icon name="x" size={24} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Cancel Option */}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel Free Throws</Text>
            </TouchableOpacity>

            {/* Swipe Hint */}
            <Text style={styles.swipeHint}>Swipe left to dismiss</Text>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: "#1F2937",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
  },
  playerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  playerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  playerNumber: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  playerName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  progressSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  attemptText: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 12,
  },
  progressDots: {
    flexDirection: "row",
    gap: 12,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#374151",
    borderWidth: 2,
    borderColor: "#4B5563",
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotCurrent: {
    borderColor: "#F97316",
    borderWidth: 3,
  },
  progressDotMade: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  progressDotMissed: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  missedX: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  buttonSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  madeButton: {
    backgroundColor: "#22C55E",
  },
  missedButton: {
    backgroundColor: "#EF4444",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  buttonSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: 2,
  },
  missedIcon: {
    marginTop: 4,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  swipeHint: {
    color: "#6B7280",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
  },
});
