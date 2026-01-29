import React, { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import type { GameSettings, LiveTeamStats, GameStatus } from "@basketball-stats/shared";

// Import all new modular components
import {
  LiveGameLayout,
  ShotRecordingModal,
  AssistPromptModal,
  ReboundPromptModal,
  QuickStatModal,
  FoulRecordingModal,
  FreeThrowSequenceModal,
  CourtModeContent,
  StatsModeContent,
  PlaysModeContent,
  LineupsModeContent,
  StartingLineupSelector,
} from "../components/livegame";
import { ClockModeContent } from "../components/livegame/ClockModeContent";
import { TimeEditModal } from "../components/livegame/modals/TimeEditModal";

// Import types
import type {
  GameMode,
  PlayerStat,
  TeamStatsData,
  StatType,
  FoulType,
  ShotLocation,
  PendingShot,
  PendingRebound,
  PendingAssist,
  ActionHistoryItem,
  LastAction,
  FreeThrowSequence,
  PlayByPlayEvent,
} from "../types/livegame";

// Local interface for game event items returned from the API
interface GameEventItem {
  id?: string;
  _id?: string;
  quarter: number;
  timeRemaining?: number;
  gameTime?: number;
  eventType: string;
  description: string;
  points?: number;
  player?: {
    id: Id<"players">;
    name?: string;
    number?: number;
  };
  team?: {
    id: Id<"teams">;
    name?: string;
  };
  details?: Record<string, unknown>;
}

// Import hooks
import { useFeedback } from "../hooks/livegame/useFeedback";
import { useToast } from "../contexts/ToastContext";
import { useGameClock } from "../hooks/livegame/useGameClock";
import { useShotClock } from "../hooks/livegame/useShotClock";

/**
 * Refactored LiveGame page - modular, one-page, no-scroll design.
 * Uses h-dvh layout with fixed scoreboard and tabs, flexible content area.
 */
const LiveGameNew: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();

  // UI State
  const [activeMode, setActiveMode] = useState<GameMode>("court");
  const [swappingPlayer, setSwappingPlayer] = useState<Id<"players"> | null>(null);
  const [pendingShot, setPendingShot] = useState<PendingShot | null>(null);
  const [pendingRebound, setPendingRebound] = useState<PendingRebound | null>(null);
  const [pendingAssist, setPendingAssist] = useState<PendingAssist | null>(null);
  const [pendingQuickStat, setPendingQuickStat] = useState<StatType | null>(null);
  const [pendingFoul, setPendingFoul] = useState<PlayerStat | null>(null);
  const [freeThrowSequence, setFreeThrowSequence] = useState<FreeThrowSequence | null>(null);
  const [_actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [recentShots, setRecentShots] = useState<ShotLocation[]>([]);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [selectedHomeStarters, setSelectedHomeStarters] = useState<Id<"players">[]>([]);
  const [selectedAwayStarters, setSelectedAwayStarters] = useState<Id<"players">[]>([]);
  const [homeActiveRoster, setHomeActiveRoster] = useState<Id<"players">[]>([]);
  const [awayActiveRoster, setAwayActiveRoster] = useState<Id<"players">[]>([]);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isCreatingPlayers, setIsCreatingPlayers] = useState(false);
  const isCreatingPlayersRef = useRef(false);
  const [showGameClockEdit, setShowGameClockEdit] = useState(false);
  const [showShotClockEdit, setShowShotClockEdit] = useState(false);

  // Convex queries
  const gameData = useQuery(
    api.games.get,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const liveStats = useQuery(
    api.stats.getLiveStats,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const gameEvents = useQuery(
    api.games.getGameEvents,
    token && gameId ? { token, gameId: gameId as Id<"games">, limit: 100 } : "skip"
  );

  const gameShotsData = useQuery(
    api.shots.getGameShots,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  // Get the game first to access team IDs
  const game = gameData?.game;

  // Query actual team rosters to find max jersey numbers (not just game stats)
  const homeTeamPlayersData = useQuery(
    api.players.list,
    token && game?.homeTeam?.id ? { token, teamId: game.homeTeam.id } : "skip"
  );

  const awayTeamPlayersData = useQuery(
    api.players.list,
    token && game?.awayTeam?.id ? { token, teamId: game.awayTeam.id } : "skip"
  );

  // Convex mutations
  const startGame = useMutation(api.games.start);
  const pauseGame = useMutation(api.games.pause);
  const resumeGame = useMutation(api.games.resume);
  const endGame = useMutation(api.games.end);
  const reactivateGame = useMutation(api.games.reactivate);
  const recordStat = useMutation(api.stats.recordStat);
  const undoStat = useMutation(api.stats.undoStat);
  const swapSubstituteMutation = useMutation(api.stats.swapSubstitute);
  const substituteMutation = useMutation(api.stats.substitute);
  const recordTeamReboundMutation = useMutation(api.stats.recordTeamRebound);
  const setQuarter = useMutation(api.games.setQuarter);
  const recordFoulWithContextMutation = useMutation(api.stats.recordFoulWithContext);
  const recordFreeThrowMutation = useMutation(api.stats.recordFreeThrow);
  const recordTimeoutMutation = useMutation(api.games.recordTimeout);
  const _startOvertimeMutation = useMutation(api.games.startOvertime);
  const recordShotMutation = useMutation(api.shots.recordShot);
  const updateGameSettingsMutation = useMutation(api.games.updateGameSettings);
  const setGameTimeMutation = useMutation(api.games.setGameTime);
  const initializePlayerForGameMutation = useMutation(api.stats.initializePlayerForGame);
  const createPlayerMutation = useMutation(api.players.create);

  // Hooks
  const feedback = useFeedback();
  const toast = useToast();

  // Derived data
  const stats = (liveStats?.stats || []) as PlayerStat[];
  const homeStats = stats.filter((s) => s.isHomeTeam);
  const awayStats = stats.filter((s) => !s.isHomeTeam);

  const homeOnCourt = homeStats.filter((p) => p.isOnCourt && !p.fouledOut);
  const awayOnCourt = awayStats.filter((p) => p.isOnCourt && !p.fouledOut);
  const allOnCourtPlayers = [...homeOnCourt, ...awayOnCourt];

  const gameSettings = (game?.gameSettings ?? {}) as GameSettings;
  const foulLimit = gameSettings.foulLimit || 5;
  const timeoutsPerTeam = gameSettings.timeoutsPerTeam || 4;

  const teamStatsFromLive = liveStats?.teamStats as
    | { home?: LiveTeamStats; away?: LiveTeamStats }
    | undefined;
  const defaultFoulsByQuarter = { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 };
  const homeTeamStats: TeamStatsData = {
    offensiveRebounds: teamStatsFromLive?.home?.offensiveRebounds ?? 0,
    defensiveRebounds: teamStatsFromLive?.home?.defensiveRebounds ?? 0,
    teamFouls: teamStatsFromLive?.home?.teamFouls ?? 0,
    foulsThisQuarter: teamStatsFromLive?.home?.foulsThisQuarter ?? 0,
    foulsByQuarter: teamStatsFromLive?.home?.foulsByQuarter ?? defaultFoulsByQuarter,
    timeoutsRemaining: teamStatsFromLive?.home?.timeoutsRemaining ?? timeoutsPerTeam,
    inBonus: teamStatsFromLive?.home?.inBonus ?? false,
    inDoubleBonus: teamStatsFromLive?.home?.inDoubleBonus ?? false,
  };

  const awayTeamStats: TeamStatsData = {
    offensiveRebounds: teamStatsFromLive?.away?.offensiveRebounds ?? 0,
    defensiveRebounds: teamStatsFromLive?.away?.defensiveRebounds ?? 0,
    teamFouls: teamStatsFromLive?.away?.teamFouls ?? 0,
    foulsThisQuarter: teamStatsFromLive?.away?.foulsThisQuarter ?? 0,
    foulsByQuarter: teamStatsFromLive?.away?.foulsByQuarter ?? defaultFoulsByQuarter,
    timeoutsRemaining: teamStatsFromLive?.away?.timeoutsRemaining ?? timeoutsPerTeam,
    inBonus: teamStatsFromLive?.away?.inBonus ?? false,
    inDoubleBonus: teamStatsFromLive?.away?.inDoubleBonus ?? false,
  };

  const isActive = game?.status === "active";
  const isPaused = game?.status === "paused";
  const _isCompleted = game?.status === "completed";
  const canRecordStats = isActive || isPaused;

  // Transform persisted shots to ShotLocation format for heat maps
  const persistedShots: ShotLocation[] = (gameShotsData?.shots || []).map((shot) => ({
    id: shot._id,
    x: shot.x,
    y: shot.y,
    made: shot.made,
    playerId: shot.playerId as Id<"players">,
    teamId: shot.teamId as Id<"teams">,
    is3pt: shot.shotType === "3pt",
    isHomeTeam: shot.teamId === game?.homeTeam?.id,
  }));

  // Game clock (for optional local countdown)
  const _gameClock = useGameClock({
    initialSeconds: game?.timeRemainingSeconds || 0,
    quarterDuration: (gameSettings.quarterMinutes || 12) * 60,
  });

  // Shot clock synced with Convex
  const shotClock = useShotClock({
    gameId: gameId as Id<"games"> | undefined,
    token: token ?? undefined,
    serverSeconds: game?.shotClockSeconds,
    serverStartedAt: game?.shotClockStartedAt,
    serverIsRunning: game?.shotClockIsRunning,
    gameTimeRemainingSeconds: game?.timeRemainingSeconds,
    initialSeconds: 24,
    offensiveReboundReset: 14,
    warningThreshold: 5,
  });

  // Handlers
  const handleGameControl = async (action: "start" | "pause" | "resume" | "end" | "reactivate") => {
    if (!token || !gameId) return;

    try {
      const gameIdTyped = gameId as Id<"games">;
      switch (action) {
        case "start":
          await startGame({ token, gameId: gameIdTyped });
          break;
        case "pause":
          await pauseGame({ token, gameId: gameIdTyped });
          break;
        case "resume":
          await resumeGame({ token, gameId: gameIdTyped });
          break;
        case "end":
          await endGame({ token, gameId: gameIdTyped, forceEnd: true });
          break;
        case "reactivate":
          await reactivateGame({ token, gameId: gameIdTyped });
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} game:`, error);
    }
  };

  const handleCourtClick = useCallback(
    (x: number, y: number, is3pt: boolean, zoneName: string) => {
      if (!canRecordStats) return;
      setPendingShot({ x, y, is3pt, zoneName });
    },
    [canRecordStats]
  );

  const handleStatSelect = useCallback(
    (statType: StatType) => {
      if (!canRecordStats) return;
      if (statType === "foul") {
        // Foul requires special handling - show player selection first via quick stat
        setPendingQuickStat(statType);
      } else {
        setPendingQuickStat(statType);
      }
    },
    [canRecordStats]
  );

  const handleRecordStat = async (
    playerId: Id<"players">,
    statType: StatType,
    made?: boolean,
    shotLocation?: { x: number; y: number }
  ) => {
    if (!token || !gameId) return;

    const playerStat = stats.find((s) => s.playerId === playerId);
    if (!playerStat) return;

    try {
      await recordStat({
        token,
        gameId: gameId as Id<"games">,
        playerId,
        statType,
        made,
      });

      // Track action history for undo
      const actionItem: ActionHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        playerId,
        playerName: playerStat.player?.name || "Unknown",
        playerNumber: playerStat.player?.number || 0,
        statType,
        made,
        timestamp: Date.now(),
      };
      setActionHistory((prev) => [actionItem, ...prev.slice(0, 19)]);

      // Set last action for FAB
      setLastAction({
        playerId,
        playerNumber: playerStat.player?.number || 0,
        playerName: playerStat.player?.name || "Unknown",
        statType,
        wasMade: made,
        displayText: `${statType}${made !== undefined ? (made ? " Made" : " Missed") : ""}`,
        timestamp: Date.now(),
      });

      // Sound/haptic feedback
      if (statType === "shot2" || statType === "shot3" || statType === "freethrow") {
        if (made) {
          feedback.made();
        } else {
          feedback.missed();
        }
      } else if (statType === "foul") {
        feedback.foul();
        // Check for foul out
        if (playerStat.fouls >= foulLimit - 1) {
          feedback.foulOut();
        }
      } else {
        feedback.confirm();
      }

      // Track recent shots for visualization AND persist to database
      if (shotLocation && (statType === "shot2" || statType === "shot3")) {
        const is3pt = statType === "shot3";
        setRecentShots((prev) => [
          ...prev.slice(-4),
          {
            ...shotLocation,
            made: made || false,
            playerId,
            teamId: playerStat.teamId,
            is3pt,
            isHomeTeam: playerStat.isHomeTeam,
          },
        ]);

        // Persist shot location to database for heat maps
        try {
          await recordShotMutation({
            token,
            gameId: gameId as Id<"games">,
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

      // Show assist prompt after made shots
      const isMadeShot = (statType === "shot2" || statType === "shot3") && made === true;
      if (isMadeShot) {
        const points = statType === "shot3" ? 3 : 2;
        setTimeout(() => {
          setPendingAssist({
            scorerPlayerId: playerId,
            scorerName: playerStat.player?.name || "Unknown",
            scorerNumber: playerStat.player?.number || 0,
            shotType: statType,
            points,
            isHomeTeam: playerStat.isHomeTeam,
          });
        }, 300);
      }

      // Show rebound prompt after missed shots
      const isMissedShot =
        (statType === "shot2" || statType === "shot3" || statType === "freethrow") &&
        made === false;
      if (isMissedShot) {
        setTimeout(() => {
          setPendingRebound({
            shooterTeamId: playerStat.teamId,
            isHomeTeam: playerStat.isHomeTeam,
            shotType: statType,
          });
        }, 500);
      }
    } catch (error) {
      console.error("Failed to record stat:", error);
    }
  };

  const handleShotFromModal = (playerId: Id<"players">, made: boolean) => {
    if (!pendingShot) return;
    const statType = pendingShot.is3pt ? "shot3" : "shot2";
    handleRecordStat(playerId, statType, made, { x: pendingShot.x, y: pendingShot.y });
    setPendingShot(null);
  };

  const handleQuickStatFromModal = (playerId: Id<"players">) => {
    if (!pendingQuickStat) return;

    // For fouls, show the foul type modal
    if (pendingQuickStat === "foul") {
      const playerStat = stats.find((s) => s.playerId === playerId);
      if (playerStat) {
        setPendingFoul(playerStat);
      }
      setPendingQuickStat(null);
      return;
    }

    handleRecordStat(playerId, pendingQuickStat);
    setPendingQuickStat(null);
  };

  const handlePlayerRebound = async (playerId: Id<"players">, type: "offensive" | "defensive") => {
    if (!token || !gameId) return;

    // Record rebound stat
    await recordStat({
      token,
      gameId: gameId as Id<"games">,
      playerId,
      statType: "rebound",
    });

    const playerStat = stats.find((s) => s.playerId === playerId);
    feedback.confirm();

    setLastAction({
      playerId,
      playerNumber: playerStat?.player?.number || 0,
      playerName: playerStat?.player?.name || "Unknown",
      statType: "rebound",
      displayText: `${type === "offensive" ? "OREB" : "DREB"}`,
      timestamp: Date.now(),
    });

    setPendingRebound(null);
  };

  const handleTeamRebound = async (teamId: Id<"teams">, type: "offensive" | "defensive") => {
    if (!token || !gameId) return;

    try {
      await recordTeamReboundMutation({
        token,
        gameId: gameId as Id<"games">,
        teamId,
        reboundType: type,
      });
      feedback.confirm();
      setPendingRebound(null);
    } catch (error) {
      console.error("Failed to record team rebound:", error);
    }
  };

  const handleAssist = async (playerId: Id<"players">) => {
    if (!token || !gameId || !pendingAssist) return;

    await handleRecordStat(playerId, "assist");
    setPendingAssist(null);
  };

  const handleRecordFoulWithContext = async (
    playerId: Id<"players">,
    foulType: FoulType,
    options?: { wasAndOne?: boolean; shotType?: "2pt" | "3pt"; fouledPlayerId?: Id<"players"> }
  ) => {
    if (!token || !gameId) return;

    try {
      const _result = await recordFoulWithContextMutation({
        token,
        gameId: gameId as Id<"games">,
        playerId,
        foulType,
        wasAndOne: options?.wasAndOne,
        shotType: options?.shotType,
        fouledPlayerId: options?.fouledPlayerId,
      });

      const playerStat = stats.find((s) => s.playerId === playerId);
      feedback.foul();

      // Check if fouled out
      if (playerStat && playerStat.fouls >= foulLimit - 1) {
        feedback.foulOut();
      }

      // Set up free throw sequence if shooting foul
      if (foulType === "shooting" && options?.fouledPlayerId) {
        const fouledPlayer = stats.find((s) => s.playerId === options.fouledPlayerId);
        if (fouledPlayer) {
          const ftCount = options.wasAndOne ? 1 : options.shotType === "3pt" ? 3 : 2;
          setFreeThrowSequence({
            playerId: options.fouledPlayerId,
            playerName: fouledPlayer.player?.name || "Unknown",
            playerNumber: fouledPlayer.player?.number || 0,
            totalAttempts: ftCount,
            currentAttempt: 1,
            isOneAndOne: false,
            results: [],
          });
        }
      }

      setPendingFoul(null);
    } catch (error) {
      console.error("Failed to record foul:", error);
    }
  };

  const handleFreeThrowResult = async (made: boolean) => {
    if (!token || !gameId || !freeThrowSequence) return;

    try {
      await recordFreeThrowMutation({
        token,
        gameId: gameId as Id<"games">,
        playerId: freeThrowSequence.playerId,
        made,
        attemptNumber: freeThrowSequence.currentAttempt,
        totalAttempts: freeThrowSequence.totalAttempts,
        isOneAndOne: freeThrowSequence.isOneAndOne,
      });

      if (made) {
        feedback.made();
      } else {
        feedback.missed();
      }

      const newResults = [...freeThrowSequence.results, made];
      const nextAttempt = freeThrowSequence.currentAttempt + 1;

      // Check if one-and-one and missed first
      if (freeThrowSequence.isOneAndOne && !made && freeThrowSequence.currentAttempt === 1) {
        setFreeThrowSequence(null);
        // Show rebound prompt
        const shooterStat = stats.find((s) => s.playerId === freeThrowSequence.playerId);
        if (shooterStat) {
          setPendingRebound({
            shooterTeamId: shooterStat.teamId,
            isHomeTeam: shooterStat.isHomeTeam,
            shotType: "freethrow",
          });
        }
        return;
      }

      // Check if sequence complete
      if (nextAttempt > freeThrowSequence.totalAttempts) {
        setFreeThrowSequence(null);
        // Show rebound prompt if last FT missed
        if (!made) {
          const shooterStat = stats.find((s) => s.playerId === freeThrowSequence.playerId);
          if (shooterStat) {
            setPendingRebound({
              shooterTeamId: shooterStat.teamId,
              isHomeTeam: shooterStat.isHomeTeam,
              shotType: "freethrow",
            });
          }
        }
        return;
      }

      // Continue sequence
      setFreeThrowSequence({
        ...freeThrowSequence,
        currentAttempt: nextAttempt,
        results: newResults,
      });
    } catch (error) {
      console.error("Failed to record free throw:", error);
    }
  };

  const handleUndo = async (action: LastAction) => {
    if (!token || !gameId) return;

    try {
      await undoStat({
        token,
        gameId: gameId as Id<"games">,
        playerId: action.playerId,
        statType: action.statType as StatType,
        wasMade: action.wasMade,
      });

      setActionHistory((prev) => prev.filter((a) => a.id !== action.playerId));
      setLastAction(null);
    } catch (error) {
      console.error("Failed to undo stat:", error);
    }
  };

  const handleSwapSubstitute = async (playerOutId: Id<"players">, playerInId: Id<"players">) => {
    if (!token || !gameId) return;

    try {
      await swapSubstituteMutation({
        token,
        gameId: gameId as Id<"games">,
        playerOutId,
        playerInId,
      });
      setSwappingPlayer(null);
    } catch (error) {
      console.error("Failed to swap players:", error);
    }
  };

  // Add a player to the court (for filling empty slots after foul-outs)
  const handleSubstituteIn = async (playerId: Id<"players">) => {
    if (!token || !gameId) return;

    try {
      await substituteMutation({
        token,
        gameId: gameId as Id<"games">,
        playerId,
        isOnCourt: true,
      });
      setSwappingPlayer(null);
    } catch (error) {
      console.error("Failed to substitute player in:", error);
    }
  };

  const handleTimeoutHome = async () => {
    if (!token || !gameId || !game) return;
    try {
      await recordTimeoutMutation({
        token,
        gameId: gameId as Id<"games">,
        teamId: game.homeTeam?.id as Id<"teams">,
      });
      feedback.timeout();
    } catch (error) {
      console.error("Failed to record timeout:", error);
    }
  };

  const handleTimeoutAway = async () => {
    if (!token || !gameId || !game) return;
    try {
      await recordTimeoutMutation({
        token,
        gameId: gameId as Id<"games">,
        teamId: game.awayTeam?.id as Id<"teams">,
      });
      feedback.timeout();
    } catch (error) {
      console.error("Failed to record timeout:", error);
    }
  };

  const handleQuarterChange = async (quarter: number) => {
    if (!token || !gameId) return;
    try {
      await setQuarter({
        token,
        gameId: gameId as Id<"games">,
        quarter,
        resetTime: true,
      });
    } catch (error) {
      console.error("Failed to change quarter:", error);
    }
  };

  const handleResetShotClock = (seconds: number = 24) => {
    // Convex mutation handles auto-start when game is active
    if (seconds === 14) {
      shotClock.resetOffensiveRebound();
    } else {
      shotClock.reset();
    }
  };

  // Handler for creating missing players (when team has fewer than 5)
  const handleCreatePlayers = useCallback(
    async (teamId: Id<"teams">, count: number) => {
      if (!token || !gameId) return;

      // Use ref to prevent race conditions on rapid clicks
      if (isCreatingPlayersRef.current) return;
      isCreatingPlayersRef.current = true;

      setIsCreatingPlayers(true);
      try {
        // Get max jersey number from actual team roster
        const isHomeTeam = teamId === game?.homeTeam?.id;
        const rosterPlayers = isHomeTeam
          ? homeTeamPlayersData?.players
          : awayTeamPlayersData?.players;

        // Find the highest jersey number currently on the team
        const maxJerseyNumber =
          rosterPlayers?.reduce((max, player) => Math.max(max, player.number ?? 0), 0) ?? 0;

        // Start from the next available number
        const startingNumber = maxJerseyNumber + 1;

        for (let i = 0; i < count; i++) {
          const playerNumber = startingNumber + i;
          await createPlayerMutation({
            token,
            teamId,
            name: `Player ${playerNumber}`,
            number: playerNumber,
            active: true,
          });
        }
        toast.success(`Added ${count} player${count > 1 ? "s" : ""}`);
      } catch (error) {
        console.error("Failed to create players:", error);
        toast.error("Failed to add players");
      } finally {
        isCreatingPlayersRef.current = false;
        setIsCreatingPlayers(false);
      }
    },
    [token, gameId, game, homeTeamPlayersData, awayTeamPlayersData, createPlayerMutation, toast]
  );

  // Handler for starting lineup changes
  const handleStartersChange = useCallback(
    async (homeStarters: Id<"players">[], awayStarters: Id<"players">[]) => {
      setSelectedHomeStarters(homeStarters);
      setSelectedAwayStarters(awayStarters);

      // Save to backend when both teams have 5 starters
      if (token && gameId && homeStarters.length === 5 && awayStarters.length === 5) {
        try {
          await updateGameSettingsMutation({
            token,
            gameId: gameId as Id<"games">,
            startingFive: {
              homeTeam: homeStarters,
              awayTeam: awayStarters,
            },
          });
        } catch (error) {
          console.error("Failed to save starting lineup:", error);
        }
      }
    },
    [token, gameId, updateGameSettingsMutation]
  );

  // Handler for active roster changes
  const handleActiveRosterChange = useCallback(
    (homeRoster: Id<"players">[], awayRoster: Id<"players">[]) => {
      setHomeActiveRoster(homeRoster);
      setAwayActiveRoster(awayRoster);
    },
    []
  );

  // Handler for starting game with selected starters
  const handleStartGameWithStarters = useCallback(async () => {
    if (!token || !gameId) return;
    if (selectedHomeStarters.length !== 5 || selectedAwayStarters.length !== 5) return;

    setIsStartingGame(true);
    try {
      // Initialize only active roster players for this game (so they can be subbed in)
      // Initialize home team active roster
      for (const playerId of homeActiveRoster) {
        try {
          await initializePlayerForGameMutation({
            token,
            gameId: gameId as Id<"games">,
            playerId,
          });
        } catch {
          // Player might already be initialized, continue
        }
      }

      // Initialize away team active roster
      for (const playerId of awayActiveRoster) {
        try {
          await initializePlayerForGameMutation({
            token,
            gameId: gameId as Id<"games">,
            playerId,
          });
        } catch {
          // Player might already be initialized, continue
        }
      }

      // Save the active roster and starters
      await updateGameSettingsMutation({
        token,
        gameId: gameId as Id<"games">,
        activeRoster: {
          homeTeam: homeActiveRoster,
          awayTeam: awayActiveRoster,
        },
        startingFive: {
          homeTeam: selectedHomeStarters,
          awayTeam: selectedAwayStarters,
        },
      });

      // Then start the game
      await startGame({ token, gameId: gameId as Id<"games"> });
    } catch (error) {
      console.error("Failed to start game:", error);
      toast.error("Failed to start game");
    } finally {
      setIsStartingGame(false);
    }
  }, [
    token,
    gameId,
    selectedHomeStarters,
    selectedAwayStarters,
    homeActiveRoster,
    awayActiveRoster,
    initializePlayerForGameMutation,
    updateGameSettingsMutation,
    startGame,
    toast,
  ]);

  const handleEndPeriod = async () => {
    if (!token || !gameId || !game) return;
    try {
      // First pause the game
      await pauseGame({ token, gameId: gameId as Id<"games"> });
      // Then advance to next quarter (or overtime)
      const nextQuarter = game.currentQuarter + 1;
      await setQuarter({
        token,
        gameId: gameId as Id<"games">,
        quarter: nextQuarter,
        resetTime: true,
      });
      // Reset shot clock
      shotClock.reset();
    } catch (error) {
      console.error("Failed to end period:", error);
    }
  };

  // Handle manual game clock edit
  const handleSetGameTime = async (seconds: number) => {
    if (!token || !gameId) return;
    try {
      await setGameTimeMutation({
        token,
        gameId: gameId as Id<"games">,
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

  // Loading state
  if (!game) {
    return (
      <div className="h-dvh flex items-center justify-center bg-surface-900">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  // Format events for PlaysModeContent
  const formattedEvents: PlayByPlayEvent[] = ((gameEvents?.events || []) as GameEventItem[]).map(
    (e) => ({
      id: e.id || e._id || `event-${e.quarter}-${e.gameTime || e.timeRemaining}`,
      quarter: e.quarter,
      gameTime: e.gameTime || e.timeRemaining || 0,
      eventType: e.eventType,
      description: e.description,
      playerId: e.player?.id,
      teamId: e.team?.id,
      points: e.points,
      details: e.details,
    })
  );

  // Show starting lineup selector for scheduled games
  if (game.status === "scheduled") {
    return (
      <div className="h-dvh bg-surface-100 dark:bg-surface-900 p-4 safe-area-inset">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Header with game info */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              {game.awayTeam?.name || "Away"} @ {game.homeTeam?.name || "Home"}
            </h1>
            <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
              {game.scheduledAt
                ? new Date(game.scheduledAt).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Game Setup"}
            </p>
          </div>

          {/* Starting Lineup Selector */}
          <div className="flex-1 overflow-hidden">
            <StartingLineupSelector
              homeTeamName={game.homeTeam?.name || "Home"}
              awayTeamName={game.awayTeam?.name || "Away"}
              homeTeamId={game.homeTeam?.id}
              awayTeamId={game.awayTeam?.id}
              homePlayers={
                homeTeamPlayersData?.players?.map((p) => ({
                  id: p.id,
                  name: p.name,
                  number: p.number,
                  position: p.position,
                  active: p.active,
                })) ?? []
              }
              awayPlayers={
                awayTeamPlayersData?.players?.map((p) => ({
                  id: p.id,
                  name: p.name,
                  number: p.number,
                  position: p.position,
                  active: p.active,
                })) ?? []
              }
              initialHomeStarters={selectedHomeStarters}
              initialAwayStarters={selectedAwayStarters}
              rosterLimit={game.leagueSettings?.playersPerRoster ?? 15}
              onStartersChange={handleStartersChange}
              onActiveRosterChange={handleActiveRosterChange}
              onStartGame={handleStartGameWithStarters}
              onCreatePlayers={handleCreatePlayers}
              isStarting={isStartingGame}
              isLoading={!homeTeamPlayersData || !awayTeamPlayersData}
              isCreatingPlayers={isCreatingPlayers}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <LiveGameLayout
      // Scoreboard props
      game={{
        status: game.status as GameStatus,
        currentQuarter: game.currentQuarter,
        timeRemainingSeconds: game.timeRemainingSeconds,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        homeTeam: game.homeTeam ? { name: game.homeTeam.name } : null,
        awayTeam: game.awayTeam ? { name: game.awayTeam.name } : null,
      }}
      homeTeamStats={homeTeamStats}
      awayTeamStats={awayTeamStats}
      timeoutsPerTeam={timeoutsPerTeam}
      onGameControl={handleGameControl}
      onTimeoutHome={handleTimeoutHome}
      onTimeoutAway={handleTimeoutAway}
      onQuarterChange={handleQuarterChange}
      // Tab navigation
      activeMode={activeMode}
      onModeChange={setActiveMode}
      // Undo FAB
      lastAction={lastAction}
      onUndo={handleUndo}
      onDismissUndo={() => setLastAction(null)}
    >
      {/* Court Mode */}
      {activeMode === "court" && (
        <CourtModeContent
          homeTeamName={game.homeTeam?.name || "Home"}
          awayTeamName={game.awayTeam?.name || "Away"}
          homeTeamId={game.homeTeam?.id as Id<"teams">}
          awayTeamId={game.awayTeam?.id as Id<"teams">}
          homeStats={homeStats}
          awayStats={awayStats}
          foulLimit={foulLimit}
          onCourtClick={handleCourtClick}
          recentShots={persistedShots.length > 0 ? persistedShots.slice(-8) : recentShots}
          showHeatMap={showHeatMap}
          onToggleHeatMap={() => setShowHeatMap(!showHeatMap)}
          allShots={persistedShots}
          onStatSelect={handleStatSelect}
          homeTimeoutsRemaining={homeTeamStats.timeoutsRemaining}
          awayTimeoutsRemaining={awayTeamStats.timeoutsRemaining}
          onTimeoutHome={handleTimeoutHome}
          onTimeoutAway={handleTimeoutAway}
          swappingPlayer={swappingPlayer}
          onSwap={handleSwapSubstitute}
          onSubIn={handleSubstituteIn}
          onStartSwap={setSwappingPlayer}
          onCancelSwap={() => setSwappingPlayer(null)}
          disabled={!canRecordStats}
        />
      )}

      {/* Stats Mode */}
      {activeMode === "stats" && (
        <StatsModeContent
          homeTeamName={game.homeTeam?.name || "Home"}
          awayTeamName={game.awayTeam?.name || "Away"}
          homeStats={homeStats}
          awayStats={awayStats}
          foulLimit={foulLimit}
          currentQuarter={game.currentQuarter}
          scoreByPeriod={gameSettings.scoreByPeriod}
          homeScore={game.homeScore}
          awayScore={game.awayScore}
        />
      )}

      {/* Plays Mode */}
      {activeMode === "plays" && (
        <PlaysModeContent
          events={formattedEvents}
          currentQuarter={game.currentQuarter}
          playerStats={stats}
          homeTeamId={game.homeTeam?.id as Id<"teams">}
        />
      )}

      {/* Lineups Mode */}
      {activeMode === "subs" && (
        <LineupsModeContent
          homeTeamName={game.homeTeam?.name || "Home"}
          awayTeamName={game.awayTeam?.name || "Away"}
          homeTeamId={game.homeTeam?.id as Id<"teams">}
          awayTeamId={game.awayTeam?.id as Id<"teams">}
          homeStats={homeStats}
          awayStats={awayStats}
          foulLimit={foulLimit}
          onSwap={handleSwapSubstitute}
          onSubIn={handleSubstituteIn}
          swappingPlayer={swappingPlayer}
          onStartSwap={setSwappingPlayer}
          onCancelSwap={() => setSwappingPlayer(null)}
          disabled={!canRecordStats}
        />
      )}

      {/* Clock Mode */}
      {activeMode === "clock" && (
        <ClockModeContent
          timeRemainingSeconds={game.timeRemainingSeconds}
          shotClockSeconds={shotClock.displaySeconds}
          shotClockFormatted={shotClock.formattedTime}
          shotClockIsWarning={shotClock.isWarning}
          showViolationButton={shotClock.showViolationButton}
          violationGameTime={shotClock.violationGameTime}
          onViolationPause={shotClock.handleViolationPause}
          currentQuarter={game.currentQuarter}
          status={game.status as "scheduled" | "active" | "paused" | "completed"}
          onGameControl={handleGameControl}
          onResetShotClock={handleResetShotClock}
          onEndPeriod={handleEndPeriod}
          onEditGameClock={() => setShowGameClockEdit(true)}
          onEditShotClock={() => setShowShotClockEdit(true)}
        />
      )}

      {/* Modals */}
      <ShotRecordingModal
        isOpen={!!pendingShot}
        onClose={() => setPendingShot(null)}
        onRecord={handleShotFromModal}
        shotType={pendingShot?.is3pt ? "3pt" : "2pt"}
        zoneName={pendingShot?.zoneName || ""}
        onCourtPlayers={allOnCourtPlayers}
        homeTeamName={game?.homeTeam?.name || "Home"}
        awayTeamName={game?.awayTeam?.name || "Away"}
      />

      <QuickStatModal
        isOpen={!!pendingQuickStat}
        onClose={() => setPendingQuickStat(null)}
        onRecord={handleQuickStatFromModal}
        statType={pendingQuickStat}
        onCourtPlayers={allOnCourtPlayers}
        homeTeamName={game?.homeTeam?.name || "Home"}
        awayTeamName={game?.awayTeam?.name || "Away"}
      />

      {pendingRebound && game && (
        <ReboundPromptModal
          isOpen={!!pendingRebound}
          onClose={() => setPendingRebound(null)}
          onPlayerRebound={handlePlayerRebound}
          onTeamRebound={handleTeamRebound}
          shooterTeamId={pendingRebound.shooterTeamId}
          shooterTeamName={
            pendingRebound.isHomeTeam
              ? game.homeTeam?.name || "Home"
              : game.awayTeam?.name || "Away"
          }
          opposingTeamId={
            pendingRebound.isHomeTeam
              ? (game.awayTeam?.id as Id<"teams">)
              : (game.homeTeam?.id as Id<"teams">)
          }
          opposingTeamName={
            pendingRebound.isHomeTeam
              ? game.awayTeam?.name || "Away"
              : game.homeTeam?.name || "Home"
          }
          shooterTeamPlayers={pendingRebound.isHomeTeam ? homeStats : awayStats}
          opposingTeamPlayers={pendingRebound.isHomeTeam ? awayStats : homeStats}
          shotType={pendingRebound.shotType}
        />
      )}

      {pendingAssist && (
        <AssistPromptModal
          isOpen={!!pendingAssist}
          onClose={() => setPendingAssist(null)}
          onAssist={handleAssist}
          onNoAssist={() => setPendingAssist(null)}
          scorerName={pendingAssist.scorerName}
          scorerNumber={pendingAssist.scorerNumber}
          shotType={pendingAssist.shotType}
          points={pendingAssist.points}
          teammates={(pendingAssist.isHomeTeam ? homeStats : awayStats).filter(
            (s) => s.isOnCourt && s.playerId !== pendingAssist.scorerPlayerId
          )}
        />
      )}

      <FoulRecordingModal
        isOpen={!!pendingFoul}
        onClose={() => setPendingFoul(null)}
        onRecord={handleRecordFoulWithContext}
        selectedPlayer={pendingFoul}
        opponentPlayers={pendingFoul?.isHomeTeam ? awayStats : homeStats}
      />

      <FreeThrowSequenceModal
        isOpen={!!freeThrowSequence}
        onClose={() => setFreeThrowSequence(null)}
        onRecord={handleFreeThrowResult}
        sequence={freeThrowSequence}
      />

      {/* Time Edit Modals */}
      <TimeEditModal
        isOpen={showGameClockEdit}
        onClose={() => setShowGameClockEdit(false)}
        currentSeconds={game.timeRemainingSeconds}
        onSave={handleSetGameTime}
        title="Edit Game Clock"
        mode="game"
      />

      <TimeEditModal
        isOpen={showShotClockEdit}
        onClose={() => setShowShotClockEdit(false)}
        currentSeconds={shotClock.seconds}
        maxSeconds={24}
        onSave={handleSetShotClockTime}
        title="Edit Shot Clock"
        mode="shot"
      />
    </LiveGameLayout>
  );
};

export default LiveGameNew;
