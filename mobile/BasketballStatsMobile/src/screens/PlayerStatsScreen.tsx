import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { FontAwesome5 } from "@expo/vector-icons";
import { exportPlayerGameLogCSV } from "../utils/export";

type PlayerStatsRouteProp = RouteProp<RootStackParamList, "PlayerStats">;
type PlayerStatsNavigationProp = NativeStackNavigationProp<RootStackParamList, "PlayerStats">;

interface StatCategory {
  title: string;
  stats: Array<{
    label: string;
    value: string | number;
    highlight?: boolean;
  }>;
}

export default function PlayerStatsScreen() {
  const route = useRoute<PlayerStatsRouteProp>();
  const navigation = useNavigation<PlayerStatsNavigationProp>();
  const { playerId } = route.params;
  const { token, selectedLeague } = useAuth();
  const { resolvedTheme } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"season" | "recent">("season");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    number: "",
    position: "PG" as "PG" | "SG" | "SF" | "PF" | "C",
    heightCm: "",
    weightKg: "",
    active: true,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch player data from Convex
  const playerData = useQuery(
    api.players.get,
    token && playerId ? { token, playerId: playerId as unknown as Id<"players"> } : "skip"
  );

  // Fetch player season stats
  const playerStats = useQuery(
    api.statistics.getPlayerSeasonStats,
    token && playerId && selectedLeague
      ? { token, leagueId: selectedLeague.id, playerId: playerId as unknown as Id<"players"> }
      : "skip"
  );

  // Mutations
  const updatePlayer = useMutation(api.players.update);
  const removePlayer = useMutation(api.players.remove);

  // Initialize edit form when player data loads
  React.useEffect(() => {
    if (playerData?.player) {
      const p = playerData.player;
      setEditForm({
        name: p.name || "",
        number: p.number?.toString() || "",
        position: p.position || "PG",
        heightCm: p.heightCm?.toString() || "",
        weightKg: p.weightKg?.toString() || "",
        active: p.active !== false,
      });
    }
  }, [playerData?.player]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleEditPlayer = async () => {
    if (!editForm.name.trim() || !editForm.number || !token) return;

    setIsUpdating(true);
    try {
      await updatePlayer({
        token,
        playerId: playerId as Id<"players">,
        name: editForm.name.trim(),
        number: parseInt(editForm.number),
        position: editForm.position,
        heightCm: editForm.heightCm ? parseInt(editForm.heightCm) : undefined,
        weightKg: editForm.weightKg ? parseInt(editForm.weightKg) : undefined,
        active: editForm.active,
      });
      setShowEditModal(false);
      Alert.alert("Success", "Player updated successfully");
    } catch (error) {
      console.error("Failed to update player:", error);
      Alert.alert("Error", "Failed to update player. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePlayer = () => {
    const playerName = playerData?.player?.name || "this player";
    Alert.alert(
      "Delete Player",
      `Are you sure you want to delete "${playerName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            setIsDeleting(true);
            try {
              await removePlayer({
                token,
                playerId: playerId as Id<"players">,
              });
              navigation.goBack();
            } catch (error) {
              console.error("Failed to delete player:", error);
              Alert.alert("Error", "Failed to delete player. Please try again.");
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleExportGameLog = async () => {
    const recentGames = playerStats?.recentGames || [];
    if (recentGames.length === 0) {
      Alert.alert("No Data", "No game data to export");
      return;
    }
    setIsExporting(true);
    setShowOptionsMenu(false);
    try {
      const playerName = playerData?.player?.name || "Player";
      await exportPlayerGameLogCSV(recentGames, playerName, selectedLeague?.season);
    } catch (error) {
      console.error("Failed to export game log:", error);
      Alert.alert("Error", "Failed to export game log. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Set header right button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity className="p-2 mr-1" onPress={() => setShowOptionsMenu(true)}>
          <FontAwesome5
            name="ellipsis-v"
            size={18}
            color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, resolvedTheme]);

  const getStatCategories = (): StatCategory[] => {
    if (!playerStats?.stats) return [];

    const stats = playerStats.stats;

    return [
      {
        title: "Scoring",
        stats: [
          { label: "PPG", value: stats.avgPoints?.toFixed(1) || "0.0", highlight: true },
          { label: "Total Points", value: stats.totalPoints || 0 },
          { label: "FG%", value: `${stats.fieldGoalPercentage?.toFixed(1) || "0.0"}%` },
          {
            label: "FGM/FGA",
            value: `${stats.totalFieldGoalsMade || 0}/${stats.totalFieldGoalsAttempted || 0}`,
          },
          { label: "3P%", value: `${stats.threePointPercentage?.toFixed(1) || "0.0"}%` },
          {
            label: "3PM/3PA",
            value: `${stats.totalThreePointersMade || 0}/${stats.totalThreePointersAttempted || 0}`,
          },
          { label: "FT%", value: `${stats.freeThrowPercentage?.toFixed(1) || "0.0"}%` },
          {
            label: "FTM/FTA",
            value: `${stats.totalFreeThrowsMade || 0}/${stats.totalFreeThrowsAttempted || 0}`,
          },
        ],
      },
      {
        title: "Rebounds & Assists",
        stats: [
          { label: "RPG", value: stats.avgRebounds?.toFixed(1) || "0.0", highlight: true },
          { label: "Total Rebounds", value: stats.totalRebounds || 0 },
          { label: "APG", value: stats.avgAssists?.toFixed(1) || "0.0", highlight: true },
          { label: "Total Assists", value: stats.totalAssists || 0 },
        ],
      },
      {
        title: "Defense & Hustle",
        stats: [
          { label: "Steals", value: stats.totalSteals || 0 },
          { label: "Blocks", value: stats.totalBlocks || 0 },
          { label: "Turnovers", value: stats.totalTurnovers || 0 },
          { label: "Personal Fouls", value: stats.totalFouls || 0 },
        ],
      },
      {
        title: "Game Info",
        stats: [
          { label: "Games Played", value: stats.gamesPlayed || 0 },
          { label: "Total Minutes", value: Math.round(stats.totalMinutes || 0) },
          {
            label: "Avg Minutes",
            value: stats.avgMinutes?.toFixed(1) || "0.0",
          },
        ],
      },
    ];
  };

  const renderStatCard = (category: StatCategory) => (
    <View
      key={category.title}
      className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-4"
    >
      <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
        {category.title}
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {category.stats.map((stat, index) => (
          <View key={index} className="w-[48%] items-center mb-3">
            <Text
              className={`text-surface-900 dark:text-white text-lg font-bold ${
                stat.highlight ? "text-red-500 text-2xl" : ""
              }`}
            >
              {stat.value}
            </Text>
            <Text className="text-surface-600 dark:text-surface-400 text-xs mt-0.5">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentGames = () => {
    const recentGames = playerStats?.recentGames || [];

    if (!recentGames.length) {
      return (
        <View className="items-center justify-center py-10">
          <Text className="text-surface-600 dark:text-surface-400 text-base">No recent games</Text>
        </View>
      );
    }

    return (
      <View className="mt-2">
        <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
          Recent Games
        </Text>
        {recentGames.slice(0, 5).map(
          (
            game: {
              gameId?: string;
              gameDate?: number;
              opponent?: string;
              points?: number;
              rebounds?: number;
              assists?: number;
              fieldGoalPercentage?: number;
            },
            index: number
          ) => (
            <View
              key={game.gameId || index}
              className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-2"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-surface-600 dark:text-surface-400 text-xs">
                  {game.gameDate ? new Date(game.gameDate).toLocaleDateString() : ""}
                </Text>
                <Text className="text-surface-900 dark:text-white text-xs font-semibold">
                  vs {game.opponent || "Opponent"}
                </Text>
              </View>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-surface-900 dark:text-white text-base font-bold">
                    {game.points || 0}
                  </Text>
                  <Text className="text-surface-600 dark:text-surface-400 text-xs mt-0.5">PTS</Text>
                </View>
                <View className="items-center">
                  <Text className="text-surface-900 dark:text-white text-base font-bold">
                    {game.rebounds || 0}
                  </Text>
                  <Text className="text-surface-600 dark:text-surface-400 text-xs mt-0.5">REB</Text>
                </View>
                <View className="items-center">
                  <Text className="text-surface-900 dark:text-white text-base font-bold">
                    {game.assists || 0}
                  </Text>
                  <Text className="text-surface-600 dark:text-surface-400 text-xs mt-0.5">AST</Text>
                </View>
                <View className="items-center">
                  <Text className="text-surface-900 dark:text-white text-base font-bold">
                    {game.fieldGoalPercentage?.toFixed(0) || 0}%
                  </Text>
                  <Text className="text-surface-600 dark:text-surface-400 text-xs mt-0.5">FG%</Text>
                </View>
              </View>
            </View>
          )
        )}
      </View>
    );
  };

  if (playerData === undefined || playerStats === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950">
        <Text className="text-surface-900 dark:text-white text-base">Loading player stats...</Text>
      </View>
    );
  }

  if (!playerData?.player) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950">
        <Text className="text-surface-900 dark:text-white text-base">Player not found</Text>
      </View>
    );
  }

  const player = playerData.player;
  const statCategories = getStatCategories();

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      <StatusBar style="light" />

      {/* Player Header */}
      <View className="bg-white dark:bg-surface-800 p-4 border-b border-surface-200 dark:border-surface-700">
        <View className="flex-row items-center mb-4">
          <Text className="text-red-500 text-4xl font-bold mr-4">#{player.number}</Text>
          <View className="flex-1">
            <Text className="text-surface-900 dark:text-white text-xl font-bold">
              {player.name}
            </Text>
            <Text className="text-surface-600 dark:text-surface-400 text-sm mt-0.5">
              {player.position} {player.heightCm ? `• ${player.heightCm}cm` : ""}{" "}
              {player.weightKg ? `• ${player.weightKg}kg` : ""}
            </Text>
            <Text className="text-green-400 text-sm font-semibold mt-1">{player.team?.name}</Text>
          </View>
        </View>

        {/* Period Selector */}
        <View className="flex-row bg-surface-100 dark:bg-surface-950 rounded-lg p-1">
          <TouchableOpacity
            className={`flex-1 py-2 px-4 rounded-md items-center ${
              selectedPeriod === "season" ? "bg-red-500" : ""
            }`}
            onPress={() => setSelectedPeriod("season")}
          >
            <Text
              className={`text-sm font-semibold ${
                selectedPeriod === "season"
                  ? "text-white"
                  : "text-surface-600 dark:text-surface-400"
              }`}
            >
              Season
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 px-4 rounded-md items-center ${
              selectedPeriod === "recent" ? "bg-red-500" : ""
            }`}
            onPress={() => setSelectedPeriod("recent")}
          >
            <Text
              className={`text-sm font-semibold ${
                selectedPeriod === "recent"
                  ? "text-white"
                  : "text-surface-600 dark:text-surface-400"
              }`}
            >
              Recent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        {statCategories.map((category) => renderStatCard(category))}

        {/* Recent Games */}
        {renderRecentGames()}
      </ScrollView>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View className="bg-white dark:bg-surface-800 rounded-t-3xl p-4 pb-8">
            <View className="w-10 h-1 bg-surface-300 dark:bg-surface-600 rounded-full self-center mb-4" />
            <Text className="text-surface-900 dark:text-white text-lg font-bold mb-4 text-center">
              Player Options
            </Text>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-surface-100 dark:bg-surface-700 rounded-xl mb-3"
              onPress={() => {
                setShowOptionsMenu(false);
                setShowEditModal(true);
              }}
            >
              <FontAwesome5 name="edit" size={18} color="#3B82F6" />
              <Text className="text-surface-900 dark:text-white font-medium ml-3">Edit Player</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-surface-100 dark:bg-surface-700 rounded-xl mb-3"
              onPress={handleExportGameLog}
              disabled={isExporting || !playerStats?.recentGames?.length}
            >
              <FontAwesome5 name="file-export" size={18} color="#10B981" />
              <Text className="text-surface-900 dark:text-white font-medium ml-3">
                {isExporting ? "Exporting..." : "Export Game Log"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-red-100 dark:bg-red-900/30 rounded-xl"
              onPress={() => {
                setShowOptionsMenu(false);
                handleDeletePlayer();
              }}
              disabled={isDeleting}
            >
              <FontAwesome5 name="trash" size={18} color="#EF4444" />
              <Text className="text-red-600 dark:text-red-400 font-medium ml-3">
                {isDeleting ? "Deleting..." : "Delete Player"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Player Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-surface-50 dark:bg-surface-950"
        >
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text className="text-surface-600 dark:text-surface-400 text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-surface-900 dark:text-white text-lg font-bold">Edit Player</Text>
            <TouchableOpacity
              onPress={handleEditPlayer}
              disabled={isUpdating || !editForm.name.trim() || !editForm.number}
            >
              <Text
                className={`text-base font-semibold ${
                  isUpdating || !editForm.name.trim() || !editForm.number
                    ? "text-surface-400"
                    : "text-primary-500"
                }`}
              >
                {isUpdating ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView className="flex-1 p-4">
            <View className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
              {/* Player Name */}
              <View className="mb-4">
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  Player Name *
                </Text>
                <TextInput
                  className="bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base"
                  value={editForm.name}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                  placeholder="Enter player name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Jersey Number */}
              <View className="mb-4">
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  Jersey Number *
                </Text>
                <TextInput
                  className="bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base"
                  value={editForm.number}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, number: text }))}
                  placeholder="Enter jersey number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              </View>

              {/* Position */}
              <View className="mb-4">
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  Position
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(["PG", "SG", "SF", "PF", "C"] as const).map((pos) => (
                    <TouchableOpacity
                      key={pos}
                      className={`px-4 py-2 rounded-lg ${
                        editForm.position === pos
                          ? "bg-primary-500"
                          : "bg-surface-100 dark:bg-surface-700"
                      }`}
                      onPress={() => setEditForm((prev) => ({ ...prev, position: pos }))}
                    >
                      <Text
                        className={`font-medium ${
                          editForm.position === pos
                            ? "text-white"
                            : "text-surface-700 dark:text-surface-300"
                        }`}
                      >
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Height & Weight */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                    Height (cm)
                  </Text>
                  <TextInput
                    className="bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base"
                    value={editForm.heightCm}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, heightCm: text }))}
                    placeholder="Height"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                    Weight (kg)
                  </Text>
                  <TextInput
                    className="bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base"
                    value={editForm.weightKg}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, weightKg: text }))}
                    placeholder="Weight"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Active Status */}
              <View className="flex-row items-center justify-between">
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium">
                  Active Player
                </Text>
                <TouchableOpacity
                  className={`w-12 h-7 rounded-full justify-center ${
                    editForm.active ? "bg-primary-500" : "bg-surface-300 dark:bg-surface-600"
                  }`}
                  onPress={() => setEditForm((prev) => ({ ...prev, active: !prev.active }))}
                >
                  <View
                    className={`w-5 h-5 bg-white rounded-full ${
                      editForm.active ? "self-end mr-1" : "self-start ml-1"
                    }`}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
