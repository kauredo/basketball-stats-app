import React, { useState, useRef, useEffect } from "react";
import { BaseModal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton } from "../ui/BaseModal";
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChartBarSquareIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SunIcon,
  MoonIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { useExport } from "../../hooks/useExport";
import { PrintableShotChart } from "./PrintableShotChart";
import type {
  ExportFormat,
  ExportType,
  GameExportData,
  ExportShotLocation,
} from "../../utils/export/types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameData?: GameExportData;
  defaultExportType?: ExportType;
  defaultFormat?: ExportFormat;
}

interface ContentOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

export function ExportModal({
  isOpen,
  onClose,
  gameData,
  defaultExportType = "game-report",
  defaultFormat = "pdf",
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [includeHeatmap, setIncludeHeatmap] = useState(false);
  const [contentOptions, setContentOptions] = useState<ContentOption[]>([
    {
      id: "boxScore",
      label: "Box Score",
      description: "Player statistics for both teams",
      icon: TableCellsIcon,
      enabled: true,
    },
    {
      id: "shotCharts",
      label: "Shot Charts",
      description: "Visual shot distribution",
      icon: ChartBarSquareIcon,
      enabled: true,
    },
    {
      id: "playByPlay",
      label: "Play-by-Play",
      description: "Game events timeline",
      icon: ClipboardDocumentListIcon,
      enabled: false,
    },
  ]);

  const homeCourtRef = useRef<HTMLDivElement>(null);
  const awayCourtRef = useRef<HTMLDivElement>(null);

  const { progress, isExporting, actions } = useExport({
    onComplete: () => {
      // Auto-close modal after successful export
      setTimeout(() => {
        actions.reset();
        onClose();
      }, 1500);
    },
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      actions.reset();
    }
  }, [isOpen, actions]);

  const toggleContentOption = (id: string) => {
    setContentOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, enabled: !opt.enabled } : opt))
    );
  };

  // Transform game shots for PrintableShotChart
  const getTeamShots = (teamId: string): ExportShotLocation[] => {
    if (!gameData) return [];
    return gameData.shots
      .filter((s) => s.teamId === teamId)
      .map((s) => ({
        x: s.x,
        y: s.y,
        made: s.made,
        is3pt: s.shotType === "3pt",
      }));
  };

  const handleExport = async () => {
    if (!gameData) return;

    if (format === "csv") {
      const boxScoreEnabled = contentOptions.find((o) => o.id === "boxScore")?.enabled;
      const shotsEnabled = contentOptions.find((o) => o.id === "shotCharts")?.enabled;
      const playByPlayEnabled = contentOptions.find((o) => o.id === "playByPlay")?.enabled;

      if (boxScoreEnabled) {
        await actions.exportBoxScore(gameData);
      }
      if (shotsEnabled) {
        await actions.exportShots(gameData);
      }
      if (playByPlayEnabled) {
        await actions.exportPlayByPlay(gameData);
      }
    } else {
      // PDF export
      const shotsEnabled = contentOptions.find((o) => o.id === "shotCharts")?.enabled;

      await actions.exportGameReportPDF(gameData, {
        theme,
        homeCourtRef: shotsEnabled ? homeCourtRef : undefined,
        awayCourtRef: shotsEnabled ? awayCourtRef : undefined,
      });
    }
  };

  const hasSelectedContent = contentOptions.some((opt) => opt.enabled);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Export Game Data" maxWidth="lg">
      <ModalHeader
        title="Export Game Data"
        subtitle={
          gameData
            ? `${gameData.homeTeam.name} vs ${gameData.awayTeam.name}`
            : "Select export options"
        }
        variant="default"
      />

      <ModalBody scrollable={true} maxHeight="max-h-[60vh]" className="p-0">
        {/* Format Selector */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            Export Format
          </label>
          <div className="flex gap-3" role="radiogroup" aria-label="Export format">
            <button
              onClick={() => setFormat("pdf")}
              role="radio"
              aria-checked={format === "pdf"}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800 ${
                format === "pdf"
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                  : "border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500 text-surface-700 dark:text-surface-300"
              }`}
            >
              <DocumentArrowDownIcon className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">PDF</span>
            </button>
            <button
              onClick={() => setFormat("csv")}
              role="radio"
              aria-checked={format === "csv"}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800 ${
                format === "csv"
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                  : "border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500 text-surface-700 dark:text-surface-300"
              }`}
            >
              <DocumentTextIcon className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">CSV</span>
            </button>
          </div>
        </div>

        {/* Content Selection */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            Include Content
          </label>
          <div className="space-y-2" role="group" aria-label="Content to include">
            {contentOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleContentOption(option.id)}
                aria-pressed={option.enabled}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800 ${
                  option.enabled
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150 ${
                    option.enabled
                      ? "bg-primary-500 text-white"
                      : "bg-surface-100 dark:bg-surface-700 text-surface-500"
                  }`}
                >
                  <option.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      option.enabled
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-surface-900 dark:text-white"
                    }`}
                  >
                    {option.label}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {option.description}
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${
                    option.enabled
                      ? "border-primary-500 bg-primary-500"
                      : "border-surface-300 dark:border-surface-600"
                  }`}
                >
                  {option.enabled && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PDF Options */}
        {format === "pdf" && (
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
              PDF Options
            </label>

            <div className="space-y-3">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-600 dark:text-surface-400">PDF Theme</span>
                <div className="flex gap-2" role="radiogroup" aria-label="PDF theme">
                  <button
                    onClick={() => setTheme("light")}
                    role="radio"
                    aria-checked={theme === "light"}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800 ${
                      theme === "light"
                        ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900"
                        : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600"
                    }`}
                  >
                    <SunIcon className="w-4 h-4" aria-hidden="true" />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    role="radio"
                    aria-checked={theme === "dark"}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800 ${
                      theme === "dark"
                        ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900"
                        : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600"
                    }`}
                  >
                    <MoonIcon className="w-4 h-4" aria-hidden="true" />
                    Dark
                  </button>
                </div>
              </div>

              {/* Heatmap Toggle */}
              {contentOptions.find((o) => o.id === "shotCharts")?.enabled && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600 dark:text-surface-400">
                    Include Heat Map
                  </span>
                  <button
                    onClick={() => setIncludeHeatmap(!includeHeatmap)}
                    aria-pressed={includeHeatmap}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800 ${
                      includeHeatmap
                        ? "bg-primary-500 text-white"
                        : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600"
                    }`}
                  >
                    <FireIcon className="w-4 h-4" aria-hidden="true" />
                    {includeHeatmap ? "Enabled" : "Disabled"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {isExporting && (
          <div
            className="p-4 bg-primary-50 dark:bg-primary-900/20"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"
                aria-hidden="true"
              ></div>
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                {progress.message}
              </span>
            </div>
            <div
              className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progress.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Export progress"
            >
              <div
                className="h-full bg-primary-500 transition-all duration-300 ease-out"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success State */}
        {progress.status === "complete" && (
          <div
            className="p-4 bg-green-50 dark:bg-green-900/20 flex items-center gap-3"
            role="status"
            aria-live="polite"
          >
            <CheckCircleIcon className="w-6 h-6 text-green-500 shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {progress.message}
            </span>
          </div>
        )}

        {/* Error State */}
        {progress.status === "error" && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 flex items-center gap-3" role="alert">
            <ExclamationCircleIcon className="w-6 h-6 text-red-500 shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              {progress.error || "Export failed. Please try again."}
            </span>
          </div>
        )}

        {/* Hidden Court Components for PDF capture */}
        {format === "pdf" &&
          contentOptions.find((o) => o.id === "shotCharts")?.enabled &&
          gameData && (
            <div className="absolute left-[-9999px] top-0 pointer-events-none">
              <div ref={homeCourtRef}>
                <PrintableShotChart
                  shots={getTeamShots(gameData.homeTeam.id)}
                  theme={theme}
                  showHeatMap={includeHeatmap}
                  title={gameData.homeTeam.name}
                  width={300}
                />
              </div>
              <div ref={awayCourtRef}>
                <PrintableShotChart
                  shots={getTeamShots(gameData.awayTeam.id)}
                  theme={theme}
                  showHeatMap={includeHeatmap}
                  title={gameData.awayTeam.name}
                  width={300}
                />
              </div>
            </div>
          )}
      </ModalBody>

      <ModalFooter align="between">
        <ModalCancelButton onClick={onClose}>Cancel</ModalCancelButton>
        <button
          onClick={handleExport}
          disabled={!gameData || isExporting || !hasSelectedContent}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-colors duration-150 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800 ${
            !gameData || isExporting || !hasSelectedContent
              ? "bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed"
              : "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white"
          }`}
        >
          <DocumentArrowDownIcon className="w-5 h-5" aria-hidden="true" />
          {isExporting ? "Exporting..." : `Export ${format.toUpperCase()}`}
        </button>
      </ModalFooter>
    </BaseModal>
  );
}

export default ExportModal;
