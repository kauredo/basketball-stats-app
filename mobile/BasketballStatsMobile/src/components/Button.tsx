import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, useColorScheme } from "react-native";
import { getButtonStyles, type ButtonProps } from "@basketball-stats/shared";

interface NativeButtonProps extends ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function Button({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
}: NativeButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const buttonStyles = getButtonStyles({
    variant,
    size,
    disabled: disabled || loading,
    loading,
    fullWidth,
  });

  // Determine spinner color based on variant and theme
  const getSpinnerColor = () => {
    if (variant === "primary" || variant === "danger") {
      return "#FFFFFF";
    }
    // For secondary and ghost variants
    return "#EA580C"; // primary orange color
  };

  // Determine text color class based on variant and theme
  const getTextColorClass = () => {
    switch (variant) {
      case "primary":
      case "danger":
        return "text-white";
      case "secondary":
        return isDark ? "text-surface-300" : "text-surface-700";
      case "ghost":
        return isDark ? "text-surface-400" : "text-surface-600";
      default:
        return "text-white";
    }
  };

  const textColorClass = getTextColorClass();

  return (
    <TouchableOpacity
      className={`${buttonStyles} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <View className="flex-row items-center">
          <ActivityIndicator color={getSpinnerColor()} size="small" className="mr-2" />
          <Text className={`${textColorClass} font-medium`}>
            {typeof children === "string" ? children : "Loading..."}
          </Text>
        </View>
      ) : (
        <Text className={`${textColorClass} font-medium`}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}
