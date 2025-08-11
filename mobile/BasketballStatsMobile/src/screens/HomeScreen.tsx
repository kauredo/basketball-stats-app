import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import Icon from "../components/Icon";

// Import shared library
import {
  basketballAPI,
  Game,
  BasketballUtils,
  GAME_STATUSES,
} from "@basketball-stats/shared";

import { RootStackParamList, TabParamList } from "../navigation/AppNavigator";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  TabParamList & RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const response = await basketballAPI.getGames();
      const allGames = response.games;

      // Separate live and recent games
      const live = allGames.filter(
        game => game.status === "active" || game.status === "paused"
      );
      const recent = allGames
        .filter(game => game.status === "completed")
        .slice(0, 5);

      setLiveGames(live);
      setRecentGames(recent);
    } catch (error) {
      console.error("Failed to load games:", error);
      Alert.alert("Error", "Failed to load games");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleGamePress = (game: Game) => {
    if (game.status === "active" || game.status === "paused") {
      navigation.navigate("LiveGame", { gameId: game.id });
    }
  };

  const renderGameCard = (game: Game, isLive = false) => {
    const gameStatus =
      GAME_STATUSES[game.status.toUpperCase() as keyof typeof GAME_STATUSES];
    const isGameLive = BasketballUtils.isGameLive(game);
    const winner = BasketballUtils.getWinningTeam(game);

    return (
      <TouchableOpacity
        key={game.id}
        className={`bg-gray-800 rounded-xl p-4 mb-3 border ${
          isLive ? "border-primary-500 border-2 shadow-lg" : "border-gray-700"
        }`}
        onPress={() => handleGamePress(game)}
        disabled={!isLive}
      >
        <View className="mb-3">
          <View className="items-center">
            <View className="flex-row justify-between items-center w-full py-1">
              <Text
                className={`text-white text-base font-semibold flex-1 ${
                  winner === "away" && game.status === "completed"
                    ? "text-green-400"
                    : ""
                }`}
              >
                {game.away_team.name}
              </Text>
              <Text
                className={`text-white text-lg font-bold min-w-[30px] text-right ${
                  winner === "away" && game.status === "completed"
                    ? "text-green-400"
                    : ""
                }`}
              >
                {game.away_score}
              </Text>
            </View>
            <Text className="text-gray-400 text-xs my-1">@</Text>
            <View className="flex-row justify-between items-center w-full py-1">
              <Text
                className={`text-white text-base font-semibold flex-1 ${
                  winner === "home" && game.status === "completed"
                    ? "text-green-400"
                    : ""
                }`}
              >
                {game.home_team.name}
              </Text>
              <Text
                className={`text-white text-lg font-bold min-w-[30px] text-right ${
                  winner === "home" && game.status === "completed"
                    ? "text-green-400"
                    : ""
                }`}
              >
                {game.home_score}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View
            className="px-2 py-1 rounded-xl"
            style={{ backgroundColor: gameStatus?.color || "#6B7280" }}
          >
            <Text className="text-white text-xs font-semibold">
              {BasketballUtils.getGameStatusDisplayName(game.status)}
            </Text>
          </View>

          {isGameLive && (
            <Text className="text-gray-400 text-xs">
              Q{game.current_quarter} • {game.time_display}
            </Text>
          )}

          {game.status === "completed" && (
            <Text className="text-gray-400 text-xs">
              Final •{" "}
              {BasketballUtils.formatGameDate(game.ended_at || game.created_at)}
            </Text>
          )}

          {game.status === "scheduled" && (
            <Text className="text-gray-400 text-xs">
              {BasketballUtils.formatGameDate(
                game.scheduled_at || game.created_at
              )}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-950">
        <Text className="text-white text-base">Loading games...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950">
      <StatusBar style="light" />
      <ScrollView
        className="p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Navigation Cards */}
        <View className="mb-6">
          <Text className="text-white text-lg font-bold mb-3">
            Quick Navigation
          </Text>
          <View className="flex-row flex-wrap justify-between -mx-1">
            <TouchableOpacity
              className="w-[48%] bg-gray-800 rounded-xl p-4 mb-3 items-center justify-center shadow-sm"
              onPress={() => navigation.navigate("Games")}
            >
              <Icon name="basketball" size={24} color="#EA580C" />
              <Text className="text-white text-base font-bold mt-2">
                All Games
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-[48%] bg-gray-800 rounded-xl p-4 mb-3 items-center justify-center shadow-sm"
              onPress={() => navigation.navigate("Teams")}
            >
              <Icon name="users" size={24} color="#3B82F6" />
              <Text className="text-white text-base font-bold mt-2">Teams</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-[48%] bg-gray-800 rounded-xl p-4 mb-3 items-center justify-center shadow-sm"
              onPress={() => navigation.navigate("Statistics")}
            >
              <Icon name="stats" size={24} color="#10B981" />
              <Text className="text-white text-base font-bold mt-2">
                Statistics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-[48%] bg-gray-800 rounded-xl p-4 mb-3 items-center justify-center shadow-sm"
              onPress={() => navigation.navigate("Profile")}
            >
              <Icon name="user" size={24} color="#8B5CF6" />
              <Text className="text-white text-base font-bold mt-2">
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Games Section */}
        {liveGames.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
              <Text className="text-white text-lg font-bold">Live Games</Text>
            </View>
            {liveGames.map(game => renderGameCard(game, true))}
          </View>
        )}

        {/* Recent Games Section */}
        {recentGames.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Icon name="stats" size={16} color="#10B981" className="mr-2" />
              <Text className="text-white text-lg font-bold">Recent Games</Text>
            </View>
            {recentGames.map(game => renderGameCard(game, false))}
          </View>
        )}

        {/* Empty State */}
        {liveGames.length === 0 && recentGames.length === 0 && (
          <View className="items-center justify-center pt-15">
            <Icon
              name="basketball"
              size={48}
              color="#6B7280"
              className="mb-4"
            />
            <Text className="text-white text-lg font-bold mb-2">
              No games found
            </Text>
            <Text className="text-gray-400 text-sm text-center leading-5">
              Create a game to start tracking basketball statistics
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
