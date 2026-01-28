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
// Box Score Export (Game-specific)
// ============================================

interface BoxScoreRow {
  [key: string]: string | number;
  team: string;
  number: number;
  name: string;
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

const boxScoreColumns: { key: keyof BoxScoreRow; label: string }[] = [
  { key: "team", label: "Team" },
  { key: "number", label: "#" },
  { key: "name", label: "Player" },
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

export interface BoxScorePlayerInput {
  player?: {
    id?: string;
    name: string;
    number: number;
  } | null;
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
  threePointersMade?: number;
  threePointersAttempted?: number;
  freeThrowsMade?: number;
  freeThrowsAttempted?: number;
  plusMinus?: number;
}

export interface BoxScoreTeamInput {
  team?: { name: string } | null;
  players: BoxScorePlayerInput[];
}

export interface GameInfoInput {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  date?: string | number;
}

/**
 * Export box score to CSV and share
 */
export async function exportBoxScoreCSV(
  homeTeam: BoxScoreTeamInput,
  awayTeam: BoxScoreTeamInput,
  gameInfo: GameInfoInput
): Promise<void> {
  const transformPlayer = (player: BoxScorePlayerInput, teamName: string): BoxScoreRow => {
    const fgPct =
      player.fieldGoalsAttempted && player.fieldGoalsAttempted > 0
        ? (((player.fieldGoalsMade || 0) / player.fieldGoalsAttempted) * 100).toFixed(1)
        : "0.0";
    const threePct =
      player.threePointersAttempted && player.threePointersAttempted > 0
        ? (((player.threePointersMade || 0) / player.threePointersAttempted) * 100).toFixed(1)
        : "0.0";
    const ftPct =
      player.freeThrowsAttempted && player.freeThrowsAttempted > 0
        ? (((player.freeThrowsMade || 0) / player.freeThrowsAttempted) * 100).toFixed(1)
        : "0.0";

    return {
      team: teamName,
      number: player.player?.number || 0,
      name: player.player?.name || "Unknown",
      min: player.minutesPlayed || 0,
      pts: player.points || 0,
      reb: player.rebounds || 0,
      ast: player.assists || 0,
      stl: player.steals || 0,
      blk: player.blocks || 0,
      to: player.turnovers || 0,
      pf: player.fouls || 0,
      fgm: player.fieldGoalsMade || 0,
      fga: player.fieldGoalsAttempted || 0,
      "fg%": fgPct,
      "3pm": player.threePointersMade || 0,
      "3pa": player.threePointersAttempted || 0,
      "3p%": threePct,
      ftm: player.freeThrowsMade || 0,
      fta: player.freeThrowsAttempted || 0,
      "ft%": ftPct,
      "+/-": player.plusMinus || 0,
    };
  };

  const rows: BoxScoreRow[] = [
    ...homeTeam.players.map((p) =>
      transformPlayer(p, homeTeam.team?.name || gameInfo.homeTeamName)
    ),
    ...awayTeam.players.map((p) =>
      transformPlayer(p, awayTeam.team?.name || gameInfo.awayTeamName)
    ),
  ];

  // Sort by team then by points
  rows.sort((a, b) => {
    if (a.team !== b.team) return a.team.localeCompare(b.team);
    return b.pts - a.pts;
  });

  const dateStr = gameInfo.date
    ? new Date(gameInfo.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const filename = `box-score-${gameInfo.homeTeamName.replace(/\s+/g, "-")}-vs-${gameInfo.awayTeamName.replace(/\s+/g, "-")}-${dateStr}`;

  await exportAndShareCSV(rows, boxScoreColumns, filename);
}

// ============================================
// Shots Export (Game-specific)
// ============================================

interface ShotRow {
  [key: string]: string | number;
  quarter: number;
  time: string;
  team: string;
  player: string;
  number: number;
  shotType: string;
  result: string;
  zone: string;
  x: number;
  y: number;
}

const shotColumns: { key: keyof ShotRow; label: string }[] = [
  { key: "quarter", label: "Quarter" },
  { key: "time", label: "Time" },
  { key: "team", label: "Team" },
  { key: "player", label: "Player" },
  { key: "number", label: "#" },
  { key: "shotType", label: "Shot Type" },
  { key: "result", label: "Result" },
  { key: "zone", label: "Zone" },
  { key: "x", label: "X" },
  { key: "y", label: "Y" },
];

export interface ShotInput {
  id?: string;
  playerId?: string;
  player?: { name?: string; number?: number } | null;
  playerName?: string;
  playerNumber?: number;
  teamId?: string;
  teamName?: string;
  x: number;
  y: number;
  shotType: string;
  made: boolean;
  shotZone?: string;
  zone?: string;
  quarter: number;
  timeRemaining?: number;
  gameTime?: number;
}

/**
 * Export shots to CSV and share
 */
export async function exportShotsCSV(
  shots: ShotInput[],
  homeTeamId: string | undefined,
  gameInfo: GameInfoInput
): Promise<void> {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const rows: ShotRow[] = shots.map((shot) => {
    const time = shot.timeRemaining ?? shot.gameTime ?? 0;
    const isHomeTeam = shot.teamId === homeTeamId;
    const teamName = shot.teamName || (isHomeTeam ? gameInfo.homeTeamName : gameInfo.awayTeamName);

    return {
      quarter: shot.quarter,
      time: formatTime(time),
      team: teamName,
      player: shot.player?.name || shot.playerName || "Unknown",
      number: shot.player?.number || shot.playerNumber || 0,
      shotType:
        shot.shotType === "3pt"
          ? "3-pointer"
          : shot.shotType === "2pt"
            ? "2-pointer"
            : "Free Throw",
      result: shot.made ? "Made" : "Missed",
      zone: shot.shotZone || shot.zone || "Unknown",
      x: Math.round(shot.x * 100) / 100,
      y: Math.round(shot.y * 100) / 100,
    };
  });

  // Sort by quarter then by time (descending within quarter)
  rows.sort((a, b) => {
    if (a.quarter !== b.quarter) return a.quarter - b.quarter;
    // Time is formatted as MM:SS, need to compare numerically
    const [aMins, aSecs] = a.time.split(":").map(Number);
    const [bMins, bSecs] = b.time.split(":").map(Number);
    return bMins * 60 + bSecs - (aMins * 60 + aSecs);
  });

  const dateStr = gameInfo.date
    ? new Date(gameInfo.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const filename = `shots-${gameInfo.homeTeamName.replace(/\s+/g, "-")}-vs-${gameInfo.awayTeamName.replace(/\s+/g, "-")}-${dateStr}`;

  await exportAndShareCSV(rows, shotColumns, filename);
}

// ============================================
// Play-by-Play Export (Game-specific)
// ============================================

interface PlayByPlayRow {
  [key: string]: string | number;
  quarter: number;
  time: string;
  homeScore: number;
  awayScore: number;
  team: string;
  player: string;
  eventType: string;
  description: string;
  points: number;
}

const playByPlayColumns: { key: keyof PlayByPlayRow; label: string }[] = [
  { key: "quarter", label: "Quarter" },
  { key: "time", label: "Time" },
  { key: "homeScore", label: "Home Score" },
  { key: "awayScore", label: "Away Score" },
  { key: "team", label: "Team" },
  { key: "player", label: "Player" },
  { key: "eventType", label: "Event" },
  { key: "description", label: "Description" },
  { key: "points", label: "Points" },
];

export interface PlayByPlayEventInput {
  id?: string;
  eventType: string;
  quarter: number;
  gameTime?: number;
  timeRemaining?: number;
  description?: string;
  details?: {
    points?: number;
    homeScore?: number;
    awayScore?: number;
    isHomeTeam?: boolean;
  };
  player?: { name?: string; number?: number; id?: string } | null;
  team?: { name?: string; id?: string } | null;
  playerId?: string;
  teamId?: string;
}

/**
 * Export play-by-play to CSV and share
 */
export async function exportPlayByPlayCSV(
  events: PlayByPlayEventInput[],
  homeTeamId: string | undefined,
  gameInfo: GameInfoInput
): Promise<void> {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatEventType = (eventType: string): string => {
    return eventType
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const rows: PlayByPlayRow[] = events.map((event) => {
    const time = event.gameTime ?? event.timeRemaining ?? 0;
    const isHomeTeam =
      event.details?.isHomeTeam ?? (event.team?.id === homeTeamId || event.teamId === homeTeamId);
    const teamName =
      event.team?.name || (isHomeTeam ? gameInfo.homeTeamName : gameInfo.awayTeamName);

    return {
      quarter: event.quarter,
      time: formatTime(time),
      homeScore: event.details?.homeScore ?? 0,
      awayScore: event.details?.awayScore ?? 0,
      team: teamName || "-",
      player: event.player?.name || "-",
      eventType: formatEventType(event.eventType),
      description: event.description || formatEventType(event.eventType),
      points: event.details?.points || 0,
    };
  });

  // Sort by quarter then by time (descending within quarter = earliest events first in quarter)
  rows.sort((a, b) => {
    if (a.quarter !== b.quarter) return a.quarter - b.quarter;
    // Time is formatted as MM:SS, compare numerically (higher time = earlier in quarter)
    const [aMins, aSecs] = a.time.split(":").map(Number);
    const [bMins, bSecs] = b.time.split(":").map(Number);
    return bMins * 60 + bSecs - (aMins * 60 + aSecs);
  });

  const dateStr = gameInfo.date
    ? new Date(gameInfo.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const filename = `play-by-play-${gameInfo.homeTeamName.replace(/\s+/g, "-")}-vs-${gameInfo.awayTeamName.replace(/\s+/g, "-")}-${dateStr}`;

  await exportAndShareCSV(rows, playByPlayColumns, filename);
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
