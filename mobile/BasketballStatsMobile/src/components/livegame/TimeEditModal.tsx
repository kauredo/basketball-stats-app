import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
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

  const isPresetActive = (preset: number) =>
    parseInt(primaryValue) === preset && parseInt(secondaryValue) === 0;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/70 justify-center items-center px-4 py-2"
      >
        <View className="bg-surface-800 rounded-3xl w-full max-w-[400px] pb-6 overflow-hidden">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-surface-700">
            <Text className="text-lg font-bold text-white">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Time Input */}
          <View className="p-6 items-center">
            <View className="flex-row items-center justify-center gap-2">
              <View className="items-center">
                <TextInput
                  ref={primaryRef}
                  className="w-20 h-16 bg-surface-700 rounded-xl text-[32px] font-bold text-white text-center"
                  style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}
                  value={primaryValue}
                  onChangeText={handlePrimaryChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text className="text-[10px] text-surface-400 mt-1">
                  {mode === "game" ? "MIN" : "SEC"}
                </Text>
              </View>
              <Text className="text-[32px] font-bold text-surface-500 mb-5">
                {mode === "game" ? ":" : "."}
              </Text>
              <View className="items-center">
                <TextInput
                  ref={secondaryRef}
                  className={`h-16 bg-surface-700 rounded-xl text-[32px] font-bold text-white text-center ${mode === "shot" ? "w-14" : "w-20"}`}
                  style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}
                  value={secondaryValue}
                  onChangeText={handleSecondaryChange}
                  keyboardType="number-pad"
                  maxLength={mode === "game" ? 2 : 1}
                  selectTextOnFocus
                />
                <Text className="text-[10px] text-surface-400 mt-1">
                  {mode === "game" ? "SEC" : "TENTHS"}
                </Text>
              </View>
            </View>

            {/* Quick presets for shot clock */}
            {mode === "shot" && (
              <View className="flex-row gap-3 mt-6">
                {shotClockPresets.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    className={`px-5 py-3 rounded-lg ${isPresetActive(preset) ? "bg-primary-500" : "bg-surface-700"}`}
                    onPress={() => handlePreset(preset)}
                  >
                    <Text
                      className={`text-base font-bold ${isPresetActive(preset) ? "text-white" : "text-surface-300"}`}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Current time display */}
            <Text className="text-sm text-surface-500 mt-4">Current: {formatCurrentTime()}</Text>
          </View>

          {/* Actions */}
          <View className="flex-row px-4 gap-3">
            <TouchableOpacity
              className="flex-1 p-4 items-center rounded-xl bg-surface-700"
              onPress={onClose}
            >
              <Text className="text-base font-semibold text-surface-400">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 p-4 items-center rounded-xl bg-primary-500"
              onPress={handleSave}
            >
              <Text className="text-base font-semibold text-white">Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
