/**
 * Mobile Export Utilities
 * Functions for exporting data on React Native using expo-file-system and expo-sharing
 */

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { toCSV } from "@basketball-stats/shared";

// ============================================
// Base Export Function
// ============================================

/**
 * Export data to a CSV file and share it
 */
async function exportAndShareCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
): Promise<void> {
  const csv = toCSV(data, columns);
  const fileUri = `${FileSystem.cacheDirectory}${filename}.csv`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: `Export ${filename}`,
      UTI: "public.comma-separated-values-text",
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }
}

// ============================================
// Player Game Log Export
// ============================================

interface PlayerGameLogRow {
  [key: string]: string | number;
  date: string;
  opponent: string;
  homeAway: string;
  result: string;
  teamScore: number;
  opponentScore: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  pf: number;
  fgm: number;
  fga: number;
  "fg%": string;
  "3pm": number;
  "3pa": number;
  "3p%": string;
  ftm: number;
  fta: number;
  "ft%": string;
  "+/-": number;
}

const playerGameLogColumns: { key: keyof PlayerGameLogRow; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "opponent", label: "Opponent" },
  { key: "homeAway", label: "H/A" },
  { key: "result", label: "Result" },
  { key: "teamScore", label: "Team" },
  { key: "opponentScore", label: "Opp" },
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "to", label: "TO" },
  { key: "pf", label: "PF" },
  { key: "fgm", label: "FGM" },
  { key: "fga", label: "FGA" },
  { key: "fg%", label: "FG%" },
  { key: "3pm", label: "3PM" },
  { key: "3pa", label: "3PA" },
  { key: "3p%", label: "3P%" },
  { key: "ftm", label: "FTM" },
  { key: "fta", label: "FTA" },
  { key: "ft%", label: "FT%" },
  { key: "+/-", label: "+/-" },
];

export interface PlayerGameLogInput {
  gameId?: string;
  gameDate?: string | number;
  opponent?: string;
  homeGame?: boolean;
  result?: "W" | "L" | "N/A" | string;
  teamScore?: number;
  opponentScore?: number;
  minutes?: number;
  minutesPlayed?: number;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  fieldGoalPercentage?: number;
  threePointersMade?: number;
  threePointersAttempted?: number;
  threePointPercentage?: number;
  freeThrowsMade?: number;
  freeThrowsAttempted?: number;
  freeThrowPercentage?: number;
  plusMinus?: number;
}

/**
 * Export player game log to CSV and share
 */
export async function exportPlayerGameLogCSV(
  games: PlayerGameLogInput[],
  playerName: string,
  season?: string
): Promise<void> {
  const rows: PlayerGameLogRow[] = games.map((game) => {
    const fgPct =
      game.fieldGoalsAttempted && game.fieldGoalsAttempted > 0
        ? (((game.fieldGoalsMade || 0) / game.fieldGoalsAttempted) * 100).toFixed(1)
        : game.fieldGoalPercentage?.toFixed(1) || "0.0";
    const threePct =
      game.threePointersAttempted && game.threePointersAttempted > 0
        ? (((game.threePointersMade || 0) / game.threePointersAttempted) * 100).toFixed(1)
        : game.threePointPercentage?.toFixed(1) || "0.0";
    const ftPct =
      game.freeThrowsAttempted && game.freeThrowsAttempted > 0
        ? (((game.freeThrowsMade || 0) / game.freeThrowsAttempted) * 100).toFixed(1)
        : game.freeThrowPercentage?.toFixed(1) || "0.0";

    const mins = game.minutes ?? game.minutesPlayed ?? 0;

    return {
      date: game.gameDate ? new Date(game.gameDate).toLocaleDateString() : "N/A",
      opponent: game.opponent || "Unknown",
      homeAway: game.homeGame === true ? "Home" : game.homeGame === false ? "Away" : "-",
      result: game.result || "N/A",
      teamScore: game.teamScore || 0,
      opponentScore: game.opponentScore || 0,
      min: Math.round(mins),
      pts: game.points || 0,
      reb: game.rebounds || 0,
      ast: game.assists || 0,
      stl: game.steals || 0,
      blk: game.blocks || 0,
      to: game.turnovers || 0,
      pf: game.fouls || 0,
      fgm: game.fieldGoalsMade || 0,
      fga: game.fieldGoalsAttempted || 0,
      "fg%": fgPct,
      "3pm": game.threePointersMade || 0,
      "3pa": game.threePointersAttempted || 0,
      "3p%": threePct,
      ftm: game.freeThrowsMade || 0,
      fta: game.freeThrowsAttempted || 0,
      "ft%": ftPct,
      "+/-": game.plusMinus || 0,
    };
  });

  // Sort by date descending
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const safeName = playerName.replace(/\s+/g, "-");
  const seasonSuffix = season ? `-${season}` : "";
  const filename = `player-game-log-${safeName}${seasonSuffix}`;

  await exportAndShareCSV(rows, playerGameLogColumns, filename);
}

// ============================================
// Team Roster Export
// ============================================

interface RosterRow {
  [key: string]: string | number;
  number: number;
  name: string;
  position: string;
  heightCm: string;
  weightKg: string;
  status: string;
}

const rosterColumns: { key: keyof RosterRow; label: string }[] = [
  { key: "number", label: "#" },
  { key: "name", label: "Name" },
  { key: "position", label: "Position" },
  { key: "heightCm", label: "Height (cm)" },
  { key: "weightKg", label: "Weight (kg)" },
  { key: "status", label: "Status" },
];

export interface RosterPlayerInput {
  number: number;
  name: string;
  position?: string;
  heightCm?: number;
  weightKg?: number;
  active?: boolean;
  status?: "active" | "inactive" | "injured";
}

/**
 * Export team roster to CSV and share
 */
export async function exportRosterCSV(
  players: RosterPlayerInput[],
  teamName: string
): Promise<void> {
  const rows: RosterRow[] = players.map((player) => {
    let status = "Active";
    if (player.status === "injured") {
      status = "Injured";
    } else if (player.status === "inactive" || player.active === false) {
      status = "Inactive";
    }

    return {
      number: player.number,
      name: player.name,
      position: player.position || "-",
      heightCm: player.heightCm ? player.heightCm.toString() : "-",
      weightKg: player.weightKg ? player.weightKg.toString() : "-",
      status,
    };
  });

  // Sort by jersey number
  rows.sort((a, b) => a.number - b.number);

  const safeTeamName = teamName.replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `roster-${safeTeamName}-${dateStr}`;

  await exportAndShareCSV(rows, rosterColumns, filename);
}

// ============================================
// Game Schedule/Results Export
// ============================================

interface GameScheduleRow {
  [key: string]: string | number;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  status: string;
  result: string;
}

const gameScheduleColumns: { key: keyof GameScheduleRow; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "homeTeam", label: "Home Team" },
  { key: "awayTeam", label: "Away Team" },
  { key: "homeScore", label: "Home Score" },
  { key: "awayScore", label: "Away Score" },
  { key: "status", label: "Status" },
  { key: "result", label: "Result" },
];

export interface GameScheduleInput {
  id: string;
  scheduledAt?: number;
  startedAt?: number;
  status: string;
  homeTeam?: { name: string } | null;
  awayTeam?: { name: string } | null;
  homeScore: number;
  awayScore: number;
}

/**
 * Export game schedule/results to CSV and share
 */
export async function exportGameScheduleCSV(
  games: GameScheduleInput[],
  leagueName?: string
): Promise<void> {
  const rows: GameScheduleRow[] = games.map((game) => {
    const gameDate = game.scheduledAt
      ? new Date(game.scheduledAt)
      : game.startedAt
        ? new Date(game.startedAt)
        : null;

    let result = "-";
    if (game.status === "completed") {
      if (game.homeScore > game.awayScore) {
        result = `${game.homeTeam?.name || "Home"} Win`;
      } else if (game.awayScore > game.homeScore) {
        result = `${game.awayTeam?.name || "Away"} Win`;
      } else {
        result = "Tie";
      }
    }

    const statusMap: Record<string, string> = {
      scheduled: "Scheduled",
      active: "Live",
      paused: "Paused",
      completed: "Final",
    };

    return {
      date: gameDate ? gameDate.toLocaleDateString() : "TBD",
      time: gameDate
        ? gameDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "TBD",
      homeTeam: game.homeTeam?.name || "TBD",
      awayTeam: game.awayTeam?.name || "TBD",
      homeScore:
        game.status === "completed" || game.status === "active" || game.status === "paused"
          ? game.homeScore.toString()
          : "-",
      awayScore:
        game.status === "completed" || game.status === "active" || game.status === "paused"
          ? game.awayScore.toString()
          : "-",
      status: statusMap[game.status] || game.status,
      result,
    };
  });

  // Sort by date
  rows.sort((a, b) => {
    if (a.date === "TBD") return 1;
    if (b.date === "TBD") return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const safeLeagueName = (leagueName || "league").replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `game-schedule-${safeLeagueName}-${dateStr}`;

  await exportAndShareCSV(rows, gameScheduleColumns, filename);
}

// ============================================
// Lineup Stats Export
// ============================================

interface LineupStatsRow {
  [key: string]: string | number;
  rank: number;
  player1: string;
  player2: string;
  player3: string;
  player4: string;
  player5: string;
  minutes: number;
  ptsFor: number;
  ptsAgainst: number;
  "+/-": number;
  netRating: number;
  games: number;
}

const lineupStatsColumns: { key: keyof LineupStatsRow; label: string }[] = [
  { key: "rank", label: "Rank" },
  { key: "player1", label: "Player 1" },
  { key: "player2", label: "Player 2" },
  { key: "player3", label: "Player 3" },
  { key: "player4", label: "Player 4" },
  { key: "player5", label: "Player 5" },
  { key: "minutes", label: "Minutes" },
  { key: "ptsFor", label: "Pts For" },
  { key: "ptsAgainst", label: "Pts Against" },
  { key: "+/-", label: "+/-" },
  { key: "netRating", label: "Net Rating" },
  { key: "games", label: "Games" },
];

export interface LineupStatsInput {
  players: Array<{ name: string; number: number }>;
  minutesPlayed: number;
  pointsScored: number;
  pointsAllowed: number;
  plusMinus: number;
  netRating: number;
  gamesPlayed: number;
}

/**
 * Export lineup stats to CSV and share
 */
export async function exportLineupStatsCSV(
  lineups: LineupStatsInput[],
  teamName: string
): Promise<void> {
  const rows: LineupStatsRow[] = lineups.map((lineup, index) => {
    const playerNames = lineup.players.map((p) => `#${p.number} ${p.name}`);
    while (playerNames.length < 5) {
      playerNames.push("-");
    }

    return {
      rank: index + 1,
      player1: playerNames[0],
      player2: playerNames[1],
      player3: playerNames[2],
      player4: playerNames[3],
      player5: playerNames[4],
      minutes: Math.round(lineup.minutesPlayed * 10) / 10,
      ptsFor: lineup.pointsScored,
      ptsAgainst: lineup.pointsAllowed,
      "+/-": lineup.plusMinus,
      netRating: Math.round(lineup.netRating * 10) / 10,
      games: lineup.gamesPlayed,
    };
  });

  const safeTeamName = teamName.replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `lineup-stats-${safeTeamName}-${dateStr}`;

  await exportAndShareCSV(rows, lineupStatsColumns, filename);
}

// ============================================
// Pair Stats Export
// ============================================

interface PairStatsRow {
  [key: string]: string | number;
  rank: number;
  player1: string;
  player2: string;
  minutes: number;
  "+/-": number;
  netRating: number;
  games: number;
  chemistry: string;
}

const pairStatsColumns: { key: keyof PairStatsRow; label: string }[] = [
  { key: "rank", label: "Rank" },
  { key: "player1", label: "Player 1" },
  { key: "player2", label: "Player 2" },
  { key: "minutes", label: "Minutes" },
  { key: "+/-", label: "+/-" },
  { key: "netRating", label: "Net Rating" },
  { key: "games", label: "Games" },
  { key: "chemistry", label: "Chemistry" },
];

export interface PairStatsInput {
  player1: { name: string; number: number };
  player2: { name: string; number: number };
  minutesTogether: number;
  plusMinus: number;
  netRating: number;
  gamesPlayed: number;
}

function getChemistryLabel(netRating: number): string {
  if (netRating >= 15) return "Elite";
  if (netRating >= 10) return "Excellent";
  if (netRating >= 5) return "Good";
  if (netRating >= 0) return "Neutral";
  if (netRating >= -5) return "Poor";
  return "Very Poor";
}

/**
 * Export pair stats to CSV and share
 */
export async function exportPairStatsCSV(pairs: PairStatsInput[], teamName: string): Promise<void> {
  const rows: PairStatsRow[] = pairs.map((pair, index) => ({
    rank: index + 1,
    player1: `#${pair.player1.number} ${pair.player1.name}`,
    player2: `#${pair.player2.number} ${pair.player2.name}`,
    minutes: Math.round(pair.minutesTogether * 10) / 10,
    "+/-": pair.plusMinus,
    netRating: Math.round(pair.netRating * 10) / 10,
    games: pair.gamesPlayed,
    chemistry: getChemistryLabel(pair.netRating),
  }));

  const safeTeamName = teamName.replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `pair-stats-${safeTeamName}-${dateStr}`;

  await exportAndShareCSV(rows, pairStatsColumns, filename);
}

// ============================================
// Check if sharing is available
// ============================================

/**
 * Check if sharing/export is available on this device
 */
export async function isExportAvailable(): Promise<boolean> {
  return Sharing.isAvailableAsync();
}
