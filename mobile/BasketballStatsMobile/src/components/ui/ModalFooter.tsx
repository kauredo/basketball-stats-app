import React from "react";
import { View } from "react-native";

export interface ModalFooterProps {
  /** Footer content (typically ModalButton components) */
  children: React.ReactNode;
  /** Button layout: single (one button), split (two side-by-side), stacked (vertical) */
  layout?: "single" | "split" | "stacked";
  /** Whether to show top border (default: true) */
  showBorder?: boolean;
}

/**
 * Standardized modal footer with consistent padding, background, and button layouts.
 */
export function ModalFooter({ children, layout = "split", showBorder = true }: ModalFooterProps) {
  const layoutClass = {
    single: "",
    split: "flex-row gap-3",
    stacked: "gap-3",
  }[layout];

  return (
    <View
      className={`px-4 pt-2 pb-7 bg-surface-50 dark:bg-surface-900 ${showBorder ? "border-t border-surface-200 dark:border-surface-700" : ""} ${layoutClass}`}
    >
      {children}
    </View>
  );
}

export default ModalFooter;
