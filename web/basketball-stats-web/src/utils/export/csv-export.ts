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
