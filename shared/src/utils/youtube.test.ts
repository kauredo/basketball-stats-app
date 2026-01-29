import { describe, it, expect } from "vitest";
import {
  extractYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  isValidYouTubeUrl,
} from "./youtube";

describe("YouTube Utilities", () => {
  describe("extractYouTubeId", () => {
    it("extracts ID from youtu.be short URL", () => {
      expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from youtube.com/watch URL", () => {
      expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from youtube.com/embed URL", () => {
      expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from youtube.com/live URL", () => {
      expect(extractYouTubeId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from youtube.com/shorts URL", () => {
      expect(extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from youtube.com/v URL", () => {
      expect(extractYouTubeId("https://www.youtube.com/v/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("handles URL with additional query parameters", () => {
      expect(
        extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLtest")
      ).toBe("dQw4w9WgXcQ");
    });

    it("handles URL without www", () => {
      expect(extractYouTubeId("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("handles http URLs", () => {
      expect(extractYouTubeId("http://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("returns null for empty string", () => {
      expect(extractYouTubeId("")).toBeNull();
    });

    it("returns null for non-YouTube URLs", () => {
      expect(extractYouTubeId("https://vimeo.com/123456789")).toBeNull();
      expect(extractYouTubeId("https://google.com")).toBeNull();
    });

    it("returns null for invalid YouTube URLs", () => {
      expect(extractYouTubeId("https://youtube.com/")).toBeNull();
      expect(extractYouTubeId("https://youtube.com/watch")).toBeNull();
    });

    it("returns null for too-short video IDs", () => {
      // Video ID must be exactly 11 characters
      expect(extractYouTubeId("https://youtu.be/abc")).toBeNull();
    });

    it("extracts first 11 chars from longer paths", () => {
      // The regex captures exactly 11 characters from the path
      expect(extractYouTubeId("https://youtu.be/abcdefghijklm")).toBe("abcdefghijk");
    });

    it("handles video IDs with hyphens and underscores", () => {
      expect(extractYouTubeId("https://youtu.be/abc-def_123")).toBe("abc-def_123");
    });
  });

  describe("getYouTubeEmbedUrl", () => {
    it("generates basic embed URL", () => {
      expect(getYouTubeEmbedUrl("dQw4w9WgXcQ")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
    });

    it("adds autoplay parameter", () => {
      const url = getYouTubeEmbedUrl("dQw4w9WgXcQ", { autoplay: true });
      expect(url).toContain("autoplay=1");
    });

    it("adds mute parameter", () => {
      const url = getYouTubeEmbedUrl("dQw4w9WgXcQ", { mute: true });
      expect(url).toContain("mute=1");
    });

    it("adds start time parameter", () => {
      const url = getYouTubeEmbedUrl("dQw4w9WgXcQ", { start: 120 });
      expect(url).toContain("start=120");
    });

    it("adds rel=0 when rel is false", () => {
      const url = getYouTubeEmbedUrl("dQw4w9WgXcQ", { rel: false });
      expect(url).toContain("rel=0");
    });

    it("does not add rel parameter when rel is true", () => {
      const url = getYouTubeEmbedUrl("dQw4w9WgXcQ", { rel: true });
      expect(url).not.toContain("rel=");
    });

    it("combines multiple options", () => {
      const url = getYouTubeEmbedUrl("dQw4w9WgXcQ", {
        autoplay: true,
        mute: true,
        start: 60,
        rel: false,
      });
      expect(url).toContain("autoplay=1");
      expect(url).toContain("mute=1");
      expect(url).toContain("start=60");
      expect(url).toContain("rel=0");
    });

    it("does not add query string when no options", () => {
      const url = getYouTubeEmbedUrl("dQw4w9WgXcQ");
      expect(url).not.toContain("?");
    });

    it("does not add query string when all options are false/undefined", () => {
      const url = getYouTubeEmbedUrl("dQw4w9WgXcQ", {
        autoplay: false,
        mute: false,
      });
      expect(url).not.toContain("?");
    });
  });

  describe("getYouTubeThumbnailUrl", () => {
    it("generates default quality thumbnail URL", () => {
      expect(getYouTubeThumbnailUrl("dQw4w9WgXcQ", "default")).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg"
      );
    });

    it("generates medium quality thumbnail URL", () => {
      expect(getYouTubeThumbnailUrl("dQw4w9WgXcQ", "medium")).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
      );
    });

    it("generates high quality thumbnail URL", () => {
      expect(getYouTubeThumbnailUrl("dQw4w9WgXcQ", "high")).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
      );
    });

    it("generates maxres quality thumbnail URL", () => {
      expect(getYouTubeThumbnailUrl("dQw4w9WgXcQ", "maxres")).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
      );
    });

    it("defaults to high quality", () => {
      expect(getYouTubeThumbnailUrl("dQw4w9WgXcQ")).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
      );
    });
  });

  describe("isValidYouTubeUrl", () => {
    it("returns true for valid youtu.be URL", () => {
      expect(isValidYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    });

    it("returns true for valid youtube.com watch URL", () => {
      expect(isValidYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
    });

    it("returns true for valid embed URL", () => {
      expect(isValidYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(true);
    });

    it("returns false for empty string", () => {
      expect(isValidYouTubeUrl("")).toBe(false);
    });

    it("returns false for non-YouTube URL", () => {
      expect(isValidYouTubeUrl("https://vimeo.com/123456789")).toBe(false);
    });

    it("returns false for incomplete YouTube URL", () => {
      expect(isValidYouTubeUrl("https://youtube.com/watch")).toBe(false);
    });
  });
});
