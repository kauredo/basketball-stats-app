import React from "react";
import { Modal, View, Pressable, KeyboardAvoidingView, Platform } from "react-native";

export interface BaseModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Accessibility title for screen readers */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Maximum width: sm=350, md=400, lg=500 */
  maxWidth?: "sm" | "md" | "lg";
  /** Whether tapping backdrop closes modal */
  closeOnBackdropPress?: boolean;
  /** Whether to use KeyboardAvoidingView for forms */
  avoidKeyboard?: boolean;
}

const MAX_WIDTH_MAP = {
  sm: 350,
  md: 400,
  lg: 500,
};

/**
 * Base modal container with standardized backdrop, animation, and accessibility.
 * Use with ModalHeader, ModalBody, and ModalFooter for consistent modal layouts.
 */
export function BaseModal({
  visible,
  onClose,
  title,
  children,
  maxWidth = "md",
  closeOnBackdropPress = true,
  avoidKeyboard = false,
}: BaseModalProps) {
  const maxWidthValue = MAX_WIDTH_MAP[maxWidth];

  const content = (
    <View
      className="flex-1 bg-black/70 justify-center items-center px-4 py-2"
      accessible={true}
      accessibilityLabel={title}
      accessibilityRole="alert"
    >
      {/* Backdrop press handler */}
      {closeOnBackdropPress && (
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityLabel="Close modal"
          accessibilityRole="button"
        />
      )}

      {/* Modal container */}
      <View
        className="bg-surface-50 dark:bg-surface-800 rounded-2xl max-h-[96%] w-full overflow-hidden border border-surface-200 dark:border-surface-700"
        style={{ maxWidth: maxWidthValue }}
        accessibilityRole="none"
        accessibilityLabel={title}
      >
        {children}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  );
}

export default BaseModal;
