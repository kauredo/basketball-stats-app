import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
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
import TimeEditModal from "../components/livegame/TimeEditModal";
import QuarterBreakdown from "../components/livegame/QuarterBreakdown";
import TeamBoxScore from "../components/livegame/TeamBoxScore";
import AdvancedStats from "../components/livegame/AdvancedStats";
import SubstitutionPanel from "../components/livegame/SubstitutionPanel";
import useSoundFeedback from "../hooks/useSoundFeedback";
import useShotClock from "../hooks/useShotClock";

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
    <Animated.View className={`flex-1 ${isCompact ? "mx-0.5" : "mx-1"}`} style={animatedStyle}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        className="rounded-xl justify-center items-center"
        style={{
          backgroundColor: disabled ? "#374151" : color,
          height: buttonHeight,
          opacity: disabled ? 0.5 : 1,
          minWidth: TOUCH_TARGETS.minimum,
        }}
        activeOpacity={0.8}
      >
        <Text className={`text-white font-bold ${isCompact ? "text-[11px]" : "text-sm"}`}>
          {label}
        </Text>
        {!isCompact && <Text className="text-white/70 text-[10px] mt-0.5">{shortLabel}</Text>}
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

  // Time edit states
  const [showGameClockEdit, setShowGameClockEdit] = useState(false);
  const [showShotClockEdit, setShowShotClockEdit] = useState(false);

  // Pre-game lineup selection state
  const [homeStarters, setHomeStarters] = useState<Id<"players">[]>([]);
  const [awayStarters, setAwayStarters] = useState<Id<"players">[]>([]);
  const [isCreatingPlayers, setIsCreatingPlayers] = useState(false);
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

  // Shot clock synced with Convex
  const shotClock = useShotClock({
    gameId,
    token: token ?? undefined,
    serverSeconds: gameData?.game?.shotClockSeconds,
    serverStartedAt: gameData?.game?.shotClockStartedAt,
    serverIsRunning: gameData?.game?.shotClockIsRunning,
    gameTimeRemainingSeconds: gameData?.game?.timeRemainingSeconds,
    initialSeconds: 24,
    offensiveReboundReset: 14,
    warningThreshold: 5,
  });

  // Mutations
  const startGame = useMutation(api.games.start);
  const pauseGame = useMutation(api.games.pause);
  const resumeGame = useMutation(api.games.resume);
  const endGame = useMutation(api.games.end);
  const reactivateGame = useMutation(api.games.reactivate);
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
  const setGameTimeMutation = useMutation(api.games.setGameTime);
  const createPlayerMutation = useMutation(api.players.create);
  const initializePlayerForGameMutation = useMutation(api.stats.initializePlayerForGame);

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

  // Handle creating missing players for a team
  const handleCreatePlayers = async (teamId: Id<"teams">, count: number) => {
    if (!token || !gameId) return;

    setIsCreatingPlayers(true);
    try {
      // Get current player count to determine starting number
      const teamPlayers = teamId === game?.homeTeam?.id ? homePlayerStats : awayPlayerStats;
      const startingNumber = teamPlayers.length + 1;

      for (let i = 0; i < count; i++) {
        const playerNumber = startingNumber + i;
        // Create the player
        const result = await createPlayerMutation({
          token,
          teamId,
          name: `Player ${playerNumber}`,
          number: playerNumber,
          active: true,
        });
        // Initialize player stats for this game so they appear in the lineup
        if (result.player?.id) {
          await initializePlayerForGameMutation({
            token,
            gameId,
            playerId: result.player.id,
          });
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to create players:", error);
      Alert.alert("Error", "Failed to create players");
    } finally {
      setIsCreatingPlayers(false);
    }
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

  const handleGameControl = async (action: "start" | "pause" | "resume" | "end" | "reactivate") => {
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
        case "reactivate":
          await reactivateGame({ token, gameId });
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

  // Handle manual game clock edit
  const handleSetGameTime = async (seconds: number) => {
    if (!token || !gameId) return;
    try {
      await setGameTimeMutation({
        token,
        gameId,
        timeRemainingSeconds: seconds,
      });
    } catch (error) {
      console.error("Failed to set game time:", error);
    }
  };

  // Handle manual shot clock edit
  const handleSetShotClockTime = async (seconds: number) => {
    try {
      await shotClock.setTime(seconds);
    } catch (error) {
      console.error("Failed to set shot clock time:", error);
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

  // Swap two players (one out, one in)
  const handleSwap = async (playerOut: Id<"players">, playerIn: Id<"players">) => {
    if (!token) return;

    try {
      // Sub out the court player, sub in the bench player
      await substituteMutation({ token, gameId, playerId: playerOut, isOnCourt: false });
      await substituteMutation({ token, gameId, playerId: playerIn, isOnCourt: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      console.error("Failed to swap players:", error);
      Alert.alert("Error", error.message || "Failed to swap players");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Add a player to court (for empty slots)
  const handleSubIn = async (playerId: Id<"players">) => {
    if (!token) return;

    try {
      await substituteMutation({ token, gameId, playerId, isOnCourt: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      console.error("Failed to sub in player:", error);
      Alert.alert("Error", error.message || "Failed to add player to court");
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

            {/* Not enough players warning */}
            {awayPlayerStats.length < 5 && (
              <View className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Icon name="alert" size={16} color="#F59E0B" />
                    <Text className="text-amber-700 dark:text-amber-300 text-sm ml-2">
                      Need {5 - awayPlayerStats.length} more player
                      {5 - awayPlayerStats.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      game.awayTeam?.id &&
                      handleCreatePlayers(
                        game.awayTeam.id as Id<"teams">,
                        5 - awayPlayerStats.length
                      )
                    }
                    disabled={isCreatingPlayers}
                    className={`px-3 py-1.5 rounded-lg flex-row items-center ${isCreatingPlayers ? "bg-amber-400" : "bg-amber-500"}`}
                  >
                    <Icon name="plus" size={14} color="#FFFFFF" />
                    <Text className="text-white text-sm font-medium ml-1">
                      {isCreatingPlayers ? "Adding..." : `Add ${5 - awayPlayerStats.length}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {awayPlayerStats.length === 0 ? (
              <View className="py-6 items-center">
                <Icon name="users" size={32} color="#9CA3AF" />
                <Text className="text-surface-500 mt-2">No players on this team</Text>
              </View>
            ) : (
              awayPlayerStats.map((stat) => (
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
              ))
            )}
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

            {/* Not enough players warning */}
            {homePlayerStats.length < 5 && (
              <View className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Icon name="alert" size={16} color="#F59E0B" />
                    <Text className="text-amber-700 dark:text-amber-300 text-sm ml-2">
                      Need {5 - homePlayerStats.length} more player
                      {5 - homePlayerStats.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      game.homeTeam?.id &&
                      handleCreatePlayers(
                        game.homeTeam.id as Id<"teams">,
                        5 - homePlayerStats.length
                      )
                    }
                    disabled={isCreatingPlayers}
                    className={`px-3 py-1.5 rounded-lg flex-row items-center ${isCreatingPlayers ? "bg-amber-400" : "bg-amber-500"}`}
                  >
                    <Icon name="plus" size={14} color="#FFFFFF" />
                    <Text className="text-white text-sm font-medium ml-1">
                      {isCreatingPlayers ? "Adding..." : `Add ${5 - homePlayerStats.length}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {homePlayerStats.length === 0 ? (
              <View className="py-6 items-center">
                <Icon name="users" size={32} color="#9CA3AF" />
                <Text className="text-surface-500 mt-2">No players on this team</Text>
              </View>
            ) : (
              homePlayerStats.map((stat) => (
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
              ))
            )}
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
                  className={`text-xs ml-1 font-medium ${
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
            paddingBottom: isLandscape ? 8 : 16,
          }}
          showsVerticalScrollIndicator={isLandscape}
        >
          {/* Court Tab */}
          {activeTab === "court" && (
            <View className={isLandscape ? "flex-1 flex-row gap-3" : "flex-1"}>
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
                  isLandscape ? "w-36 p-2 justify-center" : "p-4"
                }`}
              >
                {!isLandscape && (
                  <Text className="text-surface-900 dark:text-white font-semibold mb-3">
                    Quick Stats
                  </Text>
                )}
                {isLandscape ? (
                  /* Landscape: Compact 2-column grid */
                  <View className="gap-1">
                    <View className="flex-row gap-1">
                      <StatButton
                        label="REB"
                        shortLabel="+R"
                        color="#2563EB"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("rebound")}
                        size="compact"
                      />
                      <StatButton
                        label="AST"
                        shortLabel="+A"
                        color="#7C3AED"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("assist")}
                        size="compact"
                      />
                    </View>
                    <View className="flex-row gap-1">
                      <StatButton
                        label="STL"
                        shortLabel="+S"
                        color="#0891B2"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("steal")}
                        size="compact"
                      />
                      <StatButton
                        label="BLK"
                        shortLabel="+B"
                        color="#0D9488"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("block")}
                        size="compact"
                      />
                    </View>
                    <View className="flex-row gap-1">
                      <StatButton
                        label="TO"
                        shortLabel="+T"
                        color="#F59E0B"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("turnover")}
                        size="compact"
                      />
                      <StatButton
                        label="FOUL"
                        shortLabel="+F"
                        color="#DC2626"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("foul")}
                        size="compact"
                      />
                    </View>
                    <View className="flex-row gap-1">
                      <StatButton
                        label="FT"
                        shortLabel="FT"
                        color="#059669"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("freethrow")}
                        size="compact"
                      />
                    </View>
                    {/* Timeout Buttons - Landscape */}
                    <View className="border-t border-surface-200 dark:border-surface-700 mt-1 pt-1 gap-1">
                      <TouchableOpacity
                        onPress={() => handleTimeout(false)}
                        disabled={!canRecordStats || awayTeamStatsData.timeoutsRemaining === 0}
                        className={`py-1.5 px-2 rounded-lg border border-surface-200 dark:border-surface-600 ${
                          !canRecordStats || awayTeamStatsData.timeoutsRemaining === 0
                            ? "opacity-50"
                            : ""
                        } bg-surface-100 dark:bg-surface-700`}
                      >
                        <Text className="text-surface-700 dark:text-surface-300 font-semibold text-xs text-center">
                          {game.awayTeam?.name?.slice(0, 8) || "Away"} TO (
                          {awayTeamStatsData.timeoutsRemaining})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleTimeout(true)}
                        disabled={!canRecordStats || homeTeamStatsData.timeoutsRemaining === 0}
                        className={`py-1.5 px-2 rounded-lg border border-surface-200 dark:border-surface-600 ${
                          !canRecordStats || homeTeamStatsData.timeoutsRemaining === 0
                            ? "opacity-50"
                            : ""
                        } bg-surface-100 dark:bg-surface-700`}
                      >
                        <Text className="text-surface-700 dark:text-surface-300 font-semibold text-xs text-center">
                          {game.homeTeam?.name?.slice(0, 8) || "Home"} TO (
                          {homeTeamStatsData.timeoutsRemaining})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* Portrait: Original layout */
                  <View>
                    <View className="flex-row mb-2">
                      <View className="flex-1 flex-row">
                        <StatButton
                          label="REB"
                          shortLabel="+R"
                          color="#2563EB"
                          disabled={!canRecordStats}
                          onPress={() => setPendingQuickStat("rebound")}
                          size="normal"
                        />
                        <StatButton
                          label="AST"
                          shortLabel="+A"
                          color="#7C3AED"
                          disabled={!canRecordStats}
                          onPress={() => setPendingQuickStat("assist")}
                          size="normal"
                        />
                      </View>
                      <View className="flex-1 flex-row">
                        <StatButton
                          label="STL"
                          shortLabel="+S"
                          color="#0891B2"
                          disabled={!canRecordStats}
                          onPress={() => setPendingQuickStat("steal")}
                          size="normal"
                        />
                        <StatButton
                          label="BLK"
                          shortLabel="+B"
                          color="#0D9488"
                          disabled={!canRecordStats}
                          onPress={() => setPendingQuickStat("block")}
                          size="normal"
                        />
                      </View>
                    </View>
                    <View className="flex-row mb-2">
                      <View className="flex-1 flex-row">
                        <StatButton
                          label="TO"
                          shortLabel="+T"
                          color="#F59E0B"
                          disabled={!canRecordStats}
                          onPress={() => setPendingQuickStat("turnover")}
                          size="normal"
                        />
                        <StatButton
                          label="FOUL"
                          shortLabel="+F"
                          color="#DC2626"
                          disabled={!canRecordStats}
                          onPress={() => setPendingQuickStat("foul")}
                          size="normal"
                        />
                      </View>
                    </View>
                    <View className="flex-row">
                      <StatButton
                        label="FREE THROW"
                        shortLabel="FT"
                        color="#059669"
                        disabled={!canRecordStats}
                        onPress={() => setPendingQuickStat("freethrow")}
                        size="normal"
                      />
                    </View>
                    {/* Timeout Buttons - Portrait */}
                    <View className="border-t border-surface-200 dark:border-surface-700 mt-3 pt-3">
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleTimeout(false)}
                          disabled={!canRecordStats || awayTeamStatsData.timeoutsRemaining === 0}
                          className={`flex-1 py-2 px-3 rounded-lg border border-surface-200 dark:border-surface-600 ${
                            !canRecordStats || awayTeamStatsData.timeoutsRemaining === 0
                              ? "opacity-50"
                              : ""
                          } bg-surface-100 dark:bg-surface-700`}
                        >
                          <Text className="text-surface-500 dark:text-surface-400 text-[10px] uppercase tracking-wide text-center">
                            {game.awayTeam?.name || "Away"}
                          </Text>
                          <Text className="text-surface-700 dark:text-surface-300 font-semibold text-sm text-center">
                            TO ({awayTeamStatsData.timeoutsRemaining})
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleTimeout(true)}
                          disabled={!canRecordStats || homeTeamStatsData.timeoutsRemaining === 0}
                          className={`flex-1 py-2 px-3 rounded-lg border border-surface-200 dark:border-surface-600 ${
                            !canRecordStats || homeTeamStatsData.timeoutsRemaining === 0
                              ? "opacity-50"
                              : ""
                          } bg-surface-100 dark:bg-surface-700`}
                        >
                          <Text className="text-surface-500 dark:text-surface-400 text-[10px] uppercase tracking-wide text-center">
                            {game.homeTeam?.name || "Home"}
                          </Text>
                          <Text className="text-surface-700 dark:text-surface-300 font-semibold text-sm text-center">
                            TO ({homeTeamStatsData.timeoutsRemaining})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Clock Tab */}
          {activeTab === "clock" && (
            <View className="flex-1">
              {/* Main Clock Display */}
              <View
                className={`bg-surface-900 rounded-2xl items-center justify-center flex-1 ${
                  isLandscape ? "p-4" : "p-6"
                }`}
              >
                {isLandscape ? (
                  /* Landscape: Inline layout - Quarter | Game Clock | Shot Clock | Controls */
                  <View className="flex-row items-center justify-center gap-6 w-full">
                    {/* Quarter Badge */}
                    <View className="bg-primary-500 rounded-full px-4 py-2">
                      <Text className="text-white font-bold text-lg">
                        {game.currentQuarter <= 4
                          ? `Q${game.currentQuarter}`
                          : `OT${game.currentQuarter - 4}`}
                      </Text>
                    </View>

                    {/* Game Clock */}
                    <TouchableOpacity
                      onPress={() => setShowGameClockEdit(true)}
                      activeOpacity={0.7}
                      className="items-center"
                    >
                      <Text
                        className={`font-mono font-bold ${
                          game.timeRemainingSeconds <= 60 && isGameActive
                            ? "text-red-500"
                            : "text-white"
                        }`}
                        style={{ fontSize: 56 }}
                      >
                        {Math.floor(game.timeRemainingSeconds / 60)}:
                        {(game.timeRemainingSeconds % 60).toString().padStart(2, "0")}
                      </Text>
                      <Text className="text-surface-500 text-[10px] uppercase tracking-wider">
                        Game
                      </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="w-px h-16 bg-surface-700" />

                    {/* Shot Clock + Reset */}
                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity
                        onPress={() => setShowShotClockEdit(true)}
                        activeOpacity={0.7}
                        className={`px-5 py-3 rounded-xl border-2 items-center ${
                          (shotClock.isWarning || shotClock.displaySeconds <= 5) && isGameActive
                            ? "bg-red-500/20 border-red-500"
                            : "bg-surface-800 border-surface-700"
                        }`}
                      >
                        <Text
                          className={`font-mono font-bold text-4xl ${
                            (shotClock.isWarning || shotClock.displaySeconds <= 5) && isGameActive
                              ? "text-red-500"
                              : "text-amber-400"
                          }`}
                        >
                          {shotClock.formattedTime}
                        </Text>
                        <Text className="text-surface-500 text-[10px] uppercase tracking-wider">
                          Shot
                        </Text>
                      </TouchableOpacity>
                      <View className="gap-1">
                        <TouchableOpacity
                          onPress={() => {
                            shotClock.reset();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }}
                          className="bg-amber-600 px-3 py-2 rounded-lg"
                        >
                          <Text className="text-white font-bold text-base">24</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            shotClock.resetOffensiveRebound();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }}
                          className="bg-amber-700 px-3 py-2 rounded-lg"
                        >
                          <Text className="text-white font-bold text-base">14</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Divider */}
                    <View className="w-px h-16 bg-surface-700" />

                    {/* Game Controls */}
                    <View className="flex-row gap-4">
                      {isGameActive && (
                        <TouchableOpacity
                          onPress={() => handleGameControl("pause")}
                          className="bg-amber-600 px-6 py-3 rounded-xl flex-row items-center"
                        >
                          <Icon name="pause" size={20} color="#FFFFFF" />
                          <Text className="text-white font-bold ml-2">Pause</Text>
                        </TouchableOpacity>
                      )}
                      {isGamePaused && (
                        <TouchableOpacity
                          onPress={() => handleGameControl("resume")}
                          className="bg-green-600 px-6 py-3 rounded-xl flex-row items-center"
                        >
                          <Icon name="play" size={20} color="#FFFFFF" />
                          <Text className="text-white font-bold ml-2">Resume</Text>
                        </TouchableOpacity>
                      )}
                      {isGamePaused && (
                        <TouchableOpacity
                          onPress={handleEndPeriod}
                          className="bg-red-600 px-6 py-3 rounded-xl flex-row items-center"
                        >
                          <Icon name="stop" size={20} color="#FFFFFF" />
                          <Text className="text-white font-bold ml-2">End</Text>
                        </TouchableOpacity>
                      )}
                      {!isGameActive && !isGamePaused && (
                        <TouchableOpacity
                          onPress={() => handleGameControl("start")}
                          className="bg-green-600 px-6 py-3 rounded-xl flex-row items-center"
                        >
                          <Icon name="play" size={20} color="#FFFFFF" />
                          <Text className="text-white font-bold ml-2">Start</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ) : (
                  /* Portrait: Stacked layout */
                  <>
                    {/* Quarter Badge */}
                    <View className="bg-primary-500 px-4 py-2 rounded-full mb-4">
                      <Text className="text-white text-lg font-bold">
                        {game.currentQuarter <= 4
                          ? `Q${game.currentQuarter}`
                          : `OT${game.currentQuarter - 4}`}
                      </Text>
                    </View>

                    {/* Game Clock */}
                    <TouchableOpacity
                      onPress={() => setShowGameClockEdit(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`font-mono font-bold text-white ${
                          game.timeRemainingSeconds <= 60 && isGameActive ? "text-red-500" : ""
                        }`}
                        style={{ fontSize: 80 }}
                      >
                        {Math.floor(game.timeRemainingSeconds / 60)}:
                        {(game.timeRemainingSeconds % 60).toString().padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                    <Text className="text-surface-400 text-sm mt-2 uppercase tracking-widest">
                      Game Clock (tap to edit)
                    </Text>

                    {/* Shot Clock */}
                    <View className="flex-row items-center gap-4 mt-6">
                      <TouchableOpacity
                        onPress={() => setShowShotClockEdit(true)}
                        activeOpacity={0.7}
                        className={`px-8 py-4 rounded-xl border-2 ${
                          (shotClock.isWarning || shotClock.displaySeconds <= 5) && isGameActive
                            ? "bg-red-500/20 border-red-500"
                            : "bg-surface-800 border-surface-700"
                        }`}
                      >
                        <Text
                          className={`font-mono font-bold text-5xl ${
                            (shotClock.isWarning || shotClock.displaySeconds <= 5) && isGameActive
                              ? "text-red-500"
                              : "text-amber-400"
                          }`}
                        >
                          {shotClock.formattedTime}
                        </Text>
                        <Text className="text-surface-400 text-xs mt-1 uppercase tracking-wider text-center">
                          Shot Clock
                        </Text>
                      </TouchableOpacity>
                      <View className="gap-2">
                        <TouchableOpacity
                          onPress={() => {
                            shotClock.reset();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }}
                          className="bg-amber-600 px-4 py-3 rounded-lg"
                        >
                          <Text className="text-white font-bold text-lg">24</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            shotClock.resetOffensiveRebound();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }}
                          className="bg-amber-700 px-4 py-3 rounded-lg"
                        >
                          <Text className="text-white font-bold text-lg">14</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Violation Button */}
                    {shotClock.showViolationButton && (
                      <TouchableOpacity
                        onPress={shotClock.handleViolationPause}
                        className="mt-4 px-6 py-4 bg-red-600 rounded-xl border-2 border-red-400"
                      >
                        <View className="flex-row items-center justify-center gap-3">
                          <Icon name="stop" size={28} color="#FFFFFF" />
                          <View>
                            <Text className="text-white text-lg font-bold">
                              SHOT CLOCK VIOLATION
                            </Text>
                            <Text className="text-white/80 text-sm">
                              Tap to stop at {Math.floor((shotClock.violationGameTime ?? 0) / 60)}:
                              {String((shotClock.violationGameTime ?? 0) % 60).padStart(2, "0")}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}

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
                        <View className="flex-row gap-3">
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
                        </View>
                      )}
                    </View>
                  </>
                )}

                {/* Violation Button for landscape */}
                {isLandscape && shotClock.showViolationButton && (
                  <TouchableOpacity
                    onPress={shotClock.handleViolationPause}
                    className="mt-3 px-4 py-2 bg-red-600 rounded-xl border-2 border-red-400"
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <Icon name="stop" size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold">
                        VIOLATION - Tap to stop at{" "}
                        {Math.floor((shotClock.violationGameTime ?? 0) / 60)}:
                        {String((shotClock.violationGameTime ?? 0) % 60).padStart(2, "0")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          {activeTab === "stats" && (
            <View className="pb-6">
              {/* Quarter Breakdown */}
              <QuarterBreakdown
                homeTeamName={game.homeTeam?.name || "Home"}
                awayTeamName={game.awayTeam?.name || "Away"}
                scoreByPeriod={(game.gameSettings as any)?.scoreByPeriod}
                currentQuarter={game.currentQuarter || 1}
                homeScore={game.homeScore}
                awayScore={game.awayScore}
              />

              {/* Away Team Box Score */}
              <TeamBoxScore
                teamName={game.awayTeam?.name || "Away"}
                players={awayPlayerStats}
                foulLimit={liveStats?.game?.foulLimit || 5}
              />

              {/* Home Team Box Score */}
              <TeamBoxScore
                teamName={game.homeTeam?.name || "Home"}
                players={homePlayerStats}
                foulLimit={liveStats?.game?.foulLimit || 5}
                isHomeTeam
              />

              {/* Advanced Stats */}
              <AdvancedStats
                homeStats={homePlayerStats}
                awayStats={awayPlayerStats}
                homeTeamName={game.homeTeam?.name || "Home"}
                awayTeamName={game.awayTeam?.name || "Away"}
              />
            </View>
          )}

          {activeTab === "subs" && (
            <View className="pb-6 gap-4">
              {/* Away Team - Position-based substitution panel */}
              <SubstitutionPanel
                teamName={game.awayTeam?.name || "Away"}
                players={awayPlayerStats}
                foulLimit={liveStats?.game?.foulLimit || 5}
                onSwap={handleSwap}
                onSubIn={handleSubIn}
                disabled={game.status !== "active" && game.status !== "paused"}
                isHomeTeam={false}
              />

              {/* Home Team - Position-based substitution panel */}
              <SubstitutionPanel
                teamName={game.homeTeam?.name || "Home"}
                players={homePlayerStats}
                foulLimit={liveStats?.game?.foulLimit || 5}
                onSwap={handleSwap}
                onSubIn={handleSubIn}
                disabled={game.status !== "active" && game.status !== "paused"}
                isHomeTeam={true}
              />
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
            playerStats={allStats}
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

      {/* Time Edit Modals */}
      <TimeEditModal
        visible={showGameClockEdit}
        onClose={() => setShowGameClockEdit(false)}
        currentSeconds={game.timeRemainingSeconds}
        onSave={handleSetGameTime}
        title="Edit Game Clock"
        mode="game"
      />

      <TimeEditModal
        visible={showShotClockEdit}
        onClose={() => setShowShotClockEdit(false)}
        currentSeconds={shotClock.seconds}
        maxSeconds={24}
        onSave={handleSetShotClockTime}
        title="Edit Shot Clock"
        mode="shot"
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
