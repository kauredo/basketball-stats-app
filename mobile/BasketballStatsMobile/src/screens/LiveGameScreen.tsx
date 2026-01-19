import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import Svg, { Rect, Circle, Path } from "react-native-svg";
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

// Import components
import EnhancedScoreboard from "../components/livegame/EnhancedScoreboard";
import FoulTypeModal, { FoulType } from "../components/livegame/FoulTypeModal";
import FreeThrowSequenceModal, {
  FreeThrowSequence,
} from "../components/livegame/FreeThrowSequenceModal";
import QuickUndoFAB, { LastAction } from "../components/livegame/QuickUndoFAB";
import OvertimePromptModal from "../components/livegame/OvertimePromptModal";
import PlayByPlayTab from "../components/livegame/PlayByPlayTab";
import ShotRecordingModal, { OnCourtPlayer } from "../components/livegame/ShotRecordingModal";
import AssistPromptModal from "../components/livegame/AssistPromptModal";
import ReboundPromptModal from "../components/livegame/ReboundPromptModal";
import QuickStatModal, { QuickStatType } from "../components/livegame/QuickStatModal";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Court colors based on theme
  const courtColors = {
    background: isDark ? "#57534e" : "#d4a574", // Dark: stone, Light: hardwood
    lines: isDark ? "rgba(255,255,255,0.7)" : "#ffffff",
    rim: "#ea580c",
    shotMade: "#22c55e",
    shotMissed: "#ef4444",
  };

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
          {/* Court background */}
          <Rect x="0" y="0" width="50" height="28" fill={courtColors.background} rx="2" />
          {/* Court border */}
          <Rect
            x="0"
            y="0"
            width="50"
            height="28"
            fill="none"
            stroke={courtColors.lines}
            strokeWidth="0.4"
            rx="2"
          />
          {/* Paint */}
          <Rect
            x="17"
            y="0"
            width="16"
            height="15"
            fill="none"
            stroke={courtColors.lines}
            strokeWidth="0.4"
          />
          {/* Free throw circle */}
          <Circle cx="25" cy="15" r="4" fill="none" stroke={courtColors.lines} strokeWidth="0.3" />
          {/* Restricted area */}
          <Path
            d="M 21 0 A 4 4 0 0 0 29 0"
            fill="none"
            stroke={courtColors.lines}
            strokeWidth="0.3"
          />
          {/* Rim */}
          <Circle cx="25" cy="4" r="0.6" fill={courtColors.rim} />
          {/* Three-point line */}
          <Path
            d="M 3 0 L 3 10 A 20 20 0 0 0 47 10 L 47 0"
            fill="none"
            stroke={courtColors.lines}
            strokeWidth="0.4"
          />
          {/* Recent shots */}
          {recentShots.slice(-5).map((shot, index) => {
            const svgX = 25 + shot.x;
            const svgY = shot.y * 0.6;
            return (
              <Circle
                key={index}
                cx={svgX}
                cy={svgY}
                r={1.2}
                fill={shot.made ? courtColors.shotMade : courtColors.shotMissed}
                opacity={0.9}
                stroke="#fff"
                strokeWidth={0.3}
              />
            );
          })}
        </Svg>
        {!disabled && (
          <View className="absolute bottom-2 left-0 right-0 items-center">
            <View className="bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-full">
              <Text className="text-gray-600 dark:text-gray-400 text-[10px] font-medium">
                TAP TO RECORD SHOT
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const TABS = [
  { key: "court", label: "Court", icon: "basketball" },
  { key: "stats", label: "Stats", icon: "stats" },
  { key: "subs", label: "Subs", icon: "users" },
  { key: "plays", label: "Plays", icon: "list" },
];

// Pending shot state for shot recording modal
interface PendingShot {
  x: number;
  y: number;
  zone: string;
  is3pt: boolean;
}

// Pending assist state for assist prompt modal
interface PendingAssist {
  scorerId: Id<"players">;
  scorerName: string;
  scorerNumber: number;
  scorerTeamId: Id<"teams">;
  shotType: "shot2" | "shot3";
  points: number;
}

// Pending rebound state for rebound prompt modal
interface PendingRebound {
  shooterTeamId: Id<"teams">;
  shooterTeamName: string;
  opposingTeamId: Id<"teams">;
  opposingTeamName: string;
  shotType: "shot2" | "shot3" | "freethrow";
}

export default function LiveGameScreen() {
  const route = useRoute<LiveGameRouteProp>();
  const { token } = useAuth();
  const gameId = route.params.gameId as Id<"games">;

  // Sound feedback hook
  const soundFeedback = useSoundFeedback();

  // Tab state
  const [activeTab, setActiveTab] = useState<"court" | "stats" | "subs" | "plays">("court");

  // Court tap state - for ShotRecordingModal
  const [pendingShot, setPendingShot] = useState<PendingShot | null>(null);
  const [recentShots, setRecentShots] = useState<Array<{ x: number; y: number; made: boolean }>>(
    []
  );

  // Auto-prompt states for assist and rebound
  const [pendingAssist, setPendingAssist] = useState<PendingAssist | null>(null);
  const [pendingRebound, setPendingRebound] = useState<PendingRebound | null>(null);

  // Quick stat modal state
  const [pendingQuickStat, setPendingQuickStat] = useState<QuickStatType | null>(null);

  // Foul and free throw states
  const [pendingFoulPlayerId, setPendingFoulPlayerId] = useState<Id<"players"> | null>(null);
  const [showFoulTypeModal, setShowFoulTypeModal] = useState(false);
  const [freeThrowSequence, setFreeThrowSequence] = useState<FreeThrowSequence | null>(null);

  // Undo and overtime states
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false);

  // Real-time game data from Convex
  const gameData = useQuery(api.games.get, token && gameId ? { token, gameId } : "skip");
  const liveStats = useQuery(api.stats.getLiveStats, token && gameId ? { token, gameId } : "skip");
  const gameEvents = useQuery(
    api.games.getGameEvents,
    token && gameId ? { token, gameId, limit: 50 } : "skip"
  );
  const gameShotsData = useQuery(
    api.shots.getGameShots,
    token && gameId ? { token, gameId } : "skip"
  );

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
  const recordShotMutation = useMutation(api.shots.recordShot);
  const setQuarterMutation = useMutation(api.games.setQuarter);

  const game = gameData?.game;
  const allStats = liveStats?.stats || [];
  const teamStats = liveStats?.teamStats;
  const homePlayerStats = allStats.filter((s: PlayerStat) => s.isHomeTeam);
  const awayPlayerStats = allStats.filter((s: PlayerStat) => !s.isHomeTeam);
  const onCourtPlayers = allStats.filter((s: PlayerStat) => s.isOnCourt);

  // Transform stats to OnCourtPlayer format for modals
  const onCourtPlayersForModal: OnCourtPlayer[] = onCourtPlayers.map((s: PlayerStat) => ({
    id: s.id,
    playerId: s.playerId,
    teamId: s.teamId,
    isHomeTeam: s.isHomeTeam,
    player: s.player,
    points: s.points,
    isOnCourt: s.isOnCourt,
    // Include extra stats for QuickStatModal
    rebounds: s.rebounds,
    assists: s.assists,
    steals: s.steals,
    blocks: s.blocks,
    turnovers: s.turnovers,
  })) as OnCourtPlayer[];

  // Transform persisted shots for MiniCourt visualization
  const persistedShots = (gameShotsData?.shots || []).map((shot) => ({
    x: shot.x,
    y: shot.y,
    made: shot.made,
  }));

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
  }, [
    game?.status,
    game?.currentQuarter,
    game?.homeScore,
    game?.awayScore,
    game?.timeRemainingSeconds,
  ]);

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

  // Handle quarter change from selector
  const handleQuarterChange = async (quarter: number) => {
    if (!token || !game) return;

    try {
      await setQuarterMutation({ token, gameId, quarter, resetTime: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      console.error("Failed to change quarter:", error);
      Alert.alert("Error", "Failed to change quarter");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Handle end period with proper quarter/OT flow
  const handleEndPeriod = () => {
    if (!game) return;

    const currentQ = game.currentQuarter;
    const isTied = game.homeScore === game.awayScore;

    // Q4 or later and tied - show overtime prompt
    if (currentQ >= 4 && isTied) {
      setShowOvertimePrompt(true);
      return;
    }

    // Q4 or later and not tied - end the game
    if (currentQ >= 4) {
      Alert.alert(
        "End Game",
        "This will end the game. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "End Game",
            style: "destructive",
            onPress: async () => {
              try {
                await endGame({ token: token!, gameId, forceEnd: true });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              } catch (error: any) {
                console.error("Failed to end game:", error);
                Alert.alert("Error", "Failed to end game");
              }
            },
          },
        ]
      );
      return;
    }

    // Q1-Q3 - advance to next quarter
    Alert.alert(
      `End ${currentQ <= 4 ? `Q${currentQ}` : `OT${currentQ - 4}`}`,
      `Ready to start ${currentQ < 4 ? `Q${currentQ + 1}` : "the next period"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Period",
          onPress: async () => {
            try {
              await pauseGame({ token: token!, gameId });
              await setQuarterMutation({
                token: token!,
                gameId,
                quarter: currentQ + 1,
                resetTime: true,
              });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              soundFeedback.buzzer?.();
            } catch (error: any) {
              console.error("Failed to end period:", error);
              Alert.alert("Error", "Failed to end period");
            }
          },
        },
      ]
    );
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

      // Add to recent shots for visualization AND persist to database
      if (shotLocation && (statType === "shot2" || statType === "shot3")) {
        const is3pt = statType === "shot3";
        setRecentShots((prev) => [...prev.slice(-4), { ...shotLocation, made: made || false }]);

        // Persist shot location to database for heat maps
        try {
          await recordShotMutation({
            token,
            gameId,
            playerId,
            x: shotLocation.x,
            y: shotLocation.y,
            shotType: is3pt ? "3pt" : "2pt",
            made: made || false,
            quarter: game?.currentQuarter || 1,
            timeRemaining: game?.timeRemainingSeconds || 0,
          });
        } catch (error) {
          console.error("Failed to persist shot location:", error);
        }
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

      return { player, made };
    } catch (error: any) {
      console.error("Failed to record stat:", error);
      Alert.alert("Error", "Failed to record stat");
      soundFeedback.error();
      return null;
    }
  };

  // Handle shot from ShotRecordingModal - triggers assist/rebound prompts
  const handleShotFromModal = async (playerId: Id<"players">, made: boolean) => {
    if (!pendingShot || !game) return;

    const statType = pendingShot.is3pt ? "shot3" : "shot2";
    const result = await handleRecordStat(playerId, statType, made, {
      x: pendingShot.x,
      y: pendingShot.y,
    });

    // Close shot modal first
    setPendingShot(null);

    if (!result) return;

    const player = result.player as PlayerStat | undefined;
    if (!player?.player) return;

    // Trigger assist or rebound prompt
    if (made) {
      // Prompt for assist
      setPendingAssist({
        scorerId: playerId,
        scorerName: player.player.name,
        scorerNumber: player.player.number,
        scorerTeamId: player.teamId,
        shotType: statType as "shot2" | "shot3",
        points: pendingShot.is3pt ? 3 : 2,
      });
    } else {
      // Prompt for rebound
      const isHomeTeam = player.isHomeTeam;
      const shooterTeamId = player.teamId;
      const shooterTeamName = isHomeTeam
        ? game.homeTeam?.name || "Home"
        : game.awayTeam?.name || "Away";
      const opposingTeamId = isHomeTeam ? game.awayTeam?.id : game.homeTeam?.id;
      const opposingTeamName = isHomeTeam
        ? game.awayTeam?.name || "Away"
        : game.homeTeam?.name || "Home";

      if (opposingTeamId) {
        setPendingRebound({
          shooterTeamId,
          shooterTeamName,
          opposingTeamId: opposingTeamId as Id<"teams">,
          opposingTeamName,
          shotType: statType as "shot2" | "shot3",
        });
      }
    }
  };

  // Handle assist recording
  const handleAssist = async (playerId: Id<"players">) => {
    await handleRecordStat(playerId, "assist");
    setPendingAssist(null);
  };

  // Handle no assist
  const handleNoAssist = () => {
    setPendingAssist(null);
  };

  // Handle rebound recording
  const handlePlayerRebound = async (playerId: Id<"players">, type: "offensive" | "defensive") => {
    await handleRecordStat(playerId, "rebound");
    setPendingRebound(null);
  };

  // Handle team rebound (just dismiss for now - could add team rebound tracking later)
  const handleTeamRebound = (teamId: Id<"teams">, type: "offensive" | "defensive") => {
    // Team rebounds could be tracked separately if needed
    setPendingRebound(null);
  };

  // Handle quick stat from modal
  const handleQuickStatRecord = async (playerId: Id<"players">) => {
    if (!pendingQuickStat) return;
    await handleRecordStat(playerId, pendingQuickStat);
    setPendingQuickStat(null);
  };

  // Handle foul button press - opens foul type modal
  const handleFoulPress = (playerId?: Id<"players">) => {
    if (playerId) {
      setPendingFoulPlayerId(playerId);
      setShowFoulTypeModal(true);
    }
  };

  const handleFoulTypeSelect = async (
    foulType: FoulType,
    shootingDetails?: {
      shotType: "2pt" | "3pt";
      wasAndOne: boolean;
      fouledPlayerId: Id<"players">;
    }
  ) => {
    if (!pendingFoulPlayerId || !token) return;

    const pendingFoul = allStats.find((s) => s.playerId === pendingFoulPlayerId);
    if (!pendingFoul) return;

    try {
      const result = await recordFoulWithContext({
        token,
        gameId,
        playerId: pendingFoulPlayerId,
        foulType,
        wasAndOne: shootingDetails?.wasAndOne,
        shotType: shootingDetails?.shotType,
        fouledPlayerId: shootingDetails?.fouledPlayerId,
      });

      soundFeedback.foul();

      // Set last action for undo
      if (pendingFoul.player) {
        setLastAction({
          playerId: pendingFoulPlayerId,
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
        const shooterId = shootingDetails?.fouledPlayerId || pendingFoulPlayerId;
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

      setPendingFoulPlayerId(null);
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

  // Court tap handler - opens shot recording modal
  const handleCourtTap = (x: number, y: number, zone: string, is3pt: boolean) => {
    setPendingShot({ x, y, zone, is3pt });
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
  const isGamePaused = game.status === "paused";
  // Allow recording stats when game is active OR paused (like web version)
  const canRecordStats = isGameActive || isGamePaused;

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

  // Get teammates for assist modal (same team as scorer, excluding scorer)
  const getTeammatesForAssist = () => {
    if (!pendingAssist) return [];
    return onCourtPlayersForModal.filter(
      (p) => p.teamId === pendingAssist.scorerTeamId && p.playerId !== pendingAssist.scorerId
    );
  };

  // Get players by team for rebound modal
  const getShooterTeamPlayers = () => {
    if (!pendingRebound) return [];
    return onCourtPlayersForModal.filter((p) => p.teamId === pendingRebound.shooterTeamId);
  };

  const getOpposingTeamPlayers = () => {
    if (!pendingRebound) return [];
    return onCourtPlayersForModal.filter((p) => p.teamId === pendingRebound.opposingTeamId);
  };

  // Get pending foul player stats for foul modal
  const pendingFoulPlayer = pendingFoulPlayerId
    ? allStats.find((s) => s.playerId === pendingFoulPlayerId)
    : null;

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
        onQuarterChange={handleQuarterChange}
        onEndPeriod={handleEndPeriod}
        showShotClock={true}
        shotClockSeconds={24}
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
            {/* Mini Court for Shot Recording */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                Shot Location
              </Text>
              <MiniCourt
                onCourtTap={handleCourtTap}
                disabled={!canRecordStats}
                recentShots={persistedShots.length > 0 ? persistedShots.slice(-5) : recentShots}
              />
            </View>

            {/* Stat Buttons Grid - Now opens modals instead of requiring pre-selected player */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-900 dark:text-white font-semibold mb-3">Quick Stats</Text>

              {/* Other Stats Row */}
              <View>
                <View className="flex-row mb-2">
                  <StatButton
                    label="REB"
                    shortLabel="+R"
                    color="#3B82F6"
                    disabled={!canRecordStats}
                    onPress={() => setPendingQuickStat("rebound")}
                  />
                  <StatButton
                    label="AST"
                    shortLabel="+A"
                    color="#8B5CF6"
                    disabled={!canRecordStats}
                    onPress={() => setPendingQuickStat("assist")}
                  />
                  <StatButton
                    label="STL"
                    shortLabel="+S"
                    color="#06B6D4"
                    disabled={!canRecordStats}
                    onPress={() => setPendingQuickStat("steal")}
                  />
                  <StatButton
                    label="BLK"
                    shortLabel="+B"
                    color="#06B6D4"
                    disabled={!canRecordStats}
                    onPress={() => setPendingQuickStat("block")}
                  />
                </View>
                <View className="flex-row">
                  <StatButton
                    label="TO"
                    shortLabel="+T"
                    color="#F59E0B"
                    disabled={!canRecordStats}
                    onPress={() => setPendingQuickStat("turnover")}
                  />
                  <View className="flex-1 mx-1" />
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
                  <TouchableOpacity
                    key={playerStat.id}
                    onPress={() => canRecordStats && handleFoulPress(playerStat.playerId)}
                    className={`flex-row items-center py-3 border-b border-gray-200 dark:border-gray-700 ${
                      !playerStat.isOnCourt ? "opacity-50" : ""
                    }`}
                    disabled={!canRecordStats}
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
                        <Text
                          className={`${playerStat.fouls >= 4 ? "text-red-500" : "text-gray-900 dark:text-white"}`}
                        >
                          {playerStat.fouls}
                        </Text>
                        <Text className="text-gray-500 text-xs">PF</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
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
                  <TouchableOpacity
                    key={playerStat.id}
                    onPress={() => canRecordStats && handleFoulPress(playerStat.playerId)}
                    className={`flex-row items-center py-3 border-b border-gray-200 dark:border-gray-700 ${
                      !playerStat.isOnCourt ? "opacity-50" : ""
                    }`}
                    disabled={!canRecordStats}
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
                        <Text
                          className={`${playerStat.fouls >= 4 ? "text-red-500" : "text-gray-900 dark:text-white"}`}
                        >
                          {playerStat.fouls}
                        </Text>
                        <Text className="text-gray-500 text-xs">PF</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
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

      {/* Shot Recording Modal - Shows player selection with MADE/MISS per player */}
      <ShotRecordingModal
        visible={!!pendingShot}
        onClose={() => setPendingShot(null)}
        onRecord={handleShotFromModal}
        shotType={pendingShot?.is3pt ? "3pt" : "2pt"}
        zoneName={pendingShot?.zone || "Unknown"}
        onCourtPlayers={onCourtPlayersForModal}
      />

      {/* Assist Prompt Modal - Auto-shows after made shots */}
      <AssistPromptModal
        visible={!!pendingAssist}
        onClose={() => setPendingAssist(null)}
        onAssist={handleAssist}
        onNoAssist={handleNoAssist}
        scorerName={pendingAssist?.scorerName || ""}
        scorerNumber={pendingAssist?.scorerNumber || 0}
        shotType={pendingAssist?.shotType || "shot2"}
        points={pendingAssist?.points || 2}
        teammates={getTeammatesForAssist()}
      />

      {/* Rebound Prompt Modal - Auto-shows after missed shots */}
      <ReboundPromptModal
        visible={!!pendingRebound}
        onClose={() => setPendingRebound(null)}
        onPlayerRebound={handlePlayerRebound}
        onTeamRebound={handleTeamRebound}
        shooterTeamId={pendingRebound?.shooterTeamId || ("" as Id<"teams">)}
        shooterTeamName={pendingRebound?.shooterTeamName || ""}
        opposingTeamId={pendingRebound?.opposingTeamId || ("" as Id<"teams">)}
        opposingTeamName={pendingRebound?.opposingTeamName || ""}
        shooterTeamPlayers={getShooterTeamPlayers()}
        opposingTeamPlayers={getOpposingTeamPlayers()}
        shotType={pendingRebound?.shotType || "shot2"}
        autoDismissMs={8000}
      />

      {/* Quick Stat Modal - For non-shot stats */}
      <QuickStatModal
        visible={!!pendingQuickStat}
        onClose={() => setPendingQuickStat(null)}
        onRecord={handleQuickStatRecord}
        statType={pendingQuickStat || "rebound"}
        onCourtPlayers={onCourtPlayersForModal}
      />

      {/* Foul Type Modal */}
      <FoulTypeModal
        visible={showFoulTypeModal}
        onClose={() => {
          setShowFoulTypeModal(false);
          setPendingFoulPlayerId(null);
        }}
        player={
          pendingFoulPlayer?.player
            ? {
                id: pendingFoulPlayerId!,
                name: pendingFoulPlayer.player.name,
                number: pendingFoulPlayer.player.number,
                fouls: pendingFoulPlayer.fouls,
              }
            : null
        }
        foulLimit={liveStats?.game?.foulLimit || 5}
        onSelectFoul={handleFoulTypeSelect}
        onCourtPlayers={onCourtPlayers.map((s) => ({
          playerId: s.playerId,
          player: s.player,
        }))}
        playerTeamId={pendingFoulPlayer?.teamId}
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
});
