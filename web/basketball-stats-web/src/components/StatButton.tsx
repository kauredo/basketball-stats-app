import React from "react";
import { COLORS, TOUCH_TARGETS } from "@basketball-stats/shared";

interface StatButtonProps {
  label: string;
  shortLabel?: string;
  color?: string;
  onClick: () => void;
  disabled?: boolean;
  size?: "small" | "normal" | "large";
  variant?: "filled" | "outlined";
  icon?: React.ReactNode;
  className?: string;
}

const StatButton: React.FC<StatButtonProps> = ({
  label,
  shortLabel,
  color = COLORS.primary[500],
  onClick,
  disabled = false,
  size = "normal",
  variant = "filled",
  icon,
  className = "",
}) => {
  const sizeClasses = {
    small: "py-2 px-3 text-sm",
    normal: "py-3 px-4",
    large: "py-4 px-5 text-lg",
  };

  const baseClasses = `
    flex flex-col items-center justify-center
    rounded-xl font-bold
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
    ${sizeClasses[size]}
    ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95 cursor-pointer"}
  `;

  const variantStyles =
    variant === "filled"
      ? { backgroundColor: disabled ? "#374151" : color }
      : { border: `2px solid ${disabled ? "#374151" : color}`, backgroundColor: "transparent" };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
      style={{
        ...variantStyles,
        minWidth: TOUCH_TARGETS.minimum,
        minHeight: TOUCH_TARGETS.minimum,
      }}
    >
      {icon && <div className="mb-1">{icon}</div>}
      <span className="text-white">{label}</span>
      {shortLabel && <span className="text-white/70 text-xs mt-0.5">{shortLabel}</span>}
    </button>
  );
};

// Preset stat buttons for common use cases
export const ScoringButton: React.FC<{
  type: "2pt" | "3pt" | "ft" | "miss";
  onClick: () => void;
  disabled?: boolean;
}> = ({ type, onClick, disabled }) => {
  const config = {
    "2pt": { label: "2PT", shortLabel: "+2", color: COLORS.shots.made2pt },
    "3pt": { label: "3PT", shortLabel: "+3", color: COLORS.shots.made3pt },
    ft: { label: "FT", shortLabel: "+1", color: COLORS.shots.freeThrowMade },
    miss: { label: "MISS", shortLabel: "×", color: COLORS.shots.missed2pt },
  }[type];

  return <StatButton {...config} onClick={onClick} disabled={disabled} size="large" />;
};

export const DefenseButton: React.FC<{
  type: "steal" | "block" | "rebound";
  onClick: () => void;
  disabled?: boolean;
}> = ({ type, onClick, disabled }) => {
  const config = {
    steal: { label: "STL", shortLabel: "+S", color: COLORS.statButtons.defense },
    block: { label: "BLK", shortLabel: "+B", color: COLORS.statButtons.defense },
    rebound: { label: "REB", shortLabel: "+R", color: COLORS.statButtons.rebounding },
  }[type];

  return <StatButton {...config} onClick={onClick} disabled={disabled} />;
};

export const NegativeButton: React.FC<{
  type: "turnover" | "foul";
  onClick: () => void;
  disabled?: boolean;
}> = ({ type, onClick, disabled }) => {
  const config = {
    turnover: { label: "TO", shortLabel: "+T", color: COLORS.statButtons.negative },
    foul: { label: "FOUL", shortLabel: "+F", color: COLORS.statButtons.negative },
  }[type];

  return <StatButton {...config} onClick={onClick} disabled={disabled} />;
};

export default StatButton;
