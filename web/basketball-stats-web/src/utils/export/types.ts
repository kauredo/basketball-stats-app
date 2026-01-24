/**
 * Web Export Types
 * Re-exports shared types and adds web-specific types
 */

// Re-export all shared export types
export type {
  ExportFormat,
  ExportType,
  ExportOptions,
  GameReportOptions,
  ShotChartExportOptions,
  PDFSettings,
  ExportStatus,
  ExportProgress,
  BoxScoreExportRow,
  ShotExportRow,
  PlayByPlayExportRow,
  GameExportData,
  TeamExportData,
  PlayerExportData,
  TeamTotalsData,
  ShotExportData,
  EventExportData,
  PDFGenerationOptions,
  ExportShotLocation,
  ExportURLParams,
  // New export types
  PlayerGameLogExportRow,
  RosterExportRow,
  GameResultExportRow,
  LineupExportRow,
  PairExportRow,
  SeasonSummaryData,
} from "@basketball-stats/shared";

export { DEFAULT_PDF_SETTINGS, buildExportURL, parseExportURL } from "@basketball-stats/shared";

// ============================================
// Web-Specific Types
// ============================================

import type { ExportType, GameExportData } from "@basketball-stats/shared";

/**
 * Props for the ExportModal component (web-only)
 */
export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: string;
  playerId?: string;
  teamId?: string;
  defaultExportType?: ExportType;
  gameData?: GameExportData;
}
