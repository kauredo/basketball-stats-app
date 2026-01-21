/** @type {import('tailwindcss').Config} */

// Design system colors - warm neutrals tinted toward orange
// Matches web app design system for consistent cross-platform experience
const sharedColors = {
  primary: {
    50: "#fff8f3",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#F97316", // Main orange
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },
  court: {
    background: "#1a472a",
    lines: "#FFFFFF",
    paint: "#234a1f",
    500: "#1a472a",
  },
  // Warm neutrals - tinted toward orange/brown instead of cold blue-gray
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
  // Keep dark for backwards compatibility during migration
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
  status: {
    active: "#dc2626", // Deeper red
    paused: "#d97706", // Amber
    completed: "#059669", // Emerald
    scheduled: "#2563eb", // Blue
  },
  shots: {
    made2pt: "#2563eb",
    made3pt: "#059669",
    missed2pt: "#d97706",
    missed3pt: "#dc2626",
  },
};

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./App.{js,jsx,ts,tsx}", "./index.ts"],
  theme: {
    extend: {
      colors: {
        ...sharedColors,
      },
      fontFamily: {
        // System fonts optimized for mobile - SF Pro on iOS, Roboto on Android
        sans: ["System", "-apple-system", "BlinkMacSystemFont", "Roboto", "sans-serif"],
        // Tabular numbers for stats display
        mono: ["Menlo", "Courier", "monospace"],
      },
      fontSize: {
        // Custom scale for dramatic stat displays
        "stat-xl": ["48px", { lineHeight: "1", fontWeight: "800", letterSpacing: "-0.02em" }],
        "stat-lg": ["32px", { lineHeight: "1", fontWeight: "700", letterSpacing: "-0.01em" }],
        "stat-md": ["24px", { lineHeight: "1.1", fontWeight: "700" }],
        "display-xl": ["40px", { lineHeight: "1.1", fontWeight: "800" }],
        "display-lg": ["32px", { lineHeight: "1.15", fontWeight: "700" }],
        "display-md": ["24px", { lineHeight: "1.2", fontWeight: "700" }],
      },
      letterSpacing: {
        tighter: "-0.03em",
        display: "-0.02em",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      // Note: Animations in React Native are handled via react-native-reanimated
      // These are kept for reference/documentation
      spacing: {
        "safe-bottom": "34px", // iPhone safe area
        "safe-top": "44px",
      },
    },
  },
  plugins: [],
};
