import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type {
  StatType,
  FoulType,
  PlayerStat,
  PendingShot,
  ShotLocation,
  ActionHistoryItem,
  FreeThrowSequence,
  GameSettings,
} from "../types/livegame";
import type { LiveTeamStats } from "@basketball-stats/shared";
import { useFeedback } from "./useFeedback";

interface PendingRebound {
  shooterPlayerId: Id<"players">;
  shooterTeamId: Id<"teams">;
  shotType: string;
  isHomeTeam: boolean;
}

interface PendingAssist {
  scorerPlayerId: Id<"players">;
  scorerName: string;
  scorerNumber: number;
  scorerTeamId: Id<"teams">;
  shotType: string;
  points: number;
  isHomeTeam: boolean;
}

interface UseLiveGameStateOptions {
  gameId: string | undefined;
  token: string | null;
}

export function useLiveGameState({ gameId, token }: UseLiveGameStateOptions) {
  // UI State
  const [activeTab, setActiveTab] = useState<"court" | "stats" | "substitutions">("court");
  const [pendingShot, setPendingShot] = useState<PendingShot | null>(null);
  const [recentShots, setRecentShots] = useState<ShotLocation[]>([]);

  // Enhanced features state
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [showQuarterSelector, setShowQuarterSelector] = useState(false);
  const [showEndPeriodConfirm, setShowEndPeriodConfirm] = useState(false);
  const [showActionHistory, setShowActionHistory] = useState(false);
  const [quarterMinutes, setQuarterMinutes] = useState(12);
  const [foulLimitSetting, setFoulLimitSetting] = useState<5 | 6>(5);
  const [homeStarters, setHomeStarters] = useState<Id<"players">[]>([]);
  const [awayStarters, setAwayStarters] = useState<Id<"players">[]>([]);

  // Modal states
  const [pendingRebound, setPendingRebound] = useState<PendingRebound | null>(null);
  const [pendingAssist, setPendingAssist] = useState<PendingAssist | null>(null);
  const [pendingQuickStat, setPendingQuickStat] = useState<StatType | null>(null);
  const [pendingFoul, setPendingFoul] = useState<PlayerStat | null>(null);
  const [freeThrowSequence, setFreeThrowSequence] = useState<FreeThrowSequence | null>(null);
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false);

  // Team stats summary expansion
  const [showHomeStatsSummary, setShowHomeStatsSummary] = useState(false);
  const [showAwayStatsSummary, setShowAwayStatsSummary] = useState(false);

  // Inline substitution swap state
  const [swappingPlayer, setSwappingPlayer] = useState<Id<"players"> | null>(null);

  // Feedback
  const feedback = useFeedback();

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
    token && gameId ? { token, gameId: gameId as Id<"games">, limit: 50 } : "skip"
  );

  // Convex mutations
  const startGame = useMutation(api.games.start);
  const pauseGame = useMutation(api.games.pause);
  const resumeGame = useMutation(api.games.resume);
  const endGame = useMutation(api.games.end);
  const recordStat = useMutation(api.stats.recordStat);
  const undoStat = useMutation(api.stats.undoStat);
  const swapSubstituteMutation = useMutation(api.stats.swapSubstitute);
  const recordTeamReboundMutation = useMutation(api.stats.recordTeamRebound);
  const setQuarter = useMutation(api.games.setQuarter);
  const updateGameSettings = useMutation(api.games.updateGameSettings);
  const recordFoulWithContextMutation = useMutation(api.stats.recordFoulWithContext);
  const recordFreeThrowMutation = useMutation(api.stats.recordFreeThrow);
  const recordTimeoutMutation = useMutation(api.games.recordTimeout);
  const startOvertimeMutation = useMutation(api.games.startOvertime);

  // Derived data
  const game = gameData?.game;
  const stats = (liveStats?.stats || []) as PlayerStat[];
  const homeStats = stats.filter((s) => s.isHomeTeam);
  const awayStats = stats.filter((s) => !s.isHomeTeam);
  const allOnCourtPlayers = stats.filter((s) => s.isOnCourt);

  // Game status helpers
  const isActive = game?.status === "active";
  const isPaused = game?.status === "paused";
  const isCompleted = game?.status === "completed";
  const isScheduled = game?.status === "scheduled";
  const canRecordStats = isActive || isPaused;

  // Game settings
  const gameSettings = (game?.gameSettings ?? {}) as GameSettings;
  const teamStats = liveStats?.teamStats as
    | { home: LiveTeamStats; away: LiveTeamStats }
    | undefined;
  const homeTeamStats = teamStats?.home;
  const awayTeamStats = teamStats?.away;
  const gameFromLiveStats = liveStats?.game as { foulLimit?: number } | undefined;
  const foulLimit = gameFromLiveStats?.foulLimit || gameSettings.foulLimit || 5;

  // Initialize starters with first 5 players
  useEffect(() => {
    if (game?.status === "scheduled" && homeStats.length > 0 && awayStats.length > 0) {
      const settings = (game.gameSettings ?? {}) as GameSettings & {
        startingFive?: {
          homeTeam?: Id<"players">[];
          awayTeam?: Id<"players">[];
          home?: Id<"players">[];
          away?: Id<"players">[];
        };
      };
      const existingStarters = settings.startingFive;

      const homeStartersList = existingStarters?.homeTeam ?? existingStarters?.home;
      const awayStartersList = existingStarters?.awayTeam ?? existingStarters?.away;

      if (homeStartersList && homeStartersList.length > 0) {
        setHomeStarters(homeStartersList as Id<"players">[]);
      } else if (homeStarters.length === 0) {
        setHomeStarters(homeStats.slice(0, 5).map((s) => s.playerId));
      }

      if (awayStartersList && awayStartersList.length > 0) {
        setAwayStarters(awayStartersList as Id<"players">[]);
      } else if (awayStarters.length === 0) {
        setAwayStarters(awayStats.slice(0, 5).map((s) => s.playerId));
      }

      if (settings?.quarterMinutes && quarterMinutes === 12) {
        setQuarterMinutes(settings.quarterMinutes);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status, game?.gameSettings, homeStats.length, awayStats.length]);

  // Handlers
  const handleGameControl = useCallback(
    async (action: "start" | "pause" | "resume" | "stop") => {
      if (!token || !gameId) return;

      try {
        const gameIdTyped = gameId as Id<"games">;
        switch (action) {
          case "start":
            if (game?.status === "scheduled") {
              // Save settings before starting
              const startingFive = {
                homeTeam: homeStarters,
                awayTeam: awayStarters,
              };
              await updateGameSettings({
                token,
                gameId: gameIdTyped,
                quarterMinutes,
                foulLimit: foulLimitSetting,
                startingFive:
                  homeStarters.length > 0 || awayStarters.length > 0 ? startingFive : undefined,
              });
            }
            await startGame({ token, gameId: gameIdTyped });
            break;
          case "pause":
            await pauseGame({ token, gameId: gameIdTyped });
            break;
          case "resume":
            await resumeGame({ token, gameId: gameIdTyped });
            break;
          case "stop":
            setShowEndPeriodConfirm(true);
            return;
        }
      } catch (error) {
        console.error(`Failed to ${action} game:`, error);
      }
    },
    [
      token,
      gameId,
      game?.status,
      homeStarters,
      awayStarters,
      quarterMinutes,
      foulLimitSetting,
      startGame,
      pauseGame,
      resumeGame,
      updateGameSettings,
    ]
  );

  const handleRecordStat = useCallback(
    async (
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
        setActionHistory((prev) => [
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            playerId,
            playerName: playerStat.player?.name || "Unknown",
            playerNumber: playerStat.player?.number || 0,
            statType,
            made,
            timestamp: Date.now(),
          },
          ...prev.slice(0, 19),
        ]);

        // Feedback
        if (statType === "shot2" || statType === "shot3" || statType === "freethrow") {
          if (made) {
            feedback.made();
          } else {
            feedback.missed();
          }
        } else {
          feedback.confirm();
        }

        // Track recent shots
        if (shotLocation && (statType === "shot2" || statType === "shot3")) {
          setRecentShots((prev) => [...prev.slice(-4), { ...shotLocation, made: made || false }]);
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
              scorerTeamId: playerStat.teamId,
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
              shooterPlayerId: playerId,
              shooterTeamId: playerStat.teamId,
              shotType: statType,
              isHomeTeam: playerStat.isHomeTeam,
            });
          }, 500);
        }
      } catch (error) {
        console.error("Failed to record stat:", error);
      }
    },
    [token, gameId, stats, recordStat, feedback]
  );

  const handleUndo = useCallback(
    async (action: ActionHistoryItem) => {
      if (!token || !gameId) return;

      try {
        await undoStat({
          token,
          gameId: gameId as Id<"games">,
          playerId: action.playerId,
          statType: action.statType,
          wasMade: action.made,
        });
        setActionHistory((prev) => prev.filter((a) => a.id !== action.id));
      } catch (error) {
        console.error("Failed to undo stat:", error);
      }
    },
    [token, gameId, undoStat]
  );

  const handleQuarterChange = useCallback(
    async (quarter: number) => {
      if (!token || !gameId) return;

      try {
        await setQuarter({
          token,
          gameId: gameId as Id<"games">,
          quarter,
          resetTime: true,
        });
        setShowQuarterSelector(false);
      } catch (error) {
        console.error("Failed to change quarter:", error);
      }
    },
    [token, gameId, setQuarter]
  );

  const handleEndPeriod = useCallback(async () => {
    if (!token || !gameId || !game) return;

    try {
      const currentQ = game.currentQuarter;

      if (currentQ >= 4) {
        if (game.homeScore === game.awayScore) {
          setShowEndPeriodConfirm(false);
          setShowOvertimePrompt(true);
          return;
        }
        await endGame({
          token,
          gameId: gameId as Id<"games">,
          forceEnd: true,
        });
      } else {
        await pauseGame({ token, gameId: gameId as Id<"games"> });
        await setQuarter({
          token,
          gameId: gameId as Id<"games">,
          quarter: currentQ + 1,
        });
      }
      setShowEndPeriodConfirm(false);
    } catch (error) {
      console.error("Failed to end period:", error);
    }
  }, [token, gameId, game, endGame, pauseGame, setQuarter]);

  const handleSwapSubstitute = useCallback(
    async (playerOutId: Id<"players">, playerInId: Id<"players">) => {
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
        alert((error as Error).message || "Failed to swap players");
      }
    },
    [token, gameId, swapSubstituteMutation]
  );

  const handlePlayerRebound = useCallback(
    async (playerId: Id<"players">, type: "offensive" | "defensive") => {
      if (!token || !gameId) return;

      try {
        const statType = type === "offensive" ? "offensiveRebound" : "defensiveRebound";
        await recordStat({
          token,
          gameId: gameId as Id<"games">,
          playerId,
          statType,
        });
        setPendingRebound(null);
      } catch (error) {
        console.error("Failed to record rebound:", error);
      }
    },
    [token, gameId, recordStat]
  );

  const handleTeamRebound = useCallback(
    async (teamId: Id<"teams">, type: "offensive" | "defensive") => {
      if (!token || !gameId) return;

      try {
        await recordTeamReboundMutation({
          token,
          gameId: gameId as Id<"games">,
          teamId,
          reboundType: type,
        });
        setPendingRebound(null);
      } catch (error) {
        console.error("Failed to record team rebound:", error);
      }
    },
    [token, gameId, recordTeamReboundMutation]
  );

  const handleAssist = useCallback(
    async (assisterId: Id<"players">) => {
      if (!token || !gameId) return;

      try {
        await recordStat({
          token,
          gameId: gameId as Id<"games">,
          playerId: assisterId,
          statType: "assist",
        });

        const assister = stats.find((s) => s.playerId === assisterId);
        if (assister) {
          setActionHistory((prev) => [
            {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              playerId: assisterId,
              playerName: assister.player?.name || "Unknown",
              playerNumber: assister.player?.number || 0,
              statType: "assist",
              timestamp: Date.now(),
            },
            ...prev.slice(0, 19),
          ]);
        }

        setPendingAssist(null);
      } catch (error) {
        console.error("Failed to record assist:", error);
      }
    },
    [token, gameId, stats, recordStat]
  );

  const handleQuickStatFromModal = useCallback(
    (playerId: Id<"players">) => {
      if (!pendingQuickStat) return;

      if (pendingQuickStat === "foul") {
        const playerStat = stats.find((s) => s.playerId === playerId);
        if (playerStat) {
          setPendingFoul(playerStat);
        }
        setPendingQuickStat(null);
        return;
      }

      const made = pendingQuickStat === "freethrow" ? true : undefined;
      handleRecordStat(playerId, pendingQuickStat, made);
      setPendingQuickStat(null);
    },
    [pendingQuickStat, stats, handleRecordStat]
  );

  const handleRecordFoulWithContext = useCallback(
    async (
      playerId: Id<"players">,
      foulType: FoulType,
      options?: { wasAndOne?: boolean; shotType?: "2pt" | "3pt"; fouledPlayerId?: Id<"players"> }
    ) => {
      if (!token || !gameId) return;

      try {
        const result = await recordFoulWithContextMutation({
          token,
          gameId: gameId as Id<"games">,
          playerId,
          foulType,
          wasAndOne: options?.wasAndOne,
          shotType: options?.shotType,
          fouledPlayerId: options?.fouledPlayerId,
        });

        const playerStat = stats.find((s) => s.playerId === playerId);
        if (playerStat) {
          setActionHistory((prev) => [
            {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              playerId,
              playerName: playerStat.player?.name || "Unknown",
              playerNumber: playerStat.player?.number || 0,
              statType: "foul",
              timestamp: Date.now(),
            },
            ...prev.slice(0, 19),
          ]);
        }

        setPendingFoul(null);

        if (result.playerFouledOut) {
          feedback.foulOut();
        } else {
          feedback.foul();
        }

        if (result.freeThrowsAwarded > 0) {
          let shooterId = playerId;
          let shooterName = playerStat?.player?.name || "Unknown";
          let shooterNumber = playerStat?.player?.number || 0;

          if (foulType === "shooting" && options?.fouledPlayerId) {
            shooterId = options.fouledPlayerId;
            const shooter = stats.find((s) => s.playerId === options.fouledPlayerId);
            if (shooter) {
              shooterName = shooter.player?.name || "Unknown";
              shooterNumber = shooter.player?.number || 0;
            }
          } else if (foulType === "personal" && result.inBonus) {
            const foulerTeam = stats.find((s) => s.playerId === playerId)?.teamId;
            const otherTeamOnCourt = stats.filter((s) => s.teamId !== foulerTeam && s.isOnCourt);
            if (otherTeamOnCourt.length > 0) {
              const shooter = otherTeamOnCourt[0];
              shooterId = shooter.playerId;
              shooterName = shooter.player?.name || "Unknown";
              shooterNumber = shooter.player?.number || 0;
            }
          }

          const isOneAndOne =
            result.bonusMode === "college" && result.inBonus && !result.inDoubleBonus;

          setFreeThrowSequence({
            playerId: shooterId,
            playerName: shooterName,
            playerNumber: shooterNumber,
            totalAttempts: result.freeThrowsAwarded,
            currentAttempt: 1,
            isOneAndOne,
            results: [],
          });
        }

        return result;
      } catch (error) {
        console.error("Failed to record foul:", error);
      }
    },
    [token, gameId, stats, recordFoulWithContextMutation, feedback]
  );

  const handleFreeThrowResult = useCallback(
    async (made: boolean) => {
      if (!token || !gameId || !freeThrowSequence) return;

      try {
        const result = await recordFreeThrowMutation({
          token,
          gameId: gameId as Id<"games">,
          playerId: freeThrowSequence.playerId,
          made,
          attemptNumber: freeThrowSequence.currentAttempt,
          totalAttempts: freeThrowSequence.totalAttempts,
          isOneAndOne: freeThrowSequence.isOneAndOne,
        });

        const newResults = [...freeThrowSequence.results, made];

        if (result.sequenceContinues && result.nextAttemptNumber) {
          setFreeThrowSequence({
            ...freeThrowSequence,
            currentAttempt: result.nextAttemptNumber,
            results: newResults,
          });
        } else {
          setFreeThrowSequence(null);

          if (!made) {
            const shooter = stats.find((s) => s.playerId === freeThrowSequence.playerId);
            if (shooter) {
              setPendingRebound({
                shooterPlayerId: freeThrowSequence.playerId,
                shooterTeamId: shooter.teamId,
                shotType: "freethrow",
                isHomeTeam: shooter.isHomeTeam,
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to record free throw:", error);
      }
    },
    [token, gameId, freeThrowSequence, stats, recordFreeThrowMutation]
  );

  const handleTimeout = useCallback(
    async (teamId: Id<"teams">) => {
      if (!token || !gameId) return;

      try {
        await recordTimeoutMutation({
          token,
          gameId: gameId as Id<"games">,
          teamId,
        });
        feedback.timeout();
      } catch (error) {
        console.error("Failed to record timeout:", error);
        feedback.error();
        alert((error as Error).message || "Failed to record timeout");
      }
    },
    [token, gameId, recordTimeoutMutation, feedback]
  );

  const handleStartOvertime = useCallback(async () => {
    if (!token || !gameId) return;

    try {
      await startOvertimeMutation({
        token,
        gameId: gameId as Id<"games">,
      });
      feedback.overtime();
      setShowOvertimePrompt(false);
    } catch (error) {
      console.error("Failed to start overtime:", error);
      feedback.error();
    }
  }, [token, gameId, startOvertimeMutation, feedback]);

  const handleEndAsTie = useCallback(async () => {
    if (!token || !gameId) return;

    try {
      await endGame({
        token,
        gameId: gameId as Id<"games">,
        forceEnd: true,
      });
      setShowOvertimePrompt(false);
    } catch (error) {
      console.error("Failed to end game:", error);
    }
  }, [token, gameId, endGame]);

  const toggleStarter = useCallback(
    (playerId: Id<"players">, isHomeTeam: boolean) => {
      const setStarters = isHomeTeam ? setHomeStarters : setAwayStarters;
      const starters = isHomeTeam ? homeStarters : awayStarters;

      if (starters.includes(playerId)) {
        setStarters(starters.filter((id) => id !== playerId));
      } else if (starters.length < 5) {
        setStarters([...starters, playerId]);
      }
    },
    [homeStarters, awayStarters]
  );

  return {
    // State
    activeTab,
    setActiveTab,
    pendingShot,
    setPendingShot,
    recentShots,
    actionHistory,
    showQuarterSelector,
    setShowQuarterSelector,
    showEndPeriodConfirm,
    setShowEndPeriodConfirm,
    showActionHistory,
    setShowActionHistory,
    quarterMinutes,
    setQuarterMinutes,
    foulLimitSetting,
    setFoulLimitSetting,
    homeStarters,
    awayStarters,
    pendingRebound,
    setPendingRebound,
    pendingAssist,
    setPendingAssist,
    pendingQuickStat,
    setPendingQuickStat,
    pendingFoul,
    setPendingFoul,
    freeThrowSequence,
    setFreeThrowSequence,
    showOvertimePrompt,
    setShowOvertimePrompt,
    showHomeStatsSummary,
    setShowHomeStatsSummary,
    showAwayStatsSummary,
    setShowAwayStatsSummary,
    swappingPlayer,
    setSwappingPlayer,

    // Data
    gameData,
    liveStats,
    gameEvents,
    game,
    stats,
    homeStats,
    awayStats,
    allOnCourtPlayers,
    homeTeamStats,
    awayTeamStats,
    gameSettings,
    foulLimit,

    // Status flags
    isActive,
    isPaused,
    isCompleted,
    isScheduled,
    canRecordStats,

    // Handlers
    handleGameControl,
    handleRecordStat,
    handleUndo,
    handleQuarterChange,
    handleEndPeriod,
    handleSwapSubstitute,
    handlePlayerRebound,
    handleTeamRebound,
    handleAssist,
    handleQuickStatFromModal,
    handleRecordFoulWithContext,
    handleFreeThrowResult,
    handleTimeout,
    handleStartOvertime,
    handleEndAsTie,
    toggleStarter,
  };
}
