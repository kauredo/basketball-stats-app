/** @type {import('tailwindcss').Config} */

// Design system colors - warm neutrals tinted toward orange
// Moving away from cold grays to create cohesive brand feel
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
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ...sharedColors,
      },
      fontFamily: {
        // Plus Jakarta Sans - geometric, modern, distinctive but professional
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        // Tabular numbers for stats
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        // Display font for dramatic moments
        display: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        // Custom fluid scale for dramatic hierarchy
        "display-xl": ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1.1", fontWeight: "800" }],
        "display-lg": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.15", fontWeight: "700" }],
        "display-md": ["clamp(1.5rem, 3vw, 2rem)", { lineHeight: "1.2", fontWeight: "700" }],
        "stat-xl": [
          "clamp(2.5rem, 6vw, 4.5rem)",
          { lineHeight: "1", fontWeight: "800", letterSpacing: "-0.02em" },
        ],
        "stat-lg": [
          "clamp(1.75rem, 4vw, 2.5rem)",
          { lineHeight: "1", fontWeight: "700", letterSpacing: "-0.01em" },
        ],
      },
      letterSpacing: {
        tighter: "-0.03em",
        display: "-0.02em",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in": "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "shot-marker": "shotMarkerEntrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        ripple: "ripple 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-live": "pulseLive 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shotMarkerEntrance: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        pulseLive: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        glow: {
          from: { boxShadow: "0 0 20px -5px rgba(249, 115, 22, 0.4)" },
          to: { boxShadow: "0 0 30px -5px rgba(249, 115, 22, 0.6)" },
        },
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.08)",
        elevated: "0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 8px 24px -4px rgba(0, 0, 0, 0.12)",
        dramatic: "0 8px 32px -8px rgba(0, 0, 0, 0.2)",
        "glow-orange": "0 0 40px -10px rgba(249, 115, 22, 0.5)",
        "glow-red": "0 0 40px -10px rgba(220, 38, 38, 0.5)",
        "inner-glow": "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-subtle": "linear-gradient(135deg, var(--tw-gradient-stops))",
        noise:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
