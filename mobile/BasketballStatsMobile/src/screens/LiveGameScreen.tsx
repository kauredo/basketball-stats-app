import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { RootStackParamList } from "../../App";

type LiveGameRouteProp = RouteProp<RootStackParamList, "LiveGame">;

interface PlayerStat {
  id: Id<"playerStats">;
  playerId: Id<"players">;
  teamId: Id<"teams">;
  player: {
    id: Id<"players">;
    name: string;
    number: number;
    position?: string;
  } | null;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  minutesPlayed: number;
  plusMinus: number;
  isOnCourt: boolean;
  isHomeTeam: boolean;
}

const TABS = [
  { key: "scoreboard", label: "Scoreboard", icon: "basketball" },
  { key: "stats", label: "Player Stats", icon: "stats" },
  { key: "substitutions", label: "Subs", icon: "users" },
];

export default function LiveGameScreen() {
  const route = useRoute<LiveGameRouteProp>();
  const { token } = useAuth();
  const gameId = route.params.gameId as Id<"games">;

  const [activeTab, setActiveTab] = React.useState<
    "scoreboard" | "stats" | "substitutions"
  >("scoreboard");

  // Real-time game data from Convex
  const gameData = useQuery(
    api.games.get,
    token && gameId ? { token, gameId } : "skip"
  );

  // Real-time player stats from Convex
  const liveStats = useQuery(
    api.stats.getLiveStats,
    token && gameId ? { token, gameId } : "skip"
  );

  // Mutations
  const startGame = useMutation(api.games.start);
  const pauseGame = useMutation(api.games.pause);
  const resumeGame = useMutation(api.games.resume);
  const endGame = useMutation(api.games.end);
  const recordStat = useMutation(api.stats.recordStat);
  const substituteMutation = useMutation(api.stats.substitute);

  const game = gameData?.game;
  const allStats = liveStats?.stats || [];
  const homePlayerStats = allStats.filter((s: PlayerStat) => s.isHomeTeam);
  const awayPlayerStats = allStats.filter((s: PlayerStat) => !s.isHomeTeam);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleGameControl = async (action: "start" | "pause" | "resume" | "end") => {
    if (!game || !token) return;

    try {
      switch (action) {
        case "start":
          await startGame({ token, gameId });
          break;
        case "pause":
          await pauseGame({ token, gameId });
          break;
        case "resume":
          await resumeGame({ token, gameId });
          break;
        case "end":
          await endGame({ token, gameId });
          break;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      console.error(`Failed to ${action} game:`, error);
      Alert.alert("Error", `Failed to ${action} game`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRecordStat = async (
    playerId: Id<"players">,
    statType: string,
    made?: boolean
  ) => {
    if (!token) return;

    try {
      await recordStat({
        token,
        gameId,
        playerId,
        statType: statType as any,
        made,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error: any) {
      console.error("Failed to record stat:", error);
      Alert.alert("Error", "Failed to record stat");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSubstitute = async (playerId: Id<"players">, isOnCourt: boolean) => {
    if (!token) return;

    try {
      await substituteMutation({ token, gameId, playerId, isOnCourt: !isOnCourt });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      console.error("Failed to substitute:", error);
      Alert.alert("Error", error.message || "Failed to substitute player");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderScoreCard = (
    teamName: string,
    score: number,
    team: "home" | "away"
  ) => (
    <View className="flex-1 items-center">
      <Text className="text-white text-lg font-bold mb-2">{teamName}</Text>
      <Text className="text-primary-500 text-5xl font-bold mb-4">{score}</Text>
    </View>
  );

  const renderPlayerStatsCard = (playerStat: PlayerStat, team: "home" | "away") => {
    const player = playerStat.player;
    if (!player) return null;

    return (
      <View
        key={playerStat.id}
        className={`bg-gray-800 rounded-xl p-4 mb-3 border ${
          playerStat.isOnCourt ? "border-green-500" : "border-gray-700"
        }`}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white text-base font-bold">
            #{player.number} {player.name}
          </Text>
          {playerStat.isOnCourt && (
            <View className="bg-green-600 px-2 py-1 rounded">
              <Text className="text-white text-xs font-semibold">On Court</Text>
            </View>
          )}
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-300 text-sm">PTS: {playerStat.points}</Text>
          <Text className="text-gray-300 text-sm">REB: {playerStat.rebounds}</Text>
          <Text className="text-gray-300 text-sm">AST: {playerStat.assists}</Text>
          <Text className="text-gray-300 text-sm">FOULS: {playerStat.fouls}</Text>
        </View>

        <View className="flex-row flex-wrap justify-center gap-2">
          <TouchableOpacity
            onPress={() => handleRecordStat(playerStat.playerId, "shot2", true)}
            className="bg-green-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+2 PTS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRecordStat(playerStat.playerId, "shot3", true)}
            className="bg-green-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+3 PTS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRecordStat(playerStat.playerId, "freethrow", true)}
            className="bg-green-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+FT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRecordStat(playerStat.playerId, "rebounds")}
            className="bg-blue-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+REB</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRecordStat(playerStat.playerId, "assists")}
            className="bg-purple-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+AST</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRecordStat(playerStat.playerId, "steals")}
            className="bg-teal-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+STL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRecordStat(playerStat.playerId, "blocks")}
            className="bg-indigo-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+BLK</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRecordStat(playerStat.playerId, "turnovers")}
            className="bg-orange-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+TO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRecordStat(playerStat.playerId, "fouls")}
            className="bg-yellow-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+FOUL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSubstitutionCard = (playerStat: PlayerStat, team: "home" | "away") => {
    const player = playerStat.player;
    if (!player) return null;

    return (
      <TouchableOpacity
        key={playerStat.id}
        className={`bg-gray-800 rounded-xl p-4 mb-3 border flex-row justify-between items-center ${
          playerStat.isOnCourt ? "border-green-500" : "border-gray-700"
        }`}
        onPress={() => handleSubstitute(playerStat.playerId, playerStat.isOnCourt)}
      >
        <View>
          <Text className="text-white text-base font-bold">
            #{player.number} {player.name}
          </Text>
          <Text className="text-gray-400 text-sm">
            {player.position || "N/A"}
          </Text>
        </View>
        <View
          className={`px-3 py-2 rounded ${
            playerStat.isOnCourt ? "bg-green-600" : "bg-gray-600"
          }`}
        >
          <Text className="text-white text-sm font-semibold">
            {playerStat.isOnCourt ? "On Court" : "Bench"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (gameData === undefined || liveStats === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-dark-950">
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-base">Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView className="flex-1 bg-dark-950">
        <View className="flex-1 justify-center items-center">
          <Icon name="basketball" size={48} color="#9CA3AF" />
          <Text className="text-white text-lg font-semibold mt-4 mb-2">
            Game not found
          </Text>
          <Text className="text-gray-400 text-center">
            The requested game could not be found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isGameActive = game.status === "active";
  const isGamePaused = game.status === "paused";
  const canStart = game.status === "scheduled";
  const canPause = game.status === "active";
  const canResume = game.status === "paused";
  const canEnd = game.status === "active" || game.status === "paused";

  return (
    <SafeAreaView className="flex-1 bg-dark-950">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-white text-xl font-bold text-center mb-1">
          Live Game Control
        </Text>
        <Text className="text-gray-400 text-center">
          {game.awayTeam?.name || "Away"} @ {game.homeTeam?.name || "Home"}
        </Text>
      </View>

      {/* Main Scoreboard */}
      <View className="bg-gray-800 mx-4 rounded-xl p-4 mb-4 border border-gray-700">
        <View className="flex-row items-center">
          {/* Away Team */}
          {renderScoreCard(
            game.awayTeam?.name || "Away",
            game.awayScore,
            "away"
          )}

          {/* Game Clock and Controls */}
          <View className="flex-1 items-center mx-4">
            <View className="bg-dark-950 rounded-lg p-3 mb-3">
              <Text className="text-gray-400 text-xs text-center mb-1">
                PERIOD {game.currentQuarter}
              </Text>
              <View className="flex-row items-center justify-center">
                <Icon name="activity" size={16} color="#FFFFFF" />
                <Text className="text-white text-2xl font-mono font-bold ml-2">
                  {formatTime(game.timeRemainingSeconds)}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              {canStart && (
                <TouchableOpacity
                  onPress={() => handleGameControl("start")}
                  className="flex-row items-center px-3 py-2 rounded-lg bg-green-600"
                >
                  <Icon name="play" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {canPause && (
                <TouchableOpacity
                  onPress={() => handleGameControl("pause")}
                  className="flex-row items-center px-3 py-2 rounded-lg bg-yellow-600"
                >
                  <Icon name="pause" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {canResume && (
                <TouchableOpacity
                  onPress={() => handleGameControl("resume")}
                  className="flex-row items-center px-3 py-2 rounded-lg bg-blue-600"
                >
                  <Icon name="play" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {canEnd && (
                <TouchableOpacity
                  onPress={() => handleGameControl("end")}
                  className="flex-row items-center px-3 py-2 bg-red-600 rounded-lg"
                >
                  <Icon name="stop" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Home Team */}
          {renderScoreCard(
            game.homeTeam?.name || "Home",
            game.homeScore,
            "home"
          )}
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row mx-4 mb-4">
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 rounded-lg mx-1 ${
              activeTab === tab.key ? "bg-primary-500" : "bg-gray-700"
            }`}
          >
            <View className="items-center">
              <Icon
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? "#FFFFFF" : "#9CA3AF"}
              />
              <Text
                className={`text-xs mt-1 ${
                  activeTab === tab.key
                    ? "text-white font-semibold"
                    : "text-gray-400"
                }`}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1 px-4">
        {activeTab === "scoreboard" && (
          <View className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <Text className="text-white text-lg font-bold mb-4">
              Game Summary
            </Text>
            <View className="space-y-4">
              <View>
                <Text className="text-white font-semibold mb-2">
                  Game Status
                </Text>
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-400">Status:</Text>
                  <Text
                    className={`font-semibold ${
                      isGameActive
                        ? "text-green-400"
                        : isGamePaused
                        ? "text-yellow-400"
                        : "text-gray-400"
                    }`}
                  >
                    {isGameActive
                      ? "Live"
                      : isGamePaused
                      ? "Paused"
                      : game.status === "completed"
                      ? "Final"
                      : "Not Started"}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-400">Period:</Text>
                  <Text className="text-white">{game.currentQuarter}</Text>
                </View>
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-400">Time:</Text>
                  <Text className="text-white font-mono">
                    {formatTime(game.timeRemainingSeconds)}
                  </Text>
                </View>
              </View>

              <View>
                <Text className="text-white font-semibold mb-2">
                  Score Summary
                </Text>
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-400">
                    {game.awayTeam?.name || "Away"}:
                  </Text>
                  <Text className="text-white font-bold text-lg">
                    {game.awayScore}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-400">
                    {game.homeTeam?.name || "Home"}:
                  </Text>
                  <Text className="text-white font-bold text-lg">
                    {game.homeScore}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-2 border-t border-gray-600 mt-2">
                  <Text className="text-gray-400">Lead:</Text>
                  <Text className="text-primary-400 font-semibold">
                    {game.homeScore === game.awayScore
                      ? "Tied"
                      : `${
                          game.homeScore > game.awayScore
                            ? game.homeTeam?.name || "Home"
                            : game.awayTeam?.name || "Away"
                        } by ${Math.abs(game.homeScore - game.awayScore)}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === "stats" && (
          <View>
            <Text className="text-white text-lg font-bold mb-4">
              {game.awayTeam?.name || "Away"} - Player Stats
            </Text>
            {awayPlayerStats.map((playerStat: PlayerStat) =>
              renderPlayerStatsCard(playerStat, "away")
            )}

            <Text className="text-white text-lg font-bold mb-4 mt-6">
              {game.homeTeam?.name || "Home"} - Player Stats
            </Text>
            {homePlayerStats.map((playerStat: PlayerStat) =>
              renderPlayerStatsCard(playerStat, "home")
            )}
          </View>
        )}

        {activeTab === "substitutions" && (
          <View>
            <Text className="text-white text-lg font-bold mb-4">
              {game.awayTeam?.name || "Away"} - Substitutions
            </Text>
            {awayPlayerStats.map((playerStat: PlayerStat) =>
              renderSubstitutionCard(playerStat, "away")
            )}

            <Text className="text-white text-lg font-bold mb-4 mt-6">
              {game.homeTeam?.name || "Home"} - Substitutions
            </Text>
            {homePlayerStats.map((playerStat: PlayerStat) =>
              renderSubstitutionCard(playerStat, "home")
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
