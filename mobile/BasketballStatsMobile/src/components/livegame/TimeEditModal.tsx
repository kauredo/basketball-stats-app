import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";

interface TimeEditModalProps {
  visible: boolean;
  onClose: () => void;
  /** Current time in seconds (can include decimals for shot clock) */
  currentSeconds: number;
  /** Maximum time in seconds (for validation) */
  maxSeconds?: number;
  /** Callback when time is saved */
  onSave: (seconds: number) => void;
  /** Modal title */
  title: string;
  /** Whether this is a game clock (MM:SS) or shot clock (SS.T - seconds.tenths) */
  mode: "game" | "shot";
}

/**
 * Modal for manually editing game clock or shot clock time
 * - Game clock: MM:SS format (minutes:seconds)
 * - Shot clock: SS.T format (seconds.tenths)
 */
export default function TimeEditModal({
  visible,
  onClose,
  currentSeconds,
  maxSeconds,
  onSave,
  title,
  mode,
}: TimeEditModalProps) {
  // For game clock: minutes and seconds
  // For shot clock: seconds and tenths
  const [primaryValue, setPrimaryValue] = useState("0");
  const [secondaryValue, setSecondaryValue] = useState("0");
  const primaryRef = useRef<TextInput>(null);
  const secondaryRef = useRef<TextInput>(null);

  // Initialize values when modal opens
  useEffect(() => {
    if (visible) {
      if (mode === "game") {
        // Game clock: minutes:seconds
        setPrimaryValue(Math.floor(currentSeconds / 60).toString());
        setSecondaryValue(Math.floor(currentSeconds % 60).toString());
      } else {
        // Shot clock: seconds.tenths
        const wholeSec = Math.floor(currentSeconds);
        const tenths = Math.floor((currentSeconds - wholeSec) * 10);
        setPrimaryValue(Math.min(wholeSec, maxSeconds ?? 24).toString());
        setSecondaryValue(tenths.toString());
      }
      // Focus the primary input after a short delay
      setTimeout(() => {
        primaryRef.current?.focus();
      }, 100);
    }
  }, [visible, currentSeconds, mode, maxSeconds]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let totalSeconds: number;
    const primary = parseInt(primaryValue) || 0;
    const secondary = parseInt(secondaryValue) || 0;

    if (mode === "game") {
      // Game clock: minutes * 60 + seconds
      totalSeconds = primary * 60 + secondary;
    } else {
      // Shot clock: seconds + tenths/10
      totalSeconds = primary + secondary / 10;
    }

    // Enforce max if provided
    if (maxSeconds !== undefined) {
      totalSeconds = Math.min(totalSeconds, maxSeconds);
    }

    totalSeconds = Math.max(0, totalSeconds);
    onSave(totalSeconds);
    onClose();
  };

  const handlePrimaryChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (mode === "game") {
      // Minutes: 0-99
      setPrimaryValue(Math.max(0, Math.min(99, num)).toString());
    } else {
      // Seconds: 0-maxSeconds (default 24)
      setPrimaryValue(Math.max(0, Math.min(maxSeconds ?? 24, num)).toString());
    }
  };

  const handleSecondaryChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (mode === "game") {
      // Seconds: 0-59
      setSecondaryValue(Math.max(0, Math.min(59, num)).toString());
    } else {
      // Tenths: 0-9
      setSecondaryValue(Math.max(0, Math.min(9, num)).toString());
    }
  };

  const handlePreset = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPrimaryValue(value.toString());
    setSecondaryValue("0");
  };

  // Quick set buttons for shot clock (sets to full seconds, 0 tenths)
  const shotClockPresets = [24, 14, 10, 5];

  // Format current time for display
  const formatCurrentTime = () => {
    if (mode === "game") {
      const mins = Math.floor(currentSeconds / 60);
      const secs = Math.floor(currentSeconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    } else {
      const wholeSec = Math.floor(currentSeconds);
      const tenths = Math.floor((currentSeconds - wholeSec) * 10);
      return `${wholeSec}.${tenths}`;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Time Input */}
          <View style={styles.content}>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <TextInput
                  ref={primaryRef}
                  style={styles.input}
                  value={primaryValue}
                  onChangeText={handlePrimaryChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={styles.inputLabel}>
                  {mode === "game" ? "MIN" : "SEC"}
                </Text>
              </View>
              <Text style={styles.separator}>{mode === "game" ? ":" : "."}</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  ref={secondaryRef}
                  style={[styles.input, mode === "shot" && styles.inputSmall]}
                  value={secondaryValue}
                  onChangeText={handleSecondaryChange}
                  keyboardType="number-pad"
                  maxLength={mode === "game" ? 2 : 1}
                  selectTextOnFocus
                />
                <Text style={styles.inputLabel}>
                  {mode === "game" ? "SEC" : "TENTHS"}
                </Text>
              </View>
            </View>

            {/* Quick presets for shot clock */}
            {mode === "shot" && (
              <View style={styles.presetsRow}>
                {shotClockPresets.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetButton,
                      parseInt(primaryValue) === preset &&
                        parseInt(secondaryValue) === 0 &&
                        styles.presetButtonActive,
                    ]}
                    onPress={() => handlePreset(preset)}
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        parseInt(primaryValue) === preset &&
                          parseInt(secondaryValue) === 0 &&
                          styles.presetButtonTextActive,
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Current time display */}
            <Text style={styles.currentTime}>Current: {formatCurrentTime()}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  container: {
    backgroundColor: "#1F2937",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    paddingBottom: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  inputGroup: {
    alignItems: "center",
  },
  input: {
    width: 80,
    height: 64,
    backgroundColor: "#374151",
    borderRadius: 12,
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  inputSmall: {
    width: 56,
  },
  inputLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
  },
  separator: {
    fontSize: 32,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 20,
  },
  presetsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  presetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#374151",
    borderRadius: 8,
  },
  presetButtonActive: {
    backgroundColor: "#F97316",
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D1D5DB",
  },
  presetButtonTextActive: {
    color: "#FFFFFF",
  },
  currentTime: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 16,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#374151",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  saveButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F97316",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
