import React from "react";

interface ShotClockProps {
  seconds: number;
  isRunning: boolean;
  isWarning?: boolean;
  isViolation?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Shot clock display with visual warnings at 5 seconds
 * and violation state when reaching 0.
 * Respects light/dark mode with enhanced visual states.
 */
export const ShotClock: React.FC<ShotClockProps> = ({
  seconds,
  isRunning,
  isWarning = false,
  isViolation = false,
  size = "md",
}) => {
  const sizeConfig = {
    sm: { container: "w-8 h-8", text: "text-sm" },
    md: { container: "w-11 h-11", text: "text-lg" },
    lg: { container: "w-14 h-14", text: "text-xl" },
  };

  const config = sizeConfig[size];

  // Determine visual state classes
  const getStateClasses = () => {
    if (isViolation) {
      return {
        bg: "bg-red-100 dark:bg-red-600/30",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-400 dark:border-red-500",
        shadow: "shadow-red-200/50 dark:shadow-red-500/20",
        animation: "animate-pulse",
      };
    }
    if (isWarning) {
      return {
        bg: "bg-amber-100 dark:bg-amber-500/20",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-400 dark:border-amber-500",
        shadow: "shadow-amber-200/50 dark:shadow-amber-500/20",
        animation: isRunning ? "animate-pulse" : "",
      };
    }
    if (isRunning) {
      return {
        bg: "bg-primary-100 dark:bg-primary-600/20",
        text: "text-primary-700 dark:text-primary-400",
        border: "border-primary-400 dark:border-primary-500",
        shadow: "shadow-primary-200/50 dark:shadow-primary-500/10",
        animation: "",
      };
    }
    return {
      bg: "bg-surface-100 dark:bg-surface-700/50",
      text: "text-surface-600 dark:text-surface-400",
      border: "border-surface-300 dark:border-surface-600",
      shadow: "",
      animation: "",
    };
  };

  const state = getStateClasses();

  return (
    <div
      className={`
        ${config.container}
        ${state.bg}
        ${state.text}
        ${state.border}
        ${state.animation}
        rounded-xl font-mono font-black border-2
        flex items-center justify-center
        transition-all duration-200
        ${state.shadow ? `shadow-md ${state.shadow}` : ""}
      `}
    >
      <span className={`${config.text} tabular-nums`}>{seconds}</span>
    </div>
  );
};

export default ShotClock;
