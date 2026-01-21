import React from "react";

interface GameClockProps {
  displayTime: string;
  isRunning: boolean;
  size?: "sm" | "md" | "lg";
  lowTimeWarning?: boolean;
}

/**
 * Game clock display showing minutes:seconds.
 * Visual indication of running state with color coding.
 * Respects light/dark mode.
 */
export const GameClock: React.FC<GameClockProps> = ({
  displayTime,
  isRunning,
  size = "md",
  lowTimeWarning = false,
}) => {
  const sizeConfig = {
    sm: { text: "text-lg", padding: "px-2 py-1", gap: "gap-0.5" },
    md: { text: "text-2xl", padding: "px-3 py-1.5", gap: "gap-1" },
    lg: { text: "text-3xl sm:text-4xl", padding: "px-4 py-2", gap: "gap-1" },
  };

  const config = sizeConfig[size];

  // Parse time to separate minutes and seconds
  const [minutes, seconds] = displayTime.split(":");

  // Determine color state
  const getColorClasses = () => {
    if (lowTimeWarning && isRunning) {
      return "text-red-600 dark:text-red-400 animate-pulse";
    }
    if (isRunning) {
      return "text-red-600 dark:text-red-500";
    }
    return "text-surface-900 dark:text-surface-100";
  };

  return (
    <div
      className={`
        inline-flex items-center ${config.gap} ${config.padding}
        rounded-xl
        bg-surface-100/80 dark:bg-surface-800/60
        border border-surface-200 dark:border-surface-700
        transition-all duration-200
      `}
      role="timer"
      aria-live={lowTimeWarning ? "assertive" : "off"}
      aria-label={`Game clock: ${displayTime}${isRunning ? ", running" : ", stopped"}`}
    >
      {/* Minutes */}
      <span
        className={`
          font-mono font-black tabular-nums tracking-wider
          ${config.text}
          ${getColorClasses()}
          transition-colors duration-200
        `}
        aria-hidden="true"
      >
        {minutes}
      </span>

      {/* Separator */}
      <span
        className={`
          font-mono font-black
          ${config.text}
          ${
            isRunning
              ? "text-red-400 dark:text-red-500 animate-pulse"
              : "text-surface-500 dark:text-surface-500"
          }
          transition-colors duration-200
        `}
        aria-hidden="true"
      >
        :
      </span>

      {/* Seconds */}
      <span
        className={`
          font-mono font-black tabular-nums tracking-wider
          ${config.text}
          ${getColorClasses()}
          transition-colors duration-200
        `}
        aria-hidden="true"
      >
        {seconds}
      </span>
    </div>
  );
};

export default GameClock;
