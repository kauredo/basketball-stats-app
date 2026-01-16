import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { getButtonStyles, ButtonProps } from "@basketball-stats/shared/src/components/Button";

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
  const buttonStyles = getButtonStyles({
    variant,
    size,
    disabled: disabled || loading,
    loading,
    fullWidth,
  });

  return (
    <TouchableOpacity
      className={`${buttonStyles} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <View className="flex-row items-center">
          <ActivityIndicator
            color={variant === "primary" ? "#FFFFFF" : "#EA580C"}
            size="small"
            className="mr-2"
          />
          <Text className="text-current font-medium">
            {typeof children === "string" ? children : "Loading..."}
          </Text>
        </View>
      ) : (
        <Text className="text-current font-medium">{children}</Text>
      )}
    </TouchableOpacity>
  );
}
