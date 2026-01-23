import React, { forwardRef } from "react";
import type { ShotLocation } from "../../types/livegame";

// ============================================================================
// Constants (same as InteractiveCourt for consistency)
// ============================================================================

const COURT_WIDTH = 300;
const COURT_HEIGHT = 282;
const BASKET_Y = 31.5;
const BASKET_X = 150;
const THREE_PT_RADIUS = 142.5;
const PAINT_WIDTH = 96;
const PAINT_HEIGHT = 114;
const FT_CIRCLE_RADIUS = 36;
const RESTRICTED_RADIUS = 24;
const CORNER_THREE_X = 18;

// Court colors for light and dark themes
const COURT_COLORS = {
  light: {
    background: "#d4a574",
    backgroundDarker: "#c49464",
    lines: "#ffffff",
    paint: "rgba(234, 88, 12, 0.15)",
    rim: "#ea580c",
    backboard: "#94a3b8",
    text: "rgba(255,255,255,0.8)",
  },
  dark: {
    background: "#78716c",
    backgroundDarker: "#57534e",
    lines: "rgba(255, 255, 255, 0.9)",
    paint: "rgba(249, 115, 22, 0.2)",
    rim: "#f97316",
    backboard: "#64748b",
    text: "rgba(255,255,255,0.7)",
  },
  shotMade: "#22c55e",
  shotMissed: "#ef4444",
  shot3pt: "#8b5cf6",
};

// ============================================================================
// Helper Functions
// ============================================================================

const courtToSvg = (courtX: number, courtY: number) => ({
  x: BASKET_X + courtX * 6,
  y: BASKET_Y + courtY * 6,
});

function getZoneKey(x: number, y: number, is3pt: boolean): string {
  if (is3pt) {
    if (Math.abs(x) > 20 && y < 14) {
      return x > 0 ? "rightCorner3" : "leftCorner3";
    } else if (Math.abs(x) > 12) {
      return x > 0 ? "rightWing3" : "leftWing3";
    }
    return "topKey3";
  } else {
    const dist = Math.sqrt(x * x + y * y);
    if (dist < 10) return "paint";
    if (x > 8) return "rightElbow";
    if (x < -8) return "leftElbow";
    return "midRange";
  }
}

interface ZoneStats {
  made: number;
  total: number;
  percentage: number;
}

function calculateZoneStats(shots: ShotLocation[]): Record<string, ZoneStats> {
  const zones: Record<string, ZoneStats> = {
    paint: { made: 0, total: 0, percentage: 0 },
    leftElbow: { made: 0, total: 0, percentage: 0 },
    rightElbow: { made: 0, total: 0, percentage: 0 },
    midRange: { made: 0, total: 0, percentage: 0 },
    leftCorner3: { made: 0, total: 0, percentage: 0 },
    rightCorner3: { made: 0, total: 0, percentage: 0 },
    leftWing3: { made: 0, total: 0, percentage: 0 },
    rightWing3: { made: 0, total: 0, percentage: 0 },
    topKey3: { made: 0, total: 0, percentage: 0 },
  };

  shots.forEach((shot) => {
    const zone = getZoneKey(shot.x, shot.y, shot.is3pt ?? false);
    if (zones[zone]) {
      zones[zone].total++;
      if (shot.made) zones[zone].made++;
    }
  });

  Object.values(zones).forEach((z) => {
    z.percentage = z.total > 0 ? Math.round((z.made / z.total) * 100) : 0;
  });

  return zones;
}

// ============================================================================
// Heat Map Zone Component
// ============================================================================

interface HeatMapZoneProps {
  zone: string;
  stats: ZoneStats;
}

const HeatMapZone: React.FC<HeatMapZoneProps> = ({ zone, stats }) => {
  if (stats.total === 0) return null;

  const getColor = (pct: number) => {
    if (pct >= 50) return "rgba(34, 197, 94, 0.5)";
    if (pct >= 40) return "rgba(234, 179, 8, 0.5)";
    if (pct >= 30) return "rgba(249, 115, 22, 0.5)";
    return "rgba(239, 68, 68, 0.5)";
  };

  const zoneCoords: Record<string, { x: number; y: number; w: number; h: number }> = {
    paint: { x: 102, y: 0, w: 96, h: 114 },
    leftElbow: { x: 18, y: 50, w: 84, h: 64 },
    rightElbow: { x: 198, y: 50, w: 84, h: 64 },
    midRange: { x: 102, y: 114, w: 96, h: 60 },
    leftCorner3: { x: 0, y: 0, w: 18, h: 100 },
    rightCorner3: { x: 282, y: 0, w: 18, h: 100 },
    leftWing3: { x: 0, y: 100, w: 100, h: 120 },
    rightWing3: { x: 200, y: 100, w: 100, h: 120 },
    topKey3: { x: 80, y: 174, w: 140, h: 108 },
  };

  const coords = zoneCoords[zone];
  if (!coords) return null;

  return (
    <rect
      x={coords.x}
      y={coords.y}
      width={coords.w}
      height={coords.h}
      fill={getColor(stats.percentage)}
      rx="4"
    />
  );
};

// ============================================================================
// Types
// ============================================================================

interface PrintableShotChartProps {
  shots: ShotLocation[];
  theme?: "light" | "dark";
  showHeatMap?: boolean;
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PrintableShotChart - Static, print-optimized shot chart for PDF export
 *
 * Key differences from InteractiveCourt:
 * - No animations or click handlers
 * - Explicit theme prop (doesn't read from DOM)
 * - Ref forwarding for html2canvas capture
 * - Thicker strokes for print clarity
 * - Optional title and subtitle
 */
export const PrintableShotChart = forwardRef<HTMLDivElement, PrintableShotChartProps>(
  (
    { shots, theme = "light", showHeatMap = false, title, subtitle, width = 300, height = 282 },
    ref
  ) => {
    const colors = theme === "dark" ? COURT_COLORS.dark : COURT_COLORS.light;
    const zoneStats = showHeatMap && shots.length > 0 ? calculateZoneStats(shots) : null;

    // Thicker stroke widths for print clarity
    const strokeWidth = {
      line: 2.5,
      court: 3,
      rim: 3,
    };

    return (
      <div
        ref={ref}
        style={{
          width,
          height: height + (title ? 40 : 0) + (subtitle ? 20 : 0),
          backgroundColor: theme === "dark" ? "#3d3835" : "#fdfcfb", // surface-800 / surface-50 (warm neutrals)
          padding: "16px",
          borderRadius: "8px",
        }}
      >
        {/* Title */}
        {title && (
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: theme === "dark" ? "#f9f7f5" : "#252220", // surface-100 / surface-900 (warm neutrals)
              marginBottom: subtitle ? "4px" : "12px",
              textAlign: "center",
            }}
          >
            {title}
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: "11px",
              color: theme === "dark" ? "#a69f96" : "#7a746c", // surface-500 / surface-600 (warm neutrals)
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Court SVG */}
        <svg
          viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
          style={{
            width: "100%",
            height: "auto",
            maxWidth: width - 32,
          }}
        >
          {/* Definitions */}
          <defs>
            <linearGradient id={`courtGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.background} />
              <stop offset="50%" stopColor={colors.backgroundDarker} />
              <stop offset="100%" stopColor={colors.background} />
            </linearGradient>
            <pattern id="woodGrainPrint" patternUnits="userSpaceOnUse" width="100" height="4">
              <line x1="0" y1="2" x2="100" y2="2" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Court background */}
          <rect
            x="0"
            y="0"
            width={COURT_WIDTH}
            height={COURT_HEIGHT}
            fill={`url(#courtGradient-${theme})`}
            rx="8"
          />

          {/* Wood grain (light mode only) */}
          {theme === "light" && (
            <rect
              x="0"
              y="0"
              width={COURT_WIDTH}
              height={COURT_HEIGHT}
              fill="url(#woodGrainPrint)"
              rx="8"
            />
          )}

          {/* Court border */}
          <rect
            x="0"
            y="0"
            width={COURT_WIDTH}
            height={COURT_HEIGHT}
            fill="none"
            stroke={theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
            strokeWidth="2"
            rx="8"
          />

          {/* Heat map zones */}
          {showHeatMap && zoneStats && (
            <g opacity="0.6">
              {Object.entries(zoneStats).map(([zone, stats]) => (
                <HeatMapZone key={zone} zone={zone} stats={stats} />
              ))}
            </g>
          )}

          {/* Paint area */}
          <rect
            x={(COURT_WIDTH - PAINT_WIDTH) / 2}
            y="0"
            width={PAINT_WIDTH}
            height={PAINT_HEIGHT}
            fill={colors.paint}
            stroke={colors.lines}
            strokeWidth={strokeWidth.line}
            rx="2"
          />

          {/* Baseline */}
          <line
            x1="0"
            y1="2"
            x2={COURT_WIDTH}
            y2="2"
            stroke={colors.lines}
            strokeWidth={strokeWidth.court + 1}
          />

          {/* Three-point line */}
          <path
            d={`M ${CORNER_THREE_X} 0
                L ${CORNER_THREE_X} ${BASKET_Y + Math.sqrt(THREE_PT_RADIUS * THREE_PT_RADIUS - (BASKET_X - CORNER_THREE_X) * (BASKET_X - CORNER_THREE_X))}
                A ${THREE_PT_RADIUS} ${THREE_PT_RADIUS} 0 0 0 ${COURT_WIDTH - CORNER_THREE_X} ${BASKET_Y + Math.sqrt(THREE_PT_RADIUS * THREE_PT_RADIUS - (BASKET_X - CORNER_THREE_X) * (BASKET_X - CORNER_THREE_X))}
                L ${COURT_WIDTH - CORNER_THREE_X} 0`}
            fill="none"
            stroke={colors.lines}
            strokeWidth={strokeWidth.line}
          />

          {/* Free throw circle */}
          <circle
            cx={BASKET_X}
            cy={PAINT_HEIGHT}
            r={FT_CIRCLE_RADIUS}
            fill="none"
            stroke={colors.lines}
            strokeWidth={strokeWidth.line}
          />

          {/* Restricted area arc */}
          <path
            d={`M ${BASKET_X - RESTRICTED_RADIUS} 0 A ${RESTRICTED_RADIUS} ${RESTRICTED_RADIUS} 0 0 0 ${BASKET_X + RESTRICTED_RADIUS} 0`}
            fill="none"
            stroke={colors.lines}
            strokeWidth={strokeWidth.line}
          />

          {/* Rim */}
          <circle
            cx={BASKET_X}
            cy={BASKET_Y}
            r="6"
            fill="none"
            stroke={colors.rim}
            strokeWidth={strokeWidth.rim}
          />
          <circle cx={BASKET_X} cy={BASKET_Y} r="2" fill={colors.rim} />

          {/* Shot markers */}
          {shots.map((shot, index) => {
            const { x: svgX, y: svgY } = courtToSvg(shot.x, shot.y);
            const is3pt = shot.is3pt;
            const shotColor = shot.made
              ? is3pt
                ? COURT_COLORS.shot3pt
                : COURT_COLORS.shotMade
              : COURT_COLORS.shotMissed;

            return (
              <g key={index}>
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={6}
                  fill={shotColor}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2}
                />
                {!shot.made && (
                  <text
                    x={svgX}
                    y={svgY + 4}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={9}
                    fontWeight="bold"
                  >
                    X
                  </text>
                )}
                {shot.made && is3pt && (
                  <text
                    x={svgX}
                    y={svgY + 4}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={7}
                    fontWeight="bold"
                  >
                    3
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }
);

PrintableShotChart.displayName = "PrintableShotChart";

export default PrintableShotChart;
