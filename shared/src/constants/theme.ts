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

  // Game status colors (unified across platforms)
  status: {
    active: "#dc2626", // Deeper red - live game
    paused: "#d97706", // Amber - paused
    completed: "#059669", // Emerald - final
    scheduled: "#2563eb", // Blue - upcoming
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

  // Warm surface colors (tinted toward orange/brown, not cold blue-gray)
  // This creates a cohesive brand feel across web and mobile
  surface: {
    50: "#fdfcfb", // Warm off-white (not pure white)
    100: "#f9f7f5",
    200: "#f3f0ed",
    300: "#e8e4df",
    400: "#d4cdc5",
    500: "#a69f96",
    600: "#7a746c",
    700: "#5c5650",
    800: "#3d3835",
    900: "#252220",
    950: "#1a1816", // Warm near-black (not pure black)
  },

  // Dark theme backgrounds (kept for backwards compatibility)
  dark: {
    50: "#fdfcfb",
    100: "#f9f7f5",
    200: "#f3f0ed",
    300: "#e8e4df",
    400: "#d4cdc5",
    500: "#a69f96",
    600: "#7a746c",
    700: "#5c5650",
    800: "#3d3835",
    900: "#252220",
    950: "#1a1816",
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
 * Type for game status keys
 */
export type GameStatusKey = keyof typeof COLORS.status;

/**
 * Type-safe helper to get status color
 * Returns fallback color if status is not found
 */
export const getStatusColor = (status: string, fallback = "#6B7280"): string => {
  const validStatuses: GameStatusKey[] = ["active", "paused", "completed", "scheduled"];
  if (validStatuses.includes(status as GameStatusKey)) {
    return COLORS.status[status as GameStatusKey];
  }
  return fallback;
};

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
 * Determine shot zone from coordinates (basket-origin: x=0, y=0 at basket)
 */
export function getShotZone(x: number, y: number): keyof typeof SHOT_ZONES | "unknown" {
  // Calculate distance from basket (origin is at basket, so y=0 at basket)
  const distanceFromBasket = Math.sqrt(x * x + y * y);

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

/**
 * Navigation theme colors for consistent navigation styling
 * Use these values for headers, tab bars, and navigation chrome
 */
export const NAV_COLORS = {
  light: {
    background: COLORS.surface[50],
    card: COLORS.surface[50],
    text: COLORS.surface[900],
    border: COLORS.surface[300],
    tabBarBg: COLORS.surface[50],
    tabBarBorder: COLORS.surface[300],
    headerBg: COLORS.surface[50],
    headerText: COLORS.surface[900],
    inactiveTab: COLORS.surface[600],
  },
  dark: {
    background: COLORS.surface[950],
    card: COLORS.surface[800],
    text: COLORS.surface[50],
    border: COLORS.surface[700],
    tabBarBg: COLORS.surface[900],
    tabBarBorder: COLORS.surface[800],
    headerBg: COLORS.surface[900],
    headerText: COLORS.surface[50],
    inactiveTab: COLORS.surface[500],
  },
  primary: COLORS.primary[500],
} as const;

/**
 * Theme-aware color utilities
 * Provides consistent color selection based on theme mode
 */
export const getThemedColors = (isDark: boolean) => ({
  // Backgrounds
  background: isDark ? COLORS.surface[950] : COLORS.surface[50],
  card: isDark ? COLORS.surface[800] : COLORS.surface[50],
  cardElevated: isDark ? COLORS.surface[800] : "#ffffff",

  // Text
  text: isDark ? COLORS.surface[50] : COLORS.surface[900],
  textSecondary: isDark ? COLORS.surface[400] : COLORS.surface[600],
  textMuted: isDark ? COLORS.surface[500] : COLORS.surface[500],

  // Borders
  border: isDark ? COLORS.surface[700] : COLORS.surface[300],
  borderSubtle: isDark ? COLORS.surface[800] : COLORS.surface[200],

  // Input specific
  inputBg: isDark ? COLORS.surface[800] : "#ffffff",
  inputBorder: isDark ? COLORS.surface[600] : COLORS.surface[300],
  placeholder: COLORS.surface[500],

  // Icons
  icon: isDark ? COLORS.surface[500] : COLORS.surface[600],
  iconMuted: isDark ? COLORS.surface[600] : COLORS.surface[400],

  // Status
  ...COLORS.status,

  // Primary
  primary: COLORS.primary[500],
});

// Export all theme utilities
export default {
  COLORS,
  COURT_DIMENSIONS,
  TOUCH_TARGETS,
  ANIMATIONS,
  STAT_BUTTON_CONFIG,
  SHOT_ZONES,
  NAV_COLORS,
  getHeatmapColor,
  courtToSvgCoords,
  svgToCourtCoords,
  getShotZone,
  getThemedColors,
};
