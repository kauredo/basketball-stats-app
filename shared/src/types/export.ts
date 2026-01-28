/**
 * Export System Types
 * Shared between web and mobile for consistent export functionality
 */

// ============================================
// Export Options
// ============================================

export type ExportFormat = "csv" | "pdf";

export type ExportType =
  | "game-report"
  | "player-shot-chart"
  | "team-shot-chart"
  | "player-season"
  | "team-season"
  | "box-score"
  | "shot-data"
  | "play-by-play"
  | "player-game-log"
  | "team-roster"
  | "game-schedule"
  | "lineup-stats"
  | "pair-stats"
  | "season-summary";

export interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  gameId?: string;
  playerId?: string;
  teamId?: string;
  theme?: "light" | "dark";
  includeHeatmap?: boolean;
}

// ============================================
// Export Content Options
// ============================================

export interface GameReportOptions {
  includeBoxScore: boolean;
  includeShotCharts: boolean;
  includePlayByPlay: boolean;
  includeQuarterBreakdown: boolean;
  includeTeamComparison: boolean;
}

export interface ShotChartExportOptions {
  includeHeatmap: boolean;
  includeZoneStats: boolean;
  includeShootingPercentages: boolean;
}

// ============================================
// PDF Settings
// ============================================

export interface PDFSettings {
  pageSize: "a4" | "letter";
  orientation: "portrait" | "landscape";
  theme: "light" | "dark";
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export const DEFAULT_PDF_SETTINGS: PDFSettings = {
  pageSize: "a4",
  orientation: "portrait",
  theme: "light",
  margins: {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40,
  },
};

// ============================================
// Export Progress
// ============================================

export type ExportStatus = "idle" | "preparing" | "generating" | "complete" | "error";

export interface ExportProgress {
  status: ExportStatus;
  progress: number; // 0-100
  message: string;
  error?: string;
}

// ============================================
// Export Data Structures
// ============================================

export interface BoxScoreExportRow {
  playerName: string;
  playerNumber: number;
  team: string;
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
  fieldGoalPercentage: string;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointPercentage: string;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: string;
}

export interface ShotExportRow {
  playerId: string;
  playerName: string;
  team: string;
  x: number;
  y: number;
  shotType: string;
  made: boolean;
  zone: string;
  quarter: number;
  timeRemaining: string;
}

export interface PlayByPlayExportRow {
  quarter: number;
  time: string;
  team: string;
  player: string;
  eventType: string;
  description: string;
  homeScore: number;
  awayScore: number;
}

// ============================================
// Game Data for Export
// ============================================

export interface GameExportData {
  game: {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    homeScore: number;
    awayScore: number;
    status: string;
    currentQuarter: number;
    date?: string;
  };
  homeTeam: TeamExportData;
  awayTeam: TeamExportData;
  shots: ShotExportData[];
  events: EventExportData[];
}

export interface TeamExportData {
  id: string;
  name: string;
  city?: string;
  players: PlayerExportData[];
  totals: TeamTotalsData;
}

export interface PlayerExportData {
  id: string;
  name: string;
  number: number;
  position?: string;
  minutesPlayed: number;
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
}

export interface TeamTotalsData {
  points: number;
  rebounds: number;
  offensiveRebounds?: number;
  defensiveRebounds?: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
}

export interface ShotExportData {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  x: number;
  y: number;
  shotType: "2pt" | "3pt" | "ft";
  made: boolean;
  zone: string;
  quarter: number;
  timeRemaining: number;
}

export interface EventExportData {
  id: string;
  quarter: number;
  timeRemaining: number;
  eventType: string;
  description: string;
  playerId?: string;
  playerName?: string;
  teamId?: string;
  teamName?: string;
  homeScore: number;
  awayScore: number;
}

// ============================================
// PDF Generation Options
// ============================================

export interface PDFGenerationOptions {
  settings: PDFSettings;
  gameReportOptions?: GameReportOptions;
  shotChartOptions?: ShotChartExportOptions;
}

// ============================================
// Shot Location (for court capture)
// ============================================

export interface ExportShotLocation {
  x: number;
  y: number;
  made: boolean;
  is3pt: boolean;
}

// ============================================
// URL Export Params (for mobile)
// ============================================

export interface ExportURLParams {
  type: ExportType;
  format: ExportFormat;
  gameId?: string;
  playerId?: string;
  teamId?: string;
  leagueId?: string;
  theme?: "light" | "dark";
  heatmap?: "true" | "false";
}

export function buildExportURL(baseUrl: string, params: ExportURLParams): string {
  const searchParams = new URLSearchParams();

  searchParams.set("type", params.type);
  searchParams.set("format", params.format);

  if (params.gameId) searchParams.set("gameId", params.gameId);
  if (params.playerId) searchParams.set("playerId", params.playerId);
  if (params.teamId) searchParams.set("teamId", params.teamId);
  if (params.leagueId) searchParams.set("leagueId", params.leagueId);
  if (params.theme) searchParams.set("theme", params.theme);
  if (params.heatmap) searchParams.set("heatmap", params.heatmap);

  return `${baseUrl}/export?${searchParams.toString()}`;
}

export function parseExportURL(url: string): ExportURLParams | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    const type = params.get("type") as ExportType;
    const format = params.get("format") as ExportFormat;

    if (!type || !format) return null;

    return {
      type,
      format,
      gameId: params.get("gameId") || undefined,
      playerId: params.get("playerId") || undefined,
      teamId: params.get("teamId") || undefined,
      leagueId: params.get("leagueId") || undefined,
      theme: (params.get("theme") as "light" | "dark") || undefined,
      heatmap: (params.get("heatmap") as "true" | "false") || undefined,
    };
  } catch {
    return null;
  }
}

// ============================================
// New Export Data Structures
// ============================================

/**
 * Player Game Log Export Row
 * For exporting a player's game-by-game statistics
 */
export interface PlayerGameLogExportRow {
  date: string;
  opponent: string;
  homeAway: "Home" | "Away";
  result: "W" | "L" | "N/A";
  teamScore: number;
  opponentScore: number;
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
  fieldGoalPercentage: string;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointPercentage: string;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: string;
  plusMinus: number;
}

/**
 * Team Roster Export Row
 * For exporting a team's player roster
 */
export interface RosterExportRow {
  number: number;
  name: string;
  position: string;
  heightCm: number | string;
  weightKg: number | string;
  status: "Active" | "Inactive" | "Injured";
}

/**
 * Game Schedule/Results Export Row
 * For exporting a list of games with results
 */
export interface GameResultExportRow {
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | string;
  awayScore: number | string;
  status: string;
  result: string;
}

/**
 * Lineup Stats Export Row
 * For exporting 5-man lineup statistics
 */
export interface LineupExportRow {
  rank: number;
  player1: string;
  player2: string;
  player3: string;
  player4: string;
  player5: string;
  minutesPlayed: number;
  pointsScored: number;
  pointsAllowed: number;
  plusMinus: number;
  netRating: number;
  gamesPlayed: number;
}

/**
 * Pair Stats Export Row
 * For exporting 2-player pair statistics
 */
export interface PairExportRow {
  rank: number;
  player1: string;
  player2: string;
  minutesTogether: number;
  plusMinus: number;
  netRating: number;
  gamesPlayed: number;
  chemistry: string;
}

/**
 * Season Summary Data
 * For PDF export of season overview
 */
export interface SeasonSummaryData {
  league: {
    name: string;
    season: string;
    type: string;
  };
  standings: Array<{
    rank: number;
    teamName: string;
    wins: number;
    losses: number;
    winPercentage: number;
    gamesBack: number;
    pointDiff: number;
  }>;
  statLeaders: {
    scoring: Array<{ playerName: string; teamName: string; value: number }>;
    rebounds: Array<{ playerName: string; teamName: string; value: number }>;
    assists: Array<{ playerName: string; teamName: string; value: number }>;
    steals: Array<{ playerName: string; teamName: string; value: number }>;
    blocks: Array<{ playerName: string; teamName: string; value: number }>;
    fieldGoalPercentage: Array<{ playerName: string; teamName: string; value: number }>;
    threePointPercentage: Array<{ playerName: string; teamName: string; value: number }>;
  };
  totalGames: number;
  generatedAt: string;
}
