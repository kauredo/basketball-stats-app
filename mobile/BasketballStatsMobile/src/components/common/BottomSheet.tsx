import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
  // eslint-disable-next-line no-restricted-imports
  StyleSheet,
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
  const translateY = useSharedValue(maxHeight);
  const opacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const springConfig = { damping: 20, stiffness: 200 };

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
      <View className="flex-1 justify-end">
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <GestureDetector gesture={gesture}>
          <Animated.View
            className="bg-white dark:bg-surface-800 rounded-t-3xl pb-[34px]"
            style={[{ maxHeight }, animatedSheetStyle]}
          >
            {showHandle && (
              <View className="w-10 h-1 bg-surface-300 dark:bg-surface-600 rounded-full self-center mt-3 mb-2" />
            )}

            {title && (
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                <Text className="text-lg font-bold text-surface-900 dark:text-white">{title}</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
                >
                  <Icon name="close" size={24} color="#7a746c" />
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-1">{children}</View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
