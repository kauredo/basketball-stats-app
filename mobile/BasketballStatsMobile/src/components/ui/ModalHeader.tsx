import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";

export type ModalHeaderVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "rebound"
  | "assist"
  | "steal"
  | "block"
  | "turnover"
  | "foul";

export interface ModalHeaderProps {
  /** Main title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Optional badge (e.g., "+3 PTS") */
  badge?: React.ReactNode;
  /** Color variant for the header */
  variant?: ModalHeaderVariant;
  /** Whether to show close button (default: true) */
  showCloseButton?: boolean;
  /** Close button callback */
  onClose?: () => void;
  /** Whether to show back button for multi-step wizards */
  showBackButton?: boolean;
  /** Back button callback */
  onBack?: () => void;
  /** Optional player info to display */
  playerInfo?: {
    number: number;
    name: string;
    subtitle?: string;
    subtitleDanger?: boolean;
  };
}

const VARIANT_STYLES: Record<
  ModalHeaderVariant,
  { bg: string; text: string; subtitle: string; border: boolean }
> = {
  default: {
    bg: "bg-surface-50 dark:bg-surface-900",
    text: "text-surface-900 dark:text-white",
    subtitle: "text-surface-500",
    border: true,
  },
  primary: {
    bg: "bg-primary-500",
    text: "text-white",
    subtitle: "text-primary-200",
    border: false,
  },
  success: {
    bg: "bg-green-600",
    text: "text-white",
    subtitle: "text-green-200",
    border: false,
  },
  warning: {
    bg: "bg-amber-500",
    text: "text-white",
    subtitle: "text-amber-200",
    border: false,
  },
  danger: {
    bg: "bg-red-600",
    text: "text-white",
    subtitle: "text-red-200",
    border: false,
  },
  info: {
    bg: "bg-blue-600",
    text: "text-white",
    subtitle: "text-blue-200",
    border: false,
  },
  rebound: {
    bg: "bg-blue-600",
    text: "text-white",
    subtitle: "text-blue-200",
    border: false,
  },
  assist: {
    bg: "bg-violet-600",
    text: "text-white",
    subtitle: "text-violet-200",
    border: false,
  },
  steal: {
    bg: "bg-cyan-600",
    text: "text-white",
    subtitle: "text-cyan-200",
    border: false,
  },
  block: {
    bg: "bg-teal-600",
    text: "text-white",
    subtitle: "text-teal-200",
    border: false,
  },
  turnover: {
    bg: "bg-amber-500",
    text: "text-white",
    subtitle: "text-amber-200",
    border: false,
  },
  foul: {
    bg: "bg-red-600",
    text: "text-white",
    subtitle: "text-red-200",
    border: false,
  },
};

/**
 * Standardized modal header with title, optional subtitle, close/back buttons,
 * and color variants for different stat types.
 */
export function ModalHeader({
  title,
  subtitle,
  badge,
  variant = "default",
  showCloseButton = true,
  onClose,
  showBackButton = false,
  onBack,
  playerInfo,
}: ModalHeaderProps) {
  const styles = VARIANT_STYLES[variant];

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  // Player info header style (for FoulTypeModal)
  if (playerInfo) {
    return (
      <View
        className={`flex-row justify-between items-center px-3 py-3 ${styles.bg} ${styles.border ? "border-b border-surface-200 dark:border-surface-700" : ""}`}
      >
        <View className="flex-row items-center flex-1 gap-2.5">
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBack}
              className="p-2 -ml-2 min-w-[44px] min-h-[44px] justify-center items-center"
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Icon name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View className="w-10 h-10 rounded-full bg-primary-500 justify-center items-center">
            <Text className="text-white font-bold text-sm">#{playerInfo.number}</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-[15px] font-semibold ${styles.text}`}>{playerInfo.name}</Text>
            {playerInfo.subtitle && (
              <Text
                className={`text-xs mt-0.5 ${playerInfo.subtitleDanger ? "text-red-500 font-semibold" : styles.subtitle}`}
              >
                {playerInfo.subtitle}
              </Text>
            )}
          </View>
        </View>
        {showCloseButton && onClose && (
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 -mr-1 min-w-[44px] min-h-[44px] justify-center items-center"
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Icon name="close" size={24} color={variant === "default" ? "#9CA3AF" : "#FFFFFF"} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View
      className={`px-4 py-3 ${styles.bg} ${styles.border ? "border-b border-surface-200 dark:border-surface-700" : ""}`}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1 gap-2">
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBack}
              className="p-2 -ml-2 min-w-[44px] min-h-[44px] justify-center items-center"
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Icon
                name="arrow-left"
                size={20}
                color={variant === "default" ? "#6B7280" : "#FFFFFF"}
              />
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Text className={`text-lg font-bold ${styles.text}`}>{title}</Text>
            {subtitle && <Text className={`text-sm ${styles.subtitle}`}>{subtitle}</Text>}
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {badge}
          {showCloseButton && onClose && (
            <TouchableOpacity
              onPress={handleClose}
              className="p-2 -mr-2 min-w-[44px] min-h-[44px] justify-center items-center"
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Icon name="close" size={24} color={variant === "default" ? "#9CA3AF" : "#FFFFFF"} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default ModalHeader;
