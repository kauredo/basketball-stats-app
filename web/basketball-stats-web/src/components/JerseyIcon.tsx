import React from "react";

export interface JerseyIconProps {
  /** Jersey number to display */
  number: number;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Display style - filled or outline only */
  variant?: "filled" | "outline";
  /** Primary jersey color */
  color?: string;
  /** Text/number color (defaults to white for filled, color for outline) */
  textColor?: string;
  /** Whether player has fouled out */
  fouledOut?: boolean;
  /** Current foul count for indicator bar */
  fouls?: number;
  /** Foul limit for the game */
  foulLimit?: number;
  /** Additional CSS classes */
  className?: string;
}

const SIZES = {
  xs: { width: 24, height: 28 },
  sm: { width: 36, height: 42 },
  md: { width: 48, height: 56 },
  lg: { width: 64, height: 74 },
  xl: { width: 80, height: 92 },
};

/**
 * Sleeveless basketball jersey icon with player number.
 *
 * Features:
 * - Classic basketball jersey silhouette
 * - Side stripes detail
 * - Optional foul indicator dots
 * - Fouled-out state with X overlay
 *
 * @example
 * ```tsx
 * // Basic usage
 * <JerseyIcon number={23} color="#f97316" />
 *
 * // With foul tracking
 * <JerseyIcon number={23} color="#3b82f6" fouls={3} foulLimit={5} />
 *
 * // Outline variant
 * <JerseyIcon number={23} variant="outline" color="#f97316" />
 * ```
 */
export const JerseyIcon: React.FC<JerseyIconProps> = ({
  number,
  size = "md",
  variant = "filled",
  color = "#3b82f6",
  textColor,
  fouledOut = false,
  fouls = 0,
  foulLimit = 5,
  className = "",
}) => {
  const { width, height } = SIZES[size];

  // Default text color based on variant
  const resolvedTextColor = textColor ?? (variant === "filled" ? "#ffffff" : color);

  // Jersey colors based on variant
  const jerseyColors = {
    body: variant === "filled" ? color : "transparent",
    stroke: color,
    stripe: variant === "filled" ? resolvedTextColor : color,
  };

  // Foul dot color based on count
  const getFoulDotColor = (index: number) => {
    if (index >= fouls) return "transparent";
    const intensity = fouls / foulLimit;
    if (intensity >= 0.8) return "#ef4444"; // red - danger
    if (intensity >= 0.6) return "#f59e0b"; // amber - warning
    return "#fbbf24"; // yellow - caution
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-all duration-300 ${fouledOut ? "opacity-50 grayscale" : ""} ${className}`}
      aria-label={`Jersey number ${number}${fouledOut ? ", fouled out" : ""}`}
    >
      {/* Jersey Body - Main shape */}
      <path
        style={{
          fill: jerseyColors.body,
          stroke: jerseyColors.stroke,
          strokeWidth: variant === "outline" ? 12 : 0,
        }}
        d={`
          M399.726,83.757c-3.346-22.65-4.432-44.455-3.55-64.382C396.644,8.792,388.081,0,377.488,0h-33.574
          c-8.743,0-16.456,6.03-18.24,14.588C318.943,46.897,290.307,71.17,256,71.17s-62.945-24.273-69.676-56.583
          C184.542,6.03,176.829,0,168.086,0h-33.574c-10.593,0-19.156,8.792-18.689,19.375c0.883,19.927-0.204,41.733-3.55,64.382
          c-5.317,35.986-15.474,68.29-28.167,93.25v316.291c0,10.329,8.373,18.702,18.702,18.702H256h153.192
          c10.329,0,18.702-8.373,18.702-18.702V177.007C415.2,152.047,405.043,119.743,399.726,83.757z
        `}
      />

      {/* Left stripe */}
      <path
        style={{ fill: jerseyColors.stripe }}
        d={`
          M84.106,400.628v56.106h67.11c15.493,0,28.053-12.56,28.053-28.053
          s-12.56-28.053-28.053-28.053H84.106z
        `}
      />

      {/* Right stripe */}
      <path
        style={{ fill: jerseyColors.stripe }}
        d={`
          M427.893,456.734v-56.106h-67.11c-15.493,0-28.053,12.56-28.053,28.053
          s12.56,28.053,28.053,28.053H427.893z
        `}
      />

      {/* Jersey Number */}
      <text
        x="256"
        y="280"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={resolvedTextColor}
        fontSize="160"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        className="select-none"
      >
        {number}
      </text>

      {/* Foul indicator dots - displayed below the stripes */}

      <g>
        {Array.from({ length: foulLimit }).map((_, i) => (
          <circle
            key={i}
            cx={256 - ((foulLimit - 1) * 48) / 2 + i * 48}
            cy="512"
            r="20"
            fill={getFoulDotColor(i)}
            stroke={"black"}
            strokeWidth="3"
            opacity={i < fouls ? 1 : 0.5}
            className="transition-all duration-300"
          />
        ))}
      </g>

      {/* Fouled out X overlay */}
      {fouledOut && (
        <g>
          {/* Red X */}
          <line
            x1="30"
            y1="30"
            x2="480"
            y2="480"
            stroke="#dc2626"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <line
            x1="480"
            y1="30"
            x2="30"
            y2="480"
            stroke="#dc2626"
            strokeWidth="32"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
};

export default JerseyIcon;
