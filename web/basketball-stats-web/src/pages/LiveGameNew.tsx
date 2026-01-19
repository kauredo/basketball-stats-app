import React, { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { getShotZone } from "@basketball-stats/shared";

// Import all new modular components
import {
  LiveGameLayout,
  EnhancedScoreboard,
  ModeTabNavigation,
  ShotRecordingModal,
  AssistPromptModal,
  ReboundPromptModal,
  QuickStatModal,
  FoulRecordingModal,
  FreeThrowSequenceModal,
  QuickUndoFAB,
  CourtModeContent,
  StatsModeContent,
  PlaysModeContent,
  LineupsModeContent,
} from "../components/livegame";
import { ClockModeContent } from "../components/livegame/ClockModeContent";

// Import types
import {
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

// Import hooks
import { useFeedback } from "../hooks/livegame/useFeedback";
import { useGameClock } from "../hooks/livegame/useGameClock";

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
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [recentShots, setRecentShots] = useState<ShotLocation[]>([]);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [shotClockSeconds, setShotClockSeconds] = useState(24);

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

  // Convex mutations
  const startGame = useMutation(api.games.start);
  const pauseGame = useMutation(api.games.pause);
  const resumeGame = useMutation(api.games.resume);
  const endGame = useMutation(api.games.end);
  const recordStat = useMutation(api.stats.recordStat);
  const undoStat = useMutation(api.stats.undoStat);
  const swapSubstituteMutation = useMutation(api.stats.swapSubstitute);
  const substituteMutation = useMutation(api.stats.substitute);
  const recordTeamReboundMutation = useMutation(api.stats.recordTeamRebound);
  const setQuarter = useMutation(api.games.setQuarter);
  const recordFoulWithContextMutation = useMutation(api.stats.recordFoulWithContext);
  const recordFreeThrowMutation = useMutation(api.stats.recordFreeThrow);
  const recordTimeoutMutation = useMutation(api.games.recordTimeout);
  const startOvertimeMutation = useMutation(api.games.startOvertime);
  const recordShotMutation = useMutation(api.shots.recordShot);

  // Hooks
  const feedback = useFeedback();

  // Derived data
  const game = gameData?.game;
  const stats = (liveStats?.stats || []) as PlayerStat[];
  const homeStats = stats.filter((s) => s.isHomeTeam);
  const awayStats = stats.filter((s) => !s.isHomeTeam);

  const homeOnCourt = homeStats.filter((p) => p.isOnCourt && !p.fouledOut);
  const awayOnCourt = awayStats.filter((p) => p.isOnCourt && !p.fouledOut);
  const allOnCourtPlayers = [...homeOnCourt, ...awayOnCourt];

  const gameSettings = (game?.gameSettings as any) || {};
  const foulLimit = gameSettings.foulLimit || 5;
  const timeoutsPerTeam = gameSettings.timeoutsPerTeam || 4;

  const homeTeamStats: TeamStatsData = (liveStats?.teamStats as any)?.home || {
    offensiveRebounds: 0,
    defensiveRebounds: 0,
    teamFouls: 0,
    foulsThisQuarter: 0,
    foulsByQuarter: { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 },
    timeoutsRemaining: timeoutsPerTeam,
    inBonus: false,
    inDoubleBonus: false,
  };

  const awayTeamStats: TeamStatsData = (liveStats?.teamStats as any)?.away || {
    offensiveRebounds: 0,
    defensiveRebounds: 0,
    teamFouls: 0,
    foulsThisQuarter: 0,
    foulsByQuarter: { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 },
    timeoutsRemaining: timeoutsPerTeam,
    inBonus: false,
    inDoubleBonus: false,
  };

  const isActive = game?.status === "active";
  const isPaused = game?.status === "paused";
  const isCompleted = game?.status === "completed";
  const canRecordStats = isActive || isPaused;

  // Transform persisted shots to ShotLocation format for heat maps
  const persistedShots: ShotLocation[] = (gameShotsData?.shots || []).map((shot) => ({
    x: shot.x,
    y: shot.y,
    made: shot.made,
    playerId: shot.playerId as Id<"players">,
    is3pt: shot.shotType === "3pt",
  }));

  // Game clock (for optional local countdown)
  const gameClock = useGameClock({
    initialSeconds: game?.timeRemainingSeconds || 0,
    quarterDuration: (gameSettings.quarterMinutes || 12) * 60,
  });

  // Handlers
  const handleGameControl = async (action: "start" | "pause" | "resume" | "end") => {
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
          { ...shotLocation, made: made || false, playerId, is3pt },
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
    setShotClockSeconds(seconds);
  };

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
      setShotClockSeconds(24);
    } catch (error) {
      console.error("Failed to end period:", error);
    }
  };

  // Loading state
  if (!game) {
    return (
      <div className="h-dvh flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  // Format events for PlaysModeContent
  const formattedEvents: PlayByPlayEvent[] = (gameEvents?.events || []).map((e: any) => ({
    _id: e.id || e._id,
    quarter: e.quarter,
    timeRemaining: e.timeRemaining || 0,
    eventType: e.eventType,
    description: e.description,
    playerId: e.player?.id,
    teamId: e.team?.id,
    points: e.points,
  }));

  return (
    <LiveGameLayout
      // Scoreboard props
      game={{
        status: game.status as any,
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
          homeScoresByQuarter={gameSettings.scoreByPeriod?.home || []}
          awayScoresByQuarter={gameSettings.scoreByPeriod?.away || []}
        />
      )}

      {/* Plays Mode */}
      {activeMode === "plays" && (
        <PlaysModeContent
          events={formattedEvents}
          homeTeamId={game.homeTeam?.id as Id<"teams">}
          currentQuarter={game.currentQuarter}
        />
      )}

      {/* Lineups Mode */}
      {activeMode === "lineups" && (
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
          shotClockSeconds={shotClockSeconds}
          currentQuarter={game.currentQuarter}
          status={game.status as "scheduled" | "active" | "paused" | "completed"}
          isOvertime={game.currentQuarter > 4}
          homeScore={game.homeScore}
          awayScore={game.awayScore}
          homeTeamName={game.homeTeam?.name || "Home"}
          awayTeamName={game.awayTeam?.name || "Away"}
          homeTimeoutsRemaining={homeTeamStats.timeoutsRemaining}
          awayTimeoutsRemaining={awayTeamStats.timeoutsRemaining}
          onGameControl={handleGameControl}
          onTimeoutHome={handleTimeoutHome}
          onTimeoutAway={handleTimeoutAway}
          onResetShotClock={handleResetShotClock}
          onEndPeriod={handleEndPeriod}
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
      />

      <QuickStatModal
        isOpen={!!pendingQuickStat}
        onClose={() => setPendingQuickStat(null)}
        onRecord={handleQuickStatFromModal}
        statType={pendingQuickStat}
        onCourtPlayers={allOnCourtPlayers}
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
    </LiveGameLayout>
  );
};

export default LiveGameNew;
