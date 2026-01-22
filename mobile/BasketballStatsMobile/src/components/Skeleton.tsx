import React, { useEffect } from "react";
import { View, useColorScheme, type ViewStyle, type DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  ReduceMotion,
} from "react-native-reanimated";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
  return (
    <View
      className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
      style={style}
    >
      <View className="flex-row items-center mb-4">
        <Skeleton width={48} height={48} borderRadius={24} />
        <View className="flex-1 ml-3">
          <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
      <View>
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="85%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={14} />
      </View>
    </View>
  );
};

// Skeleton for basketball court loading state
export const SkeletonCourt: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View
      className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
      style={style}
    >
      <Skeleton width={120} height={22} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={200} borderRadius={12} style={{ marginBottom: 16 }} />
      <View className="flex-row justify-center">
        <Skeleton width={70} height={18} style={{ marginRight: 16 }} />
        <Skeleton width={70} height={18} style={{ marginRight: 16 }} />
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
  return (
    <View
      className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
      style={style}
    >
      <Skeleton width={150} height={22} style={{ marginBottom: 16 }} />

      {/* Header */}
      <View className="flex-row items-center py-3 border-b border-surface-200 dark:border-surface-700">
        <View className="flex-[2]">
          <Skeleton width={80} height={12} />
        </View>
        <View className="flex-1">
          <Skeleton width={30} height={12} style={{ alignSelf: "center" }} />
        </View>
        <View className="flex-1">
          <Skeleton width={30} height={12} style={{ alignSelf: "center" }} />
        </View>
        <View className="flex-1">
          <Skeleton width={30} height={12} style={{ alignSelf: "center" }} />
        </View>
      </View>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          className="flex-row items-center py-3 border-b border-surface-200 dark:border-surface-700"
        >
          <View className="flex-[2]">
            <Skeleton width={100} height={14} />
          </View>
          <View className="flex-1">
            <Skeleton width={24} height={14} style={{ alignSelf: "center" }} />
          </View>
          <View className="flex-1">
            <Skeleton width={24} height={14} style={{ alignSelf: "center" }} />
          </View>
          <View className="flex-1">
            <Skeleton width={24} height={14} style={{ alignSelf: "center" }} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Skeleton for game list items
export const SkeletonGameCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View
      className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
      style={style}
    >
      <View className="flex-row items-center justify-between">
        {/* Away Team */}
        <View className="flex-1 items-center">
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 8 }} />
          <Skeleton width={80} height={14} style={{ marginBottom: 4 }} />
          <Skeleton width={50} height={12} />
        </View>

        {/* Score */}
        <View className="items-center mx-4">
          <Skeleton width={60} height={10} style={{ marginBottom: 8, alignSelf: "center" }} />
          <View className="flex-row items-center">
            <Skeleton width={28} height={28} />
            <Skeleton width={10} height={18} style={{ marginHorizontal: 8 }} />
            <Skeleton width={28} height={28} />
          </View>
          <Skeleton width={40} height={10} style={{ marginTop: 8, alignSelf: "center" }} />
        </View>

        {/* Home Team */}
        <View className="flex-1 items-center">
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 8 }} />
          <Skeleton width={80} height={14} style={{ marginBottom: 4 }} />
          <Skeleton width={50} height={12} />
        </View>
      </View>
    </View>
  );
};

// Skeleton for player stats row
export const SkeletonPlayerRow: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View
      className="flex-row items-center py-3 border-b border-surface-200 dark:border-surface-700"
      style={style}
    >
      <Skeleton width={32} height={32} borderRadius={16} />
      <View className="flex-1 ml-3">
        <Skeleton width={120} height={14} style={{ marginBottom: 4 }} />
        <Skeleton width={80} height={12} />
      </View>
      <View className="flex-row items-center">
        <Skeleton width={24} height={14} style={{ marginRight: 12 }} />
        <Skeleton width={24} height={14} style={{ marginRight: 12 }} />
        <Skeleton width={24} height={14} />
      </View>
    </View>
  );
};

// Skeleton for stat buttons grid
export const SkeletonStatButtons: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View
      className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
      style={style}
    >
      <Skeleton width={100} height={18} style={{ marginBottom: 16 }} />

      <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
      <View className="flex-row">
        <View className="flex-1">
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View className="flex-1 ml-2">
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View className="flex-1 ml-2">
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View className="flex-1 ml-2">
          <Skeleton height={56} borderRadius={12} />
        </View>
      </View>

      <Skeleton width={60} height={12} style={{ marginBottom: 8, marginTop: 16 }} />
      <View className="flex-row">
        <View className="flex-1">
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View className="flex-1 ml-2">
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View className="flex-1 ml-2">
          <Skeleton height={56} borderRadius={12} />
        </View>
        <View className="flex-1 ml-2">
          <Skeleton height={56} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

// Full screen loading skeleton
export const SkeletonScreen: React.FC = () => {
  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      {/* Header */}
      <View className="bg-white dark:bg-surface-800 p-5 pt-[60px]">
        <Skeleton width={180} height={28} style={{ marginBottom: 8 }} />
        <Skeleton width={120} height={16} />
      </View>

      {/* Content */}
      <View className="p-4">
        <SkeletonCourt style={{ marginBottom: 16 }} />
        <SkeletonStatButtons />
      </View>
    </View>
  );
};

export default Skeleton;
