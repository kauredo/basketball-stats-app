import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
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

  return (
    <View style={styles.container}>
      {/* Main Score Row */}
      <View style={styles.mainRow}>
        {/* Away Team */}
        <View style={styles.teamSection}>
          <Text style={styles.teamName} numberOfLines={1}>
            {game.awayTeam?.name || "Away"}
          </Text>
          <Animated.Text style={[styles.score, awayScoreStyle]}>
            {game.awayScore}
          </Animated.Text>
        </View>

        {/* Game Clock */}
        <View style={styles.clockSection}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isGameActive
                  ? "#EF4444"
                  : isGamePaused
                    ? "#F59E0B"
                    : game.status === "completed"
                      ? "#6B7280"
                      : "#3B82F6",
              },
            ]}
          >
            <Text style={styles.statusText}>
              {isGameActive
                ? "LIVE"
                : isGamePaused
                  ? "PAUSED"
                  : game.status === "completed"
                    ? "FINAL"
                    : "SCHEDULED"}
            </Text>
          </View>
          <Text style={styles.time}>{formatTime(game.timeRemainingSeconds)}</Text>
          <Text style={styles.quarter}>{formatQuarter(game.currentQuarter)}</Text>

          {/* Game Controls */}
          <View style={styles.controls}>
            {canStart && (
              <TouchableOpacity
                onPress={() => onGameControl("start")}
                style={[styles.controlButton, { backgroundColor: "#22C55E" }]}
              >
                <Icon name="play" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {canPause && (
              <TouchableOpacity
                onPress={() => onGameControl("pause")}
                style={[styles.controlButton, { backgroundColor: "#F59E0B" }]}
              >
                <Icon name="pause" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {canResume && (
              <TouchableOpacity
                onPress={() => onGameControl("resume")}
                style={[styles.controlButton, { backgroundColor: "#3B82F6" }]}
              >
                <Icon name="play" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {canEnd && (
              <TouchableOpacity
                onPress={() => onGameControl("end")}
                style={[styles.controlButton, { backgroundColor: "#EF4444" }]}
              >
                <Icon name="stop" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Home Team */}
        <View style={styles.teamSection}>
          <Text style={styles.teamName} numberOfLines={1}>
            {game.homeTeam?.name || "Home"}
          </Text>
          <Animated.Text style={[styles.score, homeScoreStyle]}>
            {game.homeScore}
          </Animated.Text>
        </View>
      </View>

      {/* Stats Row - Team Fouls, Timeouts, Bonus */}
      <View style={styles.statsRow}>
        {/* Away Team Stats */}
        <View style={styles.teamStatsSection}>
          <View style={styles.foulsTimeoutsRow}>
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
        <View style={styles.spacer} />

        {/* Home Team Stats */}
        <View style={[styles.teamStatsSection, styles.homeStatsSection]}>
          <View style={styles.foulsTimeoutsRow}>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2937",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
  },
  teamName: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  score: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "700",
  },
  clockSection: {
    alignItems: "center",
    marginHorizontal: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  time: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  quarter: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  teamStatsSection: {
    flex: 1,
    alignItems: "flex-start",
    gap: 4,
  },
  homeStatsSection: {
    alignItems: "flex-end",
  },
  foulsTimeoutsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  spacer: {
    width: 48,
  },
});
