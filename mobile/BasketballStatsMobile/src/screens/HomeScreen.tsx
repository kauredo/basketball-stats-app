import React from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { RootStackParamList } from "../../App";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

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

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { token, selectedLeague } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const games = gamesData?.games || [];

  // Separate live and recent games
  const liveGames = games.filter(
    (game: Game) => game.status === "active" || game.status === "paused"
  );
  const recentGames = games.filter((game: Game) => game.status === "completed").slice(0, 5);

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
    }
  };

  const getWinner = (game: Game) => {
    if (game.status !== "completed") return null;
    if (game.homeScore > game.awayScore) return "home";
    if (game.awayScore > game.homeScore) return "away";
    return "tie";
  };

  const renderGameCard = (game: Game, isLive = false) => {
    const isGameLive = game.status === "active" || game.status === "paused";
    const winner = getWinner(game);

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
                  winner === "away" && game.status === "completed" ? "text-green-400" : ""
                }`}
              >
                {game.awayTeam?.name || "Away Team"}
              </Text>
              <Text
                className={`text-white text-lg font-bold min-w-[30px] text-right ${
                  winner === "away" && game.status === "completed" ? "text-green-400" : ""
                }`}
              >
                {game.awayScore}
              </Text>
            </View>
            <Text className="text-gray-400 text-xs my-1">@</Text>
            <View className="flex-row justify-between items-center w-full py-1">
              <Text
                className={`text-white text-base font-semibold flex-1 ${
                  winner === "home" && game.status === "completed" ? "text-green-400" : ""
                }`}
              >
                {game.homeTeam?.name || "Home Team"}
              </Text>
              <Text
                className={`text-white text-lg font-bold min-w-[30px] text-right ${
                  winner === "home" && game.status === "completed" ? "text-green-400" : ""
                }`}
              >
                {game.homeScore}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View
            className="px-2 py-1 rounded-xl"
            style={{ backgroundColor: GAME_STATUS_COLORS[game.status] || "#6B7280" }}
          >
            <Text className="text-white text-xs font-semibold">{getStatusLabel(game.status)}</Text>
          </View>

          {isGameLive && (
            <Text className="text-gray-400 text-xs">
              Q{game.currentQuarter} • {formatTime(game.timeRemainingSeconds)}
            </Text>
          )}

          {game.status === "completed" && game.endedAt && (
            <Text className="text-gray-400 text-xs">
              Final • {new Date(game.endedAt).toLocaleDateString()}
            </Text>
          )}

          {game.status === "scheduled" && game.scheduledAt && (
            <Text className="text-gray-400 text-xs">
              {new Date(game.scheduledAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (gamesData === undefined) {
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Navigation Cards */}
        <View className="mb-6">
          <Text className="text-white text-lg font-bold mb-3">Quick Navigation</Text>
          <View className="flex-row flex-wrap justify-between -mx-1">
            <TouchableOpacity
              className="w-[48%] bg-gray-800 rounded-xl p-4 mb-3 items-center justify-center shadow-sm"
              onPress={() => navigation.navigate("Games")}
            >
              <Icon name="basketball" size={24} color="#EA580C" />
              <Text className="text-white text-base font-bold mt-2">All Games</Text>
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
              <Text className="text-white text-base font-bold mt-2">Statistics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-[48%] bg-gray-800 rounded-xl p-4 mb-3 items-center justify-center shadow-sm"
              onPress={() => navigation.navigate("Profile")}
            >
              <Icon name="user" size={24} color="#8B5CF6" />
              <Text className="text-white text-base font-bold mt-2">Profile</Text>
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
            {liveGames.map((game: Game) => renderGameCard(game, true))}
          </View>
        )}

        {/* Recent Games Section */}
        {recentGames.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Icon name="stats" size={16} color="#10B981" className="mr-2" />
              <Text className="text-white text-lg font-bold">Recent Games</Text>
            </View>
            {recentGames.map((game: Game) => renderGameCard(game, false))}
          </View>
        )}

        {/* Empty State */}
        {liveGames.length === 0 && recentGames.length === 0 && (
          <View className="items-center justify-center pt-15">
            <Icon name="basketball" size={48} color="#6B7280" className="mb-4" />
            <Text className="text-white text-lg font-bold mb-2">No games found</Text>
            <Text className="text-gray-400 text-sm text-center leading-5">
              Create a game to start tracking basketball statistics
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
