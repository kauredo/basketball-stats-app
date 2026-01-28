/**
 * Convex Query Return Types
 * Types for data returned from Convex queries, used to properly type
 * callback parameters and array iterations in web/mobile apps.
 */

import type { Position, GameStatus, TeamSummary, LiveTeamStats } from "./index";

// ============================================
// Live Game Types
// ============================================

/**
 * Player stat object returned from getLiveStats query
 * Used in LiveGame.tsx, LiveGameNew.tsx, LiveGameScreen.tsx
 */
export interface LivePlayerStat {
  id: string;
  playerId: string;
  teamId: string;
  gameId: string;
  player: {
    id: string;
    name: string;
    number: number;
    position?: Position;
  } | null;
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  minutesPlayed: number;
  plusMinus: number;
  isOnCourt: boolean;
  isHomeTeam: boolean;
  fouledOut?: boolean;
  // Computed percentages (optional)
  fieldGoalPercentage?: number;
  threePointPercentage?: number;
  freeThrowPercentage?: number;
}

/**
 * Live stats response from getLiveStats query
 */
export interface LiveStatsResponse {
  homeScore: number;
  awayScore: number;
  homePlayers: LivePlayerStat[];
  awayPlayers: LivePlayerStat[];
  teamStats?: {
    home: LiveTeamStats;
    away: LiveTeamStats;
  };
}

// ============================================
// Statistics Page Types
// ============================================

/**
 * Player data for statistics views
 * Used in Statistics.tsx, StatisticsScreen.tsx
 */
export interface StatsPlayerData {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  position?: Position;
  gamesPlayed: number;
  // Totals
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  totalTurnovers: number;
  totalFouls: number;
  totalMinutes: number;
  totalFieldGoalsMade: number;
  totalFieldGoalsAttempted: number;
  totalThreePointersMade: number;
  totalThreePointersAttempted: number;
  totalFreeThrowsMade: number;
  totalFreeThrowsAttempted: number;
  // Averages
  avgPoints: number;
  avgRebounds: number;
  avgAssists: number;
  avgSteals: number;
  avgBlocks: number;
  avgMinutes: number;
  // Percentages
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

/**
 * Team data for statistics views
 * Used in Statistics.tsx, StatisticsScreen.tsx
 */
export interface StatsTeamData {
  teamId: string;
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  // Totals
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  totalTurnovers: number;
  totalFieldGoalsMade: number;
  totalFieldGoalsAttempted: number;
  totalThreePointersMade: number;
  totalThreePointersAttempted: number;
  totalFreeThrowsMade: number;
  totalFreeThrowsAttempted: number;
  // Averages
  avgPoints: number;
  avgRebounds: number;
  avgAssists: number;
  avgPointsAllowed?: number;
  // Percentages
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

/**
 * Response from getPlayerStats query for stats page
 */
export interface PlayerStatsResponse {
  players: StatsPlayerData[];
  statLeaders?: {
    points: StatsPlayerData[];
    rebounds: StatsPlayerData[];
    assists: StatsPlayerData[];
  };
}

/**
 * Response from getTeamStats query for stats page
 */
export interface TeamStatsResponse {
  teams: StatsTeamData[];
}

// ============================================
// Game List Types
// ============================================

/**
 * Game item in games list
 * Used in Games.tsx, GamesScreen.tsx
 */
export interface GameListItem {
  id: string;
  status: GameStatus;
  currentQuarter: number;
  timeRemainingSeconds: number;
  homeScore: number;
  awayScore: number;
  homeTeamId: string;
  awayTeamId: string;
  leagueId: string;
  homeTeam: TeamSummary | null;
  awayTeam: TeamSummary | null;
  scheduledAt?: number;
  startedAt?: number;
  endedAt?: number;
}

// ============================================
// Game Analysis Types
// ============================================

/**
 * Player stat for game analysis/box score view
 * Used in GameAnalysis.tsx, GameAnalysisScreen.tsx
 */
export interface GameAnalysisPlayerStat {
  id: string;
  playerId: string;
  teamId: string;
  player: {
    id: string;
    name: string;
    number: number;
    position?: Position;
  } | null;
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  offensiveRebounds?: number;
  defensiveRebounds?: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  minutesPlayed: number;
  plusMinus: number;
}

/**
 * Game event for play-by-play
 * Returned from getGameEvents query
 */
export interface GameEvent {
  /** Formatted ID from getGameEvents (event._id converted to id) */
  id?: string;
  /** Raw Convex document ID when accessing raw data */
  _id?: string;
  eventType: string;
  quarter: number;
  /** Seconds remaining in quarter */
  gameTime?: number;
  /** Alias for gameTime for backward compatibility */
  timeRemaining?: number;
  /** Formatted time display string */
  gameTimeDisplay?: string;
  timestamp?: number;
  description?: string;
  /** Event-specific data (shot result, foul type, etc.) */
  details?: {
    made?: boolean;
    points?: number;
    shotType?: string;
    foulType?: string;
    homeScore?: number;
    awayScore?: number;
    isHomeTeam?: boolean;
    [key: string]: unknown;
  };
  /** Score info when event was recorded */
  pointsScored?: number;
  playerId?: string;
  teamId?: string;
  player?: {
    id?: string;
    name: string;
    number?: number;
  } | null;
  team?: {
    id?: string;
    name: string;
  } | null;
}

// ============================================
// Export Page Types
// ============================================

/**
 * Shot data for export/shot charts
 * Used in ExportPage.tsx, GameAnalysis.tsx
 * Supports both raw Convex data (_id) and formatted data (id)
 */
export interface ExportShot {
  /** Convex document ID from raw query */
  _id?: string;
  /** Formatted ID or alias */
  id?: string;
  playerId: string;
  gameId: string;
  teamId: string;
  x: number;
  y: number;
  shotType: "2pt" | "3pt" | "ft";
  made: boolean;
  quarter: number;
  timeRemaining?: number;
  /** Shot zone classification */
  zone?: string;
  /** Alias for zone */
  shotZone?: string;
  assisted?: boolean;
  assistedBy?: string;
  /** Player info from joined query */
  player?: {
    name: string;
    number: number;
  } | null;
  /** Player name from getGameShots query */
  playerName?: string;
  /** Player number from getGameShots query */
  playerNumber?: number;
}

// ============================================
// Player Detail Types
// ============================================

/**
 * Player game log entry
 * Used in PlayerDetail.tsx, PlayerDetailScreen.tsx
 */
export interface PlayerGameLogEntry {
  gameId: string;
  date: string;
  opponent: string;
  opponentId?: string;
  homeGame: boolean;
  result: "W" | "L" | "N/A";
  teamScore?: number;
  opponentScore?: number;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  plusMinus: number;
  fieldGoalPercentage?: number;
  threePointPercentage?: number;
  freeThrowPercentage?: number;
}

// ============================================
// Team/Player List Types
// ============================================

/**
 * Team in teams list
 * Used in Teams.tsx, TeamsScreen.tsx
 */
export interface TeamListItem {
  id: string;
  name: string;
  city?: string;
  logoUrl?: string;
  description?: string;
  leagueId: string;
  activePlayersCount?: number;
  wins?: number;
  losses?: number;
}

/**
 * Player in players list
 * Used in Players.tsx, PlayersScreen.tsx
 */
export interface PlayerListItem {
  id: string;
  name: string;
  number: number;
  teamId: string;
  position?: Position;
  active: boolean;
  team?: TeamSummary;
  heightCm?: number;
  weightKg?: number;
}

// ============================================
// Lineup Analysis Types
// ============================================

/**
 * Lineup stats item
 * Used in LineupAnalysis sections
 */
export interface LineupStatsItem {
  players: Array<{ id: string; name: string; number: number }>;
  playerIds: string[];
  teamId?: string;
  minutesPlayed: number;
  pointsScored: number;
  pointsAllowed: number;
  plusMinus: number;
  gamesPlayed: number;
  netRating: number;
}

/**
 * Pair stats item
 * Used in LineupAnalysis sections
 */
export interface PairStatsItem {
  player1: { id: string; name: string; number: number };
  player2: { id: string; name: string; number: number };
  player1Id: string;
  player2Id: string;
  teamId?: string;
  minutesTogether: number;
  plusMinus: number;
  gamesPlayed: number;
  netRating: number;
}

// ============================================
// League Types
// ============================================

/**
 * League membership for current user
 * Used in LeagueSelectionPage.tsx, ProfileScreen.tsx
 */
export interface LeagueMembershipItem {
  id: string;
  leagueId: string;
  userId: string;
  role: string;
  status: string;
  league?: {
    id: string;
    name: string;
    description?: string;
    leagueType: string;
    season: string;
    status: string;
  };
}

// ============================================
// Notification Types
// ============================================

/**
 * Notification item from query
 */
export interface NotificationItem {
  id: string;
  userId: string;
  leagueId?: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: number;
  expiresAt?: number;
}
