import React from "react";
import {
  View,
  Text,
  TextInput,
  useColorScheme,
  TouchableOpacity,
  type TextInputProps,
} from "react-native";
import { getThemedColors } from "@basketball-stats/shared";
import Icon, { type IconName } from "./Icon";

interface FormFieldProps extends Omit<TextInputProps, "style"> {
  /** Field label displayed above the input */
  label: string;
  /** Whether the field is required (shows asterisk) */
  required?: boolean;
  /** Optional helper text shown below the input */
  helperText?: string;
  /** Error message - when present, field shows error state */
  error?: string;
  /** Icon to show on the left side of the input */
  leftIcon?: IconName;
  /** Icon to show on the right side (clickable) */
  rightIcon?: IconName;
  /** Callback when right icon is pressed */
  onRightIconPress?: () => void;
  /** Additional container styles */
  containerClassName?: string;
}

/**
 * FormField - A consistent form input component
 *
 * Features:
 * - Theme-aware styling (light/dark mode)
 * - Optional left/right icons
 * - Label with required indicator
 * - Error state with message
 * - Helper text support
 * - Minimum 48px touch target
 *
 * @example
 * <FormField
 *   label="Email"
 *   required
 *   leftIcon="mail"
 *   placeholder="Enter your email"
 *   keyboardType="email-address"
 * />
 */
export default function FormField({
  label,
  required = false,
  helperText,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerClassName = "",
  editable = true,
  ...textInputProps
}: FormFieldProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getThemedColors(isDark);

  const hasError = !!error;
  const isDisabled = editable === false;

  // Border color based on state
  const borderColor = hasError
    ? "#dc2626" // error red
    : isDark
      ? "#5c5650" // surface-700
      : "#e8e4df"; // surface-300

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {/* Label */}
      <Text
        className={`text-sm font-medium mb-2 ${
          isDark ? "text-surface-300" : "text-surface-700"
        } ${isDisabled ? "opacity-50" : ""}`}
      >
        {label}
        {required && <Text className="text-primary-500"> *</Text>}
      </Text>

      {/* Input Container */}
      <View className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
            <Icon name={leftIcon} size={20} color={colors.placeholder} />
          </View>
        )}

        {/* TextInput */}
        <TextInput
          className={`rounded-xl px-4 py-3.5 text-base min-h-[48px] ${
            isDark ? "text-white" : "text-surface-900"
          } ${leftIcon ? "pl-12" : ""} ${rightIcon ? "pr-14" : ""}`}
          style={{
            backgroundColor: colors.inputBg,
            borderWidth: 1,
            borderColor: borderColor,
          }}
          placeholderTextColor={colors.placeholder}
          editable={editable}
          {...textInputProps}
        />

        {/* Right Icon (Touchable) */}
        {rightIcon && (
          <TouchableOpacity
            className="absolute right-2 top-0 bottom-0 min-w-[44px] min-h-[44px] items-center justify-center"
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            activeOpacity={onRightIconPress ? 0.7 : 1}
          >
            <Icon name={rightIcon} size={20} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {hasError && <Text className="text-red-500 text-sm mt-1.5">{error}</Text>}

      {/* Helper Text */}
      {helperText && !hasError && (
        <Text className={`text-sm mt-1.5 ${isDark ? "text-surface-500" : "text-surface-500"}`}>
          {helperText}
        </Text>
      )}
    </View>
  );
}

/**
 * FormSection - Groups related form fields with a section header
 */
export function FormSection({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className={`mb-6 ${className}`}>
      {title && (
        <Text
          className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-surface-900"}`}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
