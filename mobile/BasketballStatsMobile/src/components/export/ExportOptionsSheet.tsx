import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "../Icon";
import { buildExportURL, type ExportFormat, type ExportType } from "@basketball-stats/shared";
import { WEB_APP_BASE_URL, EXPORT_CONFIG } from "../../constants/config";

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface ExportOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: string;
  playerId?: string;
  teamId?: string;
  leagueId?: string;
  exportType?: ExportType;
  title?: string;
  /** Number of items being exported (for large dataset warnings) */
  dataCount?: number;
}

export function ExportOptionsSheet({
  isOpen,
  onClose,
  gameId,
  playerId,
  teamId,
  leagueId,
  exportType = "game-report",
  title = "Export Data",
  dataCount,
}: ExportOptionsSheetProps) {
  const isLargeDataset =
    dataCount !== undefined && dataCount > EXPORT_CONFIG.LARGE_DATASET_THRESHOLD;
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [includeHeatmap, setIncludeHeatmap] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [contentOptions, setContentOptions] = useState<ExportOption[]>([
    {
      id: "boxScore",
      label: "Box Score",
      description: "Player statistics",
      icon: "table",
      enabled: true,
    },
    {
      id: "shotCharts",
      label: "Shot Charts",
      description: "Visual shot distribution",
      icon: "chart-bar",
      enabled: true,
    },
    {
      id: "playByPlay",
      label: "Play-by-Play",
      description: "Game events",
      icon: "clipboard-list",
      enabled: false,
    },
  ]);

  const toggleContentOption = (id: string) => {
    setContentOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, enabled: !opt.enabled } : opt))
    );
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Build the export URL
      const exportUrl = buildExportURL(WEB_APP_BASE_URL, {
        type: exportType,
        format,
        gameId,
        playerId,
        teamId,
        leagueId,
        theme,
        heatmap: includeHeatmap ? "true" : "false",
      });

      // Check if we can open the URL
      const canOpen = await Linking.canOpenURL(exportUrl);
      if (canOpen) {
        await Linking.openURL(exportUrl);
        onClose();
      } else {
        Alert.alert(
          "Cannot Open URL",
          "Unable to open the export page. Please try again or export from the web app.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Export Failed", "An error occurred while trying to export. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsExporting(false);
    }
  };

  const hasSelectedContent = contentOptions.some((opt) => opt.enabled);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-surface-50 dark:bg-surface-950">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-surface-200 dark:border-surface-800">
          <TouchableOpacity onPress={onClose} className="p-2">
            <Icon name="x" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-surface-900 dark:text-white">{title}</Text>
          <View className="w-10" />
        </View>

        {/* Content */}
        <View className="flex-1 p-4">
          {/* Format Selector */}
          <Text className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
            Export Format
          </Text>
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => setFormat("pdf")}
              className={`flex-1 flex-row items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 ${
                format === "pdf"
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-surface-200 dark:border-surface-700"
              }`}
            >
              <Icon name="file-text" size={20} color={format === "pdf" ? "#F97316" : "#64748B"} />
              <Text
                className={`font-medium ${
                  format === "pdf"
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-surface-600 dark:text-surface-400"
                }`}
              >
                PDF
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFormat("csv")}
              className={`flex-1 flex-row items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 ${
                format === "csv"
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-surface-200 dark:border-surface-700"
              }`}
            >
              <Icon name="table" size={20} color={format === "csv" ? "#F97316" : "#64748B"} />
              <Text
                className={`font-medium ${
                  format === "csv"
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-surface-600 dark:text-surface-400"
                }`}
              >
                CSV
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Selection */}
          <Text className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
            Include Content
          </Text>
          <View className="gap-2 mb-6">
            {contentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => toggleContentOption(option.id)}
                className={`flex-row items-center gap-3 p-3 rounded-xl border-2 ${
                  option.enabled
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-surface-200 dark:border-surface-700"
                }`}
              >
                <View
                  className={`w-10 h-10 rounded-lg items-center justify-center ${
                    option.enabled ? "bg-primary-500" : "bg-surface-100 dark:bg-surface-800"
                  }`}
                >
                  <Icon
                    name={option.icon as any}
                    size={20}
                    color={option.enabled ? "#FFFFFF" : "#64748B"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-medium ${
                      option.enabled
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-surface-900 dark:text-white"
                    }`}
                  >
                    {option.label}
                  </Text>
                  <Text className="text-sm text-surface-500 dark:text-surface-400">
                    {option.description}
                  </Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    option.enabled
                      ? "border-primary-500 bg-primary-500"
                      : "border-surface-300 dark:border-surface-600"
                  }`}
                >
                  {option.enabled && <Icon name="check" size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* PDF Options */}
          {format === "pdf" && (
            <>
              <Text className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
                PDF Options
              </Text>
              <View className="gap-3 mb-6">
                {/* Theme Toggle */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-surface-600 dark:text-surface-400">Theme</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setTheme("light")}
                      className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg ${
                        theme === "light"
                          ? "bg-surface-900 dark:bg-white"
                          : "bg-surface-100 dark:bg-surface-800"
                      }`}
                    >
                      <Icon
                        name="sun"
                        size={16}
                        color={theme === "light" ? "#FFFFFF" : "#64748B"}
                      />
                      <Text
                        className={`text-sm font-medium ${
                          theme === "light"
                            ? "text-white dark:text-surface-900"
                            : "text-surface-600 dark:text-surface-400"
                        }`}
                      >
                        Light
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setTheme("dark")}
                      className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg ${
                        theme === "dark"
                          ? "bg-surface-900 dark:bg-white"
                          : "bg-surface-100 dark:bg-surface-800"
                      }`}
                    >
                      <Icon
                        name="moon"
                        size={16}
                        color={theme === "dark" ? "#FFFFFF" : "#64748B"}
                      />
                      <Text
                        className={`text-sm font-medium ${
                          theme === "dark"
                            ? "text-white dark:text-surface-900"
                            : "text-surface-600 dark:text-surface-400"
                        }`}
                      >
                        Dark
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Heatmap Toggle */}
                {contentOptions.find((o) => o.id === "shotCharts")?.enabled && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-surface-600 dark:text-surface-400">Include Heat Map</Text>
                    <TouchableOpacity
                      onPress={() => setIncludeHeatmap(!includeHeatmap)}
                      className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg ${
                        includeHeatmap ? "bg-red-500" : "bg-surface-100 dark:bg-surface-800"
                      }`}
                    >
                      <Icon name="flame" size={16} color={includeHeatmap ? "#FFFFFF" : "#64748B"} />
                      <Text
                        className={`text-sm font-medium ${
                          includeHeatmap ? "text-white" : "text-surface-600 dark:text-surface-400"
                        }`}
                      >
                        {includeHeatmap ? "Enabled" : "Disabled"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Large Dataset Warning */}
          {isLargeDataset && (
            <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex-row gap-3 mb-4">
              <Icon name="alert-triangle" size={20} color="#F59E0B" />
              <View className="flex-1">
                <Text className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-1">
                  Large Dataset
                </Text>
                <Text className="text-amber-600 dark:text-amber-400 text-xs">
                  Exporting {dataCount} items may take longer. PDF exports may timeout on very large
                  datasets - consider using CSV format instead.
                </Text>
              </View>
            </View>
          )}

          {/* Info Banner */}
          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex-row gap-3">
            <Icon name="info" size={20} color="#3B82F6" />
            <View className="flex-1">
              <Text className="text-blue-800 dark:text-blue-300 text-sm font-medium mb-1">
                Export via Web
              </Text>
              <Text className="text-blue-600 dark:text-blue-400 text-xs">
                This will open the web app to generate and download your export file.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="p-4 border-t border-surface-200 dark:border-surface-800">
          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting || !hasSelectedContent}
            className={`flex-row items-center justify-center gap-2 py-4 rounded-xl ${
              isExporting || !hasSelectedContent
                ? "bg-surface-200 dark:bg-surface-700"
                : "bg-primary-500"
            }`}
          >
            {isExporting ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white font-semibold">Opening...</Text>
              </>
            ) : (
              <>
                <Icon name="download" size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold">Export {format.toUpperCase()}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default ExportOptionsSheet;
