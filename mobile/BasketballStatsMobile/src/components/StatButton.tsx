import React from "react";
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { COLORS, TOUCH_TARGETS } from "@basketball-stats/shared";

interface StatButtonProps {
  label: string;
  shortLabel?: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
  size?: "small" | "normal" | "large";
  variant?: "filled" | "outlined";
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const StatButton: React.FC<StatButtonProps> = ({
  label,
  shortLabel,
  color = COLORS.primary[500],
  onPress,
  disabled = false,
  size = "normal",
  variant = "filled",
  style,
}) => {
  const scale = useSharedValue(1);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics not available on this device - silently continue
    }
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonHeight = {
    small: TOUCH_TARGETS.minimum,
    normal: TOUCH_TARGETS.comfortable,
    large: TOUCH_TARGETS.large,
  }[size];

  const disabledBgColor = isDark ? "#374151" : "#D1D5DB";
  const disabledBorderColor = isDark ? "#374151" : "#D1D5DB";

  const buttonStyle = {
    filled: {
      backgroundColor: disabled ? disabledBgColor : color,
      borderWidth: 0,
    },
    outlined: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: disabled ? disabledBorderColor : color,
    },
  }[variant];

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        animatedStyle,
        styles.button,
        {
          ...buttonStyle,
          height: buttonHeight,
          minWidth: TOUCH_TARGETS.minimum,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      {shortLabel && <Text style={styles.shortLabel}>{shortLabel}</Text>}
    </AnimatedTouchable>
  );
};

// Preset stat buttons for common use cases
export const ScoringButton: React.FC<{
  type: "2pt" | "3pt" | "ft" | "miss";
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}> = ({ type, onPress, disabled, style }) => {
  const config = {
    "2pt": { label: "2PT", shortLabel: "+2", color: COLORS.shots.made2pt },
    "3pt": { label: "3PT", shortLabel: "+3", color: COLORS.shots.made3pt },
    ft: { label: "FT", shortLabel: "+1", color: COLORS.shots.freeThrowMade },
    miss: { label: "MISS", shortLabel: "×", color: COLORS.shots.missed2pt },
  }[type];

  return (
    <StatButton {...config} onPress={onPress} disabled={disabled} size="large" style={style} />
  );
};

export const DefenseButton: React.FC<{
  type: "steal" | "block" | "rebound";
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}> = ({ type, onPress, disabled, style }) => {
  const config = {
    steal: { label: "STL", shortLabel: "+S", color: COLORS.statButtons.defense },
    block: { label: "BLK", shortLabel: "+B", color: COLORS.statButtons.defense },
    rebound: { label: "REB", shortLabel: "+R", color: COLORS.statButtons.rebounding },
  }[type];

  return <StatButton {...config} onPress={onPress} disabled={disabled} style={style} />;
};

export const NegativeButton: React.FC<{
  type: "turnover" | "foul";
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}> = ({ type, onPress, disabled, style }) => {
  const config = {
    turnover: { label: "TO", shortLabel: "+T", color: COLORS.statButtons.negative },
    foul: { label: "FOUL", shortLabel: "+F", color: COLORS.statButtons.negative },
  }[type];

  return <StatButton {...config} onPress={onPress} disabled={disabled} style={style} />;
};

// Stat button row component for grouping
export const StatButtonRow: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => <View style={[styles.row, style]}>{children}</View>;

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  shortLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
});

export default StatButton;
