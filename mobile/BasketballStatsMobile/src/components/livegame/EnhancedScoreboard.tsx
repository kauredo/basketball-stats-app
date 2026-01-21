import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, Modal, Pressable } from "react-native";
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
import ShotClock from "./ShotClock";

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
  onQuarterChange?: (quarter: number) => void;
  onEndPeriod?: () => void;
  shotClockSeconds?: number;
  showShotClock?: boolean;
  isLandscape?: boolean;
}

export default function EnhancedScoreboard({
  game,
  homeTeamStats,
  awayTeamStats,
  timeoutsPerTeam,
  onGameControl,
  onTimeoutHome,
  onTimeoutAway,
  onQuarterChange,
  onEndPeriod,
  shotClockSeconds = 24,
  showShotClock = false,
  isLandscape = false,
}: EnhancedScoreboardProps) {
  const [showQuarterSelector, setShowQuarterSelector] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated shared values are stable refs
  }, [game.homeScore]);

  useEffect(() => {
    if (game.awayScore !== prevAwayScore.value) {
      awayScoreScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 8 })
      );
      prevAwayScore.value = game.awayScore;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated shared values are stable refs
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

  const handleQuarterSelect = (quarter: number) => {
    setShowQuarterSelector(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onQuarterChange?.(quarter);
  };

  const handleEndPeriodPress = () => {
    if (onEndPeriod) {
      // Use the proper end period flow
      onEndPeriod();
    } else {
      // Fallback to direct end if no handler provided
      Alert.alert("End Game", "Are you sure you want to end this game?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Game",
          style: "destructive",
          onPress: () => onGameControl("end"),
        },
      ]);
    }
  };

  const isGameActive = game.status === "active";
  const isGamePaused = game.status === "paused";
  const canStart = game.status === "scheduled";
  const canPause = game.status === "active";
  const canResume = game.status === "paused";
  const canEndPeriod = game.status === "active" || game.status === "paused";

  // Get status badge styling
  const getStatusBadgeClass = () => {
    if (isGameActive) return "bg-red-500";
    if (isGamePaused) return "bg-amber-500";
    if (game.status === "completed") return "bg-surface-500";
    return "bg-blue-500";
  };

  const getStatusText = () => {
    if (isGameActive) return "LIVE";
    if (isGamePaused) return "PAUSED";
    if (game.status === "completed") return "FINAL";
    return "PRE-GAME";
  };

  // Quarter progress dots
  const renderQuarterDots = () => {
    const dots = [];
    for (let i = 1; i <= 4; i++) {
      const isCompleted = i < game.currentQuarter;
      const isCurrent = i === game.currentQuarter && game.currentQuarter <= 4;
      dots.push(
        <View
          key={i}
          className={`w-2 h-2 rounded-full mx-0.5 ${
            isCompleted
              ? "bg-green-500"
              : isCurrent
                ? "bg-orange-500"
                : "bg-surface-400 dark:bg-surface-600"
          }`}
        />
      );
    }
    // Add OT indicator if in overtime
    if (game.currentQuarter > 4) {
      dots.push(
        <View key="ot" className="bg-purple-500 px-1.5 py-0.5 rounded ml-1">
          <Text className="text-white text-[8px] font-bold">OT{game.currentQuarter - 4}</Text>
        </View>
      );
    }
    return dots;
  };

  // Compact landscape layout
  if (isLandscape) {
    return (
      <View className="bg-surface-50 dark:bg-surface-800 mx-4 mt-1 rounded-xl px-4 py-2 border border-surface-200 dark:border-surface-700">
        <View className="flex-row items-center justify-between">
          {/* Away Team */}
          <View className="flex-row items-center flex-1">
            <Text className="text-surface-500 dark:text-surface-400 text-xs mr-2" numberOfLines={1}>
              {game.awayTeam?.name || "Away"}
            </Text>
            <Animated.Text
              className="text-surface-900 dark:text-white text-2xl font-bold"
              style={awayScoreStyle}
            >
              {game.awayScore}
            </Animated.Text>
            {awayTeamStats.inBonus && (
              <View
                className={`ml-2 px-1.5 py-0.5 rounded ${awayTeamStats.inDoubleBonus ? "bg-red-500" : "bg-amber-500"}`}
              >
                <Text className="text-white text-[8px] font-bold">
                  {awayTeamStats.inDoubleBonus ? "2X" : "B"}
                </Text>
              </View>
            )}
          </View>

          {/* Center: Clock, Quarter, Controls */}
          <View className="flex-row items-center gap-3">
            <View className={`px-2 py-0.5 rounded-full ${getStatusBadgeClass()}`}>
              <Text className="text-white text-[9px] font-bold">{getStatusText()}</Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => onQuarterChange && setShowQuarterSelector(true)}
              disabled={!onQuarterChange}
            >
              <Text className="text-primary-500 font-bold text-sm">
                {formatQuarter(game.currentQuarter)}
              </Text>
            </TouchableOpacity>

            <View className="bg-surface-100 dark:bg-surface-700/50 px-3 py-1 rounded-lg">
              <Text className="text-surface-900 dark:text-white text-lg font-bold font-mono">
                {formatTime(game.timeRemainingSeconds)}
              </Text>
            </View>

            {/* Compact Game Controls */}
            <View className="flex-row gap-1">
              {canPause && (
                <TouchableOpacity
                  onPress={() => onGameControl("pause")}
                  className="bg-amber-500 p-1.5 rounded-lg"
                >
                  <Icon name="pause" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {canResume && (
                <TouchableOpacity
                  onPress={() => onGameControl("resume")}
                  className="bg-blue-500 p-1.5 rounded-lg"
                >
                  <Icon name="play" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {canEndPeriod && (
                <TouchableOpacity
                  onPress={handleEndPeriodPress}
                  className="bg-red-500 p-1.5 rounded-lg"
                >
                  <Icon name="stop" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Home Team */}
          <View className="flex-row items-center justify-end flex-1">
            {homeTeamStats.inBonus && (
              <View
                className={`mr-2 px-1.5 py-0.5 rounded ${homeTeamStats.inDoubleBonus ? "bg-red-500" : "bg-amber-500"}`}
              >
                <Text className="text-white text-[8px] font-bold">
                  {homeTeamStats.inDoubleBonus ? "2X" : "B"}
                </Text>
              </View>
            )}
            <Animated.Text
              className="text-surface-900 dark:text-white text-2xl font-bold"
              style={homeScoreStyle}
            >
              {game.homeScore}
            </Animated.Text>
            <Text className="text-surface-500 dark:text-surface-400 text-xs ml-2" numberOfLines={1}>
              {game.homeTeam?.name || "Home"}
            </Text>
          </View>
        </View>

        {/* Quarter Selector Modal - same as portrait */}
        <Modal visible={showQuarterSelector} animationType="fade" transparent>
          <Pressable
            className="flex-1 bg-black/50 justify-center items-center"
            onPress={() => setShowQuarterSelector(false)}
          >
            <View className="bg-surface-50 dark:bg-surface-800 rounded-2xl p-4 mx-8 w-64">
              <Text className="text-surface-900 dark:text-white text-lg font-bold text-center mb-4">
                Select Quarter
              </Text>
              <View className="flex-row flex-wrap justify-center gap-2">
                {[1, 2, 3, 4].map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => handleQuarterSelect(q)}
                    className={`w-14 h-14 rounded-xl items-center justify-center ${
                      game.currentQuarter === q
                        ? "bg-orange-500"
                        : q < game.currentQuarter
                          ? "bg-green-500"
                          : "bg-surface-200 dark:bg-surface-700"
                    }`}
                  >
                    <Text
                      className={`font-bold text-lg ${
                        game.currentQuarter === q || q < game.currentQuarter
                          ? "text-white"
                          : "text-surface-700 dark:text-surface-300"
                      }`}
                    >
                      Q{q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="flex-row justify-center gap-2 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                {[5, 6, 7].map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => handleQuarterSelect(q)}
                    className={`px-4 py-2 rounded-lg ${
                      game.currentQuarter === q
                        ? "bg-purple-500"
                        : "bg-surface-200 dark:bg-surface-700"
                    }`}
                  >
                    <Text
                      className={`font-bold ${
                        game.currentQuarter === q
                          ? "text-white"
                          : "text-surface-700 dark:text-surface-300"
                      }`}
                    >
                      OT{q - 4}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => setShowQuarterSelector(false)} className="mt-4 py-2">
                <Text className="text-surface-500 text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }

  // Portrait layout (original)
  return (
    <View className="bg-surface-50 dark:bg-surface-800 mx-4 mt-2 rounded-2xl p-4 border border-surface-200 dark:border-surface-700">
      {/* Main Score Row */}
      <View className="flex-row items-center justify-between">
        {/* Away Team */}
        <View className="flex-1 items-center">
          <Text className="text-surface-500 dark:text-surface-400 text-xs mb-1" numberOfLines={1}>
            {game.awayTeam?.name || "Away"}
          </Text>
          <Animated.Text
            className="text-surface-900 dark:text-white text-4xl font-bold"
            style={awayScoreStyle}
          >
            {game.awayScore}
          </Animated.Text>
        </View>

        {/* Game Clock & Controls */}
        <View className="items-center mx-4">
          <View className={`px-3 py-1 rounded-full mb-2 ${getStatusBadgeClass()}`}>
            <Text className="text-white text-[11px] font-bold tracking-wide">
              {getStatusText()}
            </Text>
          </View>

          {/* Clock and Shot Clock Row */}
          <View className="flex-row items-center gap-2">
            <View className="bg-surface-100 dark:bg-surface-700/50 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-600">
              <Text className="text-surface-900 dark:text-white text-2xl font-bold font-mono">
                {formatTime(game.timeRemainingSeconds)}
              </Text>
            </View>
            {showShotClock && (isGameActive || isGamePaused) && (
              <ShotClock
                seconds={shotClockSeconds}
                isRunning={isGameActive}
                isWarning={shotClockSeconds <= 5}
                isViolation={shotClockSeconds === 0}
                size="sm"
              />
            )}
          </View>

          {/* Quarter Selector */}
          <TouchableOpacity
            className="flex-row items-center mt-1"
            onPress={() => onQuarterChange && setShowQuarterSelector(true)}
            disabled={!onQuarterChange}
          >
            <View className="flex-row items-center">{renderQuarterDots()}</View>
            {onQuarterChange && <Icon name="chevron-down" size={12} color="#9CA3AF" />}
          </TouchableOpacity>

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
            {canEndPeriod && (
              <TouchableOpacity
                onPress={handleEndPeriodPress}
                className="bg-red-500 px-4 py-2 rounded-lg"
              >
                <Icon name="stop" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Home Team */}
        <View className="flex-1 items-center">
          <Text className="text-surface-500 dark:text-surface-400 text-xs mb-1" numberOfLines={1}>
            {game.homeTeam?.name || "Home"}
          </Text>
          <Animated.Text
            className="text-surface-900 dark:text-white text-4xl font-bold"
            style={homeScoreStyle}
          >
            {game.homeScore}
          </Animated.Text>
        </View>
      </View>

      {/* Stats Row - Team Fouls, Timeouts, Bonus */}
      <View className="flex-row mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
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

      {/* Quarter Selector Modal */}
      <Modal visible={showQuarterSelector} animationType="fade" transparent>
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowQuarterSelector(false)}
        >
          <View className="bg-surface-50 dark:bg-surface-800 rounded-2xl p-4 mx-8 w-64">
            <Text className="text-surface-900 dark:text-white text-lg font-bold text-center mb-4">
              Select Quarter
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {[1, 2, 3, 4].map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => handleQuarterSelect(q)}
                  className={`w-14 h-14 rounded-xl items-center justify-center ${
                    game.currentQuarter === q
                      ? "bg-orange-500"
                      : q < game.currentQuarter
                        ? "bg-green-500"
                        : "bg-surface-200 dark:bg-surface-700"
                  }`}
                >
                  <Text
                    className={`font-bold text-lg ${
                      game.currentQuarter === q || q < game.currentQuarter
                        ? "text-white"
                        : "text-surface-700 dark:text-surface-300"
                    }`}
                  >
                    Q{q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Overtime options */}
            <View className="flex-row justify-center gap-2 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
              {[5, 6, 7].map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => handleQuarterSelect(q)}
                  className={`px-4 py-2 rounded-lg ${
                    game.currentQuarter === q
                      ? "bg-purple-500"
                      : "bg-surface-200 dark:bg-surface-700"
                  }`}
                >
                  <Text
                    className={`font-bold ${
                      game.currentQuarter === q
                        ? "text-white"
                        : "text-surface-700 dark:text-surface-300"
                    }`}
                  >
                    OT{q - 4}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowQuarterSelector(false)} className="mt-4 py-2">
              <Text className="text-surface-500 text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
