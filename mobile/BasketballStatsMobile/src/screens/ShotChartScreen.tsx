import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import Svg, { Rect, Circle, Line, Path, G, Defs, RadialGradient, Stop } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { COLORS, COURT_DIMENSIONS, getShotZone, getHeatmapColor } from "@basketball-stats/shared";

const screenWidth = Dimensions.get("window").width;
const COURT_WIDTH = screenWidth - 32;
const COURT_HEIGHT = COURT_WIDTH * 0.94; // NBA half-court ratio

interface PlayerOption {
  id: Id<"players">;
  name: string;
  team: string;
  number: number;
  position?: string;
}

interface Shot {
  id: string;
  x: number;
  y: number;
  shotType: "2pt" | "3pt" | "ft";
  made: boolean;
  quarter: number;
  shotZone?: string;
}

interface ZoneStats {
  made: number;
  attempted: number;
  percentage: number;
}

interface PlayerSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (player: PlayerOption) => void;
  players: PlayerOption[];
  title: string;
}

function PlayerSelectModal({ visible, onClose, onSelect, players, title }: PlayerSelectModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-gray-800 rounded-t-3xl max-h-[70%]">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-gray-900 dark:text-white text-lg font-bold">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="p-4 border-b border-gray-200 dark:border-gray-700 flex-row items-center"
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <View className="w-10 h-10 bg-primary-500 rounded-full justify-center items-center mr-3">
                  <Text className="text-white font-bold">#{item.number}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-medium text-base">
                    {item.name}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400 text-sm">
                    {item.team} • {item.position || "N/A"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="p-8 items-center">
                <Text className="text-gray-600 dark:text-gray-400">No players available</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

// Animated Shot Marker Component
function AnimatedShotMarker({ shot, index }: { shot: Shot; index: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const delay = index * 50;
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const svgX = 25 + shot.x;
  const svgY = shot.y;
  const markerColor = shot.made ? COLORS.shots.made3pt : COLORS.shots.missed3pt;

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          left: (svgX / 50) * COURT_WIDTH - 6,
          top: (svgY / 47) * COURT_HEIGHT - 6,
          width: 12,
          height: 12,
        },
      ]}
    >
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: shot.made ? 6 : 0,
          backgroundColor: shot.made ? markerColor : "transparent",
          borderWidth: shot.made ? 1.5 : 0,
          borderColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {!shot.made && (
          <Text style={{ color: markerColor, fontSize: 12, fontWeight: "bold" }}>✕</Text>
        )}
      </View>
    </Animated.View>
  );
}

// Interactive Basketball court SVG component with gestures and heatmap
interface BasketballCourtProps {
  shots: Shot[];
  showHeatmap?: boolean;
  interactive?: boolean;
  onCourtTap?: (x: number, y: number, zone: string) => void;
  zoneStats?: Record<string, ZoneStats>;
}

function BasketballCourt({
  shots,
  showHeatmap = false,
  interactive = false,
  onCourtTap,
  zoneStats,
}: BasketballCourtProps) {
  // Gesture animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Tap gesture for recording shots
  const handleTap = useCallback(
    (tapX: number, tapY: number) => {
      if (!onCourtTap) return;

      // Convert tap coordinates to court coordinates
      const courtX = (tapX / COURT_WIDTH) * 50 - 25;
      const courtY = (tapY / COURT_HEIGHT) * 47;

      // Get shot zone
      const zone = getShotZone(courtX, courtY);

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      onCourtTap(courtX, courtY, zone);
    },
    [onCourtTap]
  );

  const tapGesture = Gesture.Tap()
    .enabled(interactive)
    .onEnd((event) => {
      runOnJS(handleTap)(event.x, event.y);
    });

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(3, savedScale.value * event.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // Pan gesture for navigation when zoomed
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        const maxTranslate = ((scale.value - 1) * COURT_WIDTH) / 2;
        translateX.value = Math.max(
          -maxTranslate,
          Math.min(maxTranslate, savedTranslateX.value + event.translationX)
        );
        translateY.value = Math.max(
          -maxTranslate,
          Math.min(maxTranslate, savedTranslateY.value + event.translationY)
        );
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(
    tapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Calculate heatmap colors for zones
  const getZoneColor = (zoneName: string): string => {
    if (!showHeatmap || !zoneStats || !zoneStats[zoneName]) return "transparent";
    const stats = zoneStats[zoneName];
    if (stats.attempted === 0) return "transparent";
    return getHeatmapColor(stats.percentage / 100, 0.4);
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.courtContainer, animatedStyle]}>
        <Svg width={COURT_WIDTH} height={COURT_HEIGHT} viewBox="0 0 50 47">
          {/* Court background with unified color */}
          <Rect x="0" y="0" width="50" height="47" fill={COLORS.court.background} />

          {/* Heatmap zones */}
          {showHeatmap && (
            <>
              {/* Paint zone */}
              <Rect x="17" y="0" width="16" height="19" fill={getZoneColor("paint")} />

              {/* Left midrange */}
              <Path
                d="M 3 0 L 3 14 L 17 14 L 17 19 L 33 19 L 33 14 L 17 14 L 17 0 Z"
                fill={getZoneColor("midrangeLeft")}
              />

              {/* Right midrange */}
              <Path
                d="M 47 0 L 47 14 L 33 14 L 33 19 L 17 19 L 17 14 L 33 14 L 33 0 Z"
                fill={getZoneColor("midrangeRight")}
              />

              {/* Left corner 3 */}
              <Rect x="0" y="0" width="3" height="14" fill={getZoneColor("corner3Left")} />

              {/* Right corner 3 */}
              <Rect x="47" y="0" width="3" height="14" fill={getZoneColor("corner3Right")} />

              {/* Wing and top 3 zones (simplified as a ring) */}
              <Path
                d="M 3 14 A 23.75 23.75 0 0 0 47 14 L 47 47 L 3 47 Z"
                fill={getZoneColor("top3")}
              />
            </>
          )}

          {/* Court outline */}
          <Rect x="0" y="0" width="50" height="47" fill="none" stroke="#4A5568" strokeWidth="0.3" />

          {/* Paint/Key area */}
          <Rect
            x="17"
            y="0"
            width="16"
            height="19"
            fill="none"
            stroke="#4A5568"
            strokeWidth="0.3"
          />

          {/* Free throw circle */}
          <Circle cx="25" cy="19" r="6" fill="none" stroke="#4A5568" strokeWidth="0.3" />

          {/* Restricted area arc */}
          <Path d="M 21 0 A 4 4 0 0 0 29 0" fill="none" stroke="#4A5568" strokeWidth="0.3" />

          {/* Basket */}
          <Circle
            cx="25"
            cy="5.25"
            r="0.75"
            fill={COLORS.primary[500]}
            stroke={COLORS.primary[500]}
            strokeWidth="0.2"
          />

          {/* Backboard */}
          <Line x1="22" y1="4" x2="28" y2="4" stroke="#4A5568" strokeWidth="0.3" />

          {/* Three-point line */}
          <Path
            d="M 3 0 L 3 14 A 23.75 23.75 0 0 0 47 14 L 47 0"
            fill="none"
            stroke="#4A5568"
            strokeWidth="0.3"
          />

          {/* Half court line (top of chart) */}
          <Line x1="0" y1="47" x2="50" y2="47" stroke="#4A5568" strokeWidth="0.3" />

          {/* Center circle at half court */}
          <Path d="M 19 47 A 6 6 0 0 1 31 47" fill="none" stroke="#4A5568" strokeWidth="0.3" />

          {/* Plot shots when not using animated markers */}
          {!showHeatmap && (
            <G>
              {shots.map((shot, index) => {
                const svgX = 25 + shot.x;
                const svgY = shot.y;
                const markerColor = shot.made
                  ? shot.shotType === "3pt"
                    ? COLORS.shots.made3pt
                    : COLORS.shots.made2pt
                  : shot.shotType === "3pt"
                    ? COLORS.shots.missed3pt
                    : COLORS.shots.missed2pt;

                return shot.made ? (
                  <Circle
                    key={shot.id || index}
                    cx={svgX}
                    cy={svgY}
                    r={1}
                    fill={markerColor}
                    opacity={0.9}
                    stroke="#fff"
                    strokeWidth={0.15}
                  />
                ) : (
                  <G key={shot.id || index}>
                    <Line
                      x1={svgX - 0.8}
                      y1={svgY - 0.8}
                      x2={svgX + 0.8}
                      y2={svgY + 0.8}
                      stroke={markerColor}
                      strokeWidth={0.3}
                    />
                    <Line
                      x1={svgX + 0.8}
                      y1={svgY - 0.8}
                      x2={svgX - 0.8}
                      y2={svgY + 0.8}
                      stroke={markerColor}
                      strokeWidth={0.3}
                    />
                  </G>
                );
              })}
            </G>
          )}

          {/* Interactive mode indicator */}
          {interactive && (
            <G>
              <Circle cx="25" cy="28" r="0.5" fill={COLORS.primary[500]} opacity={0.8} />
            </G>
          )}
        </Svg>

        {/* Interactive hint */}
        {interactive && (
          <View style={styles.interactiveHint}>
            <Text style={styles.interactiveHintText}>TAP TO RECORD SHOT</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

interface StatBoxProps {
  label: string;
  made: number;
  attempted: number;
  percentage: number;
  color: string;
}

function StatBox({ label, made, attempted, percentage, color }: StatBoxProps) {
  return (
    <View className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mx-1">
      <Text className="text-gray-600 dark:text-gray-400 text-xs mb-1">{label}</Text>
      <Text className="text-gray-900 dark:text-white text-lg font-bold">
        {made}/{attempted}
      </Text>
      <Text style={{ color }} className="text-sm font-medium">
        {percentage}%
      </Text>
    </View>
  );
}

export default function ShotChartScreen() {
  const { token, selectedLeague } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMade, setShowMade] = useState(true);
  const [showMissed, setShowMissed] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Fetch all players for selection
  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Build player options from teams data
  const playerOptions: PlayerOption[] = [];
  if (teamsData?.teams) {
    for (const team of teamsData.teams) {
      if (team.players) {
        for (const player of team.players) {
          playerOptions.push({
            id: player.id as Id<"players">,
            name: player.name,
            team: team.name,
            number: player.number,
            position: player.position,
          });
        }
      }
    }
  }

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

  if (!selectedLeague) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-800 p-8">
        <Icon name="basketball" size={64} color="#6B7280" />
        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-2 mt-4">
          No League Selected
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-base text-center">
          Please select a league to view shot charts.
        </Text>
      </View>
    );
  }

  // Filter shots based on toggle
  const filteredShots: Shot[] =
    shotChartData?.shots.filter((shot) => {
      if (shot.made && !showMade) return false;
      if (!shot.made && !showMissed) return false;
      return true;
    }) || [];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <View className="bg-gray-100 dark:bg-gray-700 p-5 pt-15">
        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">Shot Chart</Text>
        <Text className="text-gray-600 dark:text-gray-400 text-base">
          Visualize shooting performance
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-4">
          {/* Player Selector */}
          <TouchableOpacity
            className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 mb-4 flex-row items-center"
            onPress={() => setShowPlayerModal(true)}
          >
            {selectedPlayer ? (
              <>
                <View className="w-12 h-12 bg-primary-500 rounded-full justify-center items-center mr-3">
                  <Text className="text-white font-bold">#{selectedPlayer.number}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-medium text-lg">
                    {selectedPlayer.name}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400">
                    {selectedPlayer.team} • {selectedPlayer.position || "N/A"}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </>
            ) : (
              <>
                <View className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full justify-center items-center mr-3">
                  <Icon name="user" size={24} color="#9CA3AF" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 dark:text-gray-400 text-lg">Select a Player</Text>
                  <Text className="text-gray-500">Tap to choose</Text>
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
                    showMade ? "bg-green-600" : "bg-gray-100 dark:bg-gray-700"
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
                    className={`font-medium ${showMade ? "text-white" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    Made ({shotChartData.stats.madeShots})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ml-2 flex-row items-center justify-center ${
                    showMissed ? "bg-red-600" : "bg-gray-100 dark:bg-gray-700"
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
                    className={`font-medium ${showMissed ? "text-white" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    Missed ({shotChartData.stats.totalShots - shotChartData.stats.madeShots})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Heatmap Toggle */}
              <TouchableOpacity
                className={`py-3 rounded-lg mb-4 flex-row items-center justify-center ${
                  showHeatmap ? "bg-primary-500" : "bg-gray-100 dark:bg-gray-700"
                }`}
                onPress={() => {
                  setShowHeatmap(!showHeatmap);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Icon name="activity" size={18} color={showHeatmap ? "#FFFFFF" : "#9CA3AF"} />
                <Text
                  className={`font-medium ml-2 ${showHeatmap ? "text-white" : "text-gray-600 dark:text-gray-400"}`}
                >
                  {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
                </Text>
              </TouchableOpacity>

              {/* Shot Chart */}
              <View className="bg-white dark:bg-gray-700 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600 items-center">
                <BasketballCourt
                  shots={filteredShots}
                  showHeatmap={showHeatmap}
                  zoneStats={shotChartData.zoneStats}
                />
                <View className="flex-row items-center mt-4 flex-wrap justify-center">
                  <View className="flex-row items-center mr-4 mb-2">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS.shots.made3pt }}
                    />
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">Made 3PT</Text>
                  </View>
                  <View className="flex-row items-center mr-4 mb-2">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS.shots.made2pt }}
                    />
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">Made 2PT</Text>
                  </View>
                  <View className="flex-row items-center mr-4 mb-2">
                    <Text
                      className="mr-2 font-bold"
                      style={{ color: COLORS.shots.missed3pt, fontSize: 14 }}
                    >
                      ✕
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">Missed 3PT</Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    <Text
                      className="mr-2 font-bold"
                      style={{ color: COLORS.shots.missed2pt, fontSize: 14 }}
                    >
                      ✕
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">Missed 2PT</Text>
                  </View>
                </View>

                {/* Heatmap legend */}
                {showHeatmap && (
                  <View className="flex-row items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <Text className="text-gray-500 text-xs mr-2">Cold</Text>
                    <View className="flex-row flex-1 h-2 rounded overflow-hidden">
                      <View className="flex-1 bg-red-500" />
                      <View className="flex-1 bg-yellow-500" />
                      <View className="flex-1 bg-green-500" />
                    </View>
                    <Text className="text-gray-500 text-xs ml-2">Hot</Text>
                  </View>
                )}

                {/* Pinch to zoom hint */}
                <Text className="text-gray-500 text-xs mt-3">Pinch to zoom • Drag to pan</Text>
              </View>

              {/* Overall Stats */}
              <View className="bg-white dark:bg-gray-700 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
                <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-3">
                  Overall Stats
                </Text>
                <View className="flex-row justify-between items-center">
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-gray-900 dark:text-white">
                      {shotChartData.stats.totalShots}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">Total Shots</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-green-500">
                      {shotChartData.stats.madeShots}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">Made</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-primary-500">
                      {shotChartData.stats.overallPercentage}%
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">FG%</Text>
                  </View>
                </View>
              </View>

              {/* Shooting Breakdown */}
              <View className="bg-white dark:bg-gray-700 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
                <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-3">
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
                <View className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-3">
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
                        className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600"
                      >
                        <Text className="text-gray-900 dark:text-white font-medium flex-1">
                          {zoneName[zone] || zone}
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-sm w-20 text-center">
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
              <Text className="text-gray-600 dark:text-gray-400 mt-4">Loading shot chart...</Text>
            </View>
          ) : (
            <View className="bg-white dark:bg-gray-700 rounded-xl p-8 items-center border border-gray-200 dark:border-gray-600">
              <Icon name="stats" size={48} color="#6B7280" />
              <Text className="text-gray-900 dark:text-white text-lg font-medium mt-4 mb-2">
                Select a Player
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-center">
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
        title="Select Player"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  courtContainer: {
    width: COURT_WIDTH,
    height: COURT_HEIGHT,
    overflow: "hidden",
  },
  interactiveHint: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  interactiveHintText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
