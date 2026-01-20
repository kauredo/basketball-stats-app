import React from "react";

interface TimeoutDotsProps {
  remaining: number;
  total: number;
  teamSide?: "left" | "right";
  onTimeoutClick?: () => void;
  disabled?: boolean;
}

/**
 * Visual indicator showing team's remaining timeouts.
 * Optionally clickable to call a timeout.
 */
export const TimeoutDots: React.FC<TimeoutDotsProps> = ({
  remaining,
  total,
  teamSide = "left",
  onTimeoutClick,
  disabled = false,
}) => {
  const srText = `${remaining} of ${total} timeouts remaining`;

  const dots = (
    <div
      className={`flex gap-1 ${teamSide === "right" ? "flex-row-reverse" : ""}`}
      role="img"
      aria-label={srText}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i < remaining ? "bg-orange-500" : "bg-gray-400 dark:bg-gray-600"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );

  if (onTimeoutClick && !disabled) {
    return (
      <button
        onClick={onTimeoutClick}
        className="flex items-center gap-1 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
        aria-label={`Call timeout. ${srText}`}
      >
        {dots}
      </button>
    );
  }

  return dots;
};

export default TimeoutDots;
