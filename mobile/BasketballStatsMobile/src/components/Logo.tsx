import React from "react";
import { View, Image, Text, useColorScheme, type ViewStyle } from "react-native";

interface LogoProps {
  variant?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg" | "xl";
  style?: ViewStyle;
  showText?: boolean;
  textColor?: string;
}

const sizeMap = {
  sm: { width: 24, height: 24, fontSize: 14 },
  md: { width: 32, height: 32, fontSize: 16 },
  lg: { width: 40, height: 40, fontSize: 18 },
  xl: { width: 48, height: 48, fontSize: 20 },
};

/**
 * Logo component with dark/light theme support
 *
 * - variant="light": Use light logo (for dark backgrounds)
 * - variant="dark": Use dark logo (for light backgrounds)
 * - variant="auto": Automatically select based on system/app theme
 *
 * Logo files should be placed in /assets/:
 * - logo.png (dark logo for light backgrounds)
 * - logo-light.png (light logo for dark backgrounds)
 */
const Logo: React.FC<LogoProps> = ({
  variant = "auto",
  size = "md",
  style,
  showText = true,
  textColor,
}) => {
  const { width, height, fontSize } = sizeMap[size];
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // For auto variant, select based on system color scheme
  const effectiveVariant = variant === "auto" ? (isDark ? "light" : "dark") : variant;

  // Select the appropriate logo based on variant
  const logoSource =
    effectiveVariant === "light"
      ? require("../../assets/logo-light.png")
      : require("../../assets/logo.png");

  // Determine text color: use prop if provided, otherwise based on theme
  const effectiveTextColor = textColor ?? (isDark ? "#fdfcfb" : "#252220");

  return (
    <View className="flex-row items-center" style={style}>
      <Image source={logoSource} style={{ width, height }} resizeMode="contain" />
      {showText && (
        <Text className="ml-2 font-bold" style={{ fontSize, color: effectiveTextColor }}>
          Basketball Stats
        </Text>
      )}
    </View>
  );
};

// Compact logo without text
export const LogoIcon: React.FC<Omit<LogoProps, "showText">> = ({
  variant = "auto",
  size = "md",
  style,
  textColor,
}) => {
  return (
    <Logo variant={variant} size={size} style={style} showText={false} textColor={textColor} />
  );
};

export default Logo;
