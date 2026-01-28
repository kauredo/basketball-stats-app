// Team color utilities for Basketball Stats App

/**
 * Default team colors used when teams don't have custom colors set
 */
export const DEFAULT_TEAM_COLORS = {
  home: { primary: "#3b82f6", secondary: "#ffffff" },
  away: { primary: "#f97316", secondary: "#ffffff" },
};

/**
 * Color palette for team color selection
 * Carefully chosen for visibility and distinctiveness
 */
export const TEAM_COLOR_PALETTE = [
  { name: "Blue", hex: "#3B82F6" },
  { name: "Red", hex: "#EF4444" },
  { name: "Green", hex: "#22C55E" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Rose", hex: "#F43F5E" },
] as const;

export type TeamColorPalette = (typeof TEAM_COLOR_PALETTE)[number];

/**
 * Resolve a team's display color, falling back to default if not set
 * @param teamColor - The team's custom color (hex string) or undefined
 * @param isHomeTeam - Whether this is the home team (affects default color)
 * @returns The hex color string to use
 */
export function resolveTeamColor(
  teamColor: string | undefined,
  isHomeTeam: boolean
): string {
  return (
    teamColor ||
    (isHomeTeam
      ? DEFAULT_TEAM_COLORS.home.primary
      : DEFAULT_TEAM_COLORS.away.primary)
  );
}

/**
 * Resolve both primary and secondary colors for a team
 * @param primaryColor - The team's custom primary color or undefined
 * @param secondaryColor - The team's custom secondary color or undefined
 * @param isHomeTeam - Whether this is the home team (affects default colors)
 * @returns Object with primary and secondary hex color strings
 */
export function resolveTeamColors(
  primaryColor: string | undefined,
  secondaryColor: string | undefined,
  isHomeTeam: boolean
): { primary: string; secondary: string } {
  const defaults = isHomeTeam
    ? DEFAULT_TEAM_COLORS.home
    : DEFAULT_TEAM_COLORS.away;
  return {
    primary: primaryColor || defaults.primary,
    secondary: secondaryColor || defaults.secondary,
  };
}

/**
 * Check if a hex color is light (for determining text contrast)
 * @param hex - Hex color string (with or without #)
 * @returns true if the color is considered light
 */
export function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/**
 * Get contrasting text color (black or white) for a background
 * @param backgroundColor - Hex color string
 * @returns "#000000" for light backgrounds, "#ffffff" for dark backgrounds
 */
export function getContrastingTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? "#000000" : "#ffffff";
}
