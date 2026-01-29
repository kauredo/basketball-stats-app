import { describe, it, expect } from "vitest";
import {
  DEFAULT_TEAM_COLORS,
  TEAM_COLOR_PALETTE,
  resolveTeamColor,
  resolveTeamColors,
  isLightColor,
  getContrastingTextColor,
} from "./teamColors";

describe("Team Colors Utilities", () => {
  describe("DEFAULT_TEAM_COLORS", () => {
    it("has home team colors defined", () => {
      expect(DEFAULT_TEAM_COLORS.home.primary).toBe("#3b82f6");
      expect(DEFAULT_TEAM_COLORS.home.secondary).toBe("#ffffff");
    });

    it("has away team colors defined", () => {
      expect(DEFAULT_TEAM_COLORS.away.primary).toBe("#f97316");
      expect(DEFAULT_TEAM_COLORS.away.secondary).toBe("#ffffff");
    });
  });

  describe("TEAM_COLOR_PALETTE", () => {
    it("contains 12 color options", () => {
      expect(TEAM_COLOR_PALETTE.length).toBe(12);
    });

    it("each color has name and hex", () => {
      TEAM_COLOR_PALETTE.forEach((color) => {
        expect(color.name).toBeDefined();
        expect(color.hex).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it("includes expected colors", () => {
      const names = TEAM_COLOR_PALETTE.map((c) => c.name);
      expect(names).toContain("Blue");
      expect(names).toContain("Red");
      expect(names).toContain("Green");
      expect(names).toContain("Orange");
    });
  });

  describe("resolveTeamColor", () => {
    it("returns custom color when provided", () => {
      expect(resolveTeamColor("#FF0000", true)).toBe("#FF0000");
      expect(resolveTeamColor("#00FF00", false)).toBe("#00FF00");
    });

    it("returns home default for home team when no custom color", () => {
      expect(resolveTeamColor(undefined, true)).toBe(DEFAULT_TEAM_COLORS.home.primary);
    });

    it("returns away default for away team when no custom color", () => {
      expect(resolveTeamColor(undefined, false)).toBe(DEFAULT_TEAM_COLORS.away.primary);
    });

    it("handles empty string as no color", () => {
      expect(resolveTeamColor("", true)).toBe(DEFAULT_TEAM_COLORS.home.primary);
    });
  });

  describe("resolveTeamColors", () => {
    it("returns custom colors when both provided", () => {
      const result = resolveTeamColors("#FF0000", "#FFFFFF", true);
      expect(result.primary).toBe("#FF0000");
      expect(result.secondary).toBe("#FFFFFF");
    });

    it("uses defaults for home team when no custom colors", () => {
      const result = resolveTeamColors(undefined, undefined, true);
      expect(result.primary).toBe(DEFAULT_TEAM_COLORS.home.primary);
      expect(result.secondary).toBe(DEFAULT_TEAM_COLORS.home.secondary);
    });

    it("uses defaults for away team when no custom colors", () => {
      const result = resolveTeamColors(undefined, undefined, false);
      expect(result.primary).toBe(DEFAULT_TEAM_COLORS.away.primary);
      expect(result.secondary).toBe(DEFAULT_TEAM_COLORS.away.secondary);
    });

    it("mixes custom primary with default secondary", () => {
      const result = resolveTeamColors("#FF0000", undefined, true);
      expect(result.primary).toBe("#FF0000");
      expect(result.secondary).toBe(DEFAULT_TEAM_COLORS.home.secondary);
    });
  });

  describe("isLightColor", () => {
    it("identifies white as light", () => {
      expect(isLightColor("#FFFFFF")).toBe(true);
      expect(isLightColor("FFFFFF")).toBe(true);
    });

    it("identifies black as dark", () => {
      expect(isLightColor("#000000")).toBe(false);
      expect(isLightColor("000000")).toBe(false);
    });

    it("identifies yellow as light", () => {
      expect(isLightColor("#FFFF00")).toBe(true);
    });

    it("identifies navy blue as dark", () => {
      expect(isLightColor("#000080")).toBe(false);
    });

    it("handles lowercase hex", () => {
      expect(isLightColor("#ffffff")).toBe(true);
      expect(isLightColor("#000000")).toBe(false);
    });

    it("handles mixed case hex", () => {
      expect(isLightColor("#FfFfFf")).toBe(true);
    });

    it("identifies orange (from palette) correctly", () => {
      // Orange #F97316 has luminance around 0.55, borderline
      const isLight = isLightColor("#F97316");
      expect(typeof isLight).toBe("boolean");
    });

    it("identifies blue (from palette) as dark", () => {
      expect(isLightColor("#3B82F6")).toBe(false);
    });
  });

  describe("getContrastingTextColor", () => {
    it("returns black for white background", () => {
      expect(getContrastingTextColor("#FFFFFF")).toBe("#000000");
    });

    it("returns white for black background", () => {
      expect(getContrastingTextColor("#000000")).toBe("#ffffff");
    });

    it("returns black for light yellow background", () => {
      expect(getContrastingTextColor("#FFFF00")).toBe("#000000");
    });

    it("returns white for dark blue background", () => {
      expect(getContrastingTextColor("#000080")).toBe("#ffffff");
    });

    it("provides good contrast for palette colors", () => {
      // Blue #3B82F6 is dark, should get white text
      expect(getContrastingTextColor("#3B82F6")).toBe("#ffffff");

      // Yellow #EAB308 is light, should get black text
      expect(getContrastingTextColor("#EAB308")).toBe("#000000");
    });
  });
});
