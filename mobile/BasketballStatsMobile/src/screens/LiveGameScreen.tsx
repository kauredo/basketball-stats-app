import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import Svg, { Rect, Circle, Line, Path, G } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { RootStackParamList } from "../../App";
import { COLORS, TOUCH_TARGETS, getShotZone } from "@basketball-stats/shared";

// Import new components
import EnhancedScoreboard from "../components/livegame/EnhancedScoreboard";
import FoulTypeModal, { FoulType } from "../components/livegame/FoulTypeModal";
import FreeThrowSequenceModal, { FreeThrowSequence } from "../components/livegame/FreeThrowSequenceModal";
import QuickUndoFAB, { LastAction } from "../components/livegame/QuickUndoFAB";
import OvertimePromptModal from "../components/livegame/OvertimePromptModal";
import PlayByPlayTab from "../components/livegame/PlayByPlayTab";
import useSoundFeedback from "../hooks/useSoundFeedback";

type LiveGameRouteProp = RouteProp<RootStackParamList, "LiveGame">;

const screenWidth = Dimensions.get("window").width;
const MINI_COURT_WIDTH = screenWidth - 64;
const MINI_COURT_HEIGHT = MINI_COURT_WIDTH * 0.6;

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
  fouledOut?: boolean;
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

interface PlayerSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (player: PlayerStat) => void;
  players: PlayerStat[];
  title: string;
}

function PlayerSelectModal({ visible, onClose, onSelect, players }: PlayerSelectModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-gray-800 rounded-t-3xl max-h-[70%]">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-gray-900 dark:text-white text-lg font-bold">Select Player</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={players.filter((p) => p.isOnCourt)}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <Text className="text-gray-600 dark:text-gray-400 text-xs px-4 py-2 bg-gray-100 dark:bg-gray-900">
                ON COURT
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                className="p-4 border-b border-gray-200 dark:border-gray-700 flex-row items-center"
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <View className="w-12 h-12 bg-primary-500 rounded-full justify-center items-center mr-3">
                  <Text className="text-gray-900 dark:text-white font-bold text-lg">
                    #{item.player?.number}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-medium text-base">
                    {item.player?.name}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400 text-sm">
                    PTS: {item.points} • REB: {item.rebounds} • AST: {item.assists}
                  </Text>
                </View>
                <View className="bg-green-600 px-2 py-1 rounded">
                  <Text className="text-white text-xs">ON</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

// Animated Stat Button Component
interface StatButtonProps {
  label: string;
  shortLabel: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  size?: "normal" | "large";
}

function StatButton({
  label,
  shortLabel,
  color,
  onPress,
  disabled,
  size = "normal",
}: StatButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonHeight = size === "large" ? TOUCH_TARGETS.large : TOUCH_TARGETS.comfortable;

  return (
    <Animated.View style={[animatedStyle, styles.statButtonContainer]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.statButton,
          {
            backgroundColor: disabled ? "#374151" : color,
            height: buttonHeight,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        activeOpacity={0.8}
      >
        <Text style={styles.statButtonLabel}>{label}</Text>
        <Text style={styles.statButtonShortLabel}>{shortLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Mini Basketball Court for Shot Recording
interface MiniCourtProps {
  onCourtTap: (x: number, y: number, zone: string, is3pt: boolean) => void;
  disabled?: boolean;
  recentShots?: Array<{ x: number; y: number; made: boolean }>;
}

function MiniCourt({ onCourtTap, disabled, recentShots = [] }: MiniCourtProps) {
  const handleTap = useCallback(
    (tapX: number, tapY: number) => {
      const courtX = (tapX / MINI_COURT_WIDTH) * 50 - 25;
      const courtY = (tapY / MINI_COURT_HEIGHT) * 28;
      const zone = getShotZone(courtX, courtY);
      const distanceFromBasket = Math.sqrt(courtX * courtX + (courtY - 5.25) ** 2);
      const is3pt = distanceFromBasket > 23.75 || (Math.abs(courtX) > 22 && courtY < 14);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onCourtTap(courtX, courtY, zone, is3pt);
    },
    [onCourtTap]
  );

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onEnd((event) => {
      runOnJS(handleTap)(event.x, event.y);
    });

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.miniCourtContainer, disabled && styles.miniCourtDisabled]}>
        <Svg width={MINI_COURT_WIDTH} height={MINI_COURT_HEIGHT} viewBox="0 0 50 28">
          <Rect x="0" y="0" width="50" height="28" fill={COLORS.court.background} />
          <Rect x="0" y="0" width="50" height="28" fill="none" stroke="#4A5568" strokeWidth="0.3" />
          <Rect x="17" y="0" width="16" height="15" fill="none" stroke="#4A5568" strokeWidth="0.3" />
          <Circle cx="25" cy="15" r="4" fill="none" stroke="#4A5568" strokeWidth="0.3" />
          <Path d="M 21 0 A 4 4 0 0 0 29 0" fill="none" stroke="#4A5568" strokeWidth="0.3" />
          <Circle cx="25" cy="4" r="0.6" fill={COLORS.primary[500]} />
          <Path d="M 3 0 L 3 10 A 20 20 0 0 0 47 10 L 47 0" fill="none" stroke="#4A5568" strokeWidth="0.3" />
          <G>
            <Circle cx="25" cy="22" r="3" fill="rgba(239, 68, 68, 0.3)" />
            <Circle cx="10" cy="20" r="2.5" fill="rgba(34, 197, 94, 0.3)" />
            <Circle cx="40" cy="20" r="2.5" fill="rgba(34, 197, 94, 0.3)" />
          </G>
          {recentShots.slice(-5).map((shot, index) => {
            const svgX = 25 + shot.x;
            const svgY = shot.y * 0.6;
            return (
              <Circle
                key={index}
                cx={svgX}
                cy={svgY}
                r={1.2}
                fill={shot.made ? COLORS.shots.made2pt : COLORS.shots.missed2pt}
                opacity={0.8}
                stroke="#fff"
                strokeWidth={0.2}
              />
            );
          })}
        </Svg>
        {!disabled && (
          <View style={styles.courtOverlay}>
            <Text style={styles.courtOverlayText}>TAP TO RECORD SHOT LOCATION</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// Shot Type Selection Modal
interface ShotTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMade: () => void;
  onSelectMissed: () => void;
  shotType: "2pt" | "3pt";
  location: { x: number; y: number } | null;
}

function ShotTypeModal({
  visible,
  onClose,
  onSelectMade,
  onSelectMissed,
  shotType,
}: ShotTypeModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/70 justify-center items-center px-8">
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full">
          <Text className="text-gray-900 dark:text-white text-xl font-bold text-center mb-2">
            {shotType === "3pt" ? "3-Point Shot" : "2-Point Shot"}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
            Did the shot go in?
          </Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity
              className="flex-1 bg-green-600 py-4 rounded-xl"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onSelectMade();
              }}
            >
              <Text className="text-white text-lg font-bold text-center">MADE</Text>
              <Text className="text-green-200 text-sm text-center">
                +{shotType === "3pt" ? "3" : "2"} PTS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-red-600 py-4 rounded-xl"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                onSelectMissed();
              }}
            >
              <Text className="text-white text-lg font-bold text-center">MISSED</Text>
              <Text className="text-red-200 text-sm text-center">0 PTS</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="mt-4 py-3" onPress={onClose}>
            <Text className="text-gray-600 dark:text-gray-400 text-center">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const TABS = [
  { key: "court", label: "Court", icon: "basketball" },
  { key: "stats", label: "Stats", icon: "stats" },
  { key: "subs", label: "Subs", icon: "users" },
  { key: "plays", label: "Plays", icon: "list" },
];

export default function LiveGameScreen() {
  const route = useRoute<LiveGameRouteProp>();
  const { token } = useAuth();
  const gameId = route.params.gameId as Id<"games">;

  // Sound feedback hook
  const soundFeedback = useSoundFeedback();

  // Tab state - now includes 'plays'
  const [activeTab, setActiveTab] = useState<"court" | "stats" | "subs" | "plays">("court");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStat | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [pendingShot, setPendingShot] = useState<{
    x: number;
    y: number;
    zone: string;
    is3pt: boolean;
  } | null>(null);
  const [recentShots, setRecentShots] = useState<Array<{ x: number; y: number; made: boolean }>>([]);

  // New state for enhanced features
  const [pendingFoul, setPendingFoul] = useState<PlayerStat | null>(null);
  const [showFoulTypeModal, setShowFoulTypeModal] = useState(false);
  const [freeThrowSequence, setFreeThrowSequence] = useState<FreeThrowSequence | null>(null);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false);

  // Real-time game data from Convex
  const gameData = useQuery(api.games.get, token && gameId ? { token, gameId } : "skip");
  const liveStats = useQuery(api.stats.getLiveStats, token && gameId ? { token, gameId } : "skip");
  const gameEvents = useQuery(api.games.getGameEvents, token && gameId ? { token, gameId, limit: 50 } : "skip");

  // Mutations
  const startGame = useMutation(api.games.start);
  const pauseGame = useMutation(api.games.pause);
  const resumeGame = useMutation(api.games.resume);
  const endGame = useMutation(api.games.end);
  const recordStat = useMutation(api.stats.recordStat);
  const substituteMutation = useMutation(api.stats.substitute);
  const recordFoulWithContext = useMutation(api.stats.recordFoulWithContext);
  const recordFreeThrow = useMutation(api.stats.recordFreeThrow);
  const recordTimeout = useMutation(api.games.recordTimeout);
  const startOvertime = useMutation(api.games.startOvertime);
  const undoStat = useMutation(api.stats.undoStat);

  const game = gameData?.game;
  const allStats = liveStats?.stats || [];
  const teamStats = liveStats?.teamStats;
  const homePlayerStats = allStats.filter((s: PlayerStat) => s.isHomeTeam);
  const awayPlayerStats = allStats.filter((s: PlayerStat) => !s.isHomeTeam);
  const onCourtPlayers = allStats.filter((s: PlayerStat) => s.isOnCourt);

  // Check for overtime trigger
  useEffect(() => {
    if (
      game?.status === "paused" &&
      game.currentQuarter >= 4 &&
      game.homeScore === game.awayScore &&
      game.timeRemainingSeconds === 0
    ) {
      setShowOvertimePrompt(true);
      soundFeedback.overtime();
    }
  }, [game?.status, game?.currentQuarter, game?.homeScore, game?.awayScore, game?.timeRemainingSeconds]);

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
          await endGame({ token, gameId, forceEnd: true });
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
    made?: boolean,
    shotLocation?: { x: number; y: number }
  ) => {
    if (!token) return;

    try {
      const result = await recordStat({
        token,
        gameId,
        playerId,
        statType: statType as any,
        made,
      });

      // Set last action for undo
      const player = allStats.find((s) => s.playerId === playerId);
      if (player?.player) {
        setLastAction({
          playerId,
          playerNumber: player.player.number,
          playerName: player.player.name,
          statType,
          wasMade: made,
          displayText: `${statType}${made !== undefined ? (made ? " Made" : " Missed") : ""}`,
          timestamp: Date.now(),
        });
      }

      // Add to recent shots for visualization
      if (shotLocation && (statType === "shot2" || statType === "shot3")) {
        setRecentShots((prev) => [...prev.slice(-4), { ...shotLocation, made: made || false }]);
      }

      // Sound/haptic feedback
      if (made === true) {
        soundFeedback.made();
      } else if (made === false) {
        soundFeedback.missed();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Check for foul out
      if (result.didFoulOut) {
        soundFeedback.foulOut();
        Alert.alert("Fouled Out!", `${player?.player?.name} has fouled out of the game.`);
      }
    } catch (error: any) {
      console.error("Failed to record stat:", error);
      Alert.alert("Error", "Failed to record stat");
      soundFeedback.error();
    }
  };

  const handleFoulPress = () => {
    if (!selectedPlayer) {
      setShowPlayerModal(true);
      return;
    }
    setPendingFoul(selectedPlayer);
    setShowFoulTypeModal(true);
  };

  const handleFoulTypeSelect = async (
    foulType: FoulType,
    shootingDetails?: {
      shotType: "2pt" | "3pt";
      wasAndOne: boolean;
      fouledPlayerId: Id<"players">;
    }
  ) => {
    if (!pendingFoul || !token) return;

    try {
      const result = await recordFoulWithContext({
        token,
        gameId,
        playerId: pendingFoul.playerId,
        foulType,
        wasAndOne: shootingDetails?.wasAndOne,
        shotType: shootingDetails?.shotType,
        fouledPlayerId: shootingDetails?.fouledPlayerId,
      });

      soundFeedback.foul();

      // Set last action for undo
      if (pendingFoul.player) {
        setLastAction({
          playerId: pendingFoul.playerId,
          playerNumber: pendingFoul.player.number,
          playerName: pendingFoul.player.name,
          statType: "foul",
          displayText: `${foulType} foul`,
          timestamp: Date.now(),
        });
      }

      // Check for foul out
      if (result.playerFouledOut) {
        soundFeedback.foulOut();
        Alert.alert("Fouled Out!", `${pendingFoul.player?.name} has fouled out of the game.`);
      }

      // Start free throw sequence if needed
      if (result.freeThrowsAwarded > 0) {
        const shooterId = shootingDetails?.fouledPlayerId || pendingFoul.playerId;
        const shooter = allStats.find((s) => s.playerId === shooterId);
        if (shooter?.player) {
          setFreeThrowSequence({
            playerId: shooterId,
            playerName: shooter.player.name,
            playerNumber: shooter.player.number,
            totalAttempts: result.freeThrowsAwarded,
            isOneAndOne: result.inBonus && !result.inDoubleBonus && result.bonusMode === "college",
          });
        }
      }

      setPendingFoul(null);
      setShowFoulTypeModal(false);
    } catch (error: any) {
      console.error("Failed to record foul:", error);
      Alert.alert("Error", "Failed to record foul");
      soundFeedback.error();
    }
  };

  const handleFreeThrowResult = async (
    playerId: Id<"players">,
    made: boolean,
    attemptNumber: number,
    totalAttempts: number,
    isOneAndOne: boolean
  ): Promise<{ sequenceContinues: boolean }> => {
    if (!token) return { sequenceContinues: false };

    try {
      const result = await recordFreeThrow({
        token,
        gameId,
        playerId,
        made,
        attemptNumber,
        totalAttempts,
        isOneAndOne,
      });

      if (made) {
        soundFeedback.made();
      } else {
        soundFeedback.missed();
      }

      return { sequenceContinues: result.sequenceContinues };
    } catch (error: any) {
      console.error("Failed to record free throw:", error);
      soundFeedback.error();
      return { sequenceContinues: false };
    }
  };

  const handleUndo = async (action: LastAction) => {
    if (!token) return;

    try {
      await undoStat({
        token,
        gameId,
        playerId: action.playerId,
        statType: action.statType as any,
        wasMade: action.wasMade,
      });

      soundFeedback.success();
      setLastAction(null);
    } catch (error: any) {
      console.error("Failed to undo:", error);
      Alert.alert("Error", "Failed to undo action");
      soundFeedback.error();
    }
  };

  const handleTimeout = async (isHome: boolean) => {
    if (!token || !game) return;

    const teamId = isHome ? game.homeTeam?.id : game.awayTeam?.id;
    if (!teamId) return;

    try {
      await recordTimeout({ token, gameId, teamId: teamId as Id<"teams"> });
      soundFeedback.timeout();
    } catch (error: any) {
      console.error("Failed to record timeout:", error);
      Alert.alert("Error", error.message || "Failed to record timeout");
      soundFeedback.error();
    }
  };

  const handleStartOvertime = async () => {
    if (!token) return;

    try {
      await startOvertime({ token, gameId });
      setShowOvertimePrompt(false);
      soundFeedback.overtime();
    } catch (error: any) {
      console.error("Failed to start overtime:", error);
      Alert.alert("Error", "Failed to start overtime");
      soundFeedback.error();
    }
  };

  const handleEndAsTie = async () => {
    if (!token) return;

    try {
      await endGame({ token, gameId, forceEnd: true });
      setShowOvertimePrompt(false);
    } catch (error: any) {
      console.error("Failed to end game:", error);
      Alert.alert("Error", "Failed to end game");
      soundFeedback.error();
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

  const handleCourtTap = (x: number, y: number, zone: string, is3pt: boolean) => {
    if (!selectedPlayer) {
      setShowPlayerModal(true);
      return;
    }
    setPendingShot({ x, y, zone, is3pt });
  };

  const handleShotResult = (made: boolean) => {
    if (!pendingShot || !selectedPlayer) return;

    const statType = pendingShot.is3pt ? "shot3" : "shot2";
    handleRecordStat(selectedPlayer.playerId, statType, made, {
      x: pendingShot.x,
      y: pendingShot.y,
    });
    setPendingShot(null);
  };

  if (gameData === undefined || liveStats === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-dark-950">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-900 dark:text-white text-base">Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-dark-950">
        <View className="flex-1 justify-center items-center">
          <Icon name="basketball" size={48} color="#9CA3AF" />
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mt-4 mb-2">
            Game not found
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center">
            The requested game could not be found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isGameActive = game.status === "active";
  const canRecordStats = isGameActive;

  // Team stats for enhanced scoreboard
  const homeTeamStatsData = {
    foulsThisQuarter: teamStats?.home.foulsThisQuarter || 0,
    teamFouls: teamStats?.home.teamFouls || 0,
    timeoutsRemaining: teamStats?.home.timeoutsRemaining || 4,
    inBonus: teamStats?.home.inBonus || false,
    inDoubleBonus: teamStats?.home.inDoubleBonus || false,
  };

  const awayTeamStatsData = {
    foulsThisQuarter: teamStats?.away.foulsThisQuarter || 0,
    teamFouls: teamStats?.away.teamFouls || 0,
    timeoutsRemaining: teamStats?.away.timeoutsRemaining || 4,
    inBonus: teamStats?.away.inBonus || false,
    inDoubleBonus: teamStats?.away.inDoubleBonus || false,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-dark-950">
      <StatusBar style="light" />

      {/* Enhanced Scoreboard */}
      <EnhancedScoreboard
        game={{
          status: game.status,
          currentQuarter: game.currentQuarter,
          timeRemainingSeconds: game.timeRemainingSeconds,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
        }}
        homeTeamStats={homeTeamStatsData}
        awayTeamStats={awayTeamStatsData}
        timeoutsPerTeam={liveStats?.game?.timeoutsPerTeam || 4}
        onGameControl={handleGameControl}
        onTimeoutHome={() => handleTimeout(true)}
        onTimeoutAway={() => handleTimeout(false)}
      />

      {/* Tab Navigation */}
      <View className="flex-row mx-4 mt-4 mb-2">
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              setActiveTab(tab.key as any);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className={`flex-1 py-3 rounded-xl mx-1 ${
              activeTab === tab.key ? "bg-primary-500" : "bg-white dark:bg-gray-800"
            }`}
          >
            <View className="items-center">
              <Icon
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? "#FFFFFF" : "#9CA3AF"}
              />
              <Text
                className={`text-xs mt-1 font-medium ${
                  activeTab === tab.key ? "text-white" : "text-gray-600 dark:text-gray-400"
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
        {activeTab === "court" && (
          <View className="pb-6">
            {/* Selected Player Indicator */}
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-4 flex-row items-center border border-gray-200 dark:border-gray-700"
              onPress={() => setShowPlayerModal(true)}
            >
              {selectedPlayer ? (
                <>
                  <View className="w-10 h-10 bg-primary-500 rounded-full justify-center items-center mr-3">
                    <Text className="text-gray-900 dark:text-white font-bold">
                      #{selectedPlayer.player?.number}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {selectedPlayer.player?.name}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-xs">
                      {selectedPlayer.isHomeTeam ? game.homeTeam?.name : game.awayTeam?.name}
                    </Text>
                  </View>
                  <View className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                    <Text className="text-gray-700 dark:text-gray-300 text-xs">Change</Text>
                  </View>
                </>
              ) : (
                <>
                  <View className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full justify-center items-center mr-3">
                    <Icon name="user" size={20} color="#9CA3AF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 dark:text-gray-400">Select Player</Text>
                    <Text className="text-gray-500 text-xs">
                      Tap to choose who to record stats for
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#9CA3AF" />
                </>
              )}
            </TouchableOpacity>

            {/* Mini Court for Shot Recording */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                Shot Location
              </Text>
              <MiniCourt
                onCourtTap={handleCourtTap}
                disabled={!canRecordStats}
                recentShots={recentShots}
              />
            </View>

            {/* Stat Buttons Grid */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-900 dark:text-white font-semibold mb-3">Quick Stats</Text>

              {/* Scoring Row */}
              <View className="mb-2">
                <Text className="text-gray-500 text-xs mb-2 uppercase">Scoring</Text>
                <View className="flex-row">
                  <StatButton
                    label="2PT"
                    shortLabel="+2"
                    color="#22C55E"
                    size="large"
                    disabled={!canRecordStats || !selectedPlayer}
                    onPress={() => {
                      if (selectedPlayer) {
                        handleRecordStat(selectedPlayer.playerId, "shot2", true);
                      }
                    }}
                  />
                  <StatButton
                    label="3PT"
                    shortLabel="+3"
                    color="#22C55E"
                    size="large"
                    disabled={!canRecordStats || !selectedPlayer}
                    onPress={() => {
                      if (selectedPlayer) {
                        handleRecordStat(selectedPlayer.playerId, "shot3", true);
                      }
                    }}
                  />
                  <StatButton
                    label="FT"
                    shortLabel="+1"
                    color="#22C55E"
                    size="large"
                    disabled={!canRecordStats || !selectedPlayer}
                    onPress={() => {
                      if (selectedPlayer) {
                        handleRecordStat(selectedPlayer.playerId, "freethrow", true);
                      }
                    }}
                  />
                  <StatButton
                    label="MISS"
                    shortLabel="X"
                    color="#EF4444"
                    size="large"
                    disabled={!canRecordStats || !selectedPlayer}
                    onPress={() => {
                      if (selectedPlayer) {
                        handleRecordStat(selectedPlayer.playerId, "shot2", false);
                      }
                    }}
                  />
                </View>
              </View>

              {/* Other Stats Row */}
              <View>
                <Text className="text-gray-500 text-xs mb-2 uppercase">Other</Text>
                <View className="flex-row mb-2">
                  <StatButton
                    label="REB"
                    shortLabel="+R"
                    color="#3B82F6"
                    disabled={!canRecordStats || !selectedPlayer}
                    onPress={() => {
                      if (selectedPlayer) {
                        handleRecordStat(selectedPlayer.playerId, "rebound");
                      }
                    }}
                  />
                  <StatButton
                    label="AST"
                    shortLabel="+A"
                    color="#8B5CF6"
                    disabled={!canRecordStats || !selectedPlayer}
                    onPress={() => {
                      if (selectedPlayer) {
                        handleRecordStat(selectedPlayer.playerId, "assist");
                      }
                    }}
                  />
                  <StatButton
                    label="STL"
                    shortLabel="+S"
                    color="#06B6D4"
                    disabled={!canRecordStats || !selectedPlayer}
                    onPress={() => {
                      if (selectedPlayer) {
                        handleRecordStat(selectedPlayer.playerId, "steal");
                      }
                    }}
                  />
                  <StatButton
                    label="BLK"
                    shortLabel="+B"
                    color="#06B6D4"
                    disabled={!canRecordStats || !selectedPlayer}
                    onPress={() => {
                      if (selectedPlayer) {
                        handleRecordStat(selectedPlayer.playerId, "block");
                      }
                    }}
                  />
                </View>
                <View className="flex-row">
                  <StatButton
                    label="TO"
                    shortLabel="+T"
                    color="#F59E0B"
                    disabled={!canRecordStats || !selectedPlayer}
                    onPress={() => {
                      if (selectedPlayer) {
                        handleRecordStat(selectedPlayer.playerId, "turnover");
                      }
                    }}
                  />
                  <StatButton
                    label="FOUL"
                    shortLabel="+F"
                    color="#F59E0B"
                    disabled={!canRecordStats || !selectedPlayer}
                    onPress={handleFoulPress}
                  />
                  <View className="flex-1 mx-1" />
                  <View className="flex-1 mx-1" />
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === "stats" && (
          <View className="pb-6">
            {/* Away Team Stats */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                {game.awayTeam?.name || "Away"}
              </Text>
              {awayPlayerStats.map((playerStat: PlayerStat) => {
                const player = playerStat.player;
                if (!player) return null;

                return (
                  <View
                    key={playerStat.id}
                    className={`flex-row items-center py-3 border-b border-gray-200 dark:border-gray-700 ${
                      !playerStat.isOnCourt ? "opacity-50" : ""
                    }`}
                  >
                    <View className="w-8 mr-2">
                      <Text className="text-gray-600 dark:text-gray-400 text-xs">
                        #{player.number}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-medium">
                        {player.name}
                        {playerStat.fouledOut && (
                          <Text className="text-red-500 text-xs"> (OUT)</Text>
                        )}
                      </Text>
                    </View>
                    <View className="flex-row">
                      <View className="w-12 items-center">
                        <Text className="text-gray-900 dark:text-white font-bold">
                          {playerStat.points}
                        </Text>
                        <Text className="text-gray-500 text-xs">PTS</Text>
                      </View>
                      <View className="w-10 items-center">
                        <Text className="text-gray-900 dark:text-white">{playerStat.rebounds}</Text>
                        <Text className="text-gray-500 text-xs">REB</Text>
                      </View>
                      <View className="w-10 items-center">
                        <Text className="text-gray-900 dark:text-white">{playerStat.assists}</Text>
                        <Text className="text-gray-500 text-xs">AST</Text>
                      </View>
                      <View className="w-8 items-center">
                        <Text className={`${playerStat.fouls >= 4 ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
                          {playerStat.fouls}
                        </Text>
                        <Text className="text-gray-500 text-xs">PF</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Home Team Stats */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                {game.homeTeam?.name || "Home"}
              </Text>
              {homePlayerStats.map((playerStat: PlayerStat) => {
                const player = playerStat.player;
                if (!player) return null;

                return (
                  <View
                    key={playerStat.id}
                    className={`flex-row items-center py-3 border-b border-gray-200 dark:border-gray-700 ${
                      !playerStat.isOnCourt ? "opacity-50" : ""
                    }`}
                  >
                    <View className="w-8 mr-2">
                      <Text className="text-gray-600 dark:text-gray-400 text-xs">
                        #{player.number}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-medium">
                        {player.name}
                        {playerStat.fouledOut && (
                          <Text className="text-red-500 text-xs"> (OUT)</Text>
                        )}
                      </Text>
                    </View>
                    <View className="flex-row">
                      <View className="w-12 items-center">
                        <Text className="text-gray-900 dark:text-white font-bold">
                          {playerStat.points}
                        </Text>
                        <Text className="text-gray-500 text-xs">PTS</Text>
                      </View>
                      <View className="w-10 items-center">
                        <Text className="text-gray-900 dark:text-white">{playerStat.rebounds}</Text>
                        <Text className="text-gray-500 text-xs">REB</Text>
                      </View>
                      <View className="w-10 items-center">
                        <Text className="text-gray-900 dark:text-white">{playerStat.assists}</Text>
                        <Text className="text-gray-500 text-xs">AST</Text>
                      </View>
                      <View className="w-8 items-center">
                        <Text className={`${playerStat.fouls >= 4 ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
                          {playerStat.fouls}
                        </Text>
                        <Text className="text-gray-500 text-xs">PF</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === "subs" && (
          <View className="pb-6">
            {/* Away Team Subs */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                {game.awayTeam?.name || "Away"}
              </Text>
              {awayPlayerStats.map((playerStat: PlayerStat) => {
                const player = playerStat.player;
                if (!player) return null;

                return (
                  <TouchableOpacity
                    key={playerStat.id}
                    className={`flex-row items-center py-3 px-3 mb-2 rounded-lg ${
                      playerStat.isOnCourt
                        ? "bg-green-900/30 border border-green-700"
                        : playerStat.fouledOut
                          ? "bg-red-900/30 border border-red-700"
                          : "bg-gray-100 dark:bg-gray-700"
                    }`}
                    onPress={() => handleSubstitute(playerStat.playerId, playerStat.isOnCourt)}
                    disabled={playerStat.fouledOut}
                  >
                    <View className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full justify-center items-center mr-3">
                      <Text className="text-gray-900 dark:text-white font-bold">
                        #{player.number}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-medium">
                        {player.name}
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-xs">
                        {playerStat.fouledOut ? "FOULED OUT" : player.position || "N/A"}
                      </Text>
                    </View>
                    <View
                      className={`px-4 py-2 rounded-lg ${
                        playerStat.fouledOut
                          ? "bg-gray-600"
                          : playerStat.isOnCourt
                            ? "bg-red-600"
                            : "bg-green-600"
                      }`}
                    >
                      <Text className="text-white font-semibold text-sm">
                        {playerStat.fouledOut ? "Out" : playerStat.isOnCourt ? "Sub Out" : "Sub In"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Home Team Subs */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                {game.homeTeam?.name || "Home"}
              </Text>
              {homePlayerStats.map((playerStat: PlayerStat) => {
                const player = playerStat.player;
                if (!player) return null;

                return (
                  <TouchableOpacity
                    key={playerStat.id}
                    className={`flex-row items-center py-3 px-3 mb-2 rounded-lg ${
                      playerStat.isOnCourt
                        ? "bg-green-900/30 border border-green-700"
                        : playerStat.fouledOut
                          ? "bg-red-900/30 border border-red-700"
                          : "bg-gray-100 dark:bg-gray-700"
                    }`}
                    onPress={() => handleSubstitute(playerStat.playerId, playerStat.isOnCourt)}
                    disabled={playerStat.fouledOut}
                  >
                    <View className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full justify-center items-center mr-3">
                      <Text className="text-gray-900 dark:text-white font-bold">
                        #{player.number}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-medium">
                        {player.name}
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-xs">
                        {playerStat.fouledOut ? "FOULED OUT" : player.position || "N/A"}
                      </Text>
                    </View>
                    <View
                      className={`px-4 py-2 rounded-lg ${
                        playerStat.fouledOut
                          ? "bg-gray-600"
                          : playerStat.isOnCourt
                            ? "bg-red-600"
                            : "bg-green-600"
                      }`}
                    >
                      <Text className="text-white font-semibold text-sm">
                        {playerStat.fouledOut ? "Out" : playerStat.isOnCourt ? "Sub Out" : "Sub In"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === "plays" && (
          <PlayByPlayTab
            events={gameEvents?.events}
            isLoading={gameEvents === undefined}
            currentQuarter={game.currentQuarter}
          />
        )}
      </ScrollView>

      {/* Player Selection Modal */}
      <PlayerSelectModal
        visible={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        onSelect={(player) => {
          setSelectedPlayer(player);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        players={onCourtPlayers}
        title="Select Player"
      />

      {/* Shot Type Modal */}
      <ShotTypeModal
        visible={!!pendingShot}
        onClose={() => setPendingShot(null)}
        onSelectMade={() => handleShotResult(true)}
        onSelectMissed={() => handleShotResult(false)}
        shotType={pendingShot?.is3pt ? "3pt" : "2pt"}
        location={pendingShot}
      />

      {/* Foul Type Modal */}
      <FoulTypeModal
        visible={showFoulTypeModal}
        onClose={() => {
          setShowFoulTypeModal(false);
          setPendingFoul(null);
        }}
        player={
          pendingFoul?.player
            ? {
                id: pendingFoul.playerId,
                name: pendingFoul.player.name,
                number: pendingFoul.player.number,
                fouls: pendingFoul.fouls,
              }
            : null
        }
        foulLimit={liveStats?.game?.foulLimit || 5}
        onSelectFoul={handleFoulTypeSelect}
        onCourtPlayers={onCourtPlayers.map((s) => ({
          playerId: s.playerId,
          player: s.player,
        }))}
        playerTeamId={pendingFoul?.teamId}
      />

      {/* Free Throw Sequence Modal */}
      <FreeThrowSequenceModal
        visible={!!freeThrowSequence}
        onClose={() => setFreeThrowSequence(null)}
        sequence={freeThrowSequence}
        onFreeThrowResult={handleFreeThrowResult}
      />

      {/* Overtime Prompt Modal */}
      <OvertimePromptModal
        visible={showOvertimePrompt}
        homeScore={game.homeScore}
        awayScore={game.awayScore}
        currentQuarter={game.currentQuarter}
        onStartOvertime={handleStartOvertime}
        onEndAsTie={handleEndAsTie}
        onDismiss={() => setShowOvertimePrompt(false)}
      />

      {/* Quick Undo FAB */}
      <QuickUndoFAB
        action={lastAction}
        onUndo={handleUndo}
        onDismiss={() => setLastAction(null)}
        autoDismissMs={8000}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statButtonContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  statButton: {
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: TOUCH_TARGETS.minimum,
  },
  statButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  statButtonShortLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    marginTop: 2,
  },
  miniCourtContainer: {
    width: MINI_COURT_WIDTH,
    height: MINI_COURT_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
  },
  miniCourtDisabled: {
    opacity: 0.5,
  },
  courtOverlay: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  courtOverlayText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
