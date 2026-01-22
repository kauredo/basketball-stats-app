import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { SkeletonCard, SkeletonGameCard } from "../components/Skeleton";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { token, selectedLeague } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const games = gamesData?.games || [];

  // Separate games by status
  const liveGames = games.filter(
    (game: Game) => game.status === "active" || game.status === "paused"
  );
  const recentGames = games.filter((game: Game) => game.status === "completed").slice(0, 4);
  const upcomingGames = games.filter((game: Game) => game.status === "scheduled").slice(0, 3);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleLiveGamePress = (game: Game) => {
    navigation.navigate("LiveGame", { gameId: game.id });
  };

  const handleCompletedGamePress = (game: Game) => {
    navigation.navigate("GameAnalysis", { gameId: game.id });
  };

  if (gamesData === undefined) {
    return (
      <View className="flex-1 bg-surface-50 dark:bg-surface-950">
        <ScrollView className="p-4">
          {/* Header skeleton */}
          <View className="mb-6">
            <View className="h-8 w-32 bg-surface-200 dark:bg-surface-800 rounded-lg mb-2" />
            <View className="h-5 w-48 bg-surface-200 dark:bg-surface-800 rounded" />
          </View>
          {/* Stats skeleton */}
          <View className="flex-row justify-between mb-6">
            {[...Array(4)].map((_, i) => (
              <View key={i} className="items-center">
                <View className="h-10 w-10 bg-surface-200 dark:bg-surface-800 rounded mb-1" />
                <View className="h-3 w-14 bg-surface-200 dark:bg-surface-800 rounded" />
              </View>
            ))}
          </View>
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-surface-900 dark:text-white">
            Dashboard
          </Text>
          <Text className="text-base text-surface-500 dark:text-surface-400">
            {selectedLeague?.name || "Your games at a glance"}
          </Text>
        </View>

        {/* Live Games - Dramatic treatment */}
        {liveGames.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
              <Text className="text-xs font-bold uppercase tracking-wider text-red-500">
                Live Now
              </Text>
            </View>

            {liveGames.map((game: Game) => (
              <TouchableOpacity
                key={game.id}
                onPress={() => handleLiveGamePress(game)}
                activeOpacity={0.8}
                className="mb-3"
              >
                <LinearGradient
                  colors={["#1e293b", "#0f172a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-2xl p-5 overflow-hidden"
                >
                  <View className="flex-row items-center justify-between">
                    {/* Away Team */}
                    <View className="flex-1 items-center">
                      <Text className="text-base font-semibold text-surface-200 mb-1">
                        {game.awayTeam?.name || "Away"}
                      </Text>
                      <Text className="text-4xl font-bold text-white">
                        {game.awayScore}
                      </Text>
                    </View>

                    {/* Center - Game Info */}
                    <View className="px-4 items-center">
                      <View className="flex-row items-center px-3 py-1 rounded-full bg-red-500/20 mb-2">
                        <View className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
                        <Text className="text-xs font-bold uppercase text-red-500">
                          {game.status === "paused" ? "Paused" : "Live"}
                        </Text>
                      </View>
                      <Text className="text-surface-400 text-sm font-medium">
                        Q{game.currentQuarter}
                      </Text>
                      <Text className="text-white font-mono text-xl font-semibold">
                        {formatTime(game.timeRemainingSeconds)}
                      </Text>
                    </View>

                    {/* Home Team */}
                    <View className="flex-1 items-center">
                      <Text className="text-base font-semibold text-surface-200 mb-1">
                        {game.homeTeam?.name || "Home"}
                      </Text>
                      <Text className="text-4xl font-bold text-white">
                        {game.homeScore}
                      </Text>
                    </View>
                  </View>

                  {/* Action hint */}
                  <View className="flex-row items-center justify-end mt-3">
                    <Text className="text-xs font-medium text-surface-400 mr-1">
                      Open Scorebook
                    </Text>
                    <Icon name="chevron-right" size={12} color="#94a3b8" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Stats */}
        <View className="flex-row justify-between mb-6 px-2">
          <View className="items-center">
            <Text className="text-3xl font-bold text-surface-900 dark:text-white">
              {liveGames.length}
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
              Live
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-3xl font-bold text-surface-900 dark:text-white">
              {recentGames.length}
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
              Completed
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-3xl font-bold text-surface-900 dark:text-white">
              {upcomingGames.length}
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
              Upcoming
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-3xl font-bold text-surface-900 dark:text-white">
              {games.length}
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400 font-medium">
              Total
            </Text>
          </View>
        </View>

        {/* Recent Results */}
        {recentGames.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
              Recent Results
            </Text>

            <View className="space-y-2">
              {recentGames.map((game: Game) => {
                const homeWon = game.homeScore > game.awayScore;
                const awayWon = game.awayScore > game.homeScore;

                return (
                  <TouchableOpacity
                    key={game.id}
                    onPress={() => handleCompletedGamePress(game)}
                    className="flex-row items-center p-4 rounded-xl bg-surface-100 dark:bg-surface-800/50 mb-2"
                    activeOpacity={0.7}
                  >
                    {/* Teams and Scores */}
                    <View className="flex-1 flex-row items-center">
                      <Text
                        className={`flex-1 text-right ${
                          awayWon
                            ? "font-semibold text-surface-900 dark:text-white"
                            : "text-surface-500 dark:text-surface-400"
                        }`}
                        numberOfLines={1}
                      >
                        {game.awayTeam?.name || "Away"}
                      </Text>

                      <View className="flex-row items-center mx-3">
                        <Text
                          className={`text-lg font-mono ${
                            awayWon
                              ? "font-bold text-surface-900 dark:text-white"
                              : "text-surface-500 dark:text-surface-400"
                          }`}
                        >
                          {game.awayScore}
                        </Text>
                        <Text className="text-surface-300 dark:text-surface-600 mx-1">-</Text>
                        <Text
                          className={`text-lg font-mono ${
                            homeWon
                              ? "font-bold text-surface-900 dark:text-white"
                              : "text-surface-500 dark:text-surface-400"
                          }`}
                        >
                          {game.homeScore}
                        </Text>
                      </View>

                      <Text
                        className={`flex-1 ${
                          homeWon
                            ? "font-semibold text-surface-900 dark:text-white"
                            : "text-surface-500 dark:text-surface-400"
                        }`}
                        numberOfLines={1}
                      >
                        {game.homeTeam?.name || "Home"}
                      </Text>
                    </View>

                    {/* Final badge */}
                    <View className="px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 ml-3">
                      <Text className="text-xs font-medium text-surface-600 dark:text-surface-300">
                        Final
                      </Text>
                    </View>

                    <Icon name="chevron-right" size={16} color="#94a3b8" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Upcoming Games */}
        {upcomingGames.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
              Coming Up
            </Text>

            <View className="space-y-3">
              {upcomingGames.map((game: Game) => (
                <View
                  key={game.id}
                  className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/30"
                >
                  <View className="flex-row items-center mb-3">
                    <Icon name="calendar" size={14} color="#F97316" />
                    <Text className="text-sm font-medium text-surface-600 dark:text-surface-300 ml-2">
                      {game.scheduledAt
                        ? new Date(game.scheduledAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                        : "TBD"}
                    </Text>
                  </View>
                  <View>
                    <View className="flex-row justify-between items-center">
                      <Text className="font-medium text-surface-900 dark:text-surface-100">
                        {game.awayTeam?.name || "Away"}
                      </Text>
                      <Text className="text-xs text-surface-400">@</Text>
                    </View>
                    <View className="flex-row justify-between items-center mt-1">
                      <Text className="font-medium text-surface-900 dark:text-surface-100">
                        {game.homeTeam?.name || "Home"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State for Upcoming Games */}
        {upcomingGames.length === 0 && games.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
              Coming Up
            </Text>
            <View className="py-6 items-center border border-dashed border-surface-200 dark:border-surface-700 rounded-xl">
              <Icon name="calendar" size={24} color="#6b7280" />
              <Text className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                No upcoming games
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
            Quick Actions
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 bg-primary-500 rounded-xl p-3 mr-2 items-center"
              onPress={() => navigation.navigate("CreateGame")}
            >
              <Icon name="basketball" size={20} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold mt-1">New Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-blue-600 rounded-xl p-3 mr-2 items-center"
              onPress={() => navigation.navigate("CreateTeam")}
            >
              <Icon name="users" size={20} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold mt-1">New Team</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-green-600 rounded-xl p-3 items-center"
              onPress={() => navigation.navigate("CreatePlayer")}
            >
              <Icon name="user" size={20} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold mt-1">Add Player</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty State - When no games at all */}
        {games.length === 0 && (
          <EmptyState
            icon="basketball"
            title="No games yet"
            description="Create your first game to start tracking stats and building your season history."
            actionLabel="Create your first game"
            onAction={() => navigation.navigate("CreateGame")}
          />
        )}
      </ScrollView>
    </View>
  );
}
