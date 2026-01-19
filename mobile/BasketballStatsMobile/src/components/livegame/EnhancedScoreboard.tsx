import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, useColorScheme } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import TimeoutDots from "./TimeoutDots";
import BonusIndicator from "./BonusIndicator";
import TeamFoulsDisplay from "./TeamFoulsDisplay";

interface TeamStats {
  foulsThisQuarter: number;
  teamFouls: number;
  timeoutsRemaining: number;
  inBonus: boolean;
  inDoubleBonus: boolean;
}

interface GameData {
  status: "scheduled" | "active" | "paused" | "completed";
  currentQuarter: number;
  timeRemainingSeconds: number;
  homeScore: number;
  awayScore: number;
  homeTeam?: { name: string } | null;
  awayTeam?: { name: string } | null;
}

interface EnhancedScoreboardProps {
  game: GameData;
  homeTeamStats: TeamStats;
  awayTeamStats: TeamStats;
  timeoutsPerTeam: number;
  onGameControl: (action: "start" | "pause" | "resume" | "end") => void;
  onTimeoutHome?: () => void;
  onTimeoutAway?: () => void;
}

export default function EnhancedScoreboard({
  game,
  homeTeamStats,
  awayTeamStats,
  timeoutsPerTeam,
  onGameControl,
  onTimeoutHome,
  onTimeoutAway,
}: EnhancedScoreboardProps) {
  // Score animation
  const homeScoreScale = useSharedValue(1);
  const awayScoreScale = useSharedValue(1);
  const prevHomeScore = useSharedValue(game.homeScore);
  const prevAwayScore = useSharedValue(game.awayScore);

  useEffect(() => {
    if (game.homeScore !== prevHomeScore.value) {
      homeScoreScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 8 })
      );
      prevHomeScore.value = game.homeScore;
    }
  }, [game.homeScore]);

  useEffect(() => {
    if (game.awayScore !== prevAwayScore.value) {
      awayScoreScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 8 })
      );
      prevAwayScore.value = game.awayScore;
    }
  }, [game.awayScore]);

  const homeScoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: homeScoreScale.value }],
  }));

  const awayScoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: awayScoreScale.value }],
  }));

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatQuarter = (quarter: number): string => {
    if (quarter <= 4) return `Q${quarter}`;
    return `OT${quarter - 4}`;
  };

  const handleTimeoutTap = (isHome: boolean) => {
    const stats = isHome ? homeTeamStats : awayTeamStats;
    const teamName = isHome ? game.homeTeam?.name || "Home" : game.awayTeam?.name || "Away";

    Alert.alert(
      "Call Timeout",
      `Call timeout for ${teamName}? (${stats.timeoutsRemaining} remaining)`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Timeout",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (isHome) {
              onTimeoutHome?.();
            } else {
              onTimeoutAway?.();
            }
          },
        },
      ]
    );
  };

  const isGameActive = game.status === "active";
  const isGamePaused = game.status === "paused";
  const canStart = game.status === "scheduled";
  const canPause = game.status === "active";
  const canResume = game.status === "paused";
  const canEnd = game.status === "active" || game.status === "paused";

  // Get status badge styling
  const getStatusBadgeClass = () => {
    if (isGameActive) return "bg-red-500";
    if (isGamePaused) return "bg-amber-500";
    if (game.status === "completed") return "bg-gray-500";
    return "bg-blue-500";
  };

  const getStatusText = () => {
    if (isGameActive) return "LIVE";
    if (isGamePaused) return "PAUSED";
    if (game.status === "completed") return "FINAL";
    return "PRE-GAME";
  };

  return (
    <View className="bg-white dark:bg-gray-800 mx-4 mt-2 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
      {/* Main Score Row */}
      <View className="flex-row items-center justify-between">
        {/* Away Team */}
        <View className="flex-1 items-center">
          <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1" numberOfLines={1}>
            {game.awayTeam?.name || "Away"}
          </Text>
          <Animated.Text
            className="text-gray-900 dark:text-white text-4xl font-bold"
            style={awayScoreStyle}
          >
            {game.awayScore}
          </Animated.Text>
        </View>

        {/* Game Clock */}
        <View className="items-center mx-4">
          <View className={`px-3 py-1 rounded-full mb-2 ${getStatusBadgeClass()}`}>
            <Text className="text-white text-[11px] font-bold tracking-wide">
              {getStatusText()}
            </Text>
          </View>
          <View className="bg-gray-100 dark:bg-gray-700/50 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600">
            <Text className="text-gray-900 dark:text-white text-2xl font-bold font-mono">
              {formatTime(game.timeRemainingSeconds)}
            </Text>
          </View>
          <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {formatQuarter(game.currentQuarter)}
          </Text>

          {/* Game Controls */}
          <View className="flex-row mt-2 gap-2">
            {canStart && (
              <TouchableOpacity
                onPress={() => onGameControl("start")}
                className="bg-emerald-500 px-4 py-2 rounded-lg"
              >
                <Icon name="play" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {canPause && (
              <TouchableOpacity
                onPress={() => onGameControl("pause")}
                className="bg-amber-500 px-4 py-2 rounded-lg"
              >
                <Icon name="pause" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {canResume && (
              <TouchableOpacity
                onPress={() => onGameControl("resume")}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Icon name="play" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {canEnd && (
              <TouchableOpacity
                onPress={() => onGameControl("end")}
                className="bg-red-500 px-4 py-2 rounded-lg"
              >
                <Icon name="stop" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Home Team */}
        <View className="flex-1 items-center">
          <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1" numberOfLines={1}>
            {game.homeTeam?.name || "Home"}
          </Text>
          <Animated.Text
            className="text-gray-900 dark:text-white text-4xl font-bold"
            style={homeScoreStyle}
          >
            {game.homeScore}
          </Animated.Text>
        </View>
      </View>

      {/* Stats Row - Team Fouls, Timeouts, Bonus */}
      <View className="flex-row mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        {/* Away Team Stats */}
        <View className="flex-1 items-start gap-1">
          <View className="flex-row items-center gap-2">
            <TeamFoulsDisplay
              foulsThisQuarter={awayTeamStats.foulsThisQuarter}
              totalFouls={awayTeamStats.teamFouls}
            />
            <TimeoutDots
              total={timeoutsPerTeam}
              remaining={awayTeamStats.timeoutsRemaining}
              onTimeoutTap={() => handleTimeoutTap(false)}
              disabled={game.status === "completed"}
            />
          </View>
          <BonusIndicator
            inBonus={awayTeamStats.inBonus}
            inDoubleBonus={awayTeamStats.inDoubleBonus}
          />
        </View>

        {/* Spacer */}
        <View className="w-12" />

        {/* Home Team Stats */}
        <View className="flex-1 items-end gap-1">
          <View className="flex-row items-center gap-2">
            <TimeoutDots
              total={timeoutsPerTeam}
              remaining={homeTeamStats.timeoutsRemaining}
              onTimeoutTap={() => handleTimeoutTap(true)}
              disabled={game.status === "completed"}
            />
            <TeamFoulsDisplay
              foulsThisQuarter={homeTeamStats.foulsThisQuarter}
              totalFouls={homeTeamStats.teamFouls}
            />
          </View>
          <BonusIndicator
            inBonus={homeTeamStats.inBonus}
            inDoubleBonus={homeTeamStats.inDoubleBonus}
          />
        </View>
      </View>
    </View>
  );
}
