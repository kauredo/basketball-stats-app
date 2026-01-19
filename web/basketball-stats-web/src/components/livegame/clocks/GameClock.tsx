import React from "react";

interface GameClockProps {
  displayTime: string;
  isRunning: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Game clock display showing minutes:seconds.
 * Visual indication of running state with color coding.
 */
export const GameClock: React.FC<GameClockProps> = ({
  displayTime,
  isRunning,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div
      className={`
        font-mono font-bold tabular-nums
        ${sizeClasses[size]}
        ${isRunning ? "text-white" : "text-gray-400"}
        transition-colors
      `}
    >
      {displayTime}
    </div>
  );
};

export default GameClock;
