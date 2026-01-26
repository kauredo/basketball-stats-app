import React, { useState } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { SkeletonGameCard } from "../components/Skeleton";
import { exportGameScheduleCSV } from "../utils/export";

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

interface GameSection {
  title: string;
  data: Game[];
}

export default function GamesScreen() {
  const navigation = useNavigation<GamesScreenNavigationProp>();
  const { token, selectedLeague } = useAuth();
  const { resolvedTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const games = gamesData?.games || [];

  // Group games by status
  const liveGames = games.filter(
    (game: Game) => game.status === "active" || game.status === "paused"
  );
  const upcomingGames = games
    .filter((game: Game) => game.status === "scheduled")
    .sort((a: Game, b: Game) => (a.scheduledAt || 0) - (b.scheduledAt || 0));
  const completedGames = games
    .filter((game: Game) => game.status === "completed")
    .sort((a: Game, b: Game) => (b.endedAt || 0) - (a.endedAt || 0));

  // Create sections
  const sections: GameSection[] = [];
  if (liveGames.length > 0) {
    sections.push({ title: "Live Now", data: liveGames });
  }
  if (upcomingGames.length > 0) {
    sections.push({ title: "Upcoming", data: upcomingGames });
  }
  if (completedGames.length > 0) {
    sections.push({ title: "Completed", data: completedGames });
  }

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleExportSchedule = async () => {
    if (games.length === 0) {
      Alert.alert("No Data", "No games to export");
      return;
    }
    setIsExporting(true);
    try {
      await exportGameScheduleCSV(games, selectedLeague?.name);
      Alert.alert("Success", "Game schedule exported successfully");
    } catch (error) {
      console.error("Failed to export schedule:", error);
      Alert.alert("Error", "Failed to export game schedule. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleGamePress = (game: Game) => {
    if (game.status === "active" || game.status === "paused") {
      navigation.navigate("LiveGame", { gameId: game.id });
    } else if (game.status === "completed") {
      navigation.navigate("GameAnalysis", { gameId: game.id });
    }
  };

  const renderLiveGame = (game: Game) => (
    <TouchableOpacity
      key={game.id}
      onPress={() => handleGamePress(game)}
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
            <Text className="text-4xl font-bold text-white">{game.awayScore}</Text>
          </View>

          {/* Center - Game Info */}
          <View className="px-4 items-center">
            <View className="flex-row items-center px-3 py-1 rounded-full bg-red-500/20 mb-2">
              <View className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
              <Text className="text-xs font-bold uppercase text-red-500">
                {game.status === "paused" ? "Paused" : "Live"}
              </Text>
            </View>
            <Text className="text-surface-400 text-sm font-medium">Q{game.currentQuarter}</Text>
            <Text className="text-white font-mono text-xl font-semibold">
              {formatTime(game.timeRemainingSeconds)}
            </Text>
          </View>

          {/* Home Team */}
          <View className="flex-1 items-center">
            <Text className="text-base font-semibold text-surface-200 mb-1">
              {game.homeTeam?.name || "Home"}
            </Text>
            <Text className="text-4xl font-bold text-white">{game.homeScore}</Text>
          </View>
        </View>

        {/* Action hint */}
        <View className="flex-row items-center justify-end mt-3">
          <Text className="text-xs font-medium text-surface-400 mr-1">Open Scorebook</Text>
          <Icon name="chevron-right" size={12} color="#94a3b8" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCompletedGame = (game: Game) => {
    const homeWon = game.homeScore > game.awayScore;
    const awayWon = game.awayScore > game.homeScore;

    return (
      <TouchableOpacity
        key={game.id}
        onPress={() => handleGamePress(game)}
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
          <Text className="text-xs font-medium text-surface-600 dark:text-surface-300">Final</Text>
        </View>

        <Icon name="chevron-right" size={16} color="#94a3b8" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    );
  };

  const renderUpcomingGame = (game: Game) => (
    <View
      key={game.id}
      className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/30 mb-2"
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
  );

  const renderGame = ({ item: game, section }: { item: Game; section: GameSection }) => {
    if (section.title === "Live Now") {
      return renderLiveGame(game);
    } else if (section.title === "Completed") {
      return renderCompletedGame(game);
    } else {
      return renderUpcomingGame(game);
    }
  };

  const renderSectionHeader = ({ section }: { section: GameSection }) => (
    <View className="flex-row items-center mb-3 mt-4">
      {section.title === "Live Now" && <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />}
      {section.title === "Upcoming" && (
        <Icon name="calendar" size={14} color="#F97316" style={{ marginRight: 8 }} />
      )}
      {section.title === "Completed" && (
        <Icon name="check" size={14} color="#10B981" style={{ marginRight: 8 }} />
      )}
      <Text
        className={`text-sm font-bold uppercase tracking-wider ${
          section.title === "Live Now" ? "text-red-500" : "text-surface-500 dark:text-surface-400"
        }`}
      >
        {section.title}
      </Text>
      <Text className="text-xs text-surface-400 dark:text-surface-500 ml-2">
        ({section.data.length})
      </Text>
    </View>
  );

  const statusBarStyle = resolvedTheme === "dark" ? "light" : "dark";

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
      <StatusBar style={statusBarStyle} />
      <SectionList
        sections={sections}
        renderItem={renderGame}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View className="mb-4">
            <View className="flex-row gap-3 mb-3">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-between bg-primary-500 rounded-2xl p-4"
                onPress={() => navigation.navigate("CreateGame")}
                activeOpacity={0.8}
                style={{
                  shadowColor: "#F97316",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
                    <Icon name="basketball" size={22} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text className="text-white text-base font-bold">New Game</Text>
                    <Text className="text-white/70 text-xs">Start tracking</Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            {games.length > 0 && (
              <TouchableOpacity
                className="flex-row items-center justify-center bg-surface-100 dark:bg-surface-800 rounded-xl p-3"
                onPress={handleExportSchedule}
                disabled={isExporting}
                activeOpacity={0.7}
              >
                <Icon
                  name="download"
                  size={18}
                  color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
                />
                <Text className="text-surface-600 dark:text-surface-400 text-sm font-medium ml-2">
                  {isExporting ? "Exporting..." : "Export Schedule"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center pt-12">
            <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
              <Icon name="basketball" size={32} color="#F97316" />
            </View>
            <Text className="text-surface-900 dark:text-white text-lg font-bold mb-2">
              No games yet
            </Text>
            <Text className="text-surface-600 dark:text-surface-400 text-sm text-center leading-5 px-8 mb-6">
              Create your first game to start tracking stats
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-primary-500 rounded-xl px-5 py-3"
              onPress={() => navigation.navigate("CreateGame")}
              activeOpacity={0.8}
              style={{
                shadowColor: "#F97316",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Icon name="plus" size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-bold ml-2">Create your first game</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
