import React, { useRef, useState, useCallback } from "react";
import { COLORS } from "@basketball-stats/shared";
import { ShotLocation } from "../../../types/livegame";

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
  onCourtClick: (x: number, y: number, is3pt: boolean, zoneName: string) => void;
  disabled?: boolean;
  recentShots: ShotLocation[];
  showHeatMap?: boolean;
  allShots?: ShotLocation[];
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const InteractiveCourt: React.FC<InteractiveCourtProps> = ({
  onCourtClick,
  disabled = false,
  recentShots,
  showHeatMap = false,
  allShots = [],
  compact = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const handleClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || !svgRef.current) return;

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
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
        className={`w-full rounded-lg transition-all ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-crosshair hover:shadow-lg hover:shadow-orange-500/20"
        }`}
        onClick={handleClick}
        style={{ aspectRatio: `${COURT_WIDTH}/${COURT_HEIGHT}` }}
      >
        {/* Court background */}
        <rect
          x="0"
          y="0"
          width={COURT_WIDTH}
          height={COURT_HEIGHT}
          fill={COLORS.court.background}
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

        {/* Baseline */}
        <line x1="0" y1="0" x2={COURT_WIDTH} y2="0" stroke="#4B5563" strokeWidth="2" />

        {/* Three-point line */}
        <path
          d={`M ${CORNER_THREE_X} 0
              L ${CORNER_THREE_X} ${BASKET_Y + Math.sqrt(THREE_PT_RADIUS * THREE_PT_RADIUS - (BASKET_X - CORNER_THREE_X) * (BASKET_X - CORNER_THREE_X))}
              A ${THREE_PT_RADIUS} ${THREE_PT_RADIUS} 0 0 0 ${COURT_WIDTH - CORNER_THREE_X} ${BASKET_Y + Math.sqrt(THREE_PT_RADIUS * THREE_PT_RADIUS - (BASKET_X - CORNER_THREE_X) * (BASKET_X - CORNER_THREE_X))}
              L ${COURT_WIDTH - CORNER_THREE_X} 0`}
          fill="none"
          stroke="#4B5563"
          strokeWidth="1.5"
        />

        {/* Paint area (key) */}
        <rect
          x={(COURT_WIDTH - PAINT_WIDTH) / 2}
          y="0"
          width={PAINT_WIDTH}
          height={PAINT_HEIGHT}
          fill="none"
          stroke="#4B5563"
          strokeWidth="1.5"
        />

        {/* Free throw circle */}
        <circle
          cx={BASKET_X}
          cy={PAINT_HEIGHT}
          r={FT_CIRCLE_RADIUS}
          fill="none"
          stroke="#4B5563"
          strokeWidth="1.5"
        />

        {/* Restricted area arc */}
        <path
          d={`M ${BASKET_X - RESTRICTED_RADIUS} 0 A ${RESTRICTED_RADIUS} ${RESTRICTED_RADIUS} 0 0 0 ${BASKET_X + RESTRICTED_RADIUS} 0`}
          fill="none"
          stroke="#4B5563"
          strokeWidth="1.5"
        />

        {/* Basket and backboard */}
        <rect x={BASKET_X - 18} y={BASKET_Y - 4} width="36" height="2" fill="#6B7280" rx="1" />
        <circle
          cx={BASKET_X}
          cy={BASKET_Y}
          r="5"
          fill="none"
          stroke={COLORS.primary[500]}
          strokeWidth="2"
        />
        <circle cx={BASKET_X} cy={BASKET_Y} r="2" fill={COLORS.primary[500]} />

        {/* Zone labels (only if not compact) */}
        {!compact && (
          <>
            <text
              x={BASKET_X}
              y={COURT_HEIGHT - 30}
              textAnchor="middle"
              fill="#6B7280"
              fontSize="12"
              fontWeight="500"
            >
              3PT ZONE
            </text>
            <text
              x={BASKET_X}
              y={85}
              textAnchor="middle"
              fill="#6B7280"
              fontSize="11"
              fontWeight="500"
            >
              PAINT
            </text>
            <text x={BASKET_X} y={PAINT_HEIGHT + 50} textAnchor="middle" fill="#6B7280" fontSize="10">
              MID-RANGE
            </text>
          </>
        )}

        {/* Recent shots */}
        {recentShots.slice(-5).map((shot, index) => {
          const { x: svgX, y: svgY } = courtToSvg(shot.x, shot.y);
          return (
            <g key={index}>
              <circle
                cx={svgX}
                cy={svgY}
                r={8}
                fill={shot.made ? COLORS.shots.made2pt : COLORS.shots.missed2pt}
                stroke="#fff"
                strokeWidth="2"
                opacity={0.9}
                className="transition-all duration-300"
              />
              {!shot.made && (
                <text x={svgX} y={svgY + 3} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                  ×
                </text>
              )}
            </g>
          );
        })}

        {/* Ripple effect */}
        {ripple && (
          <circle
            cx={ripple.x}
            cy={ripple.y}
            r="15"
            fill={COLORS.primary[500]}
            className="animate-ping"
            opacity="0.5"
          />
        )}
      </svg>

      {/* Tap instruction */}
      {!disabled && !compact && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1.5 rounded-full text-xs text-white font-medium shadow-lg">
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
    leftElbow: { x: 18, y: 50, w: 84, h: 100 },
    rightElbow: { x: 198, y: 50, w: 84, h: 100 },
    topKey: { x: 102, y: 114, w: 96, h: 80 },
    leftCorner3: { x: 0, y: 0, w: 18, h: 100 },
    rightCorner3: { x: 282, y: 0, w: 18, h: 100 },
    leftWing3: { x: 0, y: 100, w: 100, h: 120 },
    rightWing3: { x: 200, y: 100, w: 100, h: 120 },
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
    topKey: { made: 0, total: 0, percentage: 0 },
    leftCorner3: { made: 0, total: 0, percentage: 0 },
    rightCorner3: { made: 0, total: 0, percentage: 0 },
    leftWing3: { made: 0, total: 0, percentage: 0 },
    rightWing3: { made: 0, total: 0, percentage: 0 },
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
    return "topKey";
  } else {
    const dist = Math.sqrt(x * x + y * y);
    if (dist < 10) return "paint";
    if (x > 8) return "rightElbow";
    if (x < -8) return "leftElbow";
    return "topKey";
  }
}

export default InteractiveCourt;
