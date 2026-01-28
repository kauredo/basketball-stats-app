import type { Id } from "../../../../convex/_generated/dataModel";

// ============================================================================
// Stat Types
// ============================================================================

export type StatType =
  | "shot2"
  | "shot3"
  | "freethrow"
  | "rebound"
  | "assist"
  | "steal"
  | "block"
  | "turnover"
  | "foul";

export type FoulType =
  | "personal"
  | "shooting"
  | "offensive"
  | "technical"
  | "flagrant1"
  | "flagrant2";

export type TurnoverType =
  | "bad_pass"
  | "lost_ball"
  | "travel"
  | "double_dribble"
  | "offensive_foul"
  | "out_of_bounds"
  | "shot_clock_violation"
  | "other";

export type GameMode = "court" | "clock" | "stats" | "subs" | "plays";

export type GameStatus = "scheduled" | "active" | "paused" | "completed";

// ============================================================================
// Player & Team Types
// ============================================================================

export interface PlayerStat {
  id: Id<"playerStats">;
  playerId: Id<"players">;
  teamId: Id<"teams">;
  player: {
    number: number;
    name: string;
    position?: string;
  } | null;
  points: number;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fouledOut: boolean;
  isOnCourt: boolean;
  isHomeTeam: boolean;
  // Advanced stats (calculated)
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  threePointersMade?: number;
  threePointersAttempted?: number;
  freeThrowsMade?: number;
  freeThrowsAttempted?: number;
  plusMinus?: number;
  minutesPlayed?: number;
}

export interface TeamStatsData {
  offensiveRebounds: number;
  defensiveRebounds: number;
  teamFouls: number;
  foulsThisQuarter: number;
  foulsByQuarter: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    ot: number;
  };
  timeoutsRemaining: number;
  inBonus: boolean;
  inDoubleBonus: boolean;
}

export interface GameData {
  _id: Id<"games">;
  status: GameStatus;
  currentQuarter: number;
  timeRemainingSeconds: number;
  homeScore: number;
  awayScore: number;
  homeTeam?: { _id: Id<"teams">; name: string } | null;
  awayTeam?: { _id: Id<"teams">; name: string } | null;
}

// ============================================================================
// Shot & Court Types
// ============================================================================

export interface ShotLocation {
  id?: string;
  x: number;
  y: number;
  made: boolean;
  playerId?: Id<"players">;
  is3pt?: boolean;
}

export interface PendingShot {
  x: number;
  y: number;
  is3pt: boolean;
  zoneName: string;
}

export type ShotZone =
  | "at_rim"
  | "paint"
  | "left_elbow"
  | "right_elbow"
  | "free_throw_line"
  | "mid_range"
  | "left_corner_3"
  | "right_corner_3"
  | "left_wing_3"
  | "right_wing_3"
  | "top_key_3";

// ============================================================================
// Action History & Undo
// ============================================================================

export interface ActionHistoryItem {
  id: string;
  playerId: Id<"players">;
  playerName: string;
  playerNumber: number;
  statType: StatType;
  made?: boolean;
  timestamp: number;
  teamId?: Id<"teams">;
}

export interface LastAction {
  playerId: Id<"players">;
  playerNumber: number;
  playerName: string;
  statType: string;
  wasMade?: boolean;
  displayText: string;
  timestamp: number;
}

// ============================================================================
// Free Throw Sequence
// ============================================================================

export interface FreeThrowSequence {
  playerId: Id<"players">;
  playerName: string;
  playerNumber: number;
  totalAttempts: number;
  currentAttempt: number;
  isOneAndOne: boolean;
  results: boolean[];
}

// ============================================================================
// Pending Actions (Modal State)
// ============================================================================

export interface PendingRebound {
  shooterTeamId: Id<"teams">;
  isHomeTeam: boolean;
  shotType: StatType;
}

export interface PendingAssist {
  scorerPlayerId: Id<"players">;
  scorerName: string;
  scorerNumber: number;
  shotType: string;
  points: number;
  isHomeTeam: boolean;
}

export type ModalType =
  | "shot"
  | "assist"
  | "rebound"
  | "foul"
  | "freethrow"
  | "quickstat"
  | "turnover"
  | "overtime"
  | "endperiod";

// ============================================================================
// UI State
// ============================================================================

export interface LiveGameUIState {
  activeMode: GameMode;
  selectedPlayer: Id<"players"> | null;
  swappingPlayer: Id<"players"> | null;
  pendingShot: PendingShot | null;
  pendingRebound: PendingRebound | null;
  pendingAssist: PendingAssist | null;
  pendingQuickStat: StatType | null;
  pendingFoul: PlayerStat | null;
  freeThrowSequence: FreeThrowSequence | null;
  showQuarterSelector: boolean;
  showActionHistory: boolean;
  showOvertimePrompt: boolean;
  showEndPeriodConfirm: boolean;
  heatMapVisible: boolean;
  recentShots: ShotLocation[];
}

// ============================================================================
// Clock State
// ============================================================================

export interface GameClockState {
  displayTime: string;
  seconds: number;
  isRunning: boolean;
  quarter: number;
  quarterDuration: number;
}

export interface ShotClockState {
  seconds: number;
  isRunning: boolean;
  isWarning: boolean; // Under 5 seconds
  isViolation: boolean; // Reached 0
}

// ============================================================================
// Tracking & Analytics
// ============================================================================

export interface LineupEntry {
  players: Id<"players">[];
  plusMinus: number;
  minutesPlayed: number;
  pointsScored: number;
  pointsAllowed: number;
}

export interface PossessionStats {
  totalPossessions: { home: number; away: number };
  pointsPerPossession: { home: number; away: number };
  pace: number;
}

export interface MomentumState {
  currentRun: { team: "home" | "away" | null; points: number };
  lastScoringDrought: { team: "home" | "away"; seconds: number } | null;
  largestLead: { home: number; away: number };
  leadChanges: number;
  tieCount: number;
}

// ============================================================================
// Play-by-Play
// ============================================================================

export interface PlayByPlayEvent {
  _id: string;
  quarter: number;
  timeRemaining: number;
  eventType: string;
  description: string;
  playerId?: Id<"players">;
  teamId?: Id<"teams">;
  points?: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// Game Settings
// ============================================================================

// Score by period stored as object with period keys (q1, q2, q3, q4, ot1, ot2, etc.)
export interface ScoreByPeriod {
  [periodKey: string]: {
    home: number;
    away: number;
  };
}

export interface GameSettings {
  quarterMinutes: number;
  foulLimit: 5 | 6;
  timeoutsPerTeam: number;
  scoreByPeriod?: ScoreByPeriod;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ScoreboardProps {
  game: GameData;
  homeTeamStats: TeamStatsData;
  awayTeamStats: TeamStatsData;
  timeoutsPerTeam: number;
  onGameControl: (action: "start" | "pause" | "resume" | "end" | "reactivate") => void;
  onTimeoutHome?: () => void;
  onTimeoutAway?: () => void;
  onQuarterChange?: (quarter: number) => void;
  shotClockSeconds?: number;
  showShotClock?: boolean;
}

export interface InteractiveCourtProps {
  onCourtClick: (x: number, y: number, is3pt: boolean, zoneName: string) => void;
  disabled?: boolean;
  recentShots: ShotLocation[];
  showHeatMap?: boolean;
  allShots?: ShotLocation[];
}

export interface QuickUndoFABProps {
  action: LastAction | null;
  onUndo: (action: LastAction) => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export interface ActiveLineupPanelProps {
  teamName: string;
  teamId: Id<"teams">;
  players: PlayerStat[];
  foulLimit: number;
  onPlayerSelect: (playerId: Id<"players">) => void;
  onSwap: (playerOut: Id<"players">, playerIn: Id<"players">) => void;
  swappingPlayer: Id<"players"> | null;
  onStartSwap: (playerId: Id<"players">) => void;
  onCancelSwap: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export interface QuickStatButtonGridProps {
  onStatSelect: (statType: StatType) => void;
  disabled?: boolean;
}

// ============================================================================
// Context Types
// ============================================================================

export interface LiveGameContextValue {
  // State
  uiState: LiveGameUIState;
  gameData: GameData | null;
  homeStats: PlayerStat[];
  awayStats: PlayerStat[];
  homeTeamStats: TeamStatsData;
  awayTeamStats: TeamStatsData;
  actionHistory: ActionHistoryItem[];
  gameSettings: GameSettings;

  // Actions
  setActiveMode: (mode: GameMode) => void;
  setSelectedPlayer: (playerId: Id<"players"> | null) => void;
  setPendingShot: (shot: PendingShot | null) => void;
  setPendingRebound: (rebound: PendingRebound | null) => void;
  setPendingAssist: (assist: PendingAssist | null) => void;
  setPendingQuickStat: (statType: StatType | null) => void;
  setPendingFoul: (player: PlayerStat | null) => void;
  setFreeThrowSequence: (sequence: FreeThrowSequence | null) => void;
  setSwappingPlayer: (playerId: Id<"players"> | null) => void;
  toggleHeatMap: () => void;
  addRecentShot: (shot: ShotLocation) => void;

  // Computed
  allOnCourtPlayers: PlayerStat[];
  homeOnCourt: PlayerStat[];
  awayOnCourt: PlayerStat[];
  canRecordStats: boolean;
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
}

// ============================================================================
// Stat Labels & Config
// ============================================================================

export const STAT_TYPE_LABELS: Record<string, string> = {
  shot2: "2PT",
  shot3: "3PT",
  freethrow: "FT",
  rebound: "REB",
  offensiveRebound: "OREB",
  defensiveRebound: "DREB",
  assist: "AST",
  steal: "STL",
  block: "BLK",
  turnover: "TO",
  foul: "FOUL",
};

export const STAT_BUTTON_CONFIG = {
  scoring: [
    { key: "shot2", label: "2PT", shortLabel: "2", color: "orange" },
    { key: "shot3", label: "3PT", shortLabel: "3", color: "purple" },
    { key: "freethrow", label: "FT", shortLabel: "FT", color: "green" },
  ],
  playmaking: [{ key: "assist", label: "Assist", shortLabel: "AST", color: "purple" }],
  defense: [
    { key: "steal", label: "Steal", shortLabel: "STL", color: "cyan" },
    { key: "block", label: "Block", shortLabel: "BLK", color: "cyan" },
  ],
  rebounding: [{ key: "rebound", label: "Rebound", shortLabel: "REB", color: "blue" }],
  negative: [
    { key: "turnover", label: "Turnover", shortLabel: "TO", color: "amber" },
    { key: "foul", label: "Foul", shortLabel: "FOUL", color: "red" },
  ],
};

export const TURNOVER_TYPE_LABELS: Record<TurnoverType, string> = {
  bad_pass: "Bad Pass",
  lost_ball: "Lost Ball",
  travel: "Travel",
  double_dribble: "Double Dribble",
  offensive_foul: "Offensive Foul",
  out_of_bounds: "Out of Bounds",
  shot_clock_violation: "Shot Clock",
  other: "Other",
};

export const FOUL_TYPE_LABELS: Record<FoulType, string> = {
  personal: "Personal",
  shooting: "Shooting",
  offensive: "Offensive",
  technical: "Technical",
  flagrant1: "Flagrant 1",
  flagrant2: "Flagrant 2",
};
