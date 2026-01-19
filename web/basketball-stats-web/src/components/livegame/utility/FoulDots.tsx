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
 */
export const FoulDots: React.FC<FoulDotsProps> = ({
  fouls,
  foulLimit,
  fouledOut = false,
  size = "sm",
}) => {
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: foulLimit }).map((_, i) => {
        const isFilled = i < fouls;
        const isLastFoul = i === foulLimit - 1 && fouls >= foulLimit;

        let colorClass: string;
        if (!isFilled) {
          colorClass = "bg-gray-300 dark:bg-gray-600";
        } else if (fouledOut || isLastFoul) {
          colorClass = "bg-red-600";
        } else if (fouls >= foulLimit - 1) {
          colorClass = "bg-yellow-500";
        } else {
          colorClass = "bg-orange-500";
        }

        return (
          <div key={i} className={`${dotSize} rounded-full ${colorClass} transition-colors`} />
        );
      })}
    </div>
  );
};

export default FoulDots;
