import React from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SkeletonGameCard } from "../components/Skeleton";

type GamesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Game {
  id: Id<"games">;
  homeTeam: { id: Id<"teams">; name: string; city?: string; logoUrl?: string } | null;
  awayTeam: { id: Id<"teams">; name: string; city?: string; logoUrl?: string } | null;
  homeScore: number;
  awayScore: number;
  status: string;
  currentQuarter: number;
  timeRemainingSeconds: number;
  scheduledAt?: number;
  startedAt?: number;
  endedAt?: number;
}

const GAME_STATUS_COLORS: Record<string, string> = {
  active: "#EF4444",
  paused: "#F59E0B",
  completed: "#10B981",
  scheduled: "#3B82F6",
};

export default function GamesScreen() {
  const navigation = useNavigation<GamesScreenNavigationProp>();
  const { token, selectedLeague } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const games = gamesData?.games || [];

  // Sort games by date, most recent first
  const sortedGames = [...games].sort((a: Game, b: Game) => {
    const dateA = a.scheduledAt || a.startedAt || 0;
    const dateB = b.scheduledAt || b.startedAt || 0;
    return dateB - dateA;
  });

  const onRefresh = () => {
    setRefreshing(true);
    // Data auto-refreshes with Convex
    setTimeout(() => setRefreshing(false), 500);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Live";
      case "paused":
        return "Paused";
      case "completed":
        return "Final";
      case "scheduled":
        return "Scheduled";
      default:
        return status;
    }
  };

  const handleGamePress = (game: Game) => {
    if (game.status === "active" || game.status === "paused") {
      navigation.navigate("LiveGame", { gameId: game.id });
    } else if (game.status === "completed") {
      navigation.navigate("GameAnalysis", { gameId: game.id });
    }
  };

  const getWinner = (game: Game) => {
    if (game.status !== "completed") return null;
    if (game.homeScore > game.awayScore) return "home";
    if (game.awayScore > game.homeScore) return "away";
    return "tie";
  };

  const getPointDifferential = (game: Game) => {
    return Math.abs(game.homeScore - game.awayScore);
  };

  const renderGame = ({ item: game }: { item: Game }) => {
    const isGameLive = game.status === "active" || game.status === "paused";
    const isGameCompleted = game.status === "completed";
    const winner = getWinner(game);
    const canPress = isGameLive || isGameCompleted;

    return (
      <TouchableOpacity
        className={`bg-white dark:bg-surface-800 rounded-xl p-4 mb-3 border ${
          isGameLive
            ? "border-primary-500 border-2 shadow-lg"
            : "border-surface-200 dark:border-surface-700"
        }`}
        onPress={() => handleGamePress(game)}
        disabled={!canPress}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <View
              className="px-2 py-1 rounded-xl mr-2"
              style={{ backgroundColor: GAME_STATUS_COLORS[game.status] || "#6B7280" }}
            >
              <Text className="text-white text-xs font-semibold">
                {getStatusLabel(game.status)}
              </Text>
            </View>
            {isGameLive && <View className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />}
          </View>

          <View className="items-end">
            {isGameLive && (
              <Text className="text-surface-600 dark:text-surface-400 text-xs">
                Q{game.currentQuarter} • {formatTime(game.timeRemainingSeconds)}
              </Text>
            )}

            {game.status === "completed" && game.endedAt && (
              <Text className="text-surface-600 dark:text-surface-400 text-xs">
                {new Date(game.endedAt).toLocaleDateString()}
              </Text>
            )}

            {game.status === "scheduled" && game.scheduledAt && (
              <Text className="text-surface-600 dark:text-surface-400 text-xs">
                {new Date(game.scheduledAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <View className="items-center">
          <View className="flex-row justify-between items-center w-full py-1">
            <Text
              className={`text-surface-900 dark:text-white text-base font-semibold flex-1 ${
                winner === "away" && game.status === "completed" ? "text-green-400" : ""
              }`}
            >
              {game.awayTeam?.name || "Away Team"}
            </Text>
            <Text
              className={`text-surface-900 dark:text-white text-lg font-bold min-w-[30px] text-right ${
                winner === "away" && game.status === "completed" ? "text-green-400" : ""
              }`}
            >
              {game.awayScore}
            </Text>
          </View>

          <Text className="text-surface-600 dark:text-surface-400 text-xs my-1">@</Text>

          <View className="flex-row justify-between items-center w-full py-1">
            <Text
              className={`text-surface-900 dark:text-white text-base font-semibold flex-1 ${
                winner === "home" && game.status === "completed" ? "text-green-400" : ""
              }`}
            >
              {game.homeTeam?.name || "Home Team"}
            </Text>
            <Text
              className={`text-surface-900 dark:text-white text-lg font-bold min-w-[30px] text-right ${
                winner === "home" && game.status === "completed" ? "text-green-400" : ""
              }`}
            >
              {game.homeScore}
            </Text>
          </View>
        </View>

        {game.status === "completed" && (
          <View className="flex-row justify-between mt-2 pt-2 border-t border-surface-200 dark:border-surface-700">
            <Text className="text-surface-600 dark:text-surface-400 text-xs">Final</Text>
            {winner !== "tie" && (
              <Text className="text-surface-600 dark:text-surface-400 text-xs">
                Margin: {getPointDifferential(game)}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (gamesData === undefined) {
    return (
      <View className="flex-1 bg-surface-50 dark:bg-surface-950">
        <ScrollView className="p-4">
          <SkeletonGameCard style={{ marginBottom: 12 }} />
          <SkeletonGameCard style={{ marginBottom: 12 }} />
          <SkeletonGameCard style={{ marginBottom: 12 }} />
          <SkeletonGameCard style={{ marginBottom: 12 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      <StatusBar style="light" />
      <FlatList
        data={sortedGames}
        renderItem={renderGame}
        keyExtractor={(item) => item.id}
        className="p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center justify-center pt-15">
            <Icon name="basketball" size={48} color="#6B7280" className="mb-4" />
            <Text className="text-surface-900 dark:text-white text-lg font-bold mb-2">
              No games found
            </Text>
            <Text className="text-surface-600 dark:text-surface-400 text-sm text-center leading-5">
              Games will appear here once they&apos;re scheduled
            </Text>
          </View>
        }
      />
    </View>
  );
}
