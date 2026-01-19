import React from "react";

interface BonusIndicatorProps {
  inBonus: boolean;
  inDoubleBonus: boolean;
}

/**
 * Badge showing team bonus status (free throws on non-shooting fouls).
 * Single bonus: 4+ team fouls in quarter
 * Double bonus: 9+ team fouls in quarter
 */
export const BonusIndicator: React.FC<BonusIndicatorProps> = ({ inBonus, inDoubleBonus }) => {
  if (!inBonus) return null;

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse ${
        inDoubleBonus ? "bg-red-600 text-white" : "bg-yellow-500 text-black"
      }`}
    >
      {inDoubleBonus ? "2X" : "BONUS"}
    </span>
  );
};

export default BonusIndicator;
