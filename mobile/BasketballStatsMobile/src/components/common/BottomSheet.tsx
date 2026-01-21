import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Modal,
  Pressable,
  useColorScheme,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Icon from "../Icon";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: number;
  showHandle?: boolean;
  enableSwipeToDismiss?: boolean;
}

export default function BottomSheet({
  visible,
  onClose,
  title,
  children,
  maxHeight = SCREEN_HEIGHT * 0.7,
  showHandle = true,
  enableSwipeToDismiss = true,
}: BottomSheetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const translateY = useSharedValue(maxHeight);
  const opacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const springConfig = { damping: 20, stiffness: 200 };

  // Theme-aware colors using design system tokens
  const sheetBg = isDark ? "#3d3835" : "#fdfcfb";
  const handleBg = isDark ? "#5c5650" : "#d4cdc5";
  const borderColor = isDark ? "#5c5650" : "#e8e4df";
  const titleColor = isDark ? "#fdfcfb" : "#252220";
  const closeIconColor = isDark ? "#a69f96" : "#7a746c";

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, springConfig);
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(maxHeight, springConfig);
      opacity.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated shared values are stable refs
  }, [visible, maxHeight]);

  const handleClose = useCallback(() => {
    translateY.value = withSpring(maxHeight, springConfig);
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated shared values are stable refs
  }, [onClose, maxHeight]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      if (enableSwipeToDismiss) {
        translateY.value = Math.max(context.value.y + event.translationY, 0);
      }
    })
    .onEnd((event) => {
      if (enableSwipeToDismiss && event.translationY > 100) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, springConfig);
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[styles.sheet, { maxHeight, backgroundColor: sheetBg }, animatedSheetStyle]}
          >
            {showHandle && <View style={[styles.handle, { backgroundColor: handleBg }]} />}

            {title && (
              <View style={[styles.header, { borderBottomColor: borderColor }]}>
                <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color={closeIconColor} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Safe area padding
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8, // Increased for better touch target (was 4)
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
});
