import React from "react";
import { View, Image, Text, StyleSheet, ViewStyle } from "react-native";

interface LogoProps {
  variant?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg" | "xl";
  style?: ViewStyle;
  showText?: boolean;
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
  variant = "light",
  size = "md",
  style,
  showText = true,
}) => {
  const { width, height, fontSize } = sizeMap[size];

  // For auto variant, we'd check theme context here
  // Currently defaulting to light (for dark backgrounds) since app is dark theme
  const effectiveVariant = variant === "auto" ? "light" : variant;

  // Select the appropriate logo based on variant
  const logoSource = effectiveVariant === "light"
    ? require("../../assets/logo-light.png")
    : require("../../assets/logo.png");

  return (
    <View style={[styles.container, style]}>
      <Image
        source={logoSource}
        style={{ width, height }}
        resizeMode="contain"
      />
      {showText && (
        <Text style={[styles.text, { fontSize }]}>Basketball Stats</Text>
      )}
    </View>
  );
};

// Compact logo without text
export const LogoIcon: React.FC<Omit<LogoProps, "showText">> = ({
  variant = "light",
  size = "md",
  style,
}) => {
  return <Logo variant={variant} size={size} style={style} showText={false} />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    marginLeft: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default Logo;
