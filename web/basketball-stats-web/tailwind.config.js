/** @type {import('tailwindcss').Config} */

// Import shared theme colors (used as reference - can't import ESM in CJS)
// These values match shared/src/constants/theme.ts
const sharedColors = {
  primary: {
    50: "#fef7ee",
    100: "#fef2e4",
    200: "#fde2c8",
    300: "#fbcba6",
    400: "#f7a462",
    500: "#F97316", // Main orange (unified)
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
  },
  court: {
    background: "#1a472a", // Unified dark court green
    lines: "#FFFFFF",
    paint: "#234a1f",
    500: "#1a472a", // For Tailwind class compatibility
  },
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
  status: {
    active: "#EF4444",
    paused: "#F59E0B",
    completed: "#10B981",
    scheduled: "#3B82F6",
  },
  shots: {
    made2pt: "#3B82F6",
    made3pt: "#22C55E",
    missed2pt: "#F59E0B",
    missed3pt: "#EF4444",
  },
};

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ...sharedColors,
      },
      fontFamily: {
        basketball: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "bounce-ball": "bounce 2s infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "shot-marker": "shotMarkerEntrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        ripple: "ripple 0.6s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shotMarkerEntrance: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};
