import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";

interface StatRowProps {
  label: string;
  value: string | number;
  isHeader?: boolean;
}

function StatRow({ label, value, isHeader = false }: StatRowProps) {
  return (
    <View className={`flex-row justify-between items-center px-4 py-3 border-b border-gray-600 ${
      isHeader ? "bg-gray-600" : ""
    }`}>
      <Text className={`text-sm flex-1 ${
        isHeader ? "text-white font-medium" : "text-gray-300"
      }`}>
        {label}
      </Text>
      <Text className={`text-sm font-medium ${
        isHeader ? "text-white font-bold" : "text-white"
      }`}>
        {value}
      </Text>
    </View>
  );
}

interface GameLogItemProps {
  game: {
    gameId: string;
    gameDate?: string;
    opponent: string;
    homeGame: boolean;
    result: "W" | "L" | "N/A";
    points: number;
    rebounds: number;
    assists: number;
    fieldGoalPercentage: number;
    minutes: number;
  };
}

function GameLogItem({ game }: GameLogItemProps) {
  const resultColorClass =
    game.result === "W"
      ? "text-green-400"
      : game.result === "L"
      ? "text-red-400"
      : "text-gray-500";

  return (
    <View className="bg-gray-700 rounded-lg p-4 mb-2">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white text-base font-medium">
          {game.homeGame ? "vs" : "@"} {game.opponent}
        </Text>
        <View className="w-6 h-6 rounded-xl justify-center items-center">
          <Text className={`text-xs font-bold ${resultColorClass}`}>
            {game.result}
          </Text>
        </View>
      </View>
      <View className="flex-row justify-around">
        <View className="items-center">
          <Text className="text-white text-base font-bold">{game.points}</Text>
          <Text className="text-gray-400 text-xs mt-0.5">PTS</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-base font-bold">{game.rebounds}</Text>
          <Text className="text-gray-400 text-xs mt-0.5">REB</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-base font-bold">{game.assists}</Text>
          <Text className="text-gray-400 text-xs mt-0.5">AST</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-base font-bold">
            {game.fieldGoalPercentage.toFixed(0)}%
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">FG%</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-base font-bold">{game.minutes}</Text>
          <Text className="text-gray-400 text-xs mt-0.5">MIN</Text>
        </View>
      </View>
    </View>
  );
}

interface PlayerStatisticsScreenProps {
  route: {
    params: {
      playerId: string;
      playerName: string;
    };
  };
}

export default function PlayerStatisticsScreen({
  route,
}: PlayerStatisticsScreenProps) {
  const { playerId, playerName } = route.params;
  const { token, selectedLeague } = useAuth();
  const [activeTab, setActiveTab] = useState<"season" | "games">("season");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch player statistics from Convex
  const playerStats = useQuery(
    api.statistics.getPlayerSeasonStats,
    token && selectedLeague && playerId
      ? { token, playerId: playerId as Id<"players"> }
      : "skip"
  );

  const onRefresh = async () => {
    setRefreshing(true);
    // Convex queries auto-refresh, just wait a moment
    setTimeout(() => setRefreshing(false), 500);
  };

  if (playerStats === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-800">
        <ActivityIndicator size="large" color="#EA580C" />
        <Text className="text-gray-400 mt-4 text-base">Loading player statistics...</Text>
      </View>
    );
  }

  if (!selectedLeague || !playerStats) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-800 p-8">
        <Icon name="basketball" size={64} color="#6B7280" />
        <Text className="text-white text-2xl font-bold mb-2 mt-4">No Data Available</Text>
        <Text className="text-gray-400 text-base text-center">
          Player statistics could not be loaded.
        </Text>
      </View>
    );
  }

  const stats = playerStats.stats;
  const recentGames = playerStats.recentGames || [];

  return (
    <View className="flex-1 bg-gray-800">
      {/* Player Info Header */}
      <View className="bg-gray-700 p-5 items-center">
        <Text className="text-white text-2xl font-bold mb-1">{playerName}</Text>
        <Text className="text-orange-500 text-base font-medium mb-0.5">
          {playerStats.player?.teamName || "Unknown Team"}
        </Text>
        <Text className="text-gray-400 text-sm">
          {playerStats.player?.position || ""}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-gray-700 border-b border-gray-600">
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "season" ? "border-orange-500" : "border-transparent"
          }`}
          onPress={() => setActiveTab("season")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "season" ? "text-orange-500" : "text-gray-400"
            }`}
          >
            Season Stats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "games" ? "border-orange-500" : "border-transparent"
          }`}
          onPress={() => setActiveTab("games")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "games" ? "text-orange-500" : "text-gray-400"
            }`}
          >
            Game Log
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Season Stats Tab */}
        {activeTab === "season" && stats && (
          <View className="p-4">
            {/* Basic Stats */}
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">Basic Statistics</Text>
              <View className="bg-gray-700 rounded-lg overflow-hidden">
                <StatRow
                  label="Games Played"
                  value={stats.gamesPlayed || 0}
                  isHeader
                />
                <StatRow
                  label="Points per Game"
                  value={stats.avgPoints?.toFixed(1) || "0.0"}
                />
                <StatRow
                  label="Rebounds per Game"
                  value={stats.avgRebounds?.toFixed(1) || "0.0"}
                />
                <StatRow
                  label="Assists per Game"
                  value={stats.avgAssists?.toFixed(1) || "0.0"}
                />
                <StatRow
                  label="Steals per Game"
                  value={stats.avgSteals?.toFixed(1) || "0.0"}
                />
                <StatRow
                  label="Blocks per Game"
                  value={stats.avgBlocks?.toFixed(1) || "0.0"}
                />
                <StatRow
                  label="Minutes per Game"
                  value={stats.avgMinutes?.toFixed(1) || "0.0"}
                />
              </View>
            </View>

            {/* Shooting Stats */}
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">Shooting Statistics</Text>
              <View className="bg-gray-700 rounded-lg overflow-hidden">
                <StatRow
                  label="Field Goal %"
                  value={`${stats.fieldGoalPercentage?.toFixed(1) || "0.0"}%`}
                  isHeader
                />
                <StatRow
                  label="Three Point %"
                  value={`${stats.threePointPercentage?.toFixed(1) || "0.0"}%`}
                />
                <StatRow
                  label="Free Throw %"
                  value={`${stats.freeThrowPercentage?.toFixed(1) || "0.0"}%`}
                />
                <StatRow
                  label="Effective FG%"
                  value={`${stats.effectiveFieldGoalPercentage?.toFixed(1) || "0.0"}%`}
                />
                <StatRow
                  label="True Shooting %"
                  value={`${stats.trueShootingPercentage?.toFixed(1) || "0.0"}%`}
                />
              </View>
            </View>

            {/* Season Totals */}
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">Season Totals</Text>
              <View className="bg-gray-700 rounded-lg overflow-hidden">
                <StatRow
                  label="Total Points"
                  value={stats.totalPoints || 0}
                  isHeader
                />
                <StatRow
                  label="Total Rebounds"
                  value={stats.totalRebounds || 0}
                />
                <StatRow
                  label="Total Assists"
                  value={stats.totalAssists || 0}
                />
                <StatRow
                  label="Total Minutes"
                  value={Math.round(stats.totalMinutes || 0)}
                />
                <StatRow
                  label="Field Goals Made"
                  value={stats.totalFieldGoalsMade || 0}
                />
                <StatRow
                  label="Field Goals Attempted"
                  value={stats.totalFieldGoalsAttempted || 0}
                />
              </View>
            </View>
          </View>
        )}

        {/* Game Log Tab */}
        {activeTab === "games" && (
          <View className="p-4">
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">Recent Games</Text>
              {recentGames.length > 0 ? (
                recentGames.map((game: any, index: number) => (
                  <GameLogItem key={game.gameId || index} game={game} />
                ))
              ) : (
                <Text className="text-gray-400 text-base text-center italic mt-8">
                  No games played yet this season.
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
