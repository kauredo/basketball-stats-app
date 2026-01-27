import React, { useCallback } from "react";
import { useColorScheme, useWindowDimensions } from "react-native";
import Svg, { Rect, Circle, Path, G, Line } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { runOnJS } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { getShotZone } from "@basketball-stats/shared";

export interface ShotMarker {
  x: number;
  y: number;
  made: boolean;
  is3pt?: boolean;
}

interface MiniCourtProps {
  /** Handler for court taps - if not provided, court is display-only */
  onCourtTap?: (x: number, y: number, zone: string, is3pt: boolean) => void;
  /** Disable interactions even if onCourtTap is provided */
  disabled?: boolean;
  /** Array of shots to display on the court */
  shots?: ShotMarker[];
  /** Maximum number of shots to display (defaults to 5 for recent mode, all for display mode) */
  maxShots?: number;
  /** Whether in landscape orientation */
  isLandscape?: boolean;
  /** Display mode: "recent" shows last N shots faded, "all" shows all shots uniformly */
  displayMode?: "recent" | "all";
  /** Show heat map zones (for shot chart analysis) */
  showHeatmap?: boolean;
  /** Zone statistics for heat map coloring */
  zoneStats?: Record<string, { made: number; attempted: number; percentage: number }>;
  /** Override maximum court height (for tablet support) */
  maxCourtHeight?: number;
  /** Override maximum court width (for tablet support) */
  maxCourtWidth?: number;
}

// SVG viewBox dimensions - represents half court with proper proportions
const VIEW_WIDTH = 50;
const VIEW_HEIGHT = 35;
const BASKET_X = 25;
const BASKET_Y = 5.25;

export function MiniCourt({
  onCourtTap,
  disabled = false,
  shots = [],
  maxShots,
  isLandscape = false,
  displayMode = "recent",
  showHeatmap = false,
  zoneStats,
  maxCourtHeight,
  maxCourtWidth,
}: MiniCourtProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const ASPECT_RATIO = VIEW_WIDTH / VIEW_HEIGHT;

  // Default values (phone) - can be overridden via props for tablet support
  const defaultMaxHeightLandscape = maxCourtHeight ?? 280;
  const defaultMaxWidthPortrait = maxCourtWidth ?? 400;

  // Calculate court dimensions based on available space
  let courtWidth: number;
  let courtHeight: number;

  if (isLandscape) {
    // In landscape, maximize court size while leaving room for buttons panel
    // Account for scoreboard (~50px), tabs (~36px), safe areas (~20px), and padding (~16px)
    const availableHeight = screenHeight - 122;
    // Take up most of the available height, capped by max height (device-aware)
    courtHeight = Math.min(availableHeight * 0.95, defaultMaxHeightLandscape);
    courtWidth = courtHeight * ASPECT_RATIO;
    // Leave room for buttons panel plus gap (handled by parent, but provide buffer)
    const maxWidth = screenWidth - 180;
    if (courtWidth > maxWidth) {
      courtWidth = maxWidth;
      courtHeight = courtWidth / ASPECT_RATIO;
    }
  } else {
    const availableWidth = screenWidth - 48;
    courtWidth = Math.min(availableWidth, defaultMaxWidthPortrait);
    courtHeight = courtWidth / ASPECT_RATIO;
    const minHeight = 200;
    const maxHeight = screenHeight * 0.4;
    courtHeight = Math.max(minHeight, Math.min(courtHeight, maxHeight));
    courtWidth = courtHeight * ASPECT_RATIO;
  }

  // Court colors based on theme - matching the nice hardwood look
  const courtColors = {
    background: isDark ? "#57534e" : "#d4a574",
    lines: isDark ? "rgba(255,255,255,0.8)" : "#ffffff",
    rim: "#ea580c",
    shotMade: "#22c55e",
    shotMissed: "#ef4444",
    shot3pt: "#8b5cf6",
    paint: isDark ? "rgba(234,88,12,0.15)" : "rgba(234,88,12,0.1)",
  };

  // Heat map zone colors
  const getZoneColor = (zoneName: string): string => {
    if (!showHeatmap || !zoneStats || !zoneStats[zoneName]) return "transparent";
    const stats = zoneStats[zoneName];
    if (stats.attempted === 0) return "transparent";
    const pct = stats.percentage;
    if (pct >= 50) return "rgba(34, 197, 94, 0.4)";
    if (pct >= 40) return "rgba(234, 179, 8, 0.4)";
    if (pct >= 30) return "rgba(249, 115, 22, 0.4)";
    return "rgba(239, 68, 68, 0.4)";
  };

  const handleTap = useCallback(
    (tapX: number, tapY: number) => {
      if (!onCourtTap) return;
      // Convert tap position to SVG coordinates
      const svgX = (tapX / courtWidth) * VIEW_WIDTH;
      const svgY = (tapY / courtHeight) * VIEW_HEIGHT;
      // Convert to court coordinates (feet, origin at basket) - same as web InteractiveCourt
      const courtX = svgX - BASKET_X; // -25 to 25
      const courtY = svgY - BASKET_Y; // negative = behind basket, positive = toward half court
      const zone = getShotZone(courtX, courtY);
      const distanceFromBasket = Math.sqrt(courtX * courtX + courtY * courtY);
      const is3pt = distanceFromBasket > 23.75 || (Math.abs(courtX) > 22 && courtY < 14);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onCourtTap(courtX, courtY, zone, is3pt);
    },
    [onCourtTap, courtWidth, courtHeight]
  );

  const tapGesture = Gesture.Tap()
    .enabled(!disabled && !!onCourtTap)
    .onEnd((event) => {
      runOnJS(handleTap)(event.x, event.y);
    });

  // Determine which shots to show
  const defaultMaxShots = displayMode === "all" ? shots.length : 5;
  const shotsToDisplay =
    displayMode === "all"
      ? shots.slice(-(maxShots ?? defaultMaxShots))
      : shots.slice(-(maxShots ?? defaultMaxShots));

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View
        className={`self-center rounded-xl overflow-hidden ${disabled ? "opacity-50" : ""}`}
        style={{
          width: courtWidth,
          height: courtHeight,
        }}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Court background */}
          <Rect x="0" y="0" width={VIEW_WIDTH} height={VIEW_HEIGHT} fill={courtColors.background} />

          {/* Heatmap zones (if enabled) */}
          {showHeatmap && (
            <G>
              {/* Paint zone */}
              <Rect x="17" y="0" width="16" height="19" fill={getZoneColor("paint")} />
              {/* Left midrange */}
              <Rect x="3" y="0" width="14" height="19" fill={getZoneColor("midrangeLeft")} />
              {/* Right midrange */}
              <Rect x="33" y="0" width="14" height="19" fill={getZoneColor("midrangeRight")} />
              {/* Left corner 3 */}
              <Rect x="0" y="0" width="3" height="14" fill={getZoneColor("corner3Left")} />
              {/* Right corner 3 */}
              <Rect x="47" y="0" width="3" height="14" fill={getZoneColor("corner3Right")} />
              {/* Wing and top 3 zones */}
              <Path
                d="M 3 14 A 23.75 23.75 0 0 0 47 14 L 47 35 L 3 35 Z"
                fill={getZoneColor("top3")}
              />
            </G>
          )}

          {/* Paint/Key area with fill */}
          <Rect
            x="17"
            y="0"
            width="16"
            height="19"
            fill={showHeatmap ? "transparent" : courtColors.paint}
            stroke={courtColors.lines}
            strokeWidth="0.4"
          />

          {/* Free throw circle (top half) */}
          <Path
            d="M 17 19 A 8 8 0 0 0 33 19"
            fill="none"
            stroke={courtColors.lines}
            strokeWidth="0.4"
          />
          {/* Free throw circle (bottom half - dashed) */}
          <Path
            d="M 17 19 A 8 8 0 0 1 33 19"
            fill="none"
            stroke={courtColors.lines}
            strokeWidth="0.3"
            strokeDasharray="1,1"
          />

          {/* Restricted area arc */}
          <Path
            d="M 21 0 A 4 4 0 0 0 29 0"
            fill="none"
            stroke={courtColors.lines}
            strokeWidth="0.4"
          />

          {/* Rim */}
          <Circle
            cx={BASKET_X}
            cy={BASKET_Y}
            r="0.75"
            fill="none"
            stroke={courtColors.rim}
            strokeWidth="0.4"
          />
          {/* Rim center dot */}
          <Circle cx={BASKET_X} cy={BASKET_Y} r="0.2" fill={courtColors.rim} />

          {/* Three-point line */}
          <Path d="M 3 0 L 3 14" fill="none" stroke={courtColors.lines} strokeWidth="0.4" />
          <Path d="M 47 0 L 47 14" fill="none" stroke={courtColors.lines} strokeWidth="0.4" />
          <Path
            d="M 3 14 A 23.75 23.75 0 0 0 47 14"
            fill="none"
            stroke={courtColors.lines}
            strokeWidth="0.4"
          />

          {/* Shot markers */}
          {shotsToDisplay.map((shot, index) => {
            // Convert from basket-origin coordinates to SVG coordinates
            const svgX = BASKET_X + shot.x;
            const svgY = Math.min(Math.max(BASKET_Y + shot.y, 0), VIEW_HEIGHT - 1);
            const opacity =
              displayMode === "all" ? 0.85 : 0.5 + (index / shotsToDisplay.length) * 0.5;

            // Color: green for made, violet for made 3pt, red for missed
            const shotColor = shot.made
              ? shot.is3pt
                ? courtColors.shot3pt
                : courtColors.shotMade
              : courtColors.shotMissed;

            const markerSize = displayMode === "all" ? 1.2 : 1.5;

            return (
              <G key={index}>
                <Circle
                  cx={svgX}
                  cy={svgY}
                  r={markerSize}
                  fill={shotColor}
                  opacity={opacity}
                  stroke="#fff"
                  strokeWidth={0.2}
                />
                {!shot.made && (
                  <G>
                    <Line
                      x1={svgX - 0.6}
                      y1={svgY - 0.6}
                      x2={svgX + 0.6}
                      y2={svgY + 0.6}
                      stroke="#fff"
                      strokeWidth={0.2}
                    />
                    <Line
                      x1={svgX + 0.6}
                      y1={svgY - 0.6}
                      x2={svgX - 0.6}
                      y2={svgY + 0.6}
                      stroke="#fff"
                      strokeWidth={0.2}
                    />
                  </G>
                )}
              </G>
            );
          })}
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
}

export default MiniCourt;
