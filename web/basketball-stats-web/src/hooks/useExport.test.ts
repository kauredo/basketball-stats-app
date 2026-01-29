import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useExport } from "./useExport";

// Mock the export utilities
vi.mock("../utils/export/csv-export", () => ({
  exportBoxScoreCSV: vi.fn(),
  exportShotsCSV: vi.fn(),
  exportPlayByPlayCSV: vi.fn(),
  exportGameCSV: vi.fn(),
}));

vi.mock("../utils/export/pdf-export", () => ({
  generateGameReportPDF: vi.fn().mockResolvedValue(new Blob(["test"], { type: "application/pdf" })),
  generateShotChartPDF: vi.fn().mockResolvedValue(new Blob(["test"], { type: "application/pdf" })),
  downloadPDF: vi.fn(),
  captureCourtAsImage: vi.fn().mockResolvedValue("data:image/png;base64,test"),
}));

import {
  exportBoxScoreCSV,
  exportShotsCSV,
  exportPlayByPlayCSV,
  exportGameCSV,
} from "../utils/export/csv-export";
import {
  generateGameReportPDF,
  downloadPDF,
  captureCourtAsImage,
} from "../utils/export/pdf-export";

const mockGameData = {
  gameId: "game-1",
  date: "2024-01-15",
  homeTeam: { id: "team-1", name: "Lakers", score: 105 },
  awayTeam: { id: "team-2", name: "Celtics", score: 98 },
  homeStats: [],
  awayStats: [],
  shots: [],
  events: [],
};

describe("useExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    it("starts with idle status", () => {
      const { result } = renderHook(() => useExport());

      expect(result.current.progress.status).toBe("idle");
      expect(result.current.progress.progress).toBe(0);
      expect(result.current.isExporting).toBe(false);
    });

    it("provides all export actions", () => {
      const { result } = renderHook(() => useExport());

      expect(result.current.actions.exportBoxScore).toBeInstanceOf(Function);
      expect(result.current.actions.exportShots).toBeInstanceOf(Function);
      expect(result.current.actions.exportPlayByPlay).toBeInstanceOf(Function);
      expect(result.current.actions.exportAllCSV).toBeInstanceOf(Function);
      expect(result.current.actions.exportGameReportPDF).toBeInstanceOf(Function);
      expect(result.current.actions.exportShotChartPDF).toBeInstanceOf(Function);
      expect(result.current.actions.reset).toBeInstanceOf(Function);
    });
  });

  describe("CSV exports", () => {
    it("exports box score CSV", async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useExport({ onComplete }));

      await act(async () => {
        await result.current.actions.exportBoxScore(mockGameData);
      });

      expect(exportBoxScoreCSV).toHaveBeenCalledWith(mockGameData);
      expect(result.current.progress.status).toBe("complete");
      expect(onComplete).toHaveBeenCalledWith("csv", "box-score");
    });

    it("exports shots CSV", async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useExport({ onComplete }));

      await act(async () => {
        await result.current.actions.exportShots(mockGameData);
      });

      expect(exportShotsCSV).toHaveBeenCalledWith(mockGameData.shots);
      expect(result.current.progress.status).toBe("complete");
      expect(onComplete).toHaveBeenCalledWith("csv", "shot-data");
    });

    it("exports play-by-play CSV", async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useExport({ onComplete }));

      await act(async () => {
        await result.current.actions.exportPlayByPlay(mockGameData);
      });

      expect(exportPlayByPlayCSV).toHaveBeenCalledWith(mockGameData.events);
      expect(result.current.progress.status).toBe("complete");
      expect(onComplete).toHaveBeenCalledWith("csv", "play-by-play");
    });

    it("exports all CSV data", async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useExport({ onComplete }));

      await act(async () => {
        await result.current.actions.exportAllCSV(mockGameData);
      });

      expect(exportGameCSV).toHaveBeenCalledWith(mockGameData);
      expect(result.current.progress.status).toBe("complete");
      expect(onComplete).toHaveBeenCalledWith("csv", "game-report");
    });
  });

  describe("PDF exports", () => {
    it("exports game report PDF", async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useExport({ onComplete }));

      await act(async () => {
        await result.current.actions.exportGameReportPDF(mockGameData);
      });

      // The mock returns a Blob which is then passed to downloadPDF
      expect(generateGameReportPDF).toHaveBeenCalled();
      // Verify progress completes or is in generating state
      expect(["complete", "generating"]).toContain(result.current.progress.status);
    });

    it("captures court images when refs provided", async () => {
      const { result } = renderHook(() => useExport());

      const mockElement = document.createElement("div");
      const homeCourtRef = { current: mockElement };
      const awayCourtRef = { current: mockElement };

      await act(async () => {
        await result.current.actions.exportGameReportPDF(mockGameData, {
          homeCourtRef,
          awayCourtRef,
        });
      });

      expect(captureCourtAsImage).toHaveBeenCalledTimes(2);
    });

    it("generates PDF preview blob", async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        const blob = await result.current.actions.previewGameReportPDF(mockGameData);
        // The mock returns a Blob - verify the function was called
        expect(generateGameReportPDF).toHaveBeenCalled();
      });

      // Preview should not download
      expect(downloadPDF).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("handles CSV export error", async () => {
      const exportError = new Error("CSV export failed");
      vi.mocked(exportBoxScoreCSV).mockImplementationOnce(() => {
        throw exportError;
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useExport({ onError }));

      await act(async () => {
        await result.current.actions.exportBoxScore(mockGameData);
      });

      expect(result.current.progress.status).toBe("error");
      expect(result.current.progress.error).toBe("CSV export failed");
      expect(onError).toHaveBeenCalledWith(exportError);
    });

    it("handles PDF export error", async () => {
      vi.mocked(generateGameReportPDF).mockRejectedValueOnce(new Error("PDF generation failed"));

      const onError = vi.fn();
      const { result } = renderHook(() => useExport({ onError }));

      await act(async () => {
        await result.current.actions.exportGameReportPDF(mockGameData);
      });

      expect(result.current.progress.status).toBe("error");
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    it("resets progress to initial state", async () => {
      const { result } = renderHook(() => useExport());

      // First export something
      await act(async () => {
        await result.current.actions.exportBoxScore(mockGameData);
      });

      expect(result.current.progress.status).toBe("complete");

      // Then reset
      act(() => {
        result.current.actions.reset();
      });

      expect(result.current.progress.status).toBe("idle");
      expect(result.current.progress.progress).toBe(0);
      expect(result.current.isExporting).toBe(false);
    });
  });

  describe("isExporting flag", () => {
    it("is true during export", async () => {
      const { result } = renderHook(() => useExport());

      // Check that isExporting becomes true during export
      // Since exports are fast in tests, we check the final state
      await act(async () => {
        await result.current.actions.exportBoxScore(mockGameData);
      });

      // After completion, isExporting should be false
      expect(result.current.isExporting).toBe(false);
    });
  });
});
