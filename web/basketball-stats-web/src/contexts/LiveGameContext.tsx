import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  GameMode,
  PlayerStat,
  TeamStatsData,
  ActionHistoryItem,
  GameSettings,
  PendingShot,
  PendingRebound,
  PendingAssist,
  FreeThrowSequence,
  ShotLocation,
  StatType,
  LiveGameUIState,
  GameData,
} from "../types/livegame";

// ============================================================================
// Context Value Interface
// ============================================================================

interface LiveGameContextValue {
  // UI State
  uiState: LiveGameUIState;

  // Game Data (passed in from parent)
  gameData: GameData | null;
  homeStats: PlayerStat[];
  awayStats: PlayerStat[];
  homeTeamStats: TeamStatsData;
  awayTeamStats: TeamStatsData;
  actionHistory: ActionHistoryItem[];
  gameSettings: GameSettings;

  // UI State Actions
  setActiveMode: (mode: GameMode) => void;
  setSelectedPlayer: (playerId: Id<"players"> | null) => void;
  setPendingShot: (shot: PendingShot | null) => void;
  setPendingRebound: (rebound: PendingRebound | null) => void;
  setPendingAssist: (assist: PendingAssist | null) => void;
  setPendingQuickStat: (statType: StatType | null) => void;
  setPendingFoul: (player: PlayerStat | null) => void;
  setFreeThrowSequence: (sequence: FreeThrowSequence | null) => void;
  setSwappingPlayer: (playerId: Id<"players"> | null) => void;
  setShowQuarterSelector: (show: boolean) => void;
  setShowActionHistory: (show: boolean) => void;
  setShowOvertimePrompt: (show: boolean) => void;
  setShowEndPeriodConfirm: (show: boolean) => void;
  toggleHeatMap: () => void;
  addRecentShot: (shot: ShotLocation) => void;
  clearRecentShots: () => void;

  // Action History
  addToHistory: (item: ActionHistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;

  // Computed Values
  allOnCourtPlayers: PlayerStat[];
  homeOnCourt: PlayerStat[];
  awayOnCourt: PlayerStat[];
  canRecordStats: boolean;
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isScheduled: boolean;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultUIState: LiveGameUIState = {
  activeMode: "court",
  selectedPlayer: null,
  swappingPlayer: null,
  pendingShot: null,
  pendingRebound: null,
  pendingAssist: null,
  pendingQuickStat: null,
  pendingFoul: null,
  freeThrowSequence: null,
  showQuarterSelector: false,
  showActionHistory: false,
  showOvertimePrompt: false,
  showEndPeriodConfirm: false,
  heatMapVisible: false,
  recentShots: [],
};

const defaultTeamStats: TeamStatsData = {
  offensiveRebounds: 0,
  defensiveRebounds: 0,
  teamFouls: 0,
  foulsThisQuarter: 0,
  foulsByQuarter: { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 },
  timeoutsRemaining: 4,
  inBonus: false,
  inDoubleBonus: false,
};

const defaultGameSettings: GameSettings = {
  quarterMinutes: 12,
  foulLimit: 5,
  timeoutsPerTeam: 4,
};

// ============================================================================
// Context
// ============================================================================

const LiveGameContext = createContext<LiveGameContextValue | null>(null);

// ============================================================================
// Provider Props
// ============================================================================

interface LiveGameProviderProps {
  children: React.ReactNode;
  gameData: GameData | null;
  homeStats: PlayerStat[];
  awayStats: PlayerStat[];
  homeTeamStats?: TeamStatsData;
  awayTeamStats?: TeamStatsData;
  gameSettings?: GameSettings;
}

// ============================================================================
// Provider Component
// ============================================================================

export function LiveGameProvider({
  children,
  gameData,
  homeStats,
  awayStats,
  homeTeamStats = defaultTeamStats,
  awayTeamStats = defaultTeamStats,
  gameSettings = defaultGameSettings,
}: LiveGameProviderProps) {
  // UI State
  const [uiState, setUIState] = useState<LiveGameUIState>(defaultUIState);
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);

  // UI State Setters
  const setActiveMode = useCallback((mode: GameMode) => {
    setUIState((prev) => ({ ...prev, activeMode: mode }));
  }, []);

  const setSelectedPlayer = useCallback((playerId: Id<"players"> | null) => {
    setUIState((prev) => ({ ...prev, selectedPlayer: playerId }));
  }, []);

  const setPendingShot = useCallback((shot: PendingShot | null) => {
    setUIState((prev) => ({ ...prev, pendingShot: shot }));
  }, []);

  const setPendingRebound = useCallback((rebound: PendingRebound | null) => {
    setUIState((prev) => ({ ...prev, pendingRebound: rebound }));
  }, []);

  const setPendingAssist = useCallback((assist: PendingAssist | null) => {
    setUIState((prev) => ({ ...prev, pendingAssist: assist }));
  }, []);

  const setPendingQuickStat = useCallback((statType: StatType | null) => {
    setUIState((prev) => ({ ...prev, pendingQuickStat: statType }));
  }, []);

  const setPendingFoul = useCallback((player: PlayerStat | null) => {
    setUIState((prev) => ({ ...prev, pendingFoul: player }));
  }, []);

  const setFreeThrowSequence = useCallback((sequence: FreeThrowSequence | null) => {
    setUIState((prev) => ({ ...prev, freeThrowSequence: sequence }));
  }, []);

  const setSwappingPlayer = useCallback((playerId: Id<"players"> | null) => {
    setUIState((prev) => ({ ...prev, swappingPlayer: playerId }));
  }, []);

  const setShowQuarterSelector = useCallback((show: boolean) => {
    setUIState((prev) => ({ ...prev, showQuarterSelector: show }));
  }, []);

  const setShowActionHistory = useCallback((show: boolean) => {
    setUIState((prev) => ({ ...prev, showActionHistory: show }));
  }, []);

  const setShowOvertimePrompt = useCallback((show: boolean) => {
    setUIState((prev) => ({ ...prev, showOvertimePrompt: show }));
  }, []);

  const setShowEndPeriodConfirm = useCallback((show: boolean) => {
    setUIState((prev) => ({ ...prev, showEndPeriodConfirm: show }));
  }, []);

  const toggleHeatMap = useCallback(() => {
    setUIState((prev) => ({ ...prev, heatMapVisible: !prev.heatMapVisible }));
  }, []);

  const addRecentShot = useCallback((shot: ShotLocation) => {
    setUIState((prev) => ({
      ...prev,
      recentShots: [...prev.recentShots.slice(-9), shot], // Keep last 10
    }));
  }, []);

  const clearRecentShots = useCallback(() => {
    setUIState((prev) => ({ ...prev, recentShots: [] }));
  }, []);

  // Action History Management
  const addToHistory = useCallback((item: ActionHistoryItem) => {
    setActionHistory((prev) => [item, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setActionHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setActionHistory([]);
  }, []);

  // Computed Values
  const homeOnCourt = useMemo(
    () => homeStats.filter((p) => p.isOnCourt),
    [homeStats]
  );

  const awayOnCourt = useMemo(
    () => awayStats.filter((p) => p.isOnCourt),
    [awayStats]
  );

  const allOnCourtPlayers = useMemo(
    () => [...homeOnCourt, ...awayOnCourt],
    [homeOnCourt, awayOnCourt]
  );

  const isActive = gameData?.status === "active";
  const isPaused = gameData?.status === "paused";
  const isCompleted = gameData?.status === "completed";
  const isScheduled = gameData?.status === "scheduled";
  const canRecordStats = isActive || isPaused;

  // Context Value
  const value = useMemo<LiveGameContextValue>(
    () => ({
      // State
      uiState,
      gameData,
      homeStats,
      awayStats,
      homeTeamStats,
      awayTeamStats,
      actionHistory,
      gameSettings,

      // UI State Actions
      setActiveMode,
      setSelectedPlayer,
      setPendingShot,
      setPendingRebound,
      setPendingAssist,
      setPendingQuickStat,
      setPendingFoul,
      setFreeThrowSequence,
      setSwappingPlayer,
      setShowQuarterSelector,
      setShowActionHistory,
      setShowOvertimePrompt,
      setShowEndPeriodConfirm,
      toggleHeatMap,
      addRecentShot,
      clearRecentShots,

      // Action History
      addToHistory,
      removeFromHistory,
      clearHistory,

      // Computed
      allOnCourtPlayers,
      homeOnCourt,
      awayOnCourt,
      canRecordStats,
      isActive,
      isPaused,
      isCompleted,
      isScheduled,
    }),
    [
      uiState,
      gameData,
      homeStats,
      awayStats,
      homeTeamStats,
      awayTeamStats,
      actionHistory,
      gameSettings,
      setActiveMode,
      setSelectedPlayer,
      setPendingShot,
      setPendingRebound,
      setPendingAssist,
      setPendingQuickStat,
      setPendingFoul,
      setFreeThrowSequence,
      setSwappingPlayer,
      setShowQuarterSelector,
      setShowActionHistory,
      setShowOvertimePrompt,
      setShowEndPeriodConfirm,
      toggleHeatMap,
      addRecentShot,
      clearRecentShots,
      addToHistory,
      removeFromHistory,
      clearHistory,
      allOnCourtPlayers,
      homeOnCourt,
      awayOnCourt,
      canRecordStats,
      isActive,
      isPaused,
      isCompleted,
      isScheduled,
    ]
  );

  return (
    <LiveGameContext.Provider value={value}>
      {children}
    </LiveGameContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useLiveGame(): LiveGameContextValue {
  const context = useContext(LiveGameContext);
  if (!context) {
    throw new Error("useLiveGame must be used within a LiveGameProvider");
  }
  return context;
}

export default LiveGameContext;
