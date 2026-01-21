import React, { useRef, useState, useCallback, useEffect } from "react";
import { ShotLocation } from "../../../types/livegame";

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for dark class on html element (Tailwind's dark mode)
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
};

// ============================================================================
// Constants
// ============================================================================

// Court dimensions (based on real proportions)
// Half court is 47ft long x 50ft wide
// We use viewBox 0 0 300 282 (300px = 50ft, so 6px per foot)
const COURT_WIDTH = 300;
const COURT_HEIGHT = 282; // 47ft * 6px/ft
const BASKET_Y = 31.5; // 5.25ft from baseline
const BASKET_X = 150; // center
const THREE_PT_RADIUS = 142.5; // 23.75ft * 6px/ft
const PAINT_WIDTH = 96; // 16ft * 6px/ft
const PAINT_HEIGHT = 114; // 19ft (to free throw line) * 6px/ft
const FT_CIRCLE_RADIUS = 36; // 6ft * 6px/ft
const RESTRICTED_RADIUS = 24; // 4ft * 6px/ft
const CORNER_THREE_X = 18; // 3ft from sideline * 6px/ft

// Court colors for light and dark modes
const COURT_COLORS = {
  // Light mode - classic hardwood court
  light: {
    background: "#d4a574", // Warm hardwood
    backgroundDarker: "#c49464",
    lines: "#ffffff",
    paint: "rgba(234, 88, 12, 0.15)", // Subtle orange tint
    rim: "#ea580c",
    backboard: "#94a3b8",
  },
  // Dark mode - darker court surface
  dark: {
    background: "#78716c", // Stone/gray court
    backgroundDarker: "#57534e",
    lines: "rgba(255, 255, 255, 0.9)",
    paint: "rgba(249, 115, 22, 0.2)",
    rim: "#f97316",
    backboard: "#64748b",
  },
  // Shared colors
  shotMade: "#22c55e",
  shotMissed: "#ef4444",
  shot3pt: "#8b5cf6",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine shot zone name from court coordinates (in feet)
 */
export const getShotZoneName = (x: number, y: number, is3pt: boolean): string => {
  if (is3pt) {
    if (Math.abs(x) > 20 && y < 14) {
      return x > 0 ? "Right Corner 3" : "Left Corner 3";
    } else if (Math.abs(x) > 12) {
      return x > 0 ? "Right Wing 3" : "Left Wing 3";
    } else {
      return "Top of Key 3";
    }
  } else {
    const distanceFromBasket = Math.sqrt(x * x + y * y);
    if (distanceFromBasket < 4) {
      return "At Rim";
    } else if (y < 8 && distanceFromBasket < 10) {
      return "Paint";
    } else if (Math.abs(x) > 12) {
      return x > 0 ? "Right Elbow" : "Left Elbow";
    } else if (y > 15) {
      return "Free Throw Line";
    } else {
      return "Mid-Range";
    }
  }
};

/**
 * Convert court coordinates (feet) to SVG coordinates
 */
const courtToSvg = (courtX: number, courtY: number) => ({
  x: BASKET_X + courtX * 6,
  y: BASKET_Y + courtY * 6,
});

// ============================================================================
// Types
// ============================================================================

interface InteractiveCourtProps {
  onCourtClick?: (x: number, y: number, is3pt: boolean, zoneName: string) => void;
  disabled?: boolean;
  recentShots?: ShotLocation[];
  showHeatMap?: boolean;
  allShots?: ShotLocation[];
  compact?: boolean;
  displayMode?: "recent" | "all"; // "recent" shows last 8, "all" shows all shots
}

// ============================================================================
// Component
// ============================================================================

export const InteractiveCourt: React.FC<InteractiveCourtProps> = ({
  onCourtClick,
  disabled = false,
  recentShots = [],
  showHeatMap = false,
  allShots = [],
  compact = false,
  displayMode = "recent",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const isDarkMode = useDarkMode();

  // Select colors based on theme
  const colors = isDarkMode ? COURT_COLORS.dark : COURT_COLORS.light;

  const handleClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || !svgRef.current || !onCourtClick) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const scaleX = COURT_WIDTH / rect.width;
      const scaleY = COURT_HEIGHT / rect.height;

      const svgX = (event.clientX - rect.left) * scaleX;
      const svgY = (event.clientY - rect.top) * scaleY;

      // Convert to court coordinates (feet, origin at basket)
      const courtX = (svgX - BASKET_X) / 6;
      const courtY = (svgY - BASKET_Y) / 6;

      // Determine if it's a 3-pointer
      const distanceFromBasket = Math.sqrt(courtX * courtX + courtY * courtY);
      // Corner 3s: beyond 22ft from sideline (3ft from corner) and within 14ft from baseline
      const isCorner3 = Math.abs(courtX) > 22 && courtY < 14;
      const is3pt = distanceFromBasket > 23.75 || isCorner3;

      // Get zone name
      const zoneName = getShotZoneName(courtX, courtY, is3pt);

      // Show ripple effect
      setRipple({ x: svgX, y: svgY });
      setTimeout(() => setRipple(null), 400);

      onCourtClick(courtX, courtY, is3pt, zoneName);
    },
    [disabled, onCourtClick]
  );

  // Calculate heat map zones if enabled
  const zoneStats = showHeatMap && allShots.length > 0 ? calculateZoneStats(allShots) : null;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
        className={`max-w-full max-h-full w-auto h-auto transition-all ${
          disabled ? "opacity-50 cursor-not-allowed" : onCourtClick ? "cursor-crosshair" : ""
        }`}
        onClick={handleClick}
        style={{ aspectRatio: `${COURT_WIDTH}/${COURT_HEIGHT}` }}
        role={onCourtClick ? "application" : "img"}
        aria-label={
          onCourtClick
            ? "Interactive basketball court. Tap to record a shot location."
            : "Basketball court shot chart"
        }
        aria-describedby={showHeatMap ? "court-heatmap-desc" : undefined}
      >
        {showHeatMap && (
          <desc id="court-heatmap-desc">
            Heat map showing shooting percentages by zone. Green indicates high percentage zones,
            yellow indicates medium, and red indicates low percentage zones.
          </desc>
        )}
        {/* Definitions for gradients */}
        <defs>
          <linearGradient id="courtGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4a574" />
            <stop offset="50%" stopColor="#c9976a" />
            <stop offset="100%" stopColor="#d4a574" />
          </linearGradient>
          <linearGradient id="courtGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78716c" />
            <stop offset="50%" stopColor="#6b6560" />
            <stop offset="100%" stopColor="#78716c" />
          </linearGradient>
          {/* Wood grain pattern for light mode */}
          <pattern id="woodGrain" patternUnits="userSpaceOnUse" width="100" height="4">
            <line x1="0" y1="2" x2="100" y2="2" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Court background */}
        <rect
          x="0"
          y="0"
          width={COURT_WIDTH}
          height={COURT_HEIGHT}
          fill={isDarkMode ? "url(#courtGradientDark)" : "url(#courtGradientLight)"}
          rx="8"
        />

        {/* Wood grain overlay (light mode only) */}
        {!isDarkMode && (
          <rect
            x="0"
            y="0"
            width={COURT_WIDTH}
            height={COURT_HEIGHT}
            fill="url(#woodGrain)"
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
          stroke={isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
          strokeWidth="2"
          rx="8"
        />

        {/* Heat map zones (if enabled) */}
        {showHeatMap && zoneStats && (
          <g opacity="0.6">
            {Object.entries(zoneStats).map(([zone, stats]) => (
              <HeatMapZone key={zone} zone={zone} stats={stats} />
            ))}
          </g>
        )}

        {/* Paint area (key) */}
        <rect
          x={(COURT_WIDTH - PAINT_WIDTH) / 2}
          y="0"
          width={PAINT_WIDTH}
          height={PAINT_HEIGHT}
          fill={colors.paint}
          stroke={colors.lines}
          strokeWidth="2"
          rx="2"
        />

        {/* Baseline */}
        <line x1="0" y1="2" x2={COURT_WIDTH} y2="2" stroke={colors.lines} strokeWidth="4" />

        {/* Three-point line */}
        <path
          d={`M ${CORNER_THREE_X} 0
              L ${CORNER_THREE_X} ${BASKET_Y + Math.sqrt(THREE_PT_RADIUS * THREE_PT_RADIUS - (BASKET_X - CORNER_THREE_X) * (BASKET_X - CORNER_THREE_X))}
              A ${THREE_PT_RADIUS} ${THREE_PT_RADIUS} 0 0 0 ${COURT_WIDTH - CORNER_THREE_X} ${BASKET_Y + Math.sqrt(THREE_PT_RADIUS * THREE_PT_RADIUS - (BASKET_X - CORNER_THREE_X) * (BASKET_X - CORNER_THREE_X))}
              L ${COURT_WIDTH - CORNER_THREE_X} 0`}
          fill="none"
          stroke={colors.lines}
          strokeWidth="2"
        />

        {/* Free throw circle */}
        <circle
          cx={BASKET_X}
          cy={PAINT_HEIGHT}
          r={FT_CIRCLE_RADIUS}
          fill="none"
          stroke={colors.lines}
          strokeWidth="2"
        />

        {/* Restricted area arc */}
        <path
          d={`M ${BASKET_X - RESTRICTED_RADIUS} 0 A ${RESTRICTED_RADIUS} ${RESTRICTED_RADIUS} 0 0 0 ${BASKET_X + RESTRICTED_RADIUS} 0`}
          fill="none"
          stroke={colors.lines}
          strokeWidth="2"
        />

        {/* Rim */}
        <circle
          cx={BASKET_X}
          cy={BASKET_Y}
          r="6"
          fill="none"
          stroke={colors.rim}
          strokeWidth="2.5"
        />
        <circle cx={BASKET_X} cy={BASKET_Y} r="2" fill={colors.rim} />

        {/* Zone labels (only if not compact) */}
        {!compact && (
          <>
            <text
              x={BASKET_X}
              y={COURT_HEIGHT - 60}
              textAnchor="middle"
              fill={isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.8)"}
              fontSize="11"
              fontWeight="600"
              letterSpacing="0.1em"
            >
              3PT ZONE
            </text>
            <text
              x={BASKET_X}
              y={60}
              textAnchor="middle"
              fill={isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.8)"}
              fontSize="10"
              fontWeight="600"
              letterSpacing="0.1em"
            >
              PAINT
            </text>
            <text
              x={BASKET_X}
              y={PAINT_HEIGHT + 50}
              textAnchor="middle"
              fill={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)"}
              fontSize="9"
              fontWeight="500"
              letterSpacing="0.05em"
            >
              MID-RANGE
            </text>
          </>
        )}

        {/* Shot markers */}
        {(displayMode === "all" ? allShots : recentShots.slice(-8)).map((shot, index, arr) => {
          const { x: svgX, y: svgY } = courtToSvg(shot.x, shot.y);
          const is3pt = shot.is3pt;
          // For "recent" mode, fade older shots; for "all" mode, use consistent opacity
          const opacity = displayMode === "all" ? 0.85 : 0.6 + (index / 8) * 0.4;
          const shotColor = shot.made
            ? is3pt
              ? COURT_COLORS.shot3pt
              : COURT_COLORS.shotMade
            : COURT_COLORS.shotMissed;
          return (
            <g key={index}>
              {/* Shot marker */}
              <circle
                cx={svgX}
                cy={svgY}
                r={displayMode === "all" ? 6 : 7}
                fill={shotColor}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={displayMode === "all" ? 1.5 : 2}
                opacity={opacity}
                className="transition-all duration-300"
              />
              {!shot.made && (
                <text
                  x={svgX}
                  y={svgY + 4}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={displayMode === "all" ? 8 : 10}
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
                  fontSize={displayMode === "all" ? 6 : 8}
                  fontWeight="bold"
                >
                  3
                </text>
              )}
            </g>
          );
        })}

        {/* Ripple effect */}
        {ripple && (
          <>
            <circle
              cx={ripple.x}
              cy={ripple.y}
              r="20"
              fill="none"
              stroke={colors.rim}
              strokeWidth="2"
              className="animate-ping"
              opacity="0.6"
            />
            <circle cx={ripple.x} cy={ripple.y} r="8" fill={colors.rim} opacity="0.8" />
          </>
        )}
      </svg>

      {/* Tap instruction - floating pill (only show when interactive) */}
      {!disabled && !compact && onCourtClick && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide
            bg-white/90 dark:bg-surface-900/90 backdrop-blur-md
            border border-surface-200 dark:border-surface-700
            text-surface-600 dark:text-surface-400
            shadow-lg shadow-surface-200/50 dark:shadow-black/30"
        >
          Tap court to record shot
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Heat Map Zone Component
// ============================================================================

interface ZoneStats {
  made: number;
  total: number;
  percentage: number;
}

interface HeatMapZoneProps {
  zone: string;
  stats: ZoneStats;
}

const HeatMapZone: React.FC<HeatMapZoneProps> = ({ zone, stats }) => {
  if (stats.total === 0) return null;

  // Color based on percentage (red = cold, green = hot)
  const getColor = (pct: number) => {
    if (pct >= 50) return "rgba(34, 197, 94, 0.5)"; // Green
    if (pct >= 40) return "rgba(234, 179, 8, 0.5)"; // Yellow
    if (pct >= 30) return "rgba(249, 115, 22, 0.5)"; // Orange
    return "rgba(239, 68, 68, 0.5)"; // Red
  };

  // Zone coordinates (simplified)
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
// Helper: Calculate Zone Stats
// ============================================================================

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

  // Calculate percentages
  Object.values(zones).forEach((z) => {
    z.percentage = z.total > 0 ? Math.round((z.made / z.total) * 100) : 0;
  });

  return zones;
}

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

export default InteractiveCourt;
