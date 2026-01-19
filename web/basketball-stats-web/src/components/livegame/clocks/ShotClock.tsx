import React from "react";

interface ShotClockProps {
  seconds: number;
  isRunning: boolean;
  isWarning?: boolean;
  isViolation?: boolean;
  size?: "sm" | "md";
}

/**
 * Shot clock display with visual warnings at 5 seconds
 * and violation state when reaching 0.
 */
export const ShotClock: React.FC<ShotClockProps> = ({
  seconds,
  isRunning,
  isWarning = false,
  isViolation = false,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "text-sm w-8 h-8",
    md: "text-lg w-10 h-10",
  };

  // Determine color based on state
  let colorClass = "bg-gray-700 text-gray-300";
  if (isViolation) {
    colorClass = "bg-red-600 text-white animate-pulse";
  } else if (isWarning) {
    colorClass = "bg-yellow-500 text-black animate-pulse";
  } else if (isRunning) {
    colorClass = "bg-orange-600 text-white";
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClass}
        rounded-lg font-mono font-bold
        flex items-center justify-center
        transition-colors
      `}
    >
      {seconds}
    </div>
  );
};

export default ShotClock;
