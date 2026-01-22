// Shared types for Basketball Stats App
// Compatible with Convex backend - uses camelCase

// ============================================
// Authentication & User Types
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  confirmedAt?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName: string;
  lastName: string;
}

// ============================================
// League Types
// ============================================

export interface LeagueSettings {
  quarterMinutes?: number;
  foulLimit?: number;
  timeoutsPerTeam?: number;
  overtimeMinutes?: number;
  bonusMode?: "college" | "nba";
  playersPerRoster?: number;
  trackAdvancedStats?: boolean;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  leagueType: LeagueType;
  season: string;
  status: LeagueStatus;
  isPublic: boolean;
  ownerId: string;
  createdById: string;
  inviteCode?: string;
  settings?: LeagueSettings;
  teamsCount?: number;
  membersCount?: number;
  gamesCount?: number;
  role?: LeagueRole; // User's role in this league
  createdAt?: number;
}

export interface LeagueMembership {
  id: string;
  userId: string;
  leagueId: string;
  role: LeagueRole;
  status: MembershipStatus;
  joinedAt?: number;
}

// ============================================
// Team Types
// ============================================

export interface Team {
  id: string;
  name: string;
  city?: string;
  logoUrl?: string;
  description?: string;
  leagueId: string;
  activePlayersCount?: number;
  players?: Player[];
}

export interface TeamSummary {
  id: string;
  name: string;
  city?: string;
  logoUrl?: string;
}

// ============================================
// Player Types
// ============================================

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number: number;
  position?: Position;
  heightCm?: number;
  weightKg?: number;
  birthDate?: string;
  active: boolean;
  team?: TeamSummary;
  seasonAverages?: PlayerAverages;
  gamesPlayed?: number;
}

export interface PlayerAverages {
  gamesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  fieldGoalPercentage: number;
}

// ============================================
// Game Types
// ============================================

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  leagueId: string;
  scheduledAt?: number;
  startedAt?: number;
  endedAt?: number;
  status: GameStatus;
  currentQuarter: number;
  timeRemainingSeconds: number;
  homeScore: number;
  awayScore: number;
  gameSettings?: Record<string, unknown>;
  homeTeam?: TeamSummary;
  awayTeam?: TeamSummary;
  playerStats?: PlayerStat[];
}

export interface GameSummary {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

// ============================================
// Statistics Types
// ============================================

export interface PlayerStat {
  id: string;
  playerId: string;
  gameId: string;
  teamId: string;
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  minutesPlayed: number;
  plusMinus: number;
  isOnCourt: boolean;
  // Computed percentages
  fieldGoalPercentage?: number;
  threePointPercentage?: number;
  freeThrowPercentage?: number;
  // Related data
  player?: {
    id: string;
    name: string;
    number: number;
    position?: Position;
  };
}

export interface BoxScore {
  game: Game;
  homeTeam: {
    team: TeamSummary;
    score: number;
    players: PlayerStat[];
  };
  awayTeam: {
    team: TeamSummary;
    score: number;
    players: PlayerStat[];
  };
}

// ============================================
// Season Statistics Types
// ============================================

export interface PlayerSeasonStats {
  playerId: string;
  playerName: string;
  team: string;
  position?: Position;
  gamesPlayed: number;
  // Totals
  totalPoints: number;
  totalFieldGoalsMade: number;
  totalFieldGoalsAttempted: number;
  totalThreePointersMade: number;
  totalThreePointersAttempted: number;
  totalFreeThrowsMade: number;
  totalFreeThrowsAttempted: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  totalTurnovers: number;
  totalFouls: number;
  totalMinutes: number;
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

export interface TeamSeasonStats {
  teamId: string;
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  totalPoints: number;
  avgPoints: number;
  totalRebounds: number;
  avgRebounds: number;
  totalAssists: number;
  avgAssists: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

export interface PlayerGameLog {
  gameId: string;
  gameDate: string;
  opponent: string;
  homeGame: boolean;
  result: "W" | "L" | "N/A";
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  fieldGoals: string; // "made/attempted" format
  fieldGoalPercentage: number;
  threePointers: string;
  threePointPercentage: number;
  freeThrows: string;
  freeThrowPercentage: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  plusMinus: number;
}

// ============================================
// Shot Chart Types
// ============================================

export interface Shot {
  id: string;
  playerId: string;
  gameId: string;
  teamId: string;
  x: number; // -50 to 50
  y: number; // 0 to 94
  shotType: ShotType;
  made: boolean;
  quarter: number;
  timeRemaining: number;
  assisted?: boolean;
  assistedBy?: string;
  shotZone?: ShotZone;
}

export type ShotType = "2pt" | "3pt" | "ft";
export type ShotZone = "paint" | "midrange" | "corner3" | "wing3" | "top3" | "ft";

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  userId: string;
  leagueId?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: number;
  expiresAt?: number;
}

export type NotificationType =
  | "game_reminder"
  | "game_start"
  | "game_end"
  | "score_update"
  | "team_update"
  | "league_announcement"
  | "system";

export interface NotificationPreferences {
  gameReminders: boolean;
  gameStart: boolean;
  gameEnd: boolean;
  scoreUpdates: boolean;
  teamUpdates: boolean;
  leagueAnnouncements: boolean;
  reminderMinutesBefore?: number;
}

// ============================================
// Enums / Union Types
// ============================================

export type UserRole = "admin" | "user";

export type LeagueType = "professional" | "college" | "high_school" | "youth" | "recreational";

export type LeagueStatus = "draft" | "active" | "completed" | "archived";

export type LeagueRole = "owner" | "admin" | "coach" | "scorekeeper" | "member" | "viewer";

export type MembershipStatus = "pending" | "active" | "suspended" | "removed";

export type Position = "PG" | "SG" | "SF" | "PF" | "C";

export type GameStatus = "scheduled" | "active" | "paused" | "completed";

export type StatType =
  | "shot2"
  | "shot3"
  | "freethrow"
  | "rebounds"
  | "assists"
  | "steals"
  | "blocks"
  | "turnovers"
  | "fouls";

// ============================================
// API Types
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Action Types
// ============================================

export interface StatAction {
  playerId: string;
  statType: StatType;
  made?: boolean;
  value?: number;
}

// ============================================
// UI State Types
// ============================================

export interface GameTimerState {
  isRunning: boolean;
  timeRemaining: number;
  quarter: number;
}

export interface ConnectionStatus {
  status: "connected" | "connecting" | "disconnected" | "error";
}

// ============================================
// Lineup Stats Types
// ============================================

export interface LineupPlayerInfo {
  id: string;
  name: string;
  number: number;
}

export interface LineupStats {
  players: LineupPlayerInfo[];
  playerIds: string[];
  teamId?: string;
  minutesPlayed: number;
  pointsScored: number;
  pointsAllowed: number;
  plusMinus: number;
  gamesPlayed: number;
  netRating: number;
}

export interface PairStats {
  player1: LineupPlayerInfo;
  player2: LineupPlayerInfo;
  player1Id: string;
  player2Id: string;
  teamId?: string;
  minutesTogether: number;
  plusMinus: number;
  gamesPlayed: number;
  netRating: number;
}
