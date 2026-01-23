/**
 * useExport Hook
 * State management for export operations with progress tracking
 */

import { useState, useCallback, useRef } from "react";
import type {
  ExportStatus,
  ExportProgress,
  ExportFormat,
  ExportType,
  GameExportData,
} from "../utils/export/types";
import {
  exportBoxScoreCSV,
  exportShotsCSV,
  exportPlayByPlayCSV,
  exportGameCSV,
} from "../utils/export/csv-export";
import {
  generateGameReportPDF,
  generateShotChartPDF,
  downloadPDF,
  captureCourtAsImage,
} from "../utils/export/pdf-export";

interface UseExportOptions {
  onProgress?: (progress: ExportProgress) => void;
  onComplete?: (format: ExportFormat, type: ExportType) => void;
  onError?: (error: Error) => void;
}

interface ExportActions {
  // CSV exports
  exportBoxScore: (gameData: GameExportData) => Promise<void>;
  exportShots: (gameData: GameExportData) => Promise<void>;
  exportPlayByPlay: (gameData: GameExportData) => Promise<void>;
  exportAllCSV: (gameData: GameExportData) => Promise<void>;

  // PDF exports
  exportGameReportPDF: (
    gameData: GameExportData,
    options?: {
      theme?: "light" | "dark";
      homeCourtRef?: React.RefObject<HTMLElement | null>;
      awayCourtRef?: React.RefObject<HTMLElement | null>;
    }
  ) => Promise<void>;

  exportShotChartPDF: (
    courtRef: React.RefObject<HTMLElement | null>,
    options: {
      title: string;
      subtitle?: string;
      theme?: "light" | "dark";
      stats?: {
        totalShots: number;
        madeShots: number;
        percentage: string;
        twoPoint?: { made: number; attempted: number; percentage: string };
        threePoint?: { made: number; attempted: number; percentage: string };
      };
    }
  ) => Promise<void>;

  // Control
  reset: () => void;
}

interface UseExportReturn {
  progress: ExportProgress;
  isExporting: boolean;
  actions: ExportActions;
}

const initialProgress: ExportProgress = {
  status: "idle",
  progress: 0,
  message: "",
};

export function useExport(options: UseExportOptions = {}): UseExportReturn {
  const [progress, setProgress] = useState<ExportProgress>(initialProgress);
  const abortRef = useRef(false);

  const { onProgress, onComplete, onError } = options;

  const updateProgress = useCallback(
    (update: Partial<ExportProgress>) => {
      const newProgress = { ...progress, ...update };
      setProgress(newProgress);
      onProgress?.(newProgress);
    },
    [progress, onProgress]
  );

  const handleError = useCallback(
    (error: Error) => {
      setProgress({
        status: "error",
        progress: 0,
        message: "Export failed",
        error: error.message,
      });
      onError?.(error);
    },
    [onError]
  );

  const reset = useCallback(() => {
    abortRef.current = false;
    setProgress(initialProgress);
  }, []);

  // CSV Exports
  const exportBoxScore = useCallback(
    async (gameData: GameExportData) => {
      try {
        setProgress({ status: "generating", progress: 50, message: "Generating box score CSV..." });
        await new Promise((resolve) => setTimeout(resolve, 100)); // Allow UI update

        exportBoxScoreCSV(gameData);

        setProgress({ status: "complete", progress: 100, message: "Box score exported" });
        onComplete?.("csv", "box-score");
      } catch (error) {
        handleError(error instanceof Error ? error : new Error("Unknown error"));
      }
    },
    [handleError, onComplete]
  );

  const exportShots = useCallback(
    async (gameData: GameExportData) => {
      try {
        setProgress({ status: "generating", progress: 50, message: "Generating shot data CSV..." });
        await new Promise((resolve) => setTimeout(resolve, 100));

        exportShotsCSV(gameData.shots);

        setProgress({ status: "complete", progress: 100, message: "Shot data exported" });
        onComplete?.("csv", "shot-data");
      } catch (error) {
        handleError(error instanceof Error ? error : new Error("Unknown error"));
      }
    },
    [handleError, onComplete]
  );

  const exportPlayByPlay = useCallback(
    async (gameData: GameExportData) => {
      try {
        setProgress({
          status: "generating",
          progress: 50,
          message: "Generating play-by-play CSV...",
        });
        await new Promise((resolve) => setTimeout(resolve, 100));

        exportPlayByPlayCSV(gameData.events);

        setProgress({ status: "complete", progress: 100, message: "Play-by-play exported" });
        onComplete?.("csv", "play-by-play");
      } catch (error) {
        handleError(error instanceof Error ? error : new Error("Unknown error"));
      }
    },
    [handleError, onComplete]
  );

  const exportAllCSV = useCallback(
    async (gameData: GameExportData) => {
      try {
        setProgress({ status: "generating", progress: 33, message: "Generating box score..." });
        await new Promise((resolve) => setTimeout(resolve, 100));
        exportGameCSV(gameData);

        setProgress({ status: "complete", progress: 100, message: "All data exported" });
        onComplete?.("csv", "game-report");
      } catch (error) {
        handleError(error instanceof Error ? error : new Error("Unknown error"));
      }
    },
    [handleError, onComplete]
  );

  // PDF Exports
  const exportGameReportPDF = useCallback(
    async (
      gameData: GameExportData,
      exportOptions?: {
        theme?: "light" | "dark";
        homeCourtRef?: React.RefObject<HTMLElement | null>;
        awayCourtRef?: React.RefObject<HTMLElement | null>;
      }
    ) => {
      try {
        const theme = exportOptions?.theme || "light";
        let homeCourtImage: string | null = null;
        let awayCourtImage: string | null = null;

        setProgress({ status: "preparing", progress: 10, message: "Preparing export..." });
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Capture court images if refs provided
        if (exportOptions?.homeCourtRef?.current) {
          setProgress({
            status: "generating",
            progress: 30,
            message: "Capturing home team shot chart...",
          });
          homeCourtImage = await captureCourtAsImage(exportOptions.homeCourtRef.current, {
            scale: 2,
            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          });
        }

        if (abortRef.current) return;

        if (exportOptions?.awayCourtRef?.current) {
          setProgress({
            status: "generating",
            progress: 50,
            message: "Capturing away team shot chart...",
          });
          awayCourtImage = await captureCourtAsImage(exportOptions.awayCourtRef.current, {
            scale: 2,
            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          });
        }

        if (abortRef.current) return;

        setProgress({ status: "generating", progress: 70, message: "Generating PDF..." });

        const blob = await generateGameReportPDF(gameData, {
          settings: { theme },
          homeCourtImage,
          awayCourtImage,
        });

        if (abortRef.current) return;

        setProgress({ status: "generating", progress: 90, message: "Downloading..." });

        const filename =
          `game-report-${gameData.homeTeam.name}-vs-${gameData.awayTeam.name}`.replace(/\s+/g, "-");
        downloadPDF(blob, filename);

        setProgress({ status: "complete", progress: 100, message: "PDF downloaded" });
        onComplete?.("pdf", "game-report");
      } catch (error) {
        handleError(error instanceof Error ? error : new Error("Unknown error"));
      }
    },
    [handleError, onComplete]
  );

  const exportShotChartPDF = useCallback(
    async (
      courtRef: React.RefObject<HTMLElement | null>,
      exportOptions: {
        title: string;
        subtitle?: string;
        theme?: "light" | "dark";
        stats?: {
          totalShots: number;
          madeShots: number;
          percentage: string;
          twoPoint?: { made: number; attempted: number; percentage: string };
          threePoint?: { made: number; attempted: number; percentage: string };
        };
      }
    ) => {
      try {
        const theme = exportOptions.theme || "light";

        if (!courtRef.current) {
          throw new Error("Court element not found");
        }

        setProgress({ status: "generating", progress: 30, message: "Capturing shot chart..." });

        const courtImage = await captureCourtAsImage(courtRef.current, {
          scale: 2,
          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
        });

        if (abortRef.current) return;

        setProgress({ status: "generating", progress: 70, message: "Generating PDF..." });

        const blob = await generateShotChartPDF(courtImage, {
          title: exportOptions.title,
          subtitle: exportOptions.subtitle,
          stats: exportOptions.stats,
          settings: { theme },
        });

        if (abortRef.current) return;

        setProgress({ status: "generating", progress: 90, message: "Downloading..." });

        const filename = `shot-chart-${exportOptions.title}`.replace(/\s+/g, "-");
        downloadPDF(blob, filename);

        setProgress({ status: "complete", progress: 100, message: "PDF downloaded" });
        onComplete?.("pdf", "player-shot-chart");
      } catch (error) {
        handleError(error instanceof Error ? error : new Error("Unknown error"));
      }
    },
    [handleError, onComplete]
  );

  const isExporting = progress.status === "preparing" || progress.status === "generating";

  return {
    progress,
    isExporting,
    actions: {
      exportBoxScore,
      exportShots,
      exportPlayByPlay,
      exportAllCSV,
      exportGameReportPDF,
      exportShotChartPDF,
      reset,
    },
  };
}

export default useExport;
