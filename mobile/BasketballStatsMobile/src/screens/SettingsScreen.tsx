import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, ThemeMode } from "../contexts/ThemeContext";
import Icon from "../components/Icon";

// Column definitions for export
const playerStatsColumns = [
  { key: "playerName", label: "Player" },
  { key: "team", label: "Team" },
  { key: "gamesPlayed", label: "GP" },
  { key: "avgPoints", label: "PPG" },
  { key: "avgRebounds", label: "RPG" },
  { key: "avgAssists", label: "APG" },
  { key: "avgSteals", label: "SPG" },
  { key: "avgBlocks", label: "BPG" },
  { key: "fieldGoalPercentage", label: "FG%" },
  { key: "threePointPercentage", label: "3P%" },
  { key: "freeThrowPercentage", label: "FT%" },
];

const standingsColumns = [
  { key: "teamName", label: "Team" },
  { key: "wins", label: "Wins" },
  { key: "losses", label: "Losses" },
  { key: "winPercentage", label: "Win %" },
  { key: "gamesBack", label: "GB" },
  { key: "homeRecord", label: "Home" },
  { key: "awayRecord", label: "Away" },
  { key: "avgPointsFor", label: "PPG" },
  { key: "avgPointsAgainst", label: "OPPG" },
  { key: "pointDiff", label: "Diff" },
  { key: "streak", label: "Streak" },
];

// Helper to convert data to CSV
function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; label: string }[]
): string {
  if (data.length === 0) return "";

  const header = columns.map((col) => `"${col.label}"`).join(",");
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
        if (Array.isArray(value)) return `"${value.join(" ")}"`;
        return `"${value}"`;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

interface SettingRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingRow({ icon, title, subtitle, onPress, rightElement }: SettingRowProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full justify-center items-center mr-4">
        <Icon name={icon as any} size={20} color="#9CA3AF" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 dark:text-white font-medium text-base">{title}</Text>
        {subtitle && <Text className="text-gray-600 dark:text-gray-400 text-sm">{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <Icon name="chevron-right" size={20} color="#9CA3AF" />)}
    </TouchableOpacity>
  );
}

const themeModeLabels: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const themeModeIcons: Record<ThemeMode, string> = {
  system: "settings",
  light: "basketball",
  dark: "moon",
};

export default function SettingsScreen() {
  const { token, selectedLeague } = useAuth();
  const { mode, setMode } = useTheme();
  const [gameNotifications, setGameNotifications] = useState(true);
  const [scoreUpdates, setScoreUpdates] = useState(true);
  const [leagueAnnouncements, setLeagueAnnouncements] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data for export
  const playersData = useQuery(
    api.statistics.getPlayersStats,
    token && selectedLeague ? { token, leagueId: selectedLeague.id, perPage: 100 } : "skip"
  );

  const standingsData = useQuery(
    api.statistics.getStandings,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const handleExportPlayerStats = async () => {
    if (!playersData?.players || playersData.players.length === 0) {
      Alert.alert("No Data", "No player statistics available to export");
      return;
    }

    setIsExporting(true);
    try {
      const csv = toCSV(playersData.players, playerStatsColumns);
      const filename = `player_stats_${selectedLeague?.name || "league"}_${new Date().toISOString().split("T")[0]}`;

      await Share.share({
        message: csv,
        title: `${filename}.csv`,
      });
    } catch (error: any) {
      if (error.message !== "User did not share") {
        Alert.alert("Error", "Failed to export player statistics");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportStandings = async () => {
    if (!standingsData?.standings || standingsData.standings.length === 0) {
      Alert.alert("No Data", "No standings data available to export");
      return;
    }

    setIsExporting(true);
    try {
      const csv = toCSV(standingsData.standings, standingsColumns);
      const filename = `standings_${selectedLeague?.name || "league"}_${new Date().toISOString().split("T")[0]}`;

      await Share.share({
        message: csv,
        title: `${filename}.csv`,
      });
    } catch (error: any) {
      if (error.message !== "User did not share") {
        Alert.alert("Error", "Failed to export standings");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    if (
      (!playersData?.players || playersData.players.length === 0) &&
      (!standingsData?.standings || standingsData.standings.length === 0)
    ) {
      Alert.alert("No Data", "No data available to export");
      return;
    }

    setIsExporting(true);
    try {
      let fullExport = "";

      if (standingsData?.standings && standingsData.standings.length > 0) {
        fullExport += "=== STANDINGS ===\n\n";
        fullExport += toCSV(standingsData.standings, standingsColumns);
        fullExport += "\n\n";
      }

      if (playersData?.players && playersData.players.length > 0) {
        fullExport += "=== PLAYER STATISTICS ===\n\n";
        fullExport += toCSV(playersData.players, playerStatsColumns);
      }

      const filename = `league_data_${selectedLeague?.name || "league"}_${new Date().toISOString().split("T")[0]}`;

      await Share.share({
        message: fullExport,
        title: `${filename}.csv`,
      });
    } catch (error: any) {
      if (error.message !== "User did not share") {
        Alert.alert("Error", "Failed to export data");
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-gray-100 dark:bg-gray-800 p-5 pt-16">
        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">Settings</Text>
        {selectedLeague && (
          <Text className="text-gray-600 dark:text-gray-400 text-base">{selectedLeague.name}</Text>
        )}
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Appearance */}
        <View className="mb-6">
          <Text className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-3 uppercase">
            Appearance
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <Text className="text-gray-900 dark:text-white font-medium mb-3">Theme</Text>
            <View className="flex-row gap-2">
              {(["system", "light", "dark"] as ThemeMode[]).map((themeMode) => (
                <TouchableOpacity
                  key={themeMode}
                  onPress={() => setMode(themeMode)}
                  className={`flex-1 py-3 px-4 rounded-lg items-center ${
                    mode === themeMode
                      ? "bg-primary-500"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  <Icon
                    name={themeModeIcons[themeMode] as any}
                    size={20}
                    color={mode === themeMode ? "#FFFFFF" : "#9CA3AF"}
                  />
                  <Text
                    className={`mt-1 text-sm font-medium ${
                      mode === themeMode
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {themeModeLabels[themeMode]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notification Preferences */}
        <View className="mb-6">
          <Text className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-3 uppercase">
            Notifications
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <SettingRow
              icon="basketball"
              title="Game Notifications"
              subtitle="Alerts when games start, pause, or end"
              rightElement={
                <Switch
                  value={gameNotifications}
                  onValueChange={setGameNotifications}
                  trackColor={{ false: "#374151", true: "#F97316" }}
                  thumbColor={gameNotifications ? "#FFFFFF" : "#9CA3AF"}
                />
              }
            />
            <SettingRow
              icon="stats"
              title="Score Updates"
              subtitle="Real-time score notifications during games"
              rightElement={
                <Switch
                  value={scoreUpdates}
                  onValueChange={setScoreUpdates}
                  trackColor={{ false: "#374151", true: "#F97316" }}
                  thumbColor={scoreUpdates ? "#FFFFFF" : "#9CA3AF"}
                />
              }
            />
            <View className="flex-row items-center py-4">
              <View className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full justify-center items-center mr-4">
                <Icon name="basketball" size={20} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-medium text-base">
                  League Announcements
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
                  Important updates from league admins
                </Text>
              </View>
              <Switch
                value={leagueAnnouncements}
                onValueChange={setLeagueAnnouncements}
                trackColor={{ false: "#374151", true: "#F97316" }}
                thumbColor={leagueAnnouncements ? "#FFFFFF" : "#9CA3AF"}
              />
            </View>
          </View>
        </View>

        {/* Data Export - Only show if league selected */}
        {selectedLeague && (
          <View className="mb-6">
            <Text className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-3 uppercase">
              Data Export
            </Text>
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <SettingRow
                icon="stats"
                title="Export Player Statistics"
                subtitle="Download player stats as CSV"
                onPress={handleExportPlayerStats}
              />
              <SettingRow
                icon="basketball"
                title="Export Standings"
                subtitle="Download league standings as CSV"
                onPress={handleExportStandings}
              />
              <SettingRow
                icon="user"
                title="Export All Data"
                subtitle="Download all league data"
                onPress={handleExportAll}
              />
            </View>
            {isExporting && (
              <Text className="text-gray-600 dark:text-gray-400 text-sm mt-2 text-center">
                Preparing export...
              </Text>
            )}
          </View>
        )}

        {/* App Info */}
        <View className="mb-6">
          <Text className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-3 uppercase">
            About
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center py-4 border-b border-gray-200 dark:border-gray-700">
              <View className="w-10 h-10 bg-primary-500/20 rounded-full justify-center items-center mr-4">
                <Icon name="basketball" size={20} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-medium text-base">
                  Basketball Stats
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm">Version 1.0.0</Text>
              </View>
            </View>
            <View className="flex-row items-center py-4">
              <View className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full justify-center items-center mr-4">
                <Icon name="user" size={20} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-medium text-base">
                  Powered by Convex
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
                  Real-time database & backend
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
