import React from "react";

interface FoulDotsProps {
  fouls: number;
  foulLimit: number;
  fouledOut?: boolean;
  size?: "sm" | "md";
}

/**
 * Visual indicator showing player's current foul count.
 * Dots change color based on foul trouble status.
 * Includes screen reader text for accessibility.
 */
export const FoulDots: React.FC<FoulDotsProps> = ({
  fouls,
  foulLimit,
  fouledOut = false,
  size = "sm",
}) => {
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  // Determine foul trouble status for screen readers
  const getFoulStatus = () => {
    if (fouledOut || fouls >= foulLimit) return "fouled out";
    if (fouls >= foulLimit - 1) return "foul trouble";
    return "";
  };

  const foulStatus = getFoulStatus();
  const srText = `${fouls} of ${foulLimit} fouls${foulStatus ? `, ${foulStatus}` : ""}`;

  return (
    <div className="flex gap-0.5" role="img" aria-label={srText}>
      {Array.from({ length: foulLimit }).map((_, i) => {
        const isFilled = i < fouls;
        const isLastFoul = i === foulLimit - 1 && fouls >= foulLimit;

        let colorClass: string;
        if (!isFilled) {
          colorClass = "bg-surface-300 dark:bg-surface-600";
        } else if (fouledOut || isLastFoul) {
          colorClass = "bg-red-600";
        } else if (fouls >= foulLimit - 1) {
          colorClass = "bg-yellow-500";
        } else {
          colorClass = "bg-primary-500";
        }

        return (
          <div
            key={i}
            className={`${dotSize} rounded-full ${colorClass} transition-colors`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
};

export default FoulDots;
