import React, { useState } from "react";
import { BaseModal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton } from "../ui/BaseModal";
import {
  DocumentArrowDownIcon,
  TrophyIcon,
  ChartBarSquareIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

interface PlayerSeasonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  playerId: string;
  onExport: (options: PlayerSeasonExportOptions) => Promise<void>;
}

export interface PlayerSeasonExportOptions {
  theme: "light" | "dark";
  sections: {
    seasonSummary: boolean;
    shotChart: boolean;
    gameLog: boolean;
    advancedStats: boolean;
  };
}

interface ContentOption {
  id: keyof PlayerSeasonExportOptions["sections"];
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

export function PlayerSeasonExportModal({
  isOpen,
  onClose,
  playerName,
  onExport,
}: PlayerSeasonExportModalProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "complete" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [contentOptions, setContentOptions] = useState<ContentOption[]>([
    {
      id: "seasonSummary",
      label: "Season Summary",
      description: "Player info, key stats, and averages",
      icon: TrophyIcon,
      enabled: true,
    },
    {
      id: "shotChart",
      label: "Shot Chart",
      description: "Visual shot distribution and zone breakdown",
      icon: ChartBarSquareIcon,
      enabled: true,
    },
    {
      id: "gameLog",
      label: "Game Log",
      description: "Game-by-game performance history",
      icon: CalendarDaysIcon,
      enabled: true,
    },
    {
      id: "advancedStats",
      label: "Advanced Analytics",
      description: "TS%, eFG%, PER, and season totals",
      icon: ChartPieIcon,
      enabled: true,
    },
  ]);

  const toggleContentOption = (id: keyof PlayerSeasonExportOptions["sections"]) => {
    setContentOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, enabled: !opt.enabled } : opt))
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus("idle");
    setErrorMessage(null);

    try {
      const sections = contentOptions.reduce(
        (acc, opt) => {
          acc[opt.id] = opt.enabled;
          return acc;
        },
        {} as PlayerSeasonExportOptions["sections"]
      );

      await onExport({
        theme,
        sections,
      });

      setExportStatus("complete");
      setTimeout(() => {
        onClose();
        setExportStatus("idle");
      }, 1500);
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const hasSelectedContent = contentOptions.some((opt) => opt.enabled);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Export Player Season" maxWidth="lg">
      <ModalHeader
        title="Export Player Season"
        subtitle={`${playerName} - Season Report`}
        variant="default"
      />

      <ModalBody scrollable={true} maxHeight="max-h-[60vh]" className="p-0">
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
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  option.enabled
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-surface-200 dark:border-surface-600 hover:border-surface-300"
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

        {/* PDF Theme */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            PDF Theme
          </label>

          <div className="flex items-center justify-between">
            <span className="text-sm text-surface-600 dark:text-surface-400">
              Select appearance
            </span>
            <div className="flex gap-2" role="radiogroup" aria-label="PDF theme">
              <button
                onClick={() => setTheme("light")}
                role="radio"
                aria-checked={theme === "light"}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  theme === "light"
                    ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900"
                    : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400"
                }`}
              >
                <SunIcon className="w-4 h-4" aria-hidden="true" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                role="radio"
                aria-checked={theme === "dark"}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  theme === "dark"
                    ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900"
                    : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400"
                }`}
              >
                <MoonIcon className="w-4 h-4" aria-hidden="true" />
                Dark
              </button>
            </div>
          </div>
        </div>

        {/* Export Summary */}
        <div className="p-4 bg-surface-50 dark:bg-surface-900">
          <p className="text-sm text-surface-600 dark:text-surface-400">
            <span className="font-medium text-surface-900 dark:text-white">Export includes: </span>
            {contentOptions
              .filter((o) => o.enabled)
              .map((o) => o.label)
              .join(", ") || "Nothing selected"}
          </p>
        </div>

        {/* Success State */}
        {exportStatus === "complete" && (
          <div
            className="p-4 bg-green-50 dark:bg-green-900/20 flex items-center gap-3"
            role="status"
            aria-live="polite"
          >
            <CheckCircleIcon className="w-6 h-6 text-green-500 shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Export completed successfully!
            </span>
          </div>
        )}

        {/* Error State */}
        {exportStatus === "error" && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 flex items-center gap-3" role="alert">
            <ExclamationCircleIcon className="w-6 h-6 text-red-500 shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              {errorMessage || "Export failed. Please try again."}
            </span>
          </div>
        )}
      </ModalBody>

      <ModalFooter align="between">
        <ModalCancelButton onClick={onClose}>Cancel</ModalCancelButton>
        <button
          onClick={handleExport}
          disabled={isExporting || !hasSelectedContent}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-colors duration-150 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            isExporting || !hasSelectedContent
              ? "bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed"
              : "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white"
          }`}
        >
          <DocumentArrowDownIcon className="w-5 h-5" aria-hidden="true" />
          {isExporting ? "Exporting..." : "Export PDF"}
        </button>
      </ModalFooter>
    </BaseModal>
  );
}

export default PlayerSeasonExportModal;
