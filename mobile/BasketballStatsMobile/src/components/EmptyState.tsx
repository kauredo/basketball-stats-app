import React from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { COLORS } from "@basketball-stats/shared";
import Icon, { type IconName } from "./Icon";

interface EmptyStateProps {
  /** Icon to display (from Icon component) */
  icon: IconName;
  /** Main title text */
  title: string;
  /** Description text below the title */
  description?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** Callback when action button is pressed */
  onAction?: () => void;
  /** Secondary action button label */
  secondaryActionLabel?: string;
  /** Callback when secondary action is pressed */
  onSecondaryAction?: () => void;
  /** Custom icon color (defaults to primary orange) */
  iconColor?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * EmptyState - A consistent empty state component
 *
 * Use when there's no data to display, such as:
 * - Empty lists (no games, no teams, no players)
 * - No search results
 * - First-time user states
 *
 * Features:
 * - Branded icon in circular container
 * - Clear messaging with title and description
 * - Optional action button to guide users
 * - Theme-aware styling
 *
 * @example
 * <EmptyState
 *   icon="basketball"
 *   title="No games yet"
 *   description="Create your first game to start tracking statistics"
 *   actionLabel="Create Game"
 *   onAction={() => navigation.navigate("CreateGame")}
 * />
 */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  iconColor = COLORS.primary[500],
  size = "md",
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Size configurations
  const sizeConfig = {
    sm: {
      iconContainer: "w-14 h-14",
      iconSize: 28,
      titleSize: "text-base",
      descSize: "text-sm",
      padding: "py-6 px-4",
      buttonPadding: "px-4 py-2",
    },
    md: {
      iconContainer: "w-20 h-20",
      iconSize: 40,
      titleSize: "text-lg",
      descSize: "text-sm",
      padding: "py-12 px-6",
      buttonPadding: "px-6 py-3",
    },
    lg: {
      iconContainer: "w-24 h-24",
      iconSize: 48,
      titleSize: "text-xl",
      descSize: "text-base",
      padding: "py-16 px-8",
      buttonPadding: "px-8 py-4",
    },
  };

  const config = sizeConfig[size];

  return (
    <View className={`items-center justify-center ${config.padding}`}>
      {/* Icon Container */}
      <View
        className={`${config.iconContainer} rounded-full items-center justify-center mb-4 ${
          isDark ? "bg-surface-800" : "bg-surface-100"
        }`}
      >
        <Icon name={icon} size={config.iconSize} color={iconColor} />
      </View>

      {/* Title */}
      <Text
        className={`${config.titleSize} font-bold mb-2 text-center ${
          isDark ? "text-white" : "text-surface-900"
        }`}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          className={`${config.descSize} text-center leading-5 mb-6 max-w-[280px] ${
            isDark ? "text-surface-400" : "text-surface-600"
          }`}
        >
          {description}
        </Text>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <View className="flex-row gap-3">
          {secondaryActionLabel && onSecondaryAction && (
            <TouchableOpacity
              className={`${config.buttonPadding} rounded-xl border ${
                isDark ? "border-surface-600" : "border-surface-300"
              }`}
              onPress={onSecondaryAction}
              activeOpacity={0.7}
            >
              <Text className={`font-medium ${isDark ? "text-surface-300" : "text-surface-700"}`}>
                {secondaryActionLabel}
              </Text>
            </TouchableOpacity>
          )}

          {actionLabel && onAction && (
            <TouchableOpacity
              className={`bg-primary-500 ${config.buttonPadding} rounded-xl`}
              onPress={onAction}
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold">{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * NoSearchResults - Specialized empty state for search
 */
export function NoSearchResults({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}"`}
      actionLabel={onClear ? "Clear Search" : undefined}
      onAction={onClear}
      size="sm"
    />
  );
}

/**
 * NetworkError - Specialized empty state for network errors
 */
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="wifi-off"
      title="Connection Error"
      description="Please check your internet connection and try again"
      actionLabel={onRetry ? "Retry" : undefined}
      onAction={onRetry}
      iconColor="#dc2626"
    />
  );
}
