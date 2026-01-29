import React from "react";
import { View, ScrollView } from "react-native";

export interface ModalBodyProps {
  /** Content to render in the body */
  children: React.ReactNode;
  /** Whether content should be scrollable (default: true) */
  scrollable?: boolean;
  /** Maximum height for scrollable content (default: 320) */
  maxHeight?: number;
  /** Padding size: none, sm (8px), md (16px), lg (24px) */
  padding?: "none" | "sm" | "md" | "lg";
  /** Whether to center content */
  centered?: boolean;
}

const PADDING_MAP = {
  none: "",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
};

/**
 * Standardized modal body with optional scrolling and consistent padding.
 */
export function ModalBody({
  children,
  scrollable = true,
  maxHeight = 320,
  padding = "md",
  centered = false,
}: ModalBodyProps) {
  const paddingClass = PADDING_MAP[padding];
  const centerClass = centered ? "items-center justify-center" : "";

  if (scrollable) {
    return (
      <ScrollView
        className={`${paddingClass}`}
        style={{ maxHeight }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View className={centerClass}>{children}</View>
      </ScrollView>
    );
  }

  return <View className={`${paddingClass} ${centerClass}`}>{children}</View>;
}

export default ModalBody;
