import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { RootStackParamList } from "../navigation/AppNavigator";

type PlayerStatsRouteProp = RouteProp<RootStackParamList, "PlayerStats">;
type PlayerStatsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PlayerStats"
>;

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

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"season" | "recent">(
    "season"
  );

  // Fetch player data from Convex
  const playerData = useQuery(
    api.players.get,
    token && playerId
      ? { token, playerId: playerId as unknown as Id<"players"> }
      : "skip"
  );

  // Fetch player season stats
  const playerStats = useQuery(
    api.statistics.getPlayerSeasonStats,
    token && playerId && selectedLeague
      ? { token, leagueId: selectedLeague.id, playerId: playerId as unknown as Id<"players"> }
      : "skip"
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

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
    <View key={category.title} className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
      <Text className="text-white text-base font-bold mb-3">{category.title}</Text>
      <View className="flex-row flex-wrap justify-between">
        {category.stats.map((stat, index) => (
          <View key={index} className="w-[48%] items-center mb-3">
            <Text
              className={`text-white text-lg font-bold ${
                stat.highlight ? "text-red-500 text-2xl" : ""
              }`}
            >
              {stat.value}
            </Text>
            <Text className="text-gray-400 text-xs mt-0.5">{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentGames = () => {
    // Note: recentGames would need a separate endpoint if needed
    const recentGames: any[] = [];

    if (!recentGames.length) {
      return (
        <View className="items-center justify-center py-10">
          <Text className="text-gray-400 text-base">No recent games</Text>
        </View>
      );
    }

    return (
      <View className="mt-2">
        <Text className="text-white text-lg font-bold mb-3">Recent Games</Text>
        {recentGames.slice(0, 5).map((game: any, index: number) => (
          <View key={game.gameId || index} className="bg-gray-800 rounded-lg p-3 mb-2 border border-gray-700">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-400 text-xs">
                {game.gameDate ? new Date(game.gameDate).toLocaleDateString() : ""}
              </Text>
              <Text className="text-white text-xs font-semibold">
                vs {game.opponent || "Opponent"}
              </Text>
            </View>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-white text-base font-bold">{game.points || 0}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">PTS</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-base font-bold">{game.rebounds || 0}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">REB</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-base font-bold">{game.assists || 0}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">AST</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-base font-bold">
                  {game.fieldGoalPercentage?.toFixed(0) || 0}%
                </Text>
                <Text className="text-gray-400 text-xs mt-0.5">FG%</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (playerData === undefined || playerStats === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-950">
        <Text className="text-white text-base">Loading player stats...</Text>
      </View>
    );
  }

  if (!playerData?.player) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-950">
        <Text className="text-white text-base">Player not found</Text>
      </View>
    );
  }

  const player = playerData.player;
  const statCategories = getStatCategories();

  return (
    <View className="flex-1 bg-dark-950">
      <StatusBar style="light" />

      {/* Player Header */}
      <View className="bg-gray-800 p-4 border-b border-gray-700">
        <View className="flex-row items-center mb-4">
          <Text className="text-red-500 text-4xl font-bold mr-4">#{player.number}</Text>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">{player.name}</Text>
            <Text className="text-gray-400 text-sm mt-0.5">
              {player.position} {player.heightCm ? `• ${player.heightCm}cm` : ""} {player.weightKg ? `• ${player.weightKg}kg` : ""}
            </Text>
            <Text className="text-green-400 text-sm font-semibold mt-1">{player.team?.name}</Text>
          </View>
        </View>

        {/* Period Selector */}
        <View className="flex-row bg-dark-950 rounded-lg p-1">
          <TouchableOpacity
            className={`flex-1 py-2 px-4 rounded-md items-center ${
              selectedPeriod === "season" ? "bg-red-500" : ""
            }`}
            onPress={() => setSelectedPeriod("season")}
          >
            <Text
              className={`text-sm font-semibold ${
                selectedPeriod === "season" ? "text-white" : "text-gray-400"
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
                selectedPeriod === "recent" ? "text-white" : "text-gray-400"
              }`}
            >
              Recent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        {statCategories.map(category => renderStatCard(category))}

        {/* Recent Games */}
        {renderRecentGames()}
      </ScrollView>
    </View>
  );
}
