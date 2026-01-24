/**
 * CSV Export Utilities
 * Functions for exporting game data to CSV format
 */

import { toCSV, downloadFile } from "../export";
import type { GameExportData, PlayerExportData, ShotExportData, EventExportData } from "./types";

// ============================================
// Box Score Export
// ============================================

interface BoxScoreRow {
  [key: string]: string | number;
  team: string;
  player: string;
  number: number;
  position: string;
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
  { key: "player", label: "Player" },
  { key: "number", label: "#" },
  { key: "position", label: "Pos" },
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

function playerToBoxScoreRow(player: PlayerExportData, teamName: string): BoxScoreRow {
  const fgPct =
    player.fieldGoalsAttempted > 0
      ? ((player.fieldGoalsMade / player.fieldGoalsAttempted) * 100).toFixed(1)
      : "0.0";
  const threePct =
    player.threePointersAttempted > 0
      ? ((player.threePointersMade / player.threePointersAttempted) * 100).toFixed(1)
      : "0.0";
  const ftPct =
    player.freeThrowsAttempted > 0
      ? ((player.freeThrowsMade / player.freeThrowsAttempted) * 100).toFixed(1)
      : "0.0";

  return {
    team: teamName,
    player: player.name,
    number: player.number,
    position: player.position || "-",
    min: player.minutesPlayed,
    pts: player.points,
    reb: player.rebounds,
    ast: player.assists,
    stl: player.steals,
    blk: player.blocks,
    to: player.turnovers,
    pf: player.fouls,
    fgm: player.fieldGoalsMade,
    fga: player.fieldGoalsAttempted,
    "fg%": fgPct,
    "3pm": player.threePointersMade,
    "3pa": player.threePointersAttempted,
    "3p%": threePct,
    ftm: player.freeThrowsMade,
    fta: player.freeThrowsAttempted,
    "ft%": ftPct,
    "+/-": player.plusMinus,
  };
}

/**
 * Export box score data to CSV
 */
export function exportBoxScoreCSV(gameData: GameExportData, filename?: string): void {
  const rows: BoxScoreRow[] = [];

  // Add home team players
  for (const player of gameData.homeTeam.players) {
    rows.push(playerToBoxScoreRow(player, gameData.homeTeam.name));
  }

  // Add away team players
  for (const player of gameData.awayTeam.players) {
    rows.push(playerToBoxScoreRow(player, gameData.awayTeam.name));
  }

  // Sort by team, then by points descending
  rows.sort((a, b) => {
    if (a.team !== b.team) return a.team.localeCompare(b.team);
    return b.pts - a.pts;
  });

  const csv = toCSV(rows, boxScoreColumns);
  const exportFilename =
    filename || `box-score-${gameData.homeTeam.name}-vs-${gameData.awayTeam.name}`;
  downloadFile(csv, `${exportFilename}.csv`, "text/csv;charset=utf-8;");
}

// ============================================
// Shot Data Export
// ============================================

interface ShotRow {
  [key: string]: string | number;
  team: string;
  player: string;
  quarter: number;
  time: string;
  x: number;
  y: number;
  shotType: string;
  result: string;
  zone: string;
}

const shotColumns: { key: keyof ShotRow; label: string }[] = [
  { key: "team", label: "Team" },
  { key: "player", label: "Player" },
  { key: "quarter", label: "Quarter" },
  { key: "time", label: "Time" },
  { key: "x", label: "X Coordinate" },
  { key: "y", label: "Y Coordinate" },
  { key: "shotType", label: "Shot Type" },
  { key: "result", label: "Result" },
  { key: "zone", label: "Zone" },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function shotToRow(shot: ShotExportData): ShotRow {
  return {
    team: shot.teamName,
    player: shot.playerName,
    quarter: shot.quarter,
    time: formatTime(shot.timeRemaining),
    x: Math.round(shot.x * 100) / 100,
    y: Math.round(shot.y * 100) / 100,
    shotType: shot.shotType === "3pt" ? "3-Pointer" : "2-Pointer",
    result: shot.made ? "Made" : "Missed",
    zone: shot.zone,
  };
}

/**
 * Export shot data to CSV
 */
export function exportShotsCSV(shots: ShotExportData[], filename?: string): void {
  const rows = shots.map(shotToRow);

  // Sort by quarter, then by time descending
  rows.sort((a, b) => {
    if (a.quarter !== b.quarter) return a.quarter - b.quarter;
    const aTime = parseInt(a.time.split(":")[0]) * 60 + parseInt(a.time.split(":")[1]);
    const bTime = parseInt(b.time.split(":")[0]) * 60 + parseInt(b.time.split(":")[1]);
    return bTime - aTime;
  });

  const csv = toCSV(rows, shotColumns);
  const exportFilename = filename || "shot-data";
  downloadFile(csv, `${exportFilename}.csv`, "text/csv;charset=utf-8;");
}

// ============================================
// Play-by-Play Export
// ============================================

interface PlayByPlayRow {
  [key: string]: string | number;
  quarter: number;
  time: string;
  team: string;
  player: string;
  event: string;
  description: string;
  homeScore: number;
  awayScore: number;
  scoreDiff: string;
}

const playByPlayColumns: { key: keyof PlayByPlayRow; label: string }[] = [
  { key: "quarter", label: "Quarter" },
  { key: "time", label: "Time" },
  { key: "team", label: "Team" },
  { key: "player", label: "Player" },
  { key: "event", label: "Event Type" },
  { key: "description", label: "Description" },
  { key: "homeScore", label: "Home Score" },
  { key: "awayScore", label: "Away Score" },
  { key: "scoreDiff", label: "Score Diff" },
];

function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function eventToRow(event: EventExportData): PlayByPlayRow {
  const scoreDiff = event.homeScore - event.awayScore;
  const scoreDiffStr = scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff.toString();

  return {
    quarter: event.quarter,
    time: formatTime(event.timeRemaining),
    team: event.teamName || "-",
    player: event.playerName || "-",
    event: formatEventType(event.eventType),
    description: event.description,
    homeScore: event.homeScore,
    awayScore: event.awayScore,
    scoreDiff: scoreDiffStr,
  };
}

/**
 * Export play-by-play data to CSV
 */
export function exportPlayByPlayCSV(events: EventExportData[], filename?: string): void {
  const rows = events.map(eventToRow);

  // Sort by quarter, then by time descending
  rows.sort((a, b) => {
    if (a.quarter !== b.quarter) return a.quarter - b.quarter;
    const aTime = parseInt(a.time.split(":")[0]) * 60 + parseInt(a.time.split(":")[1]);
    const bTime = parseInt(b.time.split(":")[0]) * 60 + parseInt(b.time.split(":")[1]);
    return bTime - aTime;
  });

  const csv = toCSV(rows, playByPlayColumns);
  const exportFilename = filename || "play-by-play";
  downloadFile(csv, `${exportFilename}.csv`, "text/csv;charset=utf-8;");
}

// ============================================
// Combined Game Export
// ============================================

/**
 * Export all game data to multiple CSV files (packaged as a single download)
 * For now, we export the box score. In the future, this could create a ZIP.
 */
export function exportGameCSV(gameData: GameExportData): void {
  const dateStr = gameData.game.date
    ? new Date(gameData.game.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const baseFilename = `${dateStr}-${gameData.homeTeam.name}-vs-${gameData.awayTeam.name}`.replace(
    /\s+/g,
    "-"
  );

  exportBoxScoreCSV(gameData, `${baseFilename}-box-score`);
}

// ============================================
// Shooting Stats Summary Export
// ============================================

interface ShootingStatsRow {
  [key: string]: string | number;
  team: string;
  totalShots: number;
  madeShots: number;
  "fg%": string;
  twoPointAttempts: number;
  twoPointMade: number;
  "2p%": string;
  threePointAttempts: number;
  threePointMade: number;
  "3p%": string;
}

const shootingStatsColumns: { key: keyof ShootingStatsRow; label: string }[] = [
  { key: "team", label: "Team" },
  { key: "totalShots", label: "Total Shots" },
  { key: "madeShots", label: "Made Shots" },
  { key: "fg%", label: "FG%" },
  { key: "twoPointAttempts", label: "2PA" },
  { key: "twoPointMade", label: "2PM" },
  { key: "2p%", label: "2P%" },
  { key: "threePointAttempts", label: "3PA" },
  { key: "threePointMade", label: "3PM" },
  { key: "3p%", label: "3P%" },
];

function calculateTeamShootingStats(shots: ShotExportData[], teamName: string): ShootingStatsRow {
  const totalShots = shots.length;
  const madeShots = shots.filter((s) => s.made).length;
  const twoPointers = shots.filter((s) => s.shotType === "2pt");
  const threePointers = shots.filter((s) => s.shotType === "3pt");
  const twoPointMade = twoPointers.filter((s) => s.made).length;
  const threePointMade = threePointers.filter((s) => s.made).length;

  return {
    team: teamName,
    totalShots,
    madeShots,
    "fg%": totalShots > 0 ? ((madeShots / totalShots) * 100).toFixed(1) : "0.0",
    twoPointAttempts: twoPointers.length,
    twoPointMade,
    "2p%": twoPointers.length > 0 ? ((twoPointMade / twoPointers.length) * 100).toFixed(1) : "0.0",
    threePointAttempts: threePointers.length,
    threePointMade,
    "3p%":
      threePointers.length > 0 ? ((threePointMade / threePointers.length) * 100).toFixed(1) : "0.0",
  };
}

/**
 * Export shooting stats summary to CSV
 */
export function exportShootingStatsCSV(gameData: GameExportData, filename?: string): void {
  const homeShots = gameData.shots.filter((s) => s.teamId === gameData.homeTeam.id);
  const awayShots = gameData.shots.filter((s) => s.teamId === gameData.awayTeam.id);

  const rows = [
    calculateTeamShootingStats(homeShots, gameData.homeTeam.name),
    calculateTeamShootingStats(awayShots, gameData.awayTeam.name),
  ];

  const csv = toCSV(rows, shootingStatsColumns);
  const exportFilename =
    filename || `shooting-stats-${gameData.homeTeam.name}-vs-${gameData.awayTeam.name}`;
  downloadFile(csv, `${exportFilename}.csv`, "text/csv;charset=utf-8;");
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
 * Export player game log to CSV
 */
export function exportPlayerGameLogCSV(
  games: PlayerGameLogInput[],
  playerName: string,
  season?: string
): void {
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

    // Get minutes from either minutes or minutesPlayed
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

  // Sort by date descending (most recent first)
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const csv = toCSV(rows, playerGameLogColumns);
  const safeName = playerName.replace(/\s+/g, "-");
  const seasonSuffix = season ? `-${season}` : "";
  const exportFilename = `player-game-log-${safeName}${seasonSuffix}`;
  downloadFile(csv, `${exportFilename}.csv`, "text/csv;charset=utf-8;");
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
 * Export team roster to CSV
 */
export function exportRosterCSV(players: RosterPlayerInput[], teamName: string): void {
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

  const csv = toCSV(rows, rosterColumns);
  const safeTeamName = teamName.replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  const exportFilename = `roster-${safeTeamName}-${dateStr}`;
  downloadFile(csv, `${exportFilename}.csv`, "text/csv;charset=utf-8;");
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
 * Export game schedule/results to CSV
 */
export function exportGameScheduleCSV(games: GameScheduleInput[], leagueName?: string): void {
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

  const csv = toCSV(rows, gameScheduleColumns);
  const safeLeagueName = (leagueName || "league").replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  const exportFilename = `game-schedule-${safeLeagueName}-${dateStr}`;
  downloadFile(csv, `${exportFilename}.csv`, "text/csv;charset=utf-8;");
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
 * Export lineup stats to CSV
 */
export function exportLineupStatsCSV(lineups: LineupStatsInput[], teamName: string): void {
  const rows: LineupStatsRow[] = lineups.map((lineup, index) => {
    const playerNames = lineup.players.map((p) => `#${p.number} ${p.name}`);
    // Pad to 5 players if fewer
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

  const csv = toCSV(rows, lineupStatsColumns);
  const safeTeamName = teamName.replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  const exportFilename = `lineup-stats-${safeTeamName}-${dateStr}`;
  downloadFile(csv, `${exportFilename}.csv`, "text/csv;charset=utf-8;");
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
 * Export pair stats to CSV
 */
export function exportPairStatsCSV(pairs: PairStatsInput[], teamName: string): void {
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

  const csv = toCSV(rows, pairStatsColumns);
  const safeTeamName = teamName.replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  const exportFilename = `pair-stats-${safeTeamName}-${dateStr}`;
  downloadFile(csv, `${exportFilename}.csv`, "text/csv;charset=utf-8;");
}
