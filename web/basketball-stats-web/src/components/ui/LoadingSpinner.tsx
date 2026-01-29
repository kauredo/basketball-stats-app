import React from "react";

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Accessible label for screen readers */
  label?: string;
  /** Whether to show in a centered container */
  centered?: boolean;
  /** Height of the container when centered */
  containerHeight?: string;
}

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

/**
 * LoadingSpinner - Accessible loading indicator
 *
 * Features:
 * - Proper ARIA attributes for screen readers
 * - Multiple size variants
 * - Optional centered container
 * - Dark mode support
 */
export function LoadingSpinner({
  size = "md",
  label = "Loading",
  centered = true,
  containerHeight = "h-64",
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-primary-500`}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}...</span>
    </div>
  );

  if (centered) {
    return (
      <div className={`flex justify-center items-center ${containerHeight}`} aria-busy="true">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
