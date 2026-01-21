import React, { useState, useRef, useCallback } from "react";
import { COLORS, COURT_DIMENSIONS, svgToCourtCoords, getShotZone } from "@basketball-stats/shared";

interface Shot {
  id: string;
  x: number;
  y: number;
  shotType: "2pt" | "3pt" | "ft";
  made: boolean;
  shotZone?: string;
  isNew?: boolean; // For animation
}

interface RippleEffect {
  id: number;
  x: number;
  y: number;
}

interface InteractiveCourtProps {
  onCourtTap?: (x: number, y: number, shotZone: string) => void;
  interactive?: boolean;
}

interface ShotChartProps extends InteractiveCourtProps {
  shots: Shot[];
  width?: number;
  height?: number;
  showHeatmap?: boolean;
  title?: string;
  selectedPlayerId?: string;
}

// Basketball court dimensions (half court)
// Standard NBA half court: 47 feet long, 50 feet wide
// We'll use a 500x470 viewBox (scaled 10x)

const ShotChart: React.FC<ShotChartProps> = ({
  shots,
  width = 500,
  height = 470,
  showHeatmap = false,
  title,
  onCourtTap,
  interactive = false,
  selectedPlayerId: _selectedPlayerId,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const rippleIdRef = useRef(0);

  // Convert shot coordinates to SVG coordinates
  // Shot coordinates: x from -50 to 50, y from 0 to 47 (half court)
  const toSvgCoords = (x: number, y: number): { cx: number; cy: number } => {
    // Center x at 250 (middle of court width)
    // y=0 is at the basket (bottom), so we flip it
    const cx = 250 + x * 5; // Scale x by 5
    const cy = 470 - y * 10; // Scale y by 10 and flip
    return { cx, cy };
  };

  // Handle court click
  const handleCourtClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!interactive || !onCourtTap || !svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();

      // Get click position relative to SVG
      const scaleX = COURT_DIMENSIONS.webViewBox.width / rect.width;
      const scaleY = COURT_DIMENSIONS.webViewBox.height / rect.height;

      const svgX = (event.clientX - rect.left) * scaleX;
      const svgY = (event.clientY - rect.top) * scaleY;

      // Convert SVG coordinates to court coordinates
      const { x, y } = svgToCourtCoords(svgX, svgY, "web");

      // Determine shot zone
      const shotZone = getShotZone(x, y);

      // Add ripple effect
      const rippleId = rippleIdRef.current++;
      setRipples((prev) => [...prev, { id: rippleId, x: svgX, y: svgY }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 600);

      // Call the callback
      onCourtTap(x, y, shotZone);
    },
    [interactive, onCourtTap]
  );

  // Calculate heat zones if needed
  const getHeatmapColor = (zone: string | undefined): string => {
    if (!showHeatmap || !zone) return "transparent";

    const zoneShots = shots.filter((s) => s.shotZone === zone);
    if (zoneShots.length === 0) return "transparent";

    const made = zoneShots.filter((s) => s.made).length;
    const percentage = made / zoneShots.length;

    // Color scale from red (cold/low %) to green (hot/high %)
    if (percentage >= 0.5) return `rgba(34, 197, 94, ${0.2 + percentage * 0.3})`; // Green
    if (percentage >= 0.4) return `rgba(234, 179, 8, ${0.2 + percentage * 0.3})`; // Yellow
    return `rgba(239, 68, 68, ${0.2 + (1 - percentage) * 0.3})`; // Red
  };

  // Get shot marker color based on type and result
  const getShotColor = (shot: Shot): string => {
    if (shot.made) {
      return shot.shotType === "3pt" ? COLORS.shots.made3pt : COLORS.shots.made2pt;
    }
    return shot.shotType === "3pt" ? COLORS.shots.missed3pt : COLORS.shots.missed2pt;
  };

  return (
    <div className="shot-chart">
      {title && <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>}
      <svg
        ref={svgRef}
        viewBox="0 0 500 470"
        width={width}
        height={height}
        className={`bg-surface-800 rounded-lg transition-shadow ${
          interactive ? "cursor-crosshair hover:shadow-lg hover:shadow-primary-500/20" : ""
        }`}
        onClick={handleCourtClick}
        role={interactive ? "button" : undefined}
        aria-label={interactive ? "Click on court to record shot location" : undefined}
      >
        {/* Court background with unified color */}
        <rect
          x="0"
          y="0"
          width="500"
          height="470"
          fill={COLORS.court.background}
          stroke="#374151"
          strokeWidth="2"
        />

        {/* Three point line */}
        <path
          d="M 30 470 L 30 330 Q 30 100 250 100 Q 470 100 470 330 L 470 470"
          fill={showHeatmap ? getHeatmapColor("top3") : "none"}
          stroke="#4B5563"
          strokeWidth="2"
        />

        {/* Paint/Key area */}
        <rect
          x="170"
          y="280"
          width="160"
          height="190"
          fill={showHeatmap ? getHeatmapColor("paint") : "none"}
          stroke="#4B5563"
          strokeWidth="2"
        />

        {/* Free throw circle */}
        <circle cx="250" cy="280" r="60" fill="none" stroke="#4B5563" strokeWidth="2" />

        {/* Restricted area (semi-circle under basket) */}
        <path
          d="M 210 470 Q 210 430 250 430 Q 290 430 290 470"
          fill="none"
          stroke="#4B5563"
          strokeWidth="2"
        />

        {/* Basket */}
        <circle cx="250" cy="450" r="8" fill="none" stroke={COLORS.primary[500]} strokeWidth="3" />

        {/* Backboard */}
        <line x1="220" y1="460" x2="280" y2="460" stroke={COLORS.primary[500]} strokeWidth="3" />

        {/* Corner 3 zones (for heatmap) */}
        {showHeatmap && (
          <>
            <rect x="0" y="330" width="30" height="140" fill={getHeatmapColor("corner3")} />
            <rect x="470" y="330" width="30" height="140" fill={getHeatmapColor("corner3")} />
          </>
        )}

        {/* Wing 3 zones (for heatmap) */}
        {showHeatmap && (
          <>
            <path d="M 30 330 Q 30 200 150 150 L 150 330 Z" fill={getHeatmapColor("wing3")} />
            <path d="M 470 330 Q 470 200 350 150 L 350 330 Z" fill={getHeatmapColor("wing3")} />
          </>
        )}

        {/* Midrange zone (for heatmap) */}
        {showHeatmap && (
          <path
            d="M 170 280 L 170 470 L 30 470 L 30 330 Q 30 150 250 150 Q 470 150 470 330 L 470 470 L 330 470 L 330 280 Q 330 200 250 200 Q 170 200 170 280"
            fill={getHeatmapColor("midrange")}
          />
        )}

        {/* Ripple effects for click feedback */}
        {ripples.map((ripple) => (
          <circle
            key={ripple.id}
            cx={ripple.x}
            cy={ripple.y}
            r="10"
            fill={COLORS.primary[500]}
            className="animate-ripple"
            style={{
              transformOrigin: `${ripple.x}px ${ripple.y}px`,
            }}
          />
        ))}

        {/* Shot markers with entrance animation */}
        {shots.map((shot, index) => {
          const { cx, cy } = toSvgCoords(shot.x, shot.y);
          const markerColor = getShotColor(shot);

          return (
            <g
              key={shot.id}
              className={shot.isNew ? "animate-shot-marker" : ""}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animationDelay: shot.isNew ? "0ms" : `${index * 30}ms`,
              }}
            >
              {shot.made ? (
                // Made shot - filled circle with glow effect
                <>
                  {/* Glow effect */}
                  <circle cx={cx} cy={cy} r="10" fill={markerColor} opacity="0.2" />
                  {/* Main marker */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="6"
                    fill={markerColor}
                    stroke="#fff"
                    strokeWidth="1.5"
                    opacity="0.9"
                    className="transition-all duration-200 hover:r-8"
                  />
                </>
              ) : (
                // Missed shot - X mark
                <g stroke={markerColor} strokeWidth="2.5" strokeLinecap="round">
                  <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} />
                  <line x1={cx + 5} y1={cy - 5} x2={cx - 5} y2={cy + 5} />
                </g>
              )}
            </g>
          );
        })}

        {/* Interactive mode indicator */}
        {interactive && (
          <g>
            {/* Pulsing indicator */}
            <circle
              cx="250"
              cy="235"
              r="3"
              fill={COLORS.primary[500]}
              className="animate-pulse-glow"
            />
            <text x="250" y="250" textAnchor="middle" fill="#9CA3AF" fontSize="11" fontWeight="500">
              TAP TO RECORD SHOT
            </text>
          </g>
        )}

        {/* Court labels */}
        <text x="250" y="30" textAnchor="middle" fill="#6B7280" fontSize="12">
          3PT LINE
        </text>
        <text x="250" y="350" textAnchor="middle" fill="#6B7280" fontSize="10">
          PAINT
        </text>
      </svg>

      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: COLORS.shots.made3pt }}
          ></div>
          <span className="text-surface-400">Made 3PT</span>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: COLORS.shots.made2pt }}
          ></div>
          <span className="text-surface-400">Made 2PT</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 font-bold" style={{ color: COLORS.shots.missed3pt }}>
            ✕
          </div>
          <span className="text-surface-400">Missed 3PT</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 font-bold" style={{ color: COLORS.shots.missed2pt }}>
            ✕
          </div>
          <span className="text-surface-400">Missed 2PT</span>
        </div>
      </div>

      {/* CSS for animations (embedded for self-contained component) */}
      <style>{`
        @keyframes shotMarkerEntrance {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.5; }
          100% { transform: scale(4); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-shot-marker {
          animation: shotMarkerEntrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ShotChart;
