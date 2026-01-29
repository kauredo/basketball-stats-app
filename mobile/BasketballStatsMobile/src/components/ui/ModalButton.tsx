import React from "react";
import { TouchableOpacity, Text } from "react-native";
import * as Haptics from "expo-haptics";

export type ModalButtonVariant = "primary" | "secondary" | "cancel" | "danger" | "success";

export interface ModalButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Press handler */
  onPress: () => void;
  /** Visual variant */
  variant?: ModalButtonVariant;
  /** Whether button should fill available width */
  fullWidth?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
}

const VARIANT_STYLES: Record<ModalButtonVariant, { bg: string; text: string; disabledBg: string }> =
  {
    primary: {
      bg: "bg-primary-500",
      text: "text-white",
      disabledBg: "bg-primary-300",
    },
    secondary: {
      bg: "bg-surface-200 dark:bg-surface-700",
      text: "text-surface-700 dark:text-surface-300",
      disabledBg: "bg-surface-100 dark:bg-surface-800",
    },
    cancel: {
      bg: "bg-transparent",
      text: "text-surface-600 dark:text-surface-400",
      disabledBg: "bg-transparent",
    },
    danger: {
      bg: "bg-red-600",
      text: "text-white",
      disabledBg: "bg-red-300",
    },
    success: {
      bg: "bg-green-600",
      text: "text-white",
      disabledBg: "bg-green-300",
    },
  };

/**
 * Standardized modal button with consistent sizing, colors, and haptic feedback.
 * Min 44px touch target for accessibility.
 */
export function ModalButton({
  children,
  onPress,
  variant = "primary",
  fullWidth = true,
  disabled = false,
}: ModalButtonProps) {
  const styles = VARIANT_STYLES[variant];

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      className={`py-3 px-4 rounded-xl items-center justify-center min-h-[44px] ${
        fullWidth ? "flex-1" : ""
      } ${disabled ? styles.disabledBg : styles.bg}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text className={`text-base font-semibold ${styles.text} ${disabled ? "opacity-50" : ""}`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export default ModalButton;
