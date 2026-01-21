import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { MiniCourt } from "../components/court/MiniCourt";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { TOUCH_TARGETS } from "@basketball-stats/shared";

// Import components
import EnhancedScoreboard from "../components/livegame/EnhancedScoreboard";
import FoulTypeModal, { type FoulType } from "../components/livegame/FoulTypeModal";
import FreeThrowSequenceModal, {
  type FreeThrowSequence,
} from "../components/livegame/FreeThrowSequenceModal";
import QuickUndoFAB, { type LastAction } from "../components/livegame/QuickUndoFAB";
import OvertimePromptModal from "../components/livegame/OvertimePromptModal";
import PlayByPlayTab from "../components/livegame/PlayByPlayTab";
import ShotRecordingModal, { type OnCourtPlayer } from "../components/livegame/ShotRecordingModal";
import AssistPromptModal from "../components/livegame/AssistPromptModal";
import ReboundPromptModal from "../components/livegame/ReboundPromptModal";
import QuickStatModal, { type QuickStatType } from "../components/livegame/QuickStatModal";
import useSoundFeedback from "../hooks/useSoundFeedback";

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
  size?: "normal" | "large" | "compact";
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

  const buttonHeight =
    size === "large" ? TOUCH_TARGETS.large : size === "compact" ? 36 : TOUCH_TARGETS.comfortable;
  const isCompact = size === "compact";

  return (
    <Animated.View style={[animatedStyle, { flex: 1, marginHorizontal: isCompact ? 2 : 4 }]}>
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
        <Text style={[styles.statButtonLabel, isCompact && { fontSize: 11 }]}>{label}</Text>
        {!isCompact && <Text style={styles.statButtonShortLabel}>{shortLabel}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

const TABS = [
  { key: "court", label: "Court", icon: "basketball" },
  { key: "clock", label: "Clock", icon: "timer" },
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

  // Orientation detection
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  // Tab state
  const [activeTab, setActiveTab] = useState<"court" | "clock" | "stats" | "subs" | "plays">(
    "court"
  );

  // Shot clock state
  const [shotClockSeconds, setShotClockSeconds] = useState(24);

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

  // Pre-game lineup selection state
  const [homeStarters, setHomeStarters] = useState<Id<"players">[]>([]);
  const [awayStarters, setAwayStarters] = useState<Id<"players">[]>([]);
  const [quarterMinutes, setQuarterMinutes] = useState(12);

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
  const updateGameSettings = useMutation(api.games.updateGameSettings);
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
    is3pt: shot.shotType === "3pt",
  }));

  // Initialize starters when data loads for scheduled games
  useEffect(() => {
    if (game?.status === "scheduled" && homePlayerStats.length > 0 && awayPlayerStats.length > 0) {
      // Check if starters are already configured
      const settings = game.gameSettings as any;
      const existingStarters = settings?.startingFive;

      if (existingStarters?.homeTeam?.length > 0) {
        setHomeStarters(existingStarters.homeTeam);
      } else if (homeStarters.length === 0) {
        setHomeStarters(homePlayerStats.slice(0, 5).map((s) => s.playerId));
      }

      if (existingStarters?.awayTeam?.length > 0) {
        setAwayStarters(existingStarters.awayTeam);
      } else if (awayStarters.length === 0) {
        setAwayStarters(awayPlayerStats.slice(0, 5).map((s) => s.playerId));
      }

      if (settings?.quarterMinutes && quarterMinutes === 12) {
        setQuarterMinutes(settings.quarterMinutes);
      }
    }
  }, [game?.status, game?.gameSettings, homePlayerStats.length, awayPlayerStats.length]);

  // Toggle starter selection
  const toggleStarter = (playerId: Id<"players">, isHome: boolean) => {
    if (isHome) {
      if (homeStarters.includes(playerId)) {
        setHomeStarters(homeStarters.filter((id) => id !== playerId));
      } else if (homeStarters.length < 5) {
        setHomeStarters([...homeStarters, playerId]);
      }
    } else {
      if (awayStarters.includes(playerId)) {
        setAwayStarters(awayStarters.filter((id) => id !== playerId));
      } else if (awayStarters.length < 5) {
        setAwayStarters([...awayStarters, playerId]);
      }
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle starting the game with selected lineup
  const handleStartGame = async () => {
    if (!token) return;

    if (homeStarters.length !== 5 || awayStarters.length !== 5) {
      Alert.alert("Invalid Lineup", "Please select exactly 5 starters for each team.");
      return;
    }

    try {
      // Save settings first
      await updateGameSettings({
        token,
        gameId,
        quarterMinutes,
        startingFive: {
          homeTeam: homeStarters,
          awayTeam: awayStarters,
        },
      });

      // Set starters on court
      for (const playerId of homeStarters) {
        await substituteMutation({ token, gameId, playerId, isOnCourt: true });
      }
      for (const playerId of awayStarters) {
        await substituteMutation({ token, gameId, playerId, isOnCourt: true });
      }

      // Start the game
      await startGame({ token, gameId });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      soundFeedback.buzzer?.();
    } catch (error: any) {
      console.error("Failed to start game:", error);
      Alert.alert("Error", error.message || "Failed to start game");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

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
    if (!game) {
      Alert.alert("Error", "Game data not available. Please try again.");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Authentication required. Please log in again.");
      return;
    }

    const currentQ = game.currentQuarter;
    const isTied = game.homeScore === game.awayScore;

    // Q4 or later and tied - show overtime prompt
    if (currentQ >= 4 && isTied) {
      setShowOvertimePrompt(true);
      return;
    }

    // Q4 or later and not tied - end the game
    if (currentQ >= 4) {
      Alert.alert("End Game", "This will end the game. Are you sure?", [
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
      ]);
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

    // Handle foul specially - chain to foul type modal
    if (pendingQuickStat === "foul") {
      setPendingQuickStat(null);
      setPendingFoulPlayerId(playerId);
      setShowFoulTypeModal(true);
      return;
    }

    // Handle free throw specially - set up free throw sequence
    if (pendingQuickStat === "freethrow") {
      setPendingQuickStat(null);
      const player = allStats.find((s) => s.playerId === playerId);
      if (player?.player) {
        setFreeThrowSequence({
          playerId,
          playerName: player.player.name,
          playerNumber: player.player.number,
          totalAttempts: 2, // Default to 2 FTs, can be changed
          isOneAndOne: false,
        });
      }
      return;
    }

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
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-950">
        <View className="flex-1 justify-center items-center">
          <Text className="text-surface-900 dark:text-white text-base">Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-950">
        <View className="flex-1 justify-center items-center">
          <Icon name="basketball" size={48} color="#9CA3AF" />
          <Text className="text-surface-900 dark:text-white text-lg font-semibold mt-4 mb-2">
            Game not found
          </Text>
          <Text className="text-surface-600 dark:text-surface-400 text-center">
            The requested game could not be found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show pre-game setup if game is scheduled
  if (game.status === "scheduled") {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-950">
        <StatusBar style="light" />
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="bg-white dark:bg-surface-800 mx-4 mt-4 rounded-2xl p-4 border border-surface-200 dark:border-surface-700">
            <View className="flex-row items-center mb-4">
              <Icon name="settings" size={24} color="#F97316" />
              <View className="ml-3 flex-1">
                <Text className="text-surface-900 dark:text-white text-xl font-bold">
                  Pre-Game Setup
                </Text>
                <Text className="text-surface-600 dark:text-surface-400 text-sm">
                  Select starting lineups before starting
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-center py-3 border-t border-surface-200 dark:border-surface-700">
              <Text className="text-surface-600 dark:text-surface-400 text-lg font-semibold">
                {game.awayTeam?.name}
              </Text>
              <Text className="text-surface-400 mx-4 text-lg">VS</Text>
              <Text className="text-surface-600 dark:text-surface-400 text-lg font-semibold">
                {game.homeTeam?.name}
              </Text>
            </View>
          </View>

          {/* Quarter Duration */}
          <View className="bg-white dark:bg-surface-800 mx-4 mt-4 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <Text className="text-surface-900 dark:text-white text-base font-semibold mb-3">
              Quarter Duration
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {[5, 8, 10, 12].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  onPress={() => {
                    setQuarterMinutes(mins);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    quarterMinutes === mins
                      ? "bg-primary-500"
                      : "bg-surface-100 dark:bg-surface-700"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      quarterMinutes === mins
                        ? "text-white"
                        : "text-surface-700 dark:text-surface-300"
                    }`}
                  >
                    {mins} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Away Team Starters */}
          <View className="bg-white dark:bg-surface-800 mx-4 mt-4 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-surface-900 dark:text-white text-base font-semibold">
                {game.awayTeam?.name} Starters
              </Text>
              <Text
                className={`text-sm font-medium ${
                  awayStarters.length === 5 ? "text-green-500" : "text-primary-500"
                }`}
              >
                {awayStarters.length}/5 selected
              </Text>
            </View>
            {awayPlayerStats.map((stat) => (
              <TouchableOpacity
                key={stat.id}
                onPress={() => toggleStarter(stat.playerId, false)}
                className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                  awayStarters.includes(stat.playerId)
                    ? "bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500"
                    : "bg-surface-100 dark:bg-surface-700"
                }`}
              >
                <Text className="text-surface-900 dark:text-white font-medium">
                  #{stat.player?.number} {stat.player?.name}
                </Text>
                {awayStarters.includes(stat.playerId) && (
                  <Icon name="check" size={20} color="#F97316" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Home Team Starters */}
          <View className="bg-white dark:bg-surface-800 mx-4 mt-4 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-surface-900 dark:text-white text-base font-semibold">
                {game.homeTeam?.name} Starters
              </Text>
              <Text
                className={`text-sm font-medium ${
                  homeStarters.length === 5 ? "text-green-500" : "text-primary-500"
                }`}
              >
                {homeStarters.length}/5 selected
              </Text>
            </View>
            {homePlayerStats.map((stat) => (
              <TouchableOpacity
                key={stat.id}
                onPress={() => toggleStarter(stat.playerId, true)}
                className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                  homeStarters.includes(stat.playerId)
                    ? "bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500"
                    : "bg-surface-100 dark:bg-surface-700"
                }`}
              >
                <Text className="text-surface-900 dark:text-white font-medium">
                  #{stat.player?.number} {stat.player?.name}
                </Text>
                {homeStarters.includes(stat.playerId) && (
                  <Icon name="check" size={20} color="#F97316" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Game Button */}
          <TouchableOpacity
            onPress={handleStartGame}
            className={`mx-4 mt-6 mb-8 py-4 rounded-xl flex-row items-center justify-center ${
              homeStarters.length === 5 && awayStarters.length === 5
                ? "bg-green-600"
                : "bg-surface-400"
            }`}
            disabled={homeStarters.length !== 5 || awayStarters.length !== 5}
          >
            <Icon name="play" size={24} color="#FFFFFF" />
            <Text className="text-white text-lg font-bold ml-2">Start Game</Text>
          </TouchableOpacity>
        </ScrollView>
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
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-950">
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
        showShotClock={false}
        isLandscape={isLandscape}
      />

      {/* Tab Navigation */}
      <View className={`flex-row mx-4 ${isLandscape ? "mt-1 mb-1" : "mt-4 mb-2"}`}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              setActiveTab(tab.key as any);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className={`flex-1 ${isLandscape ? "py-1.5" : "py-3"} rounded-xl mx-1 ${
              activeTab === tab.key ? "bg-primary-500" : "bg-white dark:bg-surface-800"
            }`}
          >
            <View className="items-center flex-row justify-center">
              <Icon
                name={tab.icon as any}
                size={isLandscape ? 16 : 20}
                color={activeTab === tab.key ? "#FFFFFF" : "#9CA3AF"}
              />
              {!isLandscape && (
                <Text
                  className={`text-xs mt-1 font-medium ${
                    activeTab === tab.key ? "text-white" : "text-surface-600 dark:text-surface-400"
                  }`}
                >
                  {tab.label}
                </Text>
              )}
              {isLandscape && (
                <Text
                  className={`text-[10px] ml-1 font-medium ${
                    activeTab === tab.key ? "text-white" : "text-surface-600 dark:text-surface-400"
                  }`}
                >
                  {tab.label}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab !== "plays" && (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{
            flexGrow: isLandscape ? 0 : 1,
            paddingBottom: isLandscape ? 8 : 16,
            minHeight: isLandscape ? undefined : "100%",
          }}
          showsVerticalScrollIndicator={isLandscape}
        >
          {/* Court Tab */}
          {activeTab === "court" && (
            <View className={`flex-1 ${isLandscape ? "flex-row gap-2" : ""}`}>
              {/* Large Court for Shot Recording */}
              <View
                className={`bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 ${
                  isLandscape ? "flex-1 p-2" : "mb-4 flex-1 p-4"
                }`}
              >
                {!isLandscape && (
                  <Text className="text-surface-900 dark:text-white font-semibold mb-3">
                    Shot Location (Tap to Record Shot)
                  </Text>
                )}
                <View className="flex-1 items-center justify-center">
                  <MiniCourt
                    onCourtTap={handleCourtTap}
                    disabled={!canRecordStats}
                    shots={persistedShots.length > 0 ? persistedShots : recentShots}
                    displayMode="recent"
                    isLandscape={isLandscape}
                  />
                </View>
              </View>

              {/* Stat Buttons Grid */}
              <View
                className={`bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 ${
                  isLandscape ? "w-40 p-2" : "p-4"
                }`}
              >
                {!isLandscape && (
                  <Text className="text-surface-900 dark:text-white font-semibold mb-3">
                    Quick Stats
                  </Text>
                )}
                <View className={isLandscape ? "flex-1 justify-center" : ""}>
                  <View className={`${isLandscape ? "flex-col gap-1" : "flex-row mb-2"}`}>
                    <View className={isLandscape ? "flex-row" : "flex-1 flex-row"}>
                      <StatButton
                        label="REB"
                        shortLabel="+R"
                        color="#2563EB"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("rebound")}
                        size={isLandscape ? "compact" : "normal"}
                      />
                      <StatButton
                        label="AST"
                        shortLabel="+A"
                        color="#7C3AED"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("assist")}
                        size={isLandscape ? "compact" : "normal"}
                      />
                    </View>
                    <View className={isLandscape ? "flex-row" : "flex-1 flex-row"}>
                      <StatButton
                        label="STL"
                        shortLabel="+S"
                        color="#0891B2"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("steal")}
                        size={isLandscape ? "compact" : "normal"}
                      />
                      <StatButton
                        label="BLK"
                        shortLabel="+B"
                        color="#0D9488"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("block")}
                        size={isLandscape ? "compact" : "normal"}
                      />
                    </View>
                  </View>
                  <View className={`${isLandscape ? "flex-col gap-1" : "flex-row mb-2"}`}>
                    <View className={isLandscape ? "flex-row" : "flex-1 flex-row"}>
                      <StatButton
                        label="TO"
                        shortLabel="+T"
                        color="#F59E0B"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("turnover")}
                        size={isLandscape ? "compact" : "normal"}
                      />
                      <StatButton
                        label="FOUL"
                        shortLabel="+F"
                        color="#DC2626"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("foul")}
                        size={isLandscape ? "compact" : "normal"}
                      />
                    </View>
                  </View>
                  <View className={`${isLandscape ? "flex-row" : "flex-row"}`}>
                    <StatButton
                      label="FREE THROW"
                      shortLabel="FT"
                      color="#059669"
                      disabled={!canRecordStats}
                      onPress={() => setPendingQuickStat("freethrow")}
                      size={isLandscape ? "compact" : "normal"}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Clock Tab */}
          {activeTab === "clock" && (
            <View className={`flex-1 ${isLandscape ? "flex-row gap-4" : ""}`}>
              {/* Main Clock Display */}
              <View
                className={`bg-surface-900 rounded-2xl p-6 items-center justify-center ${
                  isLandscape ? "flex-1" : "mb-4"
                }`}
              >
                {/* Quarter Badge */}
                <View className="bg-primary-500 px-4 py-2 rounded-full mb-4">
                  <Text className="text-white text-lg font-bold">
                    {game.currentQuarter <= 4
                      ? `Q${game.currentQuarter}`
                      : `OT${game.currentQuarter - 4}`}
                  </Text>
                </View>

                {/* Game Clock */}
                <Text
                  className={`font-mono font-bold text-white ${
                    game.timeRemainingSeconds <= 60 && isGameActive ? "text-red-500" : ""
                  }`}
                  style={{ fontSize: isLandscape ? 72 : 80 }}
                >
                  {Math.floor(game.timeRemainingSeconds / 60)}:
                  {(game.timeRemainingSeconds % 60).toString().padStart(2, "0")}
                </Text>
                <Text className="text-surface-400 text-sm mt-2 uppercase tracking-widest">
                  Game Clock
                </Text>

                {/* Shot Clock */}
                <View className="flex-row items-center gap-4 mt-6">
                  <View
                    className={`px-8 py-4 rounded-xl border-2 ${
                      shotClockSeconds <= 5 && isGameActive
                        ? "bg-red-500/20 border-red-500"
                        : "bg-surface-800 border-surface-700"
                    }`}
                  >
                    <Text
                      className={`font-mono font-bold text-5xl ${
                        shotClockSeconds <= 5 && isGameActive ? "text-red-500" : "text-amber-400"
                      }`}
                    >
                      {shotClockSeconds}
                    </Text>
                    <Text className="text-surface-400 text-xs mt-1 uppercase tracking-wider text-center">
                      Shot Clock
                    </Text>
                  </View>

                  {/* Shot Clock Reset Buttons */}
                  <View className="gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        setShotClockSeconds(24);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }}
                      className="bg-amber-600 px-4 py-3 rounded-lg"
                    >
                      <Text className="text-white font-bold text-lg">24</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShotClockSeconds(14);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }}
                      className="bg-amber-700 px-4 py-3 rounded-lg"
                    >
                      <Text className="text-white font-bold text-lg">14</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Game Controls */}
                <View className="flex-row gap-3 mt-6">
                  {isGameActive && (
                    <TouchableOpacity
                      onPress={() => handleGameControl("pause")}
                      className="bg-amber-600 px-6 py-3 rounded-xl flex-row items-center"
                    >
                      <Icon name="pause" size={24} color="#FFFFFF" />
                      <Text className="text-white text-lg font-bold ml-2">Pause</Text>
                    </TouchableOpacity>
                  )}
                  {isGamePaused && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleGameControl("resume")}
                        className="bg-green-600 px-6 py-3 rounded-xl flex-row items-center"
                      >
                        <Icon name="play" size={24} color="#FFFFFF" />
                        <Text className="text-white text-lg font-bold ml-2">Resume</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleEndPeriod}
                        className="bg-red-600 px-6 py-3 rounded-xl flex-row items-center"
                      >
                        <Icon name="stop" size={24} color="#FFFFFF" />
                        <Text className="text-white text-lg font-bold ml-2">End Period</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {/* Score Display (shown in landscape or below clock in portrait) */}
              <View
                className={`bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 ${isLandscape ? "w-56" : ""}`}
              >
                <Text className="text-surface-500 dark:text-surface-400 text-sm font-semibold uppercase tracking-wider text-center mb-4">
                  Score
                </Text>
                {/* Away Team */}
                <View className="items-center mb-4 pb-4 border-b border-surface-200 dark:border-surface-700">
                  <Text className="text-surface-500 dark:text-surface-400 text-xs mb-1">
                    {game.awayTeam?.name || "Away"}
                  </Text>
                  <Text className="text-surface-900 dark:text-white text-4xl font-bold">
                    {game.awayScore}
                  </Text>
                </View>
                {/* Home Team */}
                <View className="items-center">
                  <Text className="text-surface-500 dark:text-surface-400 text-xs mb-1">
                    {game.homeTeam?.name || "Home"}
                  </Text>
                  <Text className="text-surface-900 dark:text-white text-4xl font-bold">
                    {game.homeScore}
                  </Text>
                </View>

                {/* Timeout Buttons */}
                <View className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                  <TouchableOpacity
                    onPress={() => handleTimeout(false)}
                    disabled={awayTeamStatsData.timeoutsRemaining === 0}
                    className={`py-2 px-4 rounded-lg mb-2 ${
                      awayTeamStatsData.timeoutsRemaining === 0
                        ? "bg-surface-200 dark:bg-surface-700 opacity-50"
                        : "bg-surface-200 dark:bg-surface-700"
                    }`}
                  >
                    <Text className="text-surface-900 dark:text-white text-center text-sm">
                      {game.awayTeam?.name} TO ({awayTeamStatsData.timeoutsRemaining})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleTimeout(true)}
                    disabled={homeTeamStatsData.timeoutsRemaining === 0}
                    className={`py-2 px-4 rounded-lg ${
                      homeTeamStatsData.timeoutsRemaining === 0
                        ? "bg-surface-200 dark:bg-surface-700 opacity-50"
                        : "bg-surface-200 dark:bg-surface-700"
                    }`}
                  >
                    <Text className="text-surface-900 dark:text-white text-center text-sm">
                      {game.homeTeam?.name} TO ({homeTeamStatsData.timeoutsRemaining})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          {activeTab === "stats" && (
            <View className="pb-6">
              {/* Away Team Stats */}
              <View className="bg-white dark:bg-surface-800 rounded-xl p-4 mb-4 border border-surface-200 dark:border-surface-700">
                <Text className="text-surface-900 dark:text-white font-semibold mb-3">
                  {game.awayTeam?.name || "Away"}
                </Text>
                {awayPlayerStats.map((playerStat: PlayerStat) => {
                  const player = playerStat.player;
                  if (!player) return null;

                  return (
                    <TouchableOpacity
                      key={playerStat.id}
                      onPress={() => canRecordStats && handleFoulPress(playerStat.playerId)}
                      className={`flex-row items-center py-3 border-b border-surface-200 dark:border-surface-700 ${
                        !playerStat.isOnCourt ? "opacity-50" : ""
                      }`}
                      disabled={!canRecordStats}
                    >
                      <View className="w-8 mr-2">
                        <Text className="text-surface-600 dark:text-surface-400 text-xs">
                          #{player.number}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-surface-900 dark:text-white font-medium">
                          {player.name}
                          {playerStat.fouledOut && (
                            <Text className="text-red-500 text-xs"> (OUT)</Text>
                          )}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <View className="w-12 items-center">
                          <Text className="text-surface-900 dark:text-white font-bold">
                            {playerStat.points}
                          </Text>
                          <Text className="text-surface-500 text-xs">PTS</Text>
                        </View>
                        <View className="w-10 items-center">
                          <Text className="text-surface-900 dark:text-white">
                            {playerStat.rebounds}
                          </Text>
                          <Text className="text-surface-500 text-xs">REB</Text>
                        </View>
                        <View className="w-10 items-center">
                          <Text className="text-surface-900 dark:text-white">
                            {playerStat.assists}
                          </Text>
                          <Text className="text-surface-500 text-xs">AST</Text>
                        </View>
                        <View className="w-8 items-center">
                          <Text
                            className={`${playerStat.fouls >= 4 ? "text-red-500" : "text-surface-900 dark:text-white"}`}
                          >
                            {playerStat.fouls}
                          </Text>
                          <Text className="text-surface-500 text-xs">PF</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Home Team Stats */}
              <View className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                <Text className="text-surface-900 dark:text-white font-semibold mb-3">
                  {game.homeTeam?.name || "Home"}
                </Text>
                {homePlayerStats.map((playerStat: PlayerStat) => {
                  const player = playerStat.player;
                  if (!player) return null;

                  return (
                    <TouchableOpacity
                      key={playerStat.id}
                      onPress={() => canRecordStats && handleFoulPress(playerStat.playerId)}
                      className={`flex-row items-center py-3 border-b border-surface-200 dark:border-surface-700 ${
                        !playerStat.isOnCourt ? "opacity-50" : ""
                      }`}
                      disabled={!canRecordStats}
                    >
                      <View className="w-8 mr-2">
                        <Text className="text-surface-600 dark:text-surface-400 text-xs">
                          #{player.number}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-surface-900 dark:text-white font-medium">
                          {player.name}
                          {playerStat.fouledOut && (
                            <Text className="text-red-500 text-xs"> (OUT)</Text>
                          )}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <View className="w-12 items-center">
                          <Text className="text-surface-900 dark:text-white font-bold">
                            {playerStat.points}
                          </Text>
                          <Text className="text-surface-500 text-xs">PTS</Text>
                        </View>
                        <View className="w-10 items-center">
                          <Text className="text-surface-900 dark:text-white">
                            {playerStat.rebounds}
                          </Text>
                          <Text className="text-surface-500 text-xs">REB</Text>
                        </View>
                        <View className="w-10 items-center">
                          <Text className="text-surface-900 dark:text-white">
                            {playerStat.assists}
                          </Text>
                          <Text className="text-surface-500 text-xs">AST</Text>
                        </View>
                        <View className="w-8 items-center">
                          <Text
                            className={`${playerStat.fouls >= 4 ? "text-red-500" : "text-surface-900 dark:text-white"}`}
                          >
                            {playerStat.fouls}
                          </Text>
                          <Text className="text-surface-500 text-xs">PF</Text>
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
              <View className="bg-white dark:bg-surface-800 rounded-xl p-4 mb-4 border border-surface-200 dark:border-surface-700">
                <Text className="text-surface-900 dark:text-white font-semibold mb-3">
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
                            : "bg-surface-100 dark:bg-surface-700"
                      }`}
                      onPress={() => handleSubstitute(playerStat.playerId, playerStat.isOnCourt)}
                      disabled={playerStat.fouledOut}
                    >
                      <View className="w-10 h-10 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center mr-3">
                        <Text className="text-surface-900 dark:text-white font-bold">
                          #{player.number}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-surface-900 dark:text-white font-medium">
                          {player.name}
                        </Text>
                        <Text className="text-surface-600 dark:text-surface-400 text-xs">
                          {playerStat.fouledOut ? "FOULED OUT" : player.position || "N/A"}
                        </Text>
                      </View>
                      <View
                        className={`px-4 py-2 rounded-lg ${
                          playerStat.fouledOut
                            ? "bg-surface-600"
                            : playerStat.isOnCourt
                              ? "bg-red-600"
                              : "bg-green-600"
                        }`}
                      >
                        <Text className="text-white font-semibold text-sm">
                          {playerStat.fouledOut
                            ? "Out"
                            : playerStat.isOnCourt
                              ? "Sub Out"
                              : "Sub In"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Home Team Subs */}
              <View className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                <Text className="text-surface-900 dark:text-white font-semibold mb-3">
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
                            : "bg-surface-100 dark:bg-surface-700"
                      }`}
                      onPress={() => handleSubstitute(playerStat.playerId, playerStat.isOnCourt)}
                      disabled={playerStat.fouledOut}
                    >
                      <View className="w-10 h-10 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center mr-3">
                        <Text className="text-surface-900 dark:text-white font-bold">
                          #{player.number}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-surface-900 dark:text-white font-medium">
                          {player.name}
                        </Text>
                        <Text className="text-surface-600 dark:text-surface-400 text-xs">
                          {playerStat.fouledOut ? "FOULED OUT" : player.position || "N/A"}
                        </Text>
                      </View>
                      <View
                        className={`px-4 py-2 rounded-lg ${
                          playerStat.fouledOut
                            ? "bg-surface-600"
                            : playerStat.isOnCourt
                              ? "bg-red-600"
                              : "bg-green-600"
                        }`}
                      >
                        <Text className="text-white font-semibold text-sm">
                          {playerStat.fouledOut
                            ? "Out"
                            : playerStat.isOnCourt
                              ? "Sub Out"
                              : "Sub In"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Plays tab - rendered outside ScrollView to avoid VirtualizedList nesting warning */}
      {activeTab === "plays" && (
        <View className="flex-1 mx-4 mb-2">
          <PlayByPlayTab
            events={gameEvents?.events}
            isLoading={gameEvents === undefined}
            currentQuarter={game.currentQuarter}
          />
        </View>
      )}

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
});
