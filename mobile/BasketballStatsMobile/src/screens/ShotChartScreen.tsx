import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { MiniCourt, type ShotMarker } from "../components/court/MiniCourt";
import { PlayerSelectModal, type PlayerOption } from "../components/PlayerSelectModal";
import { buildExportURL } from "@basketball-stats/shared";

interface StatBoxProps {
  label: string;
  made: number;
  attempted: number;
  percentage: number;
  color: string;
}

function StatBox({ label, made, attempted, percentage, color }: StatBoxProps) {
  return (
    <View className="flex-1 bg-surface-100 dark:bg-surface-700 rounded-lg p-3 mx-1">
      <Text className="text-surface-600 dark:text-surface-400 text-xs mb-1">{label}</Text>
      <Text className="text-surface-900 dark:text-white text-lg font-bold">
        {made}/{attempted}
      </Text>
      <Text style={{ color }} className="text-sm font-medium">
        {percentage}%
      </Text>
    </View>
  );
}

// Web app base URL - configure this based on your deployment
const WEB_APP_BASE_URL = "https://your-app-url.com"; // TODO: Replace with actual URL

export default function ShotChartScreen() {
  const { token, selectedLeague } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMade, setShowMade] = useState(true);
  const [showMissed, setShowMissed] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!selectedPlayer || !selectedLeague) return;

    try {
      setIsExporting(true);
      const exportUrl = buildExportURL(WEB_APP_BASE_URL, {
        type: "player-shot-chart",
        format: "pdf",
        playerId: selectedPlayer.id,
        leagueId: selectedLeague.id,
        theme: "light",
        heatmap: showHeatmap ? "true" : "false",
      });

      const canOpen = await Linking.canOpenURL(exportUrl);
      if (canOpen) {
        await Linking.openURL(exportUrl);
      } else {
        Alert.alert("Cannot Open URL", "Unable to open the export page.");
      }
    } catch (error) {
      Alert.alert("Export Failed", "An error occurred while exporting.");
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch all players for selection using the efficient players.list query
  const playersData = useQuery(
    api.players.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id, activeOnly: true } : "skip"
  );

  // Build player options from players data
  const playerOptions: PlayerOption[] = (playersData?.players || []).map((player) => ({
    id: player.id as Id<"players">,
    name: player.name,
    team: player.team?.name || "Unknown",
    number: player.number,
    position: player.position,
  }));

  // Fetch shot chart data
  const shotChartData = useQuery(
    api.shots.getPlayerShotChart,
    token && selectedLeague && selectedPlayer
      ? { token, leagueId: selectedLeague.id, playerId: selectedPlayer.id }
      : "skip"
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  // Transform and filter shots for MiniCourt display
  // Note: Must be called before any early returns to follow React Hooks rules
  const transformedShots: ShotMarker[] = useMemo(() => {
    if (!shotChartData?.shots) return [];
    return shotChartData.shots
      .filter((shot) => {
        if (shot.made && !showMade) return false;
        if (!shot.made && !showMissed) return false;
        return true;
      })
      .map((shot) => ({
        x: shot.x,
        y: shot.y,
        made: shot.made,
        is3pt: shot.shotType === "3pt",
      }));
  }, [shotChartData?.shots, showMade, showMissed]);

  if (!selectedLeague) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-surface-800 p-8">
        <Icon name="basketball" size={64} color="#6B7280" />
        <Text className="text-surface-900 dark:text-white text-2xl font-bold mb-2 mt-4">
          No League Selected
        </Text>
        <Text className="text-surface-600 dark:text-surface-400 text-base text-center">
          Please select a league to view shot charts.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-800">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-4">
          {/* Player Selector */}
          <TouchableOpacity
            className="bg-white dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 mb-4 flex-row items-center"
            onPress={() => setShowPlayerModal(true)}
          >
            {selectedPlayer ? (
              <>
                <View className="w-12 h-12 bg-primary-500 rounded-full justify-center items-center mr-3">
                  <Text className="text-white font-bold">#{selectedPlayer.number}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-surface-900 dark:text-white font-medium text-lg">
                    {selectedPlayer.name}
                  </Text>
                  <Text className="text-surface-600 dark:text-surface-400">
                    {selectedPlayer.team} • {selectedPlayer.position || "N/A"}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </>
            ) : (
              <>
                <View className="w-12 h-12 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center mr-3">
                  <Icon name="user" size={24} color="#9CA3AF" />
                </View>
                <View className="flex-1">
                  <Text className="text-surface-600 dark:text-surface-400 text-lg">
                    Select a Player
                  </Text>
                  <Text className="text-surface-500">Tap to choose</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </>
            )}
          </TouchableOpacity>

          {shotChartData ? (
            <>
              {/* View Mode Toggle - Shot Type and Heatmap */}
              <View className="flex-row mb-4">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg mr-2 flex-row items-center justify-center ${
                    showMade ? "bg-green-600" : "bg-surface-100 dark:bg-surface-700"
                  }`}
                  onPress={() => {
                    setShowMade(!showMade);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View
                    className={`w-3 h-3 rounded-full mr-2 ${showMade ? "bg-white" : "bg-green-600"}`}
                  />
                  <Text
                    className={`font-medium ${showMade ? "text-white" : "text-surface-600 dark:text-surface-400"}`}
                  >
                    Made ({shotChartData.stats.madeShots})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ml-2 flex-row items-center justify-center ${
                    showMissed ? "bg-red-600" : "bg-surface-100 dark:bg-surface-700"
                  }`}
                  onPress={() => {
                    setShowMissed(!showMissed);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View
                    className={`w-3 h-3 rounded-full mr-2 ${showMissed ? "bg-white" : "bg-red-600"}`}
                  />
                  <Text
                    className={`font-medium ${showMissed ? "text-white" : "text-surface-600 dark:text-surface-400"}`}
                  >
                    Missed ({shotChartData.stats.totalShots - shotChartData.stats.madeShots})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Heatmap Toggle and Export */}
              <View className="flex-row gap-2 mb-4">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
                    showHeatmap ? "bg-primary-500" : "bg-surface-100 dark:bg-surface-700"
                  }`}
                  onPress={() => {
                    setShowHeatmap(!showHeatmap);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Icon name="activity" size={18} color={showHeatmap ? "#FFFFFF" : "#9CA3AF"} />
                  <Text
                    className={`font-medium ml-2 ${showHeatmap ? "text-white" : "text-surface-600 dark:text-surface-400"}`}
                  >
                    {showHeatmap ? "Heatmap On" : "Heatmap"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-3 px-4 rounded-lg flex-row items-center justify-center bg-primary-500"
                  onPress={handleExport}
                  disabled={isExporting}
                >
                  <Icon name="download" size={18} color="#FFFFFF" />
                  <Text className="font-medium ml-2 text-white">
                    {isExporting ? "..." : "Export"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Shot Chart */}
              <View className="bg-white dark:bg-surface-700 rounded-xl p-4 mb-4 border border-surface-200 dark:border-surface-600 items-center">
                <MiniCourt
                  shots={transformedShots}
                  displayMode="all"
                  showHeatmap={showHeatmap}
                  zoneStats={shotChartData.zoneStats}
                  disabled
                />
                <View className="flex-row items-center mt-4 flex-wrap justify-center">
                  <View className="flex-row items-center mr-4 mb-2">
                    <View className="w-3 h-3 rounded-full mr-2 bg-violet-500" />
                    <Text className="text-surface-600 dark:text-surface-400 text-sm">Made 3PT</Text>
                  </View>
                  <View className="flex-row items-center mr-4 mb-2">
                    <View className="w-3 h-3 rounded-full mr-2 bg-green-500" />
                    <Text className="text-surface-600 dark:text-surface-400 text-sm">Made 2PT</Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    <View className="w-3 h-3 rounded-full mr-2 bg-red-500" />
                    <Text className="text-surface-600 dark:text-surface-400 text-sm">Missed</Text>
                  </View>
                </View>

                {/* Heatmap legend */}
                {showHeatmap && (
                  <View className="flex-row items-center mt-3 pt-3 border-t border-surface-200 dark:border-surface-600">
                    <Text className="text-surface-500 text-xs mr-2">Cold</Text>
                    <View className="flex-row flex-1 h-2 rounded overflow-hidden">
                      <View className="flex-1 bg-red-500" />
                      <View className="flex-1 bg-yellow-500" />
                      <View className="flex-1 bg-green-500" />
                    </View>
                    <Text className="text-surface-500 text-xs ml-2">Hot</Text>
                  </View>
                )}

                {/* Pinch to zoom hint */}
                <Text className="text-surface-500 text-xs mt-3">Pinch to zoom • Drag to pan</Text>
              </View>

              {/* Overall Stats */}
              <View className="bg-white dark:bg-surface-700 rounded-xl p-4 mb-4 border border-surface-200 dark:border-surface-600">
                <Text className="text-surface-900 dark:text-white text-lg font-semibold mb-3">
                  Overall Stats
                </Text>
                <View className="flex-row justify-between items-center">
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-surface-900 dark:text-white">
                      {shotChartData.stats.totalShots}
                    </Text>
                    <Text className="text-surface-600 dark:text-surface-400 text-sm">
                      Total Shots
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-green-500">
                      {shotChartData.stats.madeShots}
                    </Text>
                    <Text className="text-surface-600 dark:text-surface-400 text-sm">Made</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-primary-500">
                      {shotChartData.stats.overallPercentage}%
                    </Text>
                    <Text className="text-surface-600 dark:text-surface-400 text-sm">FG%</Text>
                  </View>
                </View>
              </View>

              {/* Shooting Breakdown */}
              <View className="bg-white dark:bg-surface-700 rounded-xl p-4 mb-4 border border-surface-200 dark:border-surface-600">
                <Text className="text-surface-900 dark:text-white text-lg font-semibold mb-3">
                  Shooting Breakdown
                </Text>
                <View className="flex-row">
                  <StatBox
                    label="2-Pointers"
                    made={shotChartData.stats.twoPoint.made}
                    attempted={shotChartData.stats.twoPoint.attempted}
                    percentage={shotChartData.stats.twoPoint.percentage}
                    color="#10B981"
                  />
                  <StatBox
                    label="3-Pointers"
                    made={shotChartData.stats.threePoint.made}
                    attempted={shotChartData.stats.threePoint.attempted}
                    percentage={shotChartData.stats.threePoint.percentage}
                    color="#3B82F6"
                  />
                  <StatBox
                    label="Free Throws"
                    made={shotChartData.stats.freeThrow.made}
                    attempted={shotChartData.stats.freeThrow.attempted}
                    percentage={shotChartData.stats.freeThrow.percentage}
                    color="#F59E0B"
                  />
                </View>
              </View>

              {/* Zone Stats */}
              {shotChartData.zoneStats && (
                <View className="bg-white dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600">
                  <Text className="text-surface-900 dark:text-white text-lg font-semibold mb-3">
                    Zone Statistics
                  </Text>
                  {Object.entries(shotChartData.zoneStats).map(([zone, stats]) => {
                    if (stats.attempted === 0) return null;
                    const zoneName: Record<string, string> = {
                      paint: "Paint",
                      midrange: "Mid-Range",
                      midrangeLeft: "Mid-Range Left",
                      midrangeRight: "Mid-Range Right",
                      corner3: "Corner 3",
                      corner3Left: "Corner 3 Left",
                      corner3Right: "Corner 3 Right",
                      wing3: "Wing 3",
                      wing3Left: "Wing 3 Left",
                      wing3Right: "Wing 3 Right",
                      top3: "Top of Key 3",
                      ft: "Free Throw",
                    };

                    return (
                      <View
                        key={zone}
                        className="flex-row items-center justify-between py-3 border-b border-surface-200 dark:border-surface-600"
                      >
                        <Text className="text-surface-900 dark:text-white font-medium flex-1">
                          {zoneName[zone] || zone}
                        </Text>
                        <Text className="text-surface-600 dark:text-surface-400 text-sm w-20 text-center">
                          {stats.made}/{stats.attempted}
                        </Text>
                        <Text className="text-primary-500 font-bold w-16 text-right">
                          {stats.percentage}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          ) : selectedPlayer ? (
            <View className="flex-1 justify-center items-center py-12">
              <View className="animate-spin">
                <Icon name="basketball" size={32} color="#F97316" />
              </View>
              <Text className="text-surface-600 dark:text-surface-400 mt-4">
                Loading shot chart...
              </Text>
            </View>
          ) : (
            <View className="bg-white dark:bg-surface-700 rounded-xl p-8 items-center border border-surface-200 dark:border-surface-600">
              <Icon name="stats" size={48} color="#6B7280" />
              <Text className="text-surface-900 dark:text-white text-lg font-medium mt-4 mb-2">
                Select a Player
              </Text>
              <Text className="text-surface-600 dark:text-surface-400 text-center">
                Choose a player above to view their shot chart and shooting statistics.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Player Selection Modal */}
      <PlayerSelectModal
        visible={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        onSelect={setSelectedPlayer}
        players={playerOptions}
        selectedId={selectedPlayer?.id}
        title="Select Player"
      />
    </View>
  );
}
