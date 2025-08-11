import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import Icon from "../components/Icon";

import {
  basketballAPI,
  Game,
  BasketballUtils,
  GAME_STATUSES,
} from "@basketball-stats/shared";

import { RootStackParamList } from "../navigation/AppNavigator";

type GamesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function GamesScreen() {
  const navigation = useNavigation<GamesScreenNavigationProp>();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGames = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const response = await basketballAPI.getGames();
      // Sort games by date, most recent first
      const sortedGames = response.games.sort(
        (a, b) =>
          new Date(b.scheduled_at || b.created_at).getTime() -
          new Date(a.scheduled_at || a.created_at).getTime()
      );
      setGames(sortedGames);
    } catch (error) {
      console.error("Failed to load games:", error);
      Alert.alert("Error", "Failed to load games");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGames(true);
  };

  const handleGamePress = (game: Game) => {
    if (game.status === "active" || game.status === "paused") {
      navigation.navigate("LiveGame", { gameId: game.id });
    }
  };

  const renderGame = ({ item: game }: { item: Game }) => {
    const gameStatus =
      GAME_STATUSES[game.status.toUpperCase() as keyof typeof GAME_STATUSES];
    const isGameLive = BasketballUtils.isGameLive(game);
    const winner = BasketballUtils.getWinningTeam(game);
    const canPress = isGameLive;

    return (
      <TouchableOpacity
        className={`bg-gray-800 rounded-xl p-4 mb-3 border ${
          isGameLive
            ? "border-primary-500 border-2 shadow-lg"
            : "border-gray-700"
        }`}
        onPress={() => handleGamePress(game)}
        disabled={!canPress}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <View
              className="px-2 py-1 rounded-xl mr-2"
              style={{ backgroundColor: gameStatus?.color || "#6B7280" }}
            >
              <Text className="text-white text-xs font-semibold">
                {BasketballUtils.getGameStatusDisplayName(game.status)}
              </Text>
            </View>
            {isGameLive && (
              <View className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            )}
          </View>

          <View className="items-end">
            {isGameLive && (
              <Text className="text-gray-400 text-xs">
                Q{game.current_quarter} • {game.time_display}
              </Text>
            )}

            {game.status === "completed" && (
              <Text className="text-gray-400 text-xs">
                {BasketballUtils.formatGameDate(
                  game.ended_at || game.created_at
                )}
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
        </View>

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

        {game.status === "completed" && (
          <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-700">
            <Text className="text-gray-400 text-xs">
              Duration: {game.duration_minutes} min
            </Text>
            {winner !== "tie" && (
              <Text className="text-gray-400 text-xs">
                Margin: {BasketballUtils.getPointDifferential(game)}
              </Text>
            )}
          </View>
        )}
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
      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={item => item.id.toString()}
        className="p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
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
              Games will appear here once they're scheduled
            </Text>
          </View>
        }
      />
    </View>
  );
}
