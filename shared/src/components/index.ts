// Shared UI Component Utilities
// Export all component utilities for consistent styling across platforms

export * from "./Button";
export * from "./Card";
export * from "./Input";
export * from "./Layout";
export * from "./Modal";

// Common utility classes that work across platforms
export const commonStyles = {
  // Text utilities
  text: {
    primary: "text-primary-500",
    secondary: "text-gray-600 dark:text-gray-400",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
    muted: "text-gray-500 dark:text-gray-500",
  },

  // Background utilities
  bg: {
    primary: "bg-primary-500",
    secondary: "bg-gray-100 dark:bg-dark-800",
    success: "bg-green-50 dark:bg-green-900/20",
    warning: "bg-yellow-50 dark:bg-yellow-900/20",
    danger: "bg-red-50 dark:bg-red-900/20",
    surface: "bg-white dark:bg-dark-800",
    overlay: "bg-black/50",
  },

  // Border utilities
  border: {
    default: "border-gray-200 dark:border-dark-700",
    primary: "border-primary-500",
    success: "border-green-500",
    warning: "border-yellow-500",
    danger: "border-red-500",
  },

  // Shadow utilities
  shadow: {
    sm: "shadow-sm",
    default: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  },

  // Spacing utilities (consistent across platforms)
  spacing: {
    xs: "p-2",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  },

  // Flexbox utilities
  flex: {
    center: "flex items-center justify-center",
    between: "flex items-center justify-between",
    start: "flex items-center justify-start",
    end: "flex items-center justify-end",
    col: "flex flex-col",
    colCenter: "flex flex-col items-center justify-center",
  },

  // Transition utilities
  transition: {
    default: "transition-colors duration-200",
    all: "transition-all duration-200",
    transform: "transition-transform duration-200",
  },
};

// Platform-specific utilities
export const getResponsiveClasses = (...classes: string[]) => {
  return classes.join(" ");
};

// Basketball-themed color utilities
export const basketballColors = {
  court: {
    light: "bg-court-500",
    dark: "bg-court-700",
  },
  basketball: {
    orange: "text-primary-500",
    darkOrange: "text-primary-700",
  },
  team: {
    home: "text-blue-500",
    away: "text-red-500",
  },
  stats: {
    positive: "text-green-500",
    negative: "text-red-500",
    neutral: "text-gray-500",
  },
};

// Animation utilities
export const animations = {
  fadeIn: "animate-fade-in",
  slideIn: "animate-slide-in",
  bounce: "animate-bounce-ball",
  spin: "animate-spin",
  pulse: "animate-pulse",
};
