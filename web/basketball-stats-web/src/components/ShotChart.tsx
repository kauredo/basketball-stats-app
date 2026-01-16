import React from "react";

interface Shot {
  id: string;
  x: number;
  y: number;
  shotType: "2pt" | "3pt" | "ft";
  made: boolean;
  shotZone?: string;
}

interface ShotChartProps {
  shots: Shot[];
  width?: number;
  height?: number;
  showHeatmap?: boolean;
  title?: string;
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
}) => {
  // Convert shot coordinates to SVG coordinates
  // Shot coordinates: x from -50 to 50, y from 0 to 47 (half court)
  const toSvgCoords = (x: number, y: number): { cx: number; cy: number } => {
    // Center x at 250 (middle of court width)
    // y=0 is at the basket (bottom), so we flip it
    const cx = 250 + x * 5; // Scale x by 5
    const cy = 470 - y * 10; // Scale y by 10 and flip
    return { cx, cy };
  };

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

  return (
    <div className="shot-chart">
      {title && <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>}
      <svg
        viewBox="0 0 500 470"
        width={width}
        height={height}
        className="bg-gray-800 rounded-lg"
      >
        {/* Court outline */}
        <rect x="0" y="0" width="500" height="470" fill="#1a1a2e" stroke="#374151" strokeWidth="2" />

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
        <circle cx="250" cy="450" r="8" fill="none" stroke="#F97316" strokeWidth="3" />

        {/* Backboard */}
        <line x1="220" y1="460" x2="280" y2="460" stroke="#F97316" strokeWidth="3" />

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
            <path
              d="M 30 330 Q 30 200 150 150 L 150 330 Z"
              fill={getHeatmapColor("wing3")}
            />
            <path
              d="M 470 330 Q 470 200 350 150 L 350 330 Z"
              fill={getHeatmapColor("wing3")}
            />
          </>
        )}

        {/* Midrange zone (for heatmap) */}
        {showHeatmap && (
          <path
            d="M 170 280 L 170 470 L 30 470 L 30 330 Q 30 150 250 150 Q 470 150 470 330 L 470 470 L 330 470 L 330 280 Q 330 200 250 200 Q 170 200 170 280"
            fill={getHeatmapColor("midrange")}
          />
        )}

        {/* Shot markers */}
        {shots.map((shot) => {
          const { cx, cy } = toSvgCoords(shot.x, shot.y);
          return (
            <g key={shot.id}>
              {shot.made ? (
                // Made shot - filled circle
                <circle
                  cx={cx}
                  cy={cy}
                  r="6"
                  fill={shot.shotType === "3pt" ? "#22C55E" : "#3B82F6"}
                  stroke="#fff"
                  strokeWidth="1"
                  opacity="0.9"
                />
              ) : (
                // Missed shot - X mark
                <g stroke={shot.shotType === "3pt" ? "#EF4444" : "#F59E0B"} strokeWidth="2">
                  <line x1={cx - 4} y1={cy - 4} x2={cx + 4} y2={cy + 4} />
                  <line x1={cx + 4} y1={cy - 4} x2={cx - 4} y2={cy + 4} />
                </g>
              )}
            </g>
          );
        })}

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
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span className="text-gray-400">Made 3PT</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span className="text-gray-400">Made 2PT</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 text-red-500 font-bold">✕</div>
          <span className="text-gray-400">Missed 3PT</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 text-yellow-500 font-bold">✕</div>
          <span className="text-gray-400">Missed 2PT</span>
        </div>
      </div>
    </div>
  );
};

export default ShotChart;
