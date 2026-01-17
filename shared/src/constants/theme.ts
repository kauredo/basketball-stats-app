// Unified theme constants for consistent styling across web and mobile platforms

/**
 * Color palette for the basketball stats app
 * Ensures visual consistency between web and mobile
 */
export const COLORS = {
  // Court colors
  court: {
    background: "#1a472a", // Unified dark court green
    lines: "#FFFFFF", // White court lines
    paint: "#234a1f", // Paint/key area (darker green)
    threePointLine: "#FFFFFF",
    freeThrowLine: "#FFFFFF",
    restrictedArea: "#FFFFFF",
  },

  // Shot marker colors
  shots: {
    made2pt: "#3B82F6", // Blue - made 2-pointers
    made3pt: "#22C55E", // Green - made 3-pointers
    missed2pt: "#F59E0B", // Amber - missed 2-pointers
    missed3pt: "#EF4444", // Red - missed 3-pointers
    freeThrowMade: "#60A5FA", // Light blue - made free throws
    freeThrowMissed: "#FBBF24", // Yellow - missed free throws
  },

  // Game status colors
  status: {
    active: "#EF4444", // Red - live game
    paused: "#F59E0B", // Amber - paused
    completed: "#10B981", // Emerald - final
    scheduled: "#3B82F6", // Blue - upcoming
  },

  // Heatmap gradient colors (cold to hot)
  heatmap: {
    cold: "#EF4444", // Red - low percentage
    medium: "#F59E0B", // Amber - medium percentage
    hot: "#22C55E", // Green - high percentage
    transparent: "transparent",
  },

  // Primary brand colors
  primary: {
    50: "#fef7ee",
    100: "#fef2e4",
    200: "#fde2c8",
    300: "#fbcba6",
    400: "#f7a462",
    500: "#F97316", // Main orange
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
  },

  // Dark theme backgrounds
  dark: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#0f1419", // Main dark background
  },

  // Stat button categories
  statButtons: {
    scoring: "#F97316", // Orange - scoring actions
    playmaking: "#8B5CF6", // Purple - assists
    defense: "#06B6D4", // Cyan - steals, blocks
    rebounding: "#3B82F6", // Blue - rebounds
    negative: "#EF4444", // Red - turnovers, fouls
  },

  // UI accent colors
  accent: {
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
} as const;

/**
 * Court dimensions and scaling constants
 * Based on standard NBA half-court measurements
 */
export const COURT_DIMENSIONS = {
  // Real court dimensions (in feet)
  width: 50, // Full court width
  height: 47, // Half court length
  fullCourtLength: 94, // Full court length

  // Key measurements (in feet)
  threePointDistance: 23.75, // Distance from basket to 3pt line
  freeThrowDistance: 15, // Distance from basket to FT line
  paintWidth: 16, // Width of the paint
  paintLength: 19, // Length of the paint
  restrictedAreaRadius: 4, // Restricted area arc radius
  freeThrowCircleRadius: 6, // Free throw circle radius

  // Corner 3-point line (shorter)
  corner3Distance: 22,

  // SVG scaling
  webScale: 10, // Multiplier for web SVG (50ft * 10 = 500px)
  webViewBox: {
    width: 500,
    height: 470,
  },
  mobileViewBox: {
    width: 50,
    height: 47,
  },
} as const;

/**
 * Touch target sizes for mobile accessibility
 * Following Material Design guidelines (minimum 48dp)
 */
export const TOUCH_TARGETS = {
  minimum: 48, // Minimum touch target in dp
  comfortable: 56, // Comfortable touch target
  large: 64, // Large touch target
  extraLarge: 72, // Extra large for primary actions
} as const;

/**
 * Animation durations and timing
 */
export const ANIMATIONS = {
  // Durations in milliseconds
  fast: 150,
  normal: 300,
  slow: 500,

  // Spring animation config (for react-native-reanimated)
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  // Shot marker entrance animation
  shotMarker: {
    duration: 400,
    scale: {
      from: 0,
      to: 1,
    },
  },

  // Button press feedback
  buttonPress: {
    scale: 0.95,
    duration: 100,
  },
} as const;

/**
 * Stat button configuration for Live Game screen
 * Organized by category for better UX
 */
export const STAT_BUTTON_CONFIG = {
  scoring: [
    {
      key: "shot2",
      label: "2PT",
      shortLabel: "+2",
      color: COLORS.statButtons.scoring,
      requiresMade: true,
    },
    {
      key: "shot3",
      label: "3PT",
      shortLabel: "+3",
      color: COLORS.statButtons.scoring,
      requiresMade: true,
    },
    {
      key: "freethrow",
      label: "FT",
      shortLabel: "+1",
      color: COLORS.statButtons.scoring,
      requiresMade: true,
    },
  ],
  playmaking: [
    {
      key: "assists",
      label: "AST",
      shortLabel: "+A",
      color: COLORS.statButtons.playmaking,
      requiresMade: false,
    },
  ],
  defense: [
    {
      key: "steals",
      label: "STL",
      shortLabel: "+S",
      color: COLORS.statButtons.defense,
      requiresMade: false,
    },
    {
      key: "blocks",
      label: "BLK",
      shortLabel: "+B",
      color: COLORS.statButtons.defense,
      requiresMade: false,
    },
  ],
  rebounding: [
    {
      key: "rebounds",
      label: "REB",
      shortLabel: "+R",
      color: COLORS.statButtons.rebounding,
      requiresMade: false,
    },
  ],
  negative: [
    {
      key: "turnovers",
      label: "TO",
      shortLabel: "+T",
      color: COLORS.statButtons.negative,
      requiresMade: false,
    },
    {
      key: "fouls",
      label: "FOUL",
      shortLabel: "+F",
      color: COLORS.statButtons.negative,
      requiresMade: false,
    },
  ],
} as const;

/**
 * Shot zone definitions for heatmap calculations
 */
export const SHOT_ZONES = {
  paint: {
    name: "Paint",
    description: "Restricted area and key",
    bounds: { xMin: -8, xMax: 8, yMin: 0, yMax: 19 },
  },
  midrangeLeft: {
    name: "Mid-Range Left",
    description: "Left side mid-range",
    bounds: { xMin: -25, xMax: -8, yMin: 0, yMax: 20 },
  },
  midrangeRight: {
    name: "Mid-Range Right",
    description: "Right side mid-range",
    bounds: { xMin: 8, xMax: 25, yMin: 0, yMax: 20 },
  },
  corner3Left: {
    name: "Corner 3 Left",
    description: "Left corner three-pointer",
    bounds: { xMin: -25, xMax: -22, yMin: 0, yMax: 14 },
  },
  corner3Right: {
    name: "Corner 3 Right",
    description: "Right corner three-pointer",
    bounds: { xMin: 22, xMax: 25, yMin: 0, yMax: 14 },
  },
  wing3Left: {
    name: "Wing 3 Left",
    description: "Left wing three-pointer",
    bounds: { xMin: -25, xMax: -10, yMin: 14, yMax: 30 },
  },
  wing3Right: {
    name: "Wing 3 Right",
    description: "Right wing three-pointer",
    bounds: { xMin: 10, xMax: 25, yMin: 14, yMax: 30 },
  },
  top3: {
    name: "Top of Key 3",
    description: "Top of the arc three-pointer",
    bounds: { xMin: -10, xMax: 10, yMin: 24, yMax: 47 },
  },
} as const;

/**
 * Utility function to get heatmap color based on shooting percentage
 */
export function getHeatmapColor(percentage: number, opacity: number = 0.5): string {
  if (percentage >= 0.5) {
    return `rgba(34, 197, 94, ${opacity})`; // Green (hot)
  } else if (percentage >= 0.4) {
    return `rgba(234, 179, 8, ${opacity})`; // Amber (medium)
  }
  return `rgba(239, 68, 68, ${opacity})`; // Red (cold)
}

/**
 * Utility function to convert court coordinates to SVG coordinates
 * Works for both web and mobile platforms
 */
export function courtToSvgCoords(
  x: number,
  y: number,
  platform: "web" | "mobile" = "web"
): { cx: number; cy: number } {
  if (platform === "web") {
    // Web: 500x470 viewBox, center at 250, y flipped
    const cx = 250 + x * 5;
    const cy = 470 - y * 10;
    return { cx, cy };
  } else {
    // Mobile: 50x47 viewBox, center at 25
    const cx = 25 + x;
    const cy = y;
    return { cx, cy };
  }
}

/**
 * Utility function to convert SVG coordinates back to court coordinates
 */
export function svgToCourtCoords(
  cx: number,
  cy: number,
  platform: "web" | "mobile" = "web"
): { x: number; y: number } {
  if (platform === "web") {
    // Web: reverse the transformation
    const x = (cx - 250) / 5;
    const y = (470 - cy) / 10;
    return { x, y };
  } else {
    // Mobile: reverse the transformation
    const x = cx - 25;
    const y = cy;
    return { x, y };
  }
}

/**
 * Determine shot zone from coordinates
 */
export function getShotZone(x: number, y: number): keyof typeof SHOT_ZONES | "unknown" {
  // Calculate distance from basket (at 0, 5.25 on mobile coords)
  const distanceFromBasket = Math.sqrt(x * x + (y - 5.25) ** 2);

  // Check if it's a 3-pointer (beyond 3pt line)
  const isThreePointer =
    distanceFromBasket > COURT_DIMENSIONS.threePointDistance || (Math.abs(x) > 22 && y < 14); // Corner 3s

  if (!isThreePointer) {
    // Inside the arc - check paint vs midrange
    if (Math.abs(x) <= 8 && y <= 19) {
      return "paint";
    }
    if (x < -8) return "midrangeLeft";
    if (x > 8) return "midrangeRight";
    return "paint"; // Default to paint if within arc but not midrange
  }

  // Three-pointer zones
  if (y < 14) {
    return x < 0 ? "corner3Left" : "corner3Right";
  }
  if (y < 30) {
    return x < 0 ? "wing3Left" : "wing3Right";
  }
  return "top3";
}

// Export all theme utilities
export default {
  COLORS,
  COURT_DIMENSIONS,
  TOUCH_TARGETS,
  ANIMATIONS,
  STAT_BUTTON_CONFIG,
  SHOT_ZONES,
  getHeatmapColor,
  courtToSvgCoords,
  svgToCourtCoords,
  getShotZone,
};
