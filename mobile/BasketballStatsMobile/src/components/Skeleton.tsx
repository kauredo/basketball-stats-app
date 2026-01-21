import React, { useEffect } from "react";
import { View, StyleSheet, type ViewStyle, type DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  ReduceMotion,
} from "react-native-reanimated";
import { useTheme } from "../contexts/ThemeContext";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmer = useSharedValue(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    // Respect reduced motion preferences
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, reduceMotion: ReduceMotion.System }),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shimmer is a stable Reanimated shared value
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    // When reduced motion is enabled, just show a static opacity
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? "#5c5650" : "#e8e4df",
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

// Skeleton Card for game cards, player cards, etc.
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const cardStyle = isDark ? styles.cardDark : styles.cardLight;

  return (
    <View style={[cardStyle, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="70%" height={18} style={styles.mb2} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Skeleton width="100%" height={14} style={styles.mb2} />
        <Skeleton width="85%" height={14} style={styles.mb2} />
        <Skeleton width="70%" height={14} />
      </View>
    </View>
  );
};

// Skeleton for basketball court loading state
export const SkeletonCourt: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const cardStyle = isDark ? styles.cardDark : styles.cardLight;

  return (
    <View style={[cardStyle, style]}>
      <Skeleton width={120} height={22} style={styles.mb4} />
      <Skeleton width="100%" height={200} borderRadius={12} style={styles.mb4} />
      <View style={styles.row}>
        <Skeleton width={70} height={18} style={styles.mr4} />
        <Skeleton width={70} height={18} style={styles.mr4} />
        <Skeleton width={70} height={18} />
      </View>
    </View>
  );
};

// Skeleton for statistics tables
export const SkeletonTable: React.FC<{
  rows?: number;
  style?: ViewStyle;
}> = ({ rows = 5, style }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const cardStyle = isDark ? styles.cardDark : styles.cardLight;
  const borderStyle = isDark ? styles.borderBottomDark : styles.borderBottomLight;

  return (
    <View style={[cardStyle, style]}>
      <Skeleton width={150} height={22} style={styles.mb4} />

      {/* Header */}
      <View style={[styles.tableRow, borderStyle]}>
        <View style={styles.flex2}>
          <Skeleton width={80} height={12} />
        </View>
        <View style={styles.flex1}>
          <Skeleton width={30} height={12} style={styles.centered} />
        </View>
        <View style={styles.flex1}>
          <Skeleton width={30} height={12} style={styles.centered} />
        </View>
        <View style={styles.flex1}>
          <Skeleton width={30} height={12} style={styles.centered} />
        </View>
      </View>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={[styles.tableRow, borderStyle]}>
          <View style={styles.flex2}>
            <Skeleton width={100} height={14} />
          </View>
          <View style={styles.flex1}>
            <Skeleton width={24} height={14} style={styles.centered} />
          </View>
          <View style={styles.flex1}>
            <Skeleton width={24} height={14} style={styles.centered} />
          </View>
          <View style={styles.flex1}>
            <Skeleton width={24} height={14} style={styles.centered} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Skeleton for game list items
export const SkeletonGameCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gameCardStyle = isDark ? styles.gameCardDark : styles.gameCardLight;

  return (
    <View style={[gameCardStyle, style]}>
      <View style={styles.gameCardContent}>
        {/* Away Team */}
        <View style={styles.teamColumn}>
          <Skeleton width={40} height={40} borderRadius={20} style={styles.mb2} />
          <Skeleton width={80} height={14} style={styles.mb1} />
          <Skeleton width={50} height={12} />
        </View>

        {/* Score */}
        <View style={styles.scoreSection}>
          <Skeleton width={60} height={10} style={{ ...styles.mb2, alignSelf: "center" }} />
          <View style={styles.scoreRow}>
            <Skeleton width={28} height={28} />
            <Skeleton width={10} height={18} style={styles.mx2} />
            <Skeleton width={28} height={28} />
          </View>
          <Skeleton width={40} height={10} style={{ ...styles.mt2, alignSelf: "center" }} />
        </View>

        {/* Home Team */}
        <View style={styles.teamColumn}>
          <Skeleton width={40} height={40} borderRadius={20} style={styles.mb2} />
          <Skeleton width={80} height={14} style={styles.mb1} />
          <Skeleton width={50} height={12} />
        </View>
      </View>
    </View>
  );
};

// Skeleton for player stats row
export const SkeletonPlayerRow: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const playerRowStyle = isDark ? styles.playerRowDark : styles.playerRowLight;

  return (
    <View style={[playerRowStyle, style]}>
      <Skeleton width={32} height={32} borderRadius={16} />
      <View style={styles.playerInfo}>
        <Skeleton width={120} height={14} style={styles.mb1} />
        <Skeleton width={80} height={12} />
      </View>
      <View style={styles.statsRow}>
        <Skeleton width={24} height={14} style={styles.mr3} />
        <Skeleton width={24} height={14} style={styles.mr3} />
        <Skeleton width={24} height={14} />
      </View>
    </View>
  );
};

// Skeleton for stat buttons grid
export const SkeletonStatButtons: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const cardStyle = isDark ? styles.cardDark : styles.cardLight;

  return (
    <View style={[cardStyle, style]}>
      <Skeleton width={100} height={18} style={styles.mb4} />

      <Skeleton width={60} height={12} style={styles.mb2} />
      <View style={styles.buttonRow}>
        <View style={styles.buttonItem}>
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View style={styles.buttonItemWithMargin}>
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View style={styles.buttonItemWithMargin}>
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View style={styles.buttonItemWithMargin}>
          <Skeleton height={56} borderRadius={12} />
        </View>
      </View>

      <Skeleton width={60} height={12} style={{ ...styles.mb2, marginTop: 16 }} />
      <View style={styles.buttonRow}>
        <View style={styles.buttonItem}>
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View style={styles.buttonItemWithMargin}>
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View style={styles.buttonItemWithMargin}>
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View style={styles.buttonItemWithMargin}>
          <Skeleton height={56} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

// Full screen loading skeleton
export const SkeletonScreen: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const screenStyle = isDark ? styles.screenDark : styles.screenLight;
  const screenHeaderStyle = isDark ? styles.screenHeaderDark : styles.screenHeaderLight;

  return (
    <View style={screenStyle}>
      {/* Header */}
      <View style={screenHeaderStyle}>
        <Skeleton width={180} height={28} style={styles.mb2} />
        <Skeleton width={120} height={16} />
      </View>

      {/* Content */}
      <View style={styles.screenContent}>
        <SkeletonCourt style={styles.mb4} />
        <SkeletonStatButtons />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Dark mode card styles
  cardDark: {
    backgroundColor: "#3d3835",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#5c5650",
  },
  // Light mode card styles
  cardLight: {
    backgroundColor: "#fdfcfb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f3f0ed",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardBody: {},
  row: {
    flexDirection: "row",
    justifyContent: "center",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  borderBottomDark: {
    borderBottomWidth: 1,
    borderBottomColor: "#5c5650",
  },
  borderBottomLight: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f0ed",
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  centered: {
    alignSelf: "center" as const,
  },
  itemsCenter: {
    alignItems: "center" as const,
  },
  teamColumn: {
    flex: 1,
    alignItems: "center" as const,
  },
  gameCardDark: {
    backgroundColor: "#3d3835",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#5c5650",
  },
  gameCardLight: {
    backgroundColor: "#fdfcfb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f3f0ed",
  },
  gameCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreSection: {
    alignItems: "center",
    marginHorizontal: 16,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerRowDark: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#5c5650",
  },
  playerRowLight: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f0ed",
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
  },
  buttonItem: {
    flex: 1,
  },
  buttonItemWithMargin: {
    flex: 1,
    marginLeft: 8,
  },
  screenDark: {
    flex: 1,
    backgroundColor: "#1a1816",
  },
  screenLight: {
    flex: 1,
    backgroundColor: "#fdfcfb",
  },
  screenHeaderDark: {
    backgroundColor: "#3d3835",
    padding: 20,
    paddingTop: 60,
  },
  screenHeaderLight: {
    backgroundColor: "#fdfcfb",
    padding: 20,
    paddingTop: 60,
  },
  screenContent: {
    padding: 16,
  },
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb4: { marginBottom: 16 },
  mt2: { marginTop: 8 },
  mt4: { marginTop: 16 },
  ml2: { marginLeft: 8 },
  ml3: { marginLeft: 12 },
  mr3: { marginRight: 12 },
  mr4: { marginRight: 16 },
  mx2: { marginHorizontal: 8 },
});

export default Skeleton;
