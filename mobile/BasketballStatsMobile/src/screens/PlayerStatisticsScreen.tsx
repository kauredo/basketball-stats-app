import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { basketballAPI } from "@basketball-stats/shared";
import { useAuthStore } from "../hooks/useAuthStore";
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
    game_id: number;
    game_date: string;
    opponent: string;
    home_game: boolean;
    result: "W" | "L" | "N/A";
    points: number;
    rebounds: number;
    assists: number;
    field_goal_percentage: number;
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
          {game.home_game ? "vs" : "@"} {game.opponent}
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
            {game.field_goal_percentage}%
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
      playerId: number;
      playerName: string;
    };
  };
}

export default function PlayerStatisticsScreen({
  route,
}: PlayerStatisticsScreenProps) {
  const { playerId, playerName } = route.params;
  const { selectedLeague } = useAuthStore();
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"season" | "games">("season");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedLeague) {
      loadPlayerStats();
    }
  }, [selectedLeague, playerId]);

  const loadPlayerStats = async () => {
    if (!selectedLeague) return;

    try {
      setLoading(true);
      const stats = await basketballAPI.getPlayerStatistics(
        selectedLeague.id,
        playerId
      );
      setPlayerStats(stats);
    } catch (error) {
      console.error("Failed to load player statistics:", error);
      Alert.alert(
        "Error",
        "Failed to load player statistics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlayerStats();
    setRefreshing(false);
  };

  if (loading && !playerStats) {
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
        <Icon name="basketball" size={64} color="#6B7280" className="mb-4" />
        <Text className="text-white text-2xl font-bold mb-2">No Data Available</Text>
        <Text className="text-gray-400 text-base text-center">
          Player statistics could not be loaded.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-800">
      {/* Player Info Header */}
      <View className="bg-gray-700 p-5 items-center">
        <Text className="text-white text-2xl font-bold mb-1">{playerName}</Text>
        <Text className="text-primary-500 text-base font-medium mb-0.5">
          {playerStats.player?.team || "Unknown Team"}
        </Text>
        <Text className="text-gray-400 text-sm">
          {playerStats.player?.position || ""}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-gray-700 border-b border-gray-600">
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "season" ? "border-primary-500" : "border-transparent"
          }`}
          onPress={() => setActiveTab("season")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "season" ? "text-primary-500" : "text-gray-400"
            }`}
          >
            Season Stats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "games" ? "border-primary-500" : "border-transparent"
          }`}
          onPress={() => setActiveTab("games")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "games" ? "text-primary-500" : "text-gray-400"
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
        {activeTab === "season" && playerStats.season_stats && (
          <View className="p-4">
            {/* Basic Stats */}
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">Basic Statistics</Text>
              <View className="bg-gray-700 rounded-lg overflow-hidden">
                <StatRow
                  label="Games Played"
                  value={playerStats.season_stats.games_played}
                  isHeader
                />
                <StatRow
                  label="Points per Game"
                  value={
                    playerStats.season_stats.avg_points?.toFixed(1) || "0.0"
                  }
                />
                <StatRow
                  label="Rebounds per Game"
                  value={
                    playerStats.season_stats.avg_rebounds?.toFixed(1) || "0.0"
                  }
                />
                <StatRow
                  label="Assists per Game"
                  value={
                    playerStats.season_stats.avg_assists?.toFixed(1) || "0.0"
                  }
                />
                <StatRow
                  label="Steals per Game"
                  value={
                    playerStats.season_stats.avg_steals?.toFixed(1) || "0.0"
                  }
                />
                <StatRow
                  label="Blocks per Game"
                  value={
                    playerStats.season_stats.avg_blocks?.toFixed(1) || "0.0"
                  }
                />
                <StatRow
                  label="Minutes per Game"
                  value={
                    playerStats.season_stats.avg_minutes?.toFixed(1) || "0.0"
                  }
                />
              </View>
            </View>

            {/* Shooting Stats */}
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">Shooting Statistics</Text>
              <View className="bg-gray-700 rounded-lg overflow-hidden">
                <StatRow
                  label="Field Goal %"
                  value={`${
                    playerStats.season_stats.field_goal_percentage?.toFixed(
                      1
                    ) || "0.0"
                  }%`}
                  isHeader
                />
                <StatRow
                  label="Three Point %"
                  value={`${
                    playerStats.season_stats.three_point_percentage?.toFixed(
                      1
                    ) || "0.0"
                  }%`}
                />
                <StatRow
                  label="Free Throw %"
                  value={`${
                    playerStats.season_stats.free_throw_percentage?.toFixed(
                      1
                    ) || "0.0"
                  }%`}
                />
                <StatRow
                  label="Effective FG%"
                  value={`${
                    playerStats.season_stats.effective_field_goal_percentage?.toFixed(
                      1
                    ) || "0.0"
                  }%`}
                />
                <StatRow
                  label="True Shooting %"
                  value={`${
                    playerStats.season_stats.true_shooting_percentage?.toFixed(
                      1
                    ) || "0.0"
                  }%`}
                />
              </View>
            </View>

            {/* Advanced Stats */}
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">Advanced Statistics</Text>
              <View className="bg-gray-700 rounded-lg overflow-hidden">
                <StatRow
                  label="Player Efficiency Rating"
                  value={
                    playerStats.season_stats.player_efficiency_rating?.toFixed(
                      1
                    ) || "0.0"
                  }
                  isHeader
                />
                <StatRow
                  label="Usage Rate"
                  value={`${
                    playerStats.season_stats.usage_rate?.toFixed(1) || "0.0"
                  }%`}
                />
                <StatRow
                  label="Assist/Turnover Ratio"
                  value={
                    playerStats.season_stats.assist_to_turnover_ratio?.toFixed(
                      2
                    ) || "0.00"
                  }
                />
                <StatRow
                  label="Turnovers per Game"
                  value={
                    playerStats.season_stats.avg_turnovers?.toFixed(1) || "0.0"
                  }
                />
                <StatRow
                  label="Fouls per Game"
                  value={
                    playerStats.season_stats.avg_fouls?.toFixed(1) || "0.0"
                  }
                />
              </View>
            </View>

            {/* Season Totals */}
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">Season Totals</Text>
              <View className="bg-gray-700 rounded-lg overflow-hidden">
                <StatRow
                  label="Total Points"
                  value={playerStats.season_stats.total_points || 0}
                  isHeader
                />
                <StatRow
                  label="Total Rebounds"
                  value={playerStats.season_stats.total_rebounds || 0}
                />
                <StatRow
                  label="Total Assists"
                  value={playerStats.season_stats.total_assists || 0}
                />
                <StatRow
                  label="Total Minutes"
                  value={playerStats.season_stats.total_minutes || 0}
                />
                <StatRow
                  label="Field Goals Made"
                  value={playerStats.season_stats.total_field_goals_made || 0}
                />
                <StatRow
                  label="Field Goals Attempted"
                  value={
                    playerStats.season_stats.total_field_goals_attempted || 0
                  }
                />
              </View>
            </View>
          </View>
        )}

        {/* Game Log Tab */}
        {activeTab === "games" && playerStats.recent_games && (
          <View className="p-4">
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">Recent Games</Text>
              {playerStats.recent_games.length > 0 ? (
                playerStats.recent_games.map((game: any, index: number) => (
                  <GameLogItem key={game.game_id || index} game={game} />
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

