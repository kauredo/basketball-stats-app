/**
 * PDF Export Utilities
 * Functions for generating PDF reports with jsPDF and html2canvas
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  DEFAULT_PDF_SETTINGS,
  type PDFSettings,
  type GameExportData,
  type PlayerExportData,
  type ExportShotLocation,
} from "./types";

// ============================================
// Constants
// ============================================

// Design tokens aligned with tailwind.config.js warm neutrals
const COLORS = {
  primary: "#F97316", // Orange - primary-500
  primaryDark: "#ea580c", // primary-600
  surface: {
    light: {
      bg: "#fdfcfb", // surface-50 (warm off-white)
      card: "#f9f7f5", // surface-100
      text: "#252220", // surface-900 (warm near-black)
      textSecondary: "#7a746c", // surface-600
      border: "#e8e4df", // surface-300
    },
    dark: {
      bg: "#1a1816", // surface-950 (warm near-black)
      card: "#3d3835", // surface-800
      text: "#f9f7f5", // surface-100
      textSecondary: "#a69f96", // surface-500
      border: "#5c5650", // surface-700
    },
  },
  success: "#059669", // status.completed (emerald)
  danger: "#dc2626", // status.active (deeper red)
  info: "#2563eb", // status.scheduled (blue)
};

// Page dimensions in mm (A4)
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

// ============================================
// Helper Functions
// ============================================

function getColors(theme: "light" | "dark") {
  return COLORS.surface[theme];
}

function formatDate(date?: string | number): string {
  if (!date) return new Date().toLocaleDateString();
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPercentage(made: number, attempted: number): string {
  if (attempted === 0) return "0.0%";
  return ((made / attempted) * 100).toFixed(1) + "%";
}

// ============================================
// Court Image Capture
// ============================================

/**
 * Capture a shot chart element as a base64 image
 */
export async function captureCourtAsImage(
  element: HTMLElement,
  options?: { scale?: number; backgroundColor?: string }
): Promise<string> {
  const scale = options?.scale ?? 2;
  const backgroundColor = options?.backgroundColor ?? "#ffffff";

  const canvas = await html2canvas(element, {
    // @ts-expect-error - html2canvas types may be incomplete
    scale,
    backgroundColor,
    useCORS: true,
    logging: false,
  });

  return canvas.toDataURL("image/png");
}

// ============================================
// PDF Header
// ============================================

function addHeader(doc: jsPDF, title: string, subtitle: string, theme: "light" | "dark"): number {
  const colors = getColors(theme);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Background header bar
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 25, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 15, 16);

  // Date/subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(subtitle, pageWidth - 15, 16, { align: "right" });

  return 35; // Return Y position after header
}

// ============================================
// Score Summary
// ============================================

function addScoreSummary(
  doc: jsPDF,
  gameData: GameExportData,
  y: number,
  theme: "light" | "dark"
): number {
  const colors = getColors(theme);
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // Background card - using warm neutrals
  doc.setFillColor(...hexToRgb(colors.card));
  doc.roundedRect(15, y, pageWidth - 30, 40, 3, 3, "F");

  // Home team
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(colors.textSecondary));
  doc.text(gameData.homeTeam.city || "", 40, y + 12, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(colors.text));
  doc.text(gameData.homeTeam.name, 40, y + 22, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(...hexToRgb(COLORS.primary));
  doc.text(gameData.game.homeScore.toString(), 40, y + 36, { align: "center" });

  // VS
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(colors.textSecondary));
  doc.text("VS", centerX, y + 22, { align: "center" });

  const statusText =
    gameData.game.status === "completed" ? "FINAL" : gameData.game.status.toUpperCase();
  doc.setFontSize(10);
  doc.text(statusText, centerX, y + 32, { align: "center" });

  // Away team
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(colors.textSecondary));
  doc.text(gameData.awayTeam.city || "", pageWidth - 40, y + 12, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(colors.text));
  doc.text(gameData.awayTeam.name, pageWidth - 40, y + 22, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(...hexToRgb(COLORS.info));
  doc.text(gameData.game.awayScore.toString(), pageWidth - 40, y + 36, { align: "center" });

  return y + 50;
}

// ============================================
// Box Score Table
// ============================================

function addBoxScoreTable(
  doc: jsPDF,
  team: { name: string; players: PlayerExportData[] },
  y: number,
  theme: "light" | "dark",
  isHomeTeam: boolean
): number {
  const colors = getColors(theme);
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  const tableWidth = pageWidth - 30;

  // Team header
  const headerColor = isHomeTeam ? COLORS.primary : COLORS.info;
  doc.setFillColor(...hexToRgb(headerColor + "20")); // Light tint
  doc.rect(marginLeft, y, tableWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(colors.text));
  doc.text(team.name.toUpperCase(), marginLeft + 4, y + 5.5);

  y += 10;

  // Column headers - tightened widths to fit within 180mm (A4 width - 30mm margins)
  // Total: 38 + 10*7 + 8*2 + 15*3 = 38 + 70 + 16 + 45 = 169mm
  const columns = [
    { label: "Player", width: 38, align: "left" as const },
    { label: "MIN", width: 10, align: "center" as const },
    { label: "PTS", width: 10, align: "center" as const },
    { label: "REB", width: 10, align: "center" as const },
    { label: "AST", width: 10, align: "center" as const },
    { label: "STL", width: 10, align: "center" as const },
    { label: "BLK", width: 10, align: "center" as const },
    { label: "TO", width: 8, align: "center" as const },
    { label: "PF", width: 8, align: "center" as const },
    { label: "FG", width: 15, align: "center" as const },
    { label: "3PT", width: 15, align: "center" as const },
    { label: "FT", width: 15, align: "center" as const },
    { label: "+/-", width: 10, align: "center" as const },
  ];

  // Header background - using warm neutrals
  doc.setFillColor(...hexToRgb(theme === "dark" ? "#3d3835" : "#f3f0ed")); // surface-800 / surface-200
  doc.rect(marginLeft, y, tableWidth, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...hexToRgb(colors.textSecondary));

  let xPos = marginLeft + 2;
  for (const col of columns) {
    const textX = col.align === "center" ? xPos + col.width / 2 : xPos;
    doc.text(col.label, textX, y + 4, { align: col.align });
    xPos += col.width;
  }

  y += 7;

  // Player rows
  const sortedPlayers = [...team.players].sort((a, b) => b.points - a.points);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  for (const player of sortedPlayers) {
    // Alternate row background - using warm neutrals
    if (sortedPlayers.indexOf(player) % 2 === 1) {
      doc.setFillColor(...hexToRgb(colors.card));
      doc.rect(marginLeft, y - 1, tableWidth, 6, "F");
    }

    doc.setTextColor(...hexToRgb(colors.text));

    xPos = marginLeft + 2;

    // Player name with number - truncate to fit
    doc.setFont("helvetica", "bold");
    doc.text(`#${player.number} ${player.name}`.slice(0, 18), xPos, y + 3);
    xPos += 38;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...hexToRgb(colors.textSecondary));

    // Stats including +/-
    const plusMinus = player.plusMinus || 0;
    const plusMinusStr = plusMinus > 0 ? `+${plusMinus}` : plusMinus.toString();
    const stats = [
      player.minutesPlayed.toString(),
      player.points.toString(),
      player.rebounds.toString(),
      player.assists.toString(),
      player.steals.toString(),
      player.blocks.toString(),
      player.turnovers.toString(),
      player.fouls.toString(),
      `${player.fieldGoalsMade}/${player.fieldGoalsAttempted}`,
      `${player.threePointersMade}/${player.threePointersAttempted}`,
      `${player.freeThrowsMade}/${player.freeThrowsAttempted}`,
      plusMinusStr,
    ];

    const colWidths = [10, 10, 10, 10, 10, 10, 8, 8, 15, 15, 15, 10];

    // Highlight points in bold
    doc.setTextColor(...hexToRgb(colors.text));
    doc.setFont("helvetica", "bold");
    doc.text(stats[1], xPos + colWidths[0] + colWidths[1] / 2, y + 3, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...hexToRgb(colors.textSecondary));

    for (let i = 0; i < stats.length; i++) {
      if (i === 1) {
        xPos += colWidths[i];
        continue; // Skip points (already drawn)
      }
      // Color +/- based on value
      if (i === 11) {
        const pmColor =
          plusMinus > 0 ? COLORS.success : plusMinus < 0 ? COLORS.danger : colors.textSecondary;
        doc.setTextColor(...hexToRgb(pmColor));
      }
      doc.text(stats[i], xPos + colWidths[i] / 2, y + 3, { align: "center" });
      xPos += colWidths[i];
      // Reset color after +/-
      if (i === 11) {
        doc.setTextColor(...hexToRgb(colors.textSecondary));
      }
    }

    y += 6;
  }

  return y + 5;
}

// ============================================
// Advanced Analytics Section
// ============================================

interface AdvancedPlayerStats {
  playerId: string;
  playerName: string;
  playerNumber: number;
  ts: number; // True Shooting %
  efg: number; // Effective FG %
  ger: number; // Game Efficiency Rating
  atr: number; // Assist-to-Turnover Ratio
  minutes: number;
}

function calculateAdvancedStats(player: PlayerExportData): AdvancedPlayerStats {
  const fga = player.fieldGoalsAttempted;
  const fta = player.freeThrowsAttempted;
  const fgm = player.fieldGoalsMade;
  const tpm = player.threePointersMade;

  // True Shooting %
  const tsAttempts = fga + 0.44 * fta;
  const ts = tsAttempts > 0 ? (player.points / (2 * tsAttempts)) * 100 : 0;

  // Effective FG %
  const efg = fga > 0 ? ((fgm + 0.5 * tpm) / fga) * 100 : 0;

  // Game Efficiency Rating
  const positive = player.points + player.rebounds + player.assists + player.steals + player.blocks;
  const ftm = player.freeThrowsMade;
  const negative = fga - fgm + (fta - ftm) + player.turnovers + player.fouls;
  const ger = positive - negative;

  // Assist-to-Turnover Ratio
  const atr = player.turnovers > 0 ? player.assists / player.turnovers : player.assists;

  return {
    playerId: player.id,
    playerName: player.name,
    playerNumber: player.number,
    ts: Math.round(ts * 10) / 10,
    efg: Math.round(efg * 10) / 10,
    ger,
    atr: Math.round(atr * 10) / 10,
    minutes: player.minutesPlayed,
  };
}

function addAdvancedStatsSection(
  doc: jsPDF,
  homeTeam: { name: string; players: PlayerExportData[] },
  awayTeam: { name: string; players: PlayerExportData[] },
  y: number,
  theme: "light" | "dark"
): number {
  const colors = getColors(theme);
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;

  // Section header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(colors.text));
  doc.text("ADVANCED ANALYTICS", marginLeft, y);
  y += 8;

  // Column headers for advanced stats
  const advColumns = [
    { label: "Player", width: 40, align: "left" as const },
    { label: "MIN", width: 12, align: "center" as const },
    { label: "TS%", width: 14, align: "center" as const },
    { label: "eFG%", width: 14, align: "center" as const },
    { label: "GER", width: 12, align: "center" as const },
    { label: "A/TO", width: 12, align: "center" as const },
  ];

  const tableWidth = advColumns.reduce((sum, col) => sum + col.width, 0);
  const halfWidth = (pageWidth - 30) / 2;

  // Draw both teams side by side
  const teams = [
    { team: homeTeam, xOffset: marginLeft, isHome: true },
    { team: awayTeam, xOffset: marginLeft + halfWidth + 5, isHome: false },
  ];

  const startY = y;

  for (const { team, xOffset, isHome } of teams) {
    y = startY;

    // Team header
    const headerColor = isHome ? COLORS.primary : COLORS.info;
    doc.setFillColor(...hexToRgb(headerColor + "20"));
    doc.rect(xOffset, y, tableWidth + 2, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text(team.name.toUpperCase(), xOffset + 2, y + 4);
    y += 8;

    // Column header row
    doc.setFillColor(...hexToRgb(theme === "dark" ? "#3d3835" : "#f3f0ed"));
    doc.rect(xOffset, y, tableWidth + 2, 5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...hexToRgb(colors.textSecondary));

    let xPos = xOffset + 1;
    for (const col of advColumns) {
      const textX = col.align === "center" ? xPos + col.width / 2 : xPos;
      doc.text(col.label, textX, y + 3.5, { align: col.align });
      xPos += col.width;
    }
    y += 6;

    // Player rows with advanced stats
    const sortedPlayers = [...team.players]
      .filter((p) => p.minutesPlayed > 0)
      .sort((a, b) => b.points - a.points);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);

    for (let i = 0; i < Math.min(sortedPlayers.length, 8); i++) {
      const player = sortedPlayers[i];
      const adv = calculateAdvancedStats(player);

      // Alternate row background
      if (i % 2 === 1) {
        doc.setFillColor(...hexToRgb(colors.card));
        doc.rect(xOffset, y - 0.5, tableWidth + 2, 5, "F");
      }

      xPos = xOffset + 1;

      // Player name
      doc.setTextColor(...hexToRgb(colors.text));
      doc.setFont("helvetica", "bold");
      doc.text(`#${player.number} ${player.name}`.slice(0, 16), xPos, y + 3);
      xPos += 40;

      doc.setFont("helvetica", "normal");

      // MIN
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(adv.minutes.toString(), xPos + 6, y + 3, { align: "center" });
      xPos += 12;

      // TS% - color coded
      const tsColor = adv.ts >= 55 ? COLORS.success : adv.ts < 45 ? COLORS.danger : colors.text;
      doc.setTextColor(...hexToRgb(tsColor));
      doc.text(adv.ts.toFixed(1), xPos + 7, y + 3, { align: "center" });
      xPos += 14;

      // eFG% - color coded
      const efgColor = adv.efg >= 50 ? COLORS.success : adv.efg < 40 ? COLORS.danger : colors.text;
      doc.setTextColor(...hexToRgb(efgColor));
      doc.text(adv.efg.toFixed(1), xPos + 7, y + 3, { align: "center" });
      xPos += 14;

      // GER - color coded
      const gerColor = adv.ger >= 10 ? COLORS.success : adv.ger < 0 ? COLORS.danger : colors.text;
      doc.setTextColor(...hexToRgb(gerColor));
      doc.text(adv.ger.toString(), xPos + 6, y + 3, { align: "center" });
      xPos += 12;

      // A/TO
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(adv.atr.toFixed(1), xPos + 6, y + 3, { align: "center" });

      y += 5;
    }
  }

  // Return the maximum Y position
  return Math.max(y, startY) + 10;
}

// ============================================
// Per-Player Shot Charts Section
// ============================================

async function addPlayerShotChartsSection(
  doc: jsPDF,
  playerShotCharts: Map<string, string>, // playerId -> base64 image
  gameData: GameExportData,
  y: number,
  theme: "light" | "dark"
): Promise<number> {
  const colors = getColors(theme);
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;

  // Get all players who have shot charts
  const allPlayers = [...gameData.homeTeam.players, ...gameData.awayTeam.players];
  const playersWithShots = allPlayers.filter((p) => playerShotCharts.has(p.id));

  if (playersWithShots.length === 0) return y;

  // Section header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(colors.text));
  doc.text("INDIVIDUAL SHOT CHARTS", marginLeft, y);
  y += 8;

  // Calculate chart dimensions for 3 per row
  const chartsPerRow = 3;
  const chartMargin = 5;
  const availableWidth = pageWidth - 30;
  const chartWidth = (availableWidth - (chartsPerRow - 1) * chartMargin) / chartsPerRow;
  const chartHeight = chartWidth * 0.94;

  let chartIndex = 0;

  for (const player of playersWithShots) {
    const chartImage = playerShotCharts.get(player.id);
    if (!chartImage) continue;

    // Calculate position
    const col = chartIndex % chartsPerRow;
    const xPos = marginLeft + col * (chartWidth + chartMargin);

    // Check if we need a new row or page
    if (col === 0 && chartIndex > 0) {
      y += chartHeight + 20;
    }

    if (y + chartHeight + 15 > A4_HEIGHT - 20) {
      doc.addPage();
      if (theme === "dark") {
        doc.setFillColor(...hexToRgb(colors.bg));
        doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
      }
      y = 20;
    }

    // Draw chart
    doc.addImage(chartImage, "PNG", xPos, y, chartWidth, chartHeight);

    // Player name and team below chart
    const isHomePlayer = gameData.homeTeam.players.some((p) => p.id === player.id);
    const teamColor = isHomePlayer ? COLORS.primary : COLORS.info;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(teamColor));
    doc.text(
      `#${player.number} ${player.name}`.slice(0, 15),
      xPos + chartWidth / 2,
      y + chartHeight + 4,
      { align: "center" }
    );

    // Shot stats for this player
    const playerShots = gameData.shots.filter((s) => s.playerId === player.id);
    const made = playerShots.filter((s) => s.made).length;
    const total = playerShots.length;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...hexToRgb(colors.textSecondary));
    doc.text(
      `${made}/${total} (${formatPercentage(made, total)})`,
      xPos + chartWidth / 2,
      y + chartHeight + 9,
      { align: "center" }
    );

    chartIndex++;
  }

  // Account for the last row
  if (chartIndex > 0) {
    y += chartHeight + 15;
  }

  return y;
}

// ============================================
// Shot Charts Section
// ============================================

async function addShotChartsSection(
  doc: jsPDF,
  homeCourtImage: string | null,
  awayCourtImage: string | null,
  gameData: GameExportData,
  y: number,
  theme: "light" | "dark"
): Promise<number> {
  const colors = getColors(theme);
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;

  // Section header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(colors.text));
  doc.text("SHOT CHARTS", marginLeft, y);
  y += 8;

  const chartWidth = (pageWidth - 40) / 2;
  const chartHeight = chartWidth * 0.94; // Maintain aspect ratio

  // Home team shot chart
  if (homeCourtImage) {
    doc.addImage(homeCourtImage, "PNG", marginLeft, y, chartWidth, chartHeight);

    // Team label below chart
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(COLORS.primary));
    doc.text(gameData.homeTeam.name, marginLeft + chartWidth / 2, y + chartHeight + 6, {
      align: "center",
    });

    // Shooting stats
    const homeShots = gameData.shots.filter((s) => s.teamId === gameData.homeTeam.id);
    const homeMade = homeShots.filter((s) => s.made).length;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(colors.textSecondary));
    doc.text(
      `FG: ${homeMade}/${homeShots.length} (${formatPercentage(homeMade, homeShots.length)})`,
      marginLeft + chartWidth / 2,
      y + chartHeight + 12,
      { align: "center" }
    );
  }

  // Away team shot chart
  if (awayCourtImage) {
    const awayX = marginLeft + chartWidth + 10;
    doc.addImage(awayCourtImage, "PNG", awayX, y, chartWidth, chartHeight);

    // Team label below chart
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(COLORS.info));
    doc.text(gameData.awayTeam.name, awayX + chartWidth / 2, y + chartHeight + 6, {
      align: "center",
    });

    // Shooting stats
    const awayShots = gameData.shots.filter((s) => s.teamId === gameData.awayTeam.id);
    const awayMade = awayShots.filter((s) => s.made).length;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(colors.textSecondary));
    doc.text(
      `FG: ${awayMade}/${awayShots.length} (${formatPercentage(awayMade, awayShots.length)})`,
      awayX + chartWidth / 2,
      y + chartHeight + 12,
      { align: "center" }
    );
  }

  y += chartHeight + 20;

  // Zone Breakdown Table
  if (gameData.shots.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text("Shooting by Zone", marginLeft, y);
    y += 6;

    // Calculate zone stats for both teams
    const homeShots = gameData.shots.filter((s) => s.teamId === gameData.homeTeam.id);
    const awayShots = gameData.shots.filter((s) => s.teamId === gameData.awayTeam.id);

    const calcZoneStats = (shots: typeof gameData.shots) => {
      const zones = {
        paint: shots.filter((s) => s.zone === "paint" || s.zone === "restricted"),
        midRange: shots.filter((s) => s.zone === "midrange"),
        threePoint: shots.filter(
          (s) =>
            s.zone === "corner3" || s.zone === "wing3" || s.zone === "top3" || s.shotType === "3pt"
        ),
      };
      return {
        paint: {
          made: zones.paint.filter((s) => s.made).length,
          attempted: zones.paint.length,
        },
        midRange: {
          made: zones.midRange.filter((s) => s.made).length,
          attempted: zones.midRange.length,
        },
        threePoint: {
          made: zones.threePoint.filter((s) => s.made).length,
          attempted: zones.threePoint.length,
        },
      };
    };

    const homeZones = calcZoneStats(homeShots);
    const awayZones = calcZoneStats(awayShots);

    // Table header
    const tableWidth = pageWidth - 30;
    const colWidths = [50, 45, 45, 45];

    doc.setFillColor(...hexToRgb(theme === "dark" ? "#3d3835" : "#f3f0ed"));
    doc.rect(marginLeft, y, tableWidth, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...hexToRgb(colors.textSecondary));

    let xPos = marginLeft + 2;
    doc.text("Zone", xPos, y + 4);
    xPos += colWidths[0];
    doc.text(gameData.homeTeam.name.slice(0, 12), xPos + colWidths[1] / 2, y + 4, {
      align: "center",
    });
    xPos += colWidths[1];
    doc.text(gameData.awayTeam.name.slice(0, 12), xPos + colWidths[2] / 2, y + 4, {
      align: "center",
    });
    xPos += colWidths[2];
    doc.text("Difference", xPos + colWidths[3] / 2, y + 4, { align: "center" });

    y += 7;

    // Zone rows
    const zoneNames = [
      { key: "paint" as const, label: "Paint / Restricted" },
      { key: "midRange" as const, label: "Mid-Range" },
      { key: "threePoint" as const, label: "Three-Point" },
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    for (let i = 0; i < zoneNames.length; i++) {
      const { key, label } = zoneNames[i];
      const homeStats = homeZones[key];
      const awayStats = awayZones[key];

      if (i % 2 === 1) {
        doc.setFillColor(...hexToRgb(colors.card));
        doc.rect(marginLeft, y - 1, tableWidth, 6, "F");
      }

      xPos = marginLeft + 2;

      // Zone name
      doc.setTextColor(...hexToRgb(colors.text));
      doc.text(label, xPos, y + 3);
      xPos += colWidths[0];

      // Home team
      const homePct = homeStats.attempted > 0 ? (homeStats.made / homeStats.attempted) * 100 : 0;
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(
        `${homeStats.made}/${homeStats.attempted} (${homePct.toFixed(0)}%)`,
        xPos + colWidths[1] / 2,
        y + 3,
        { align: "center" }
      );
      xPos += colWidths[1];

      // Away team
      const awayPct = awayStats.attempted > 0 ? (awayStats.made / awayStats.attempted) * 100 : 0;
      doc.text(
        `${awayStats.made}/${awayStats.attempted} (${awayPct.toFixed(0)}%)`,
        xPos + colWidths[2] / 2,
        y + 3,
        { align: "center" }
      );
      xPos += colWidths[2];

      // Difference
      const diff = homePct - awayPct;
      const diffColor = diff > 0 ? COLORS.success : diff < 0 ? COLORS.danger : colors.textSecondary;
      doc.setTextColor(...hexToRgb(diffColor));
      doc.text(`${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`, xPos + colWidths[3] / 2, y + 3, {
        align: "center",
      });

      y += 6;
    }

    y += 5;
  }

  return y;
}

// ============================================
// Footer
// ============================================

function addFooter(doc: jsPDF, theme: "light" | "dark"): void {
  const colors = getColors(theme);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...hexToRgb(colors.textSecondary));
  doc.text("Generated by Basketball Stats App", pageWidth / 2, pageHeight - 10, {
    align: "center",
  });
}

// ============================================
// Main Export Functions
// ============================================

/**
 * Generate a full game report PDF
 */
export async function generateGameReportPDF(
  gameData: GameExportData,
  options: {
    settings?: Partial<PDFSettings>;
    homeCourtImage?: string | null;
    awayCourtImage?: string | null;
    playerShotCharts?: Map<string, string>; // playerId -> base64 image
    includeAdvancedStats?: boolean;
    includePlayerShotCharts?: boolean;
  } = {}
): Promise<Blob> {
  const settings: PDFSettings = { ...DEFAULT_PDF_SETTINGS, ...options.settings };
  const theme = settings.theme;
  const includeAdvancedStats = options.includeAdvancedStats ?? true;
  const includePlayerShotCharts = options.includePlayerShotCharts ?? true;

  const doc = new jsPDF({
    orientation: settings.orientation,
    unit: "mm",
    format: settings.pageSize,
  });

  // Helper to add page with dark theme background
  const addNewPage = () => {
    doc.addPage();
    if (theme === "dark") {
      const colors = getColors(theme);
      doc.setFillColor(...hexToRgb(colors.bg));
      doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
    }
    return 20; // Return starting Y position
  };

  // Set page background
  const colors = getColors(theme);
  if (theme === "dark") {
    doc.setFillColor(...hexToRgb(colors.bg));
    doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
  }

  let y: number;

  // Header
  const dateStr = formatDate(gameData.game.date);
  y = addHeader(doc, "Game Report", dateStr, theme);

  // Score summary
  y = addScoreSummary(doc, gameData, y, theme);

  // Box scores
  y = addBoxScoreTable(doc, gameData.homeTeam, y, theme, true);

  // Check if we need a new page
  if (y > A4_HEIGHT - 80) {
    y = addNewPage();
  }

  y = addBoxScoreTable(doc, gameData.awayTeam, y, theme, false);

  // Advanced Analytics Section
  if (includeAdvancedStats) {
    if (y > A4_HEIGHT - 100) {
      y = addNewPage();
    }
    y = addAdvancedStatsSection(doc, gameData.homeTeam, gameData.awayTeam, y, theme);
  }

  // Team Shot charts (if images provided)
  if (options.homeCourtImage || options.awayCourtImage) {
    if (y > A4_HEIGHT - 100) {
      y = addNewPage();
    }
    y = await addShotChartsSection(
      doc,
      options.homeCourtImage || null,
      options.awayCourtImage || null,
      gameData,
      y,
      theme
    );
  }

  // Individual Player Shot Charts
  if (includePlayerShotCharts && options.playerShotCharts && options.playerShotCharts.size > 0) {
    if (y > A4_HEIGHT - 100) {
      y = addNewPage();
    }
    y = await addPlayerShotChartsSection(doc, options.playerShotCharts, gameData, y, theme);
  }

  // Footer on last page
  addFooter(doc, theme);

  return doc.output("blob");
}

/**
 * Generate a single shot chart PDF (player or team)
 */
export async function generateShotChartPDF(
  courtImage: string,
  options: {
    title: string;
    subtitle?: string;
    stats?: {
      totalShots: number;
      madeShots: number;
      percentage: string;
      twoPoint?: { made: number; attempted: number; percentage: string };
      threePoint?: { made: number; attempted: number; percentage: string };
    };
    settings?: Partial<PDFSettings>;
  }
): Promise<Blob> {
  const settings: PDFSettings = { ...DEFAULT_PDF_SETTINGS, ...options.settings };
  const theme = settings.theme;

  const doc = new jsPDF({
    orientation: settings.orientation,
    unit: "mm",
    format: settings.pageSize,
  });

  const colors = getColors(theme);

  // Set page background
  if (theme === "dark") {
    doc.setFillColor(...hexToRgb(colors.bg));
    doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
  }

  let y: number;

  // Header
  y = addHeader(doc, options.title, options.subtitle || "", theme);

  // Shot chart image (centered, large)
  const chartWidth = 150;
  const chartHeight = chartWidth * 0.94;
  const chartX = (A4_WIDTH - chartWidth) / 2;

  doc.addImage(courtImage, "PNG", chartX, y, chartWidth, chartHeight);
  y += chartHeight + 15;

  // Stats summary
  if (options.stats) {
    const statsCardWidth = 160;
    const statsCardX = (A4_WIDTH - statsCardWidth) / 2;

    doc.setFillColor(...hexToRgb(colors.card));
    doc.roundedRect(statsCardX, y, statsCardWidth, 40, 3, 3, "F");

    // Main stat
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...hexToRgb(COLORS.primary));
    doc.text(options.stats.percentage, A4_WIDTH / 2, y + 15, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgb(colors.textSecondary));
    doc.text(
      `${options.stats.madeShots}/${options.stats.totalShots} Field Goals`,
      A4_WIDTH / 2,
      y + 23,
      { align: "center" }
    );

    // Sub stats
    if (options.stats.twoPoint && options.stats.threePoint) {
      const subStatsY = y + 34;
      doc.setFontSize(9);

      doc.text(
        `2PT: ${options.stats.twoPoint.made}/${options.stats.twoPoint.attempted} (${options.stats.twoPoint.percentage})`,
        statsCardX + 30,
        subStatsY,
        { align: "center" }
      );
      doc.text(
        `3PT: ${options.stats.threePoint.made}/${options.stats.threePoint.attempted} (${options.stats.threePoint.percentage})`,
        statsCardX + statsCardWidth - 30,
        subStatsY,
        { align: "center" }
      );
    }
  }

  // Footer
  addFooter(doc, theme);

  return doc.output("blob");
}

/**
 * Download a PDF blob as a file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// Utility Functions
// ============================================

function hexToRgb(hex: string): [number, number, number] {
  // Remove # if present
  hex = hex.replace("#", "");

  // Handle shorthand hex
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  // Handle hex with alpha
  if (hex.length === 8) {
    hex = hex.slice(0, 6);
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return [r, g, b];
}

// ============================================
// Season Summary PDF
// ============================================

export interface SeasonSummaryInput {
  league: {
    name: string;
    season: string;
    type?: string;
  };
  standings: Array<{
    rank: number;
    teamName: string;
    city?: string;
    wins: number;
    losses: number;
    winPercentage: number;
    gamesBack: number;
    pointDiff: number;
    avgPointsFor?: number;
    avgPointsAgainst?: number;
  }>;
  statLeaders?: {
    scoring?: Array<{ playerName: string; teamName: string; value: number }>;
    rebounds?: Array<{ playerName: string; teamName: string; value: number }>;
    assists?: Array<{ playerName: string; teamName: string; value: number }>;
    steals?: Array<{ playerName: string; teamName: string; value: number }>;
    blocks?: Array<{ playerName: string; teamName: string; value: number }>;
  };
  totalGames: number;
}

/**
 * Generate Season Summary PDF
 */
export async function generateSeasonSummaryPDF(
  data: SeasonSummaryInput,
  options: {
    settings?: Partial<PDFSettings>;
  } = {}
): Promise<Blob> {
  const settings: PDFSettings = { ...DEFAULT_PDF_SETTINGS, ...options.settings };
  const theme = settings.theme;

  const doc = new jsPDF({
    orientation: settings.orientation,
    unit: "mm",
    format: settings.pageSize,
  });

  const colors = getColors(theme);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Set page background for dark theme
  if (theme === "dark") {
    doc.setFillColor(...hexToRgb(colors.bg));
    doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
  }

  // Header
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  let y = addHeader(doc, `${data.league.name} - Season Summary`, generatedDate, theme);

  // League Info Section
  doc.setFillColor(...hexToRgb(colors.card));
  doc.roundedRect(15, y, pageWidth - 30, 20, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(colors.text));
  doc.text(data.league.name, 25, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(colors.textSecondary));
  doc.text(`Season: ${data.league.season}`, 25, y + 16);

  // Total games on right side
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(COLORS.primary));
  doc.text(`${data.totalGames}`, pageWidth - 25, y + 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...hexToRgb(colors.textSecondary));
  doc.text("Total Games", pageWidth - 25, y + 16, { align: "right" });

  y += 30;

  // Standings Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(colors.text));
  doc.text("STANDINGS", 15, y);
  y += 8;

  // Table header
  const standingsColumns = [
    { label: "#", width: 10 },
    { label: "Team", width: 55 },
    { label: "W", width: 15 },
    { label: "L", width: 15 },
    { label: "PCT", width: 20 },
    { label: "GB", width: 15 },
    { label: "PPG", width: 20 },
    { label: "OPPG", width: 20 },
    { label: "DIFF", width: 20 },
  ];

  // Header background
  doc.setFillColor(...hexToRgb(theme === "dark" ? "#3d3835" : "#f3f0ed"));
  doc.rect(15, y, pageWidth - 30, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...hexToRgb(colors.textSecondary));

  let xPos = 17;
  for (const col of standingsColumns) {
    doc.text(col.label, xPos, y + 5);
    xPos += col.width;
  }
  y += 9;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (let i = 0; i < Math.min(data.standings.length, 12); i++) {
    const team = data.standings[i];

    // Alternate row background
    if (i % 2 === 1) {
      doc.setFillColor(...hexToRgb(colors.card));
      doc.rect(15, y - 1, pageWidth - 30, 7, "F");
    }

    doc.setTextColor(...hexToRgb(colors.text));
    xPos = 17;

    // Rank
    doc.text(team.rank.toString(), xPos, y + 4);
    xPos += 10;

    // Team name
    doc.setFont("helvetica", "bold");
    doc.text(team.teamName.slice(0, 20), xPos, y + 4);
    doc.setFont("helvetica", "normal");
    xPos += 55;

    // W
    doc.setTextColor(...hexToRgb(COLORS.success));
    doc.text(team.wins.toString(), xPos, y + 4);
    xPos += 15;

    // L
    doc.setTextColor(...hexToRgb(COLORS.danger));
    doc.text(team.losses.toString(), xPos, y + 4);
    xPos += 15;

    // PCT
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text(`.${(team.winPercentage * 10).toFixed(0).padStart(3, "0")}`, xPos, y + 4);
    xPos += 20;

    // GB
    doc.setTextColor(...hexToRgb(colors.textSecondary));
    doc.text(team.gamesBack === 0 ? "-" : team.gamesBack.toFixed(1), xPos, y + 4);
    xPos += 15;

    // PPG
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text(team.avgPointsFor?.toFixed(1) || "-", xPos, y + 4);
    xPos += 20;

    // OPPG
    doc.text(team.avgPointsAgainst?.toFixed(1) || "-", xPos, y + 4);
    xPos += 20;

    // DIFF
    const diffColor =
      team.pointDiff > 0
        ? COLORS.success
        : team.pointDiff < 0
          ? COLORS.danger
          : colors.textSecondary;
    doc.setTextColor(...hexToRgb(diffColor));
    doc.text(`${team.pointDiff > 0 ? "+" : ""}${team.pointDiff.toFixed(1)}`, xPos, y + 4);

    y += 7;
  }

  y += 10;

  // Stat Leaders Section
  if (data.statLeaders && Object.keys(data.statLeaders).length > 0) {
    // Check if we need a new page
    if (y > A4_HEIGHT - 80) {
      doc.addPage();
      if (theme === "dark") {
        doc.setFillColor(...hexToRgb(colors.bg));
        doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
      }
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text("STAT LEADERS", 15, y);
    y += 10;

    const leaderCategories = [
      { key: "scoring", label: "Scoring (PPG)", data: data.statLeaders.scoring },
      { key: "rebounds", label: "Rebounds (RPG)", data: data.statLeaders.rebounds },
      { key: "assists", label: "Assists (APG)", data: data.statLeaders.assists },
      { key: "steals", label: "Steals (SPG)", data: data.statLeaders.steals },
      { key: "blocks", label: "Blocks (BPG)", data: data.statLeaders.blocks },
    ];

    const cardWidth = (pageWidth - 40) / 2;
    let cardX = 15;
    let cardY = y;
    let cardCount = 0;

    for (const category of leaderCategories) {
      if (!category.data || category.data.length === 0) continue;

      // Card background
      doc.setFillColor(...hexToRgb(colors.card));
      doc.roundedRect(cardX, cardY, cardWidth, 35, 2, 2, "F");

      // Category label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...hexToRgb(COLORS.primary));
      doc.text(category.label, cardX + 5, cardY + 7);

      // Top 3 leaders
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const top3 = category.data.slice(0, 3);
      let leaderY = cardY + 14;

      for (let i = 0; i < top3.length; i++) {
        const leader = top3[i];
        doc.setTextColor(...hexToRgb(colors.text));
        doc.text(`${i + 1}. ${leader.playerName}`, cardX + 5, leaderY);
        doc.setTextColor(...hexToRgb(colors.textSecondary));
        doc.text(leader.teamName, cardX + 5, leaderY + 4);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...hexToRgb(COLORS.primary));
        doc.text(leader.value.toFixed(1), cardX + cardWidth - 10, leaderY + 2, { align: "right" });
        doc.setFont("helvetica", "normal");
        leaderY += 10;
      }

      cardCount++;
      if (cardCount % 2 === 0) {
        cardX = 15;
        cardY += 40;
      } else {
        cardX = 15 + cardWidth + 10;
      }
    }
  }

  // Footer
  addFooter(doc, theme);

  return doc.output("blob");
}

// ============================================
// Team Season PDF
// ============================================

export interface TeamSeasonPDFInput {
  team: {
    id: string;
    name: string;
    city?: string;
    wins: number;
    losses: number;
    winPercentage: number;
  };
  season: string;
  players: Array<{
    id: string;
    name: string;
    number: number;
    position?: string;
    gamesPlayed?: number;
    stats?: {
      avgPoints?: number;
      avgRebounds?: number;
      avgAssists?: number;
      avgSteals?: number;
      avgBlocks?: number;
      avgTurnovers?: number;
      fieldGoalPercentage?: number;
      threePointPercentage?: number;
      freeThrowPercentage?: number;
      // Advanced stats
      trueShootingPercentage?: number;
      effectiveFieldGoalPercentage?: number;
      playerEfficiencyRating?: number;
      assistToTurnoverRatio?: number;
    };
  }>;
  games: Array<{
    id: string;
    date?: number;
    opponent?: string;
    homeGame: boolean;
    teamScore: number;
    opponentScore: number;
    result: "W" | "L" | "N/A";
  }>;
  lineups: Array<{
    players: Array<{ name: string; number: number }>;
    minutesPlayed: number;
    pointsScored: number;
    pointsAllowed: number;
    plusMinus: number;
    netRating: number;
    gamesPlayed: number;
  }>;
  pairs: Array<{
    player1: { name: string; number: number };
    player2: { name: string; number: number };
    minutesTogether: number;
    plusMinus: number;
    netRating: number;
    gamesPlayed: number;
  }>;
  // Team shooting stats by zone (for shot charts section)
  shootingByZone?: {
    paint: { made: number; attempted: number };
    midRange: { made: number; attempted: number };
    threePoint: { made: number; attempted: number };
  };
  // Pre-captured shot chart image (base64)
  shotChartImage?: string;
  options: {
    sections: {
      seasonSummary: boolean;
      playerStats: boolean;
      gameLog: boolean;
      lineupAnalysis: boolean;
      shotCharts: boolean;
      advancedStats: boolean;
    };
    theme: "light" | "dark";
  };
}

/**
 * Generate Team Season PDF
 */
export async function generateTeamSeasonPDF(data: TeamSeasonPDFInput): Promise<Blob> {
  const theme = data.options.theme;
  const sections = data.options.sections;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const colors = getColors(theme);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Helper to add page with dark theme background
  const addNewPage = () => {
    doc.addPage();
    if (theme === "dark") {
      doc.setFillColor(...hexToRgb(colors.bg));
      doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
    }
    return 20;
  };

  // Set page background
  if (theme === "dark") {
    doc.setFillColor(...hexToRgb(colors.bg));
    doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
  }

  // Header
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  let y = addHeader(doc, `${data.team.name} - Season Report`, generatedDate, theme);

  // Season Summary Section
  if (sections.seasonSummary) {
    // Team overview card
    doc.setFillColor(...hexToRgb(colors.card));
    doc.roundedRect(15, y, pageWidth - 30, 35, 3, 3, "F");

    // Team name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text(data.team.name, 25, y + 12);

    if (data.team.city) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(data.team.city, 25, y + 19);
    }

    doc.setFontSize(9);
    doc.text(`Season: ${data.season}`, 25, y + 28);

    // Record stats on right side
    const recordX = pageWidth - 60;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...hexToRgb(COLORS.primary));
    doc.text(`${data.team.wins}-${data.team.losses}`, recordX, y + 15, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgb(colors.textSecondary));
    doc.text("Record", recordX, y + 22, { align: "center" });

    // Win percentage
    const winPct = (data.team.winPercentage * 100).toFixed(1);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text(`${winPct}%`, recordX + 40, y + 15, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgb(colors.textSecondary));
    doc.text("Win %", recordX + 40, y + 22, { align: "center" });

    y += 45;
  }

  // Player Stats Section
  if (sections.playerStats && data.players.length > 0) {
    if (y > A4_HEIGHT - 100) {
      y = addNewPage();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text("ROSTER & PLAYER STATISTICS", 15, y);
    y += 8;

    // Table header
    const playerColumns = [
      { label: "#", width: 10 },
      { label: "Player", width: 45 },
      { label: "Pos", width: 15 },
      { label: "GP", width: 12 },
      { label: "PPG", width: 15 },
      { label: "RPG", width: 15 },
      { label: "APG", width: 15 },
      { label: "FG%", width: 18 },
      { label: "3P%", width: 18 },
      { label: "FT%", width: 18 },
    ];

    // Header background
    doc.setFillColor(...hexToRgb(theme === "dark" ? "#3d3835" : "#f3f0ed"));
    doc.rect(15, y, pageWidth - 30, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(colors.textSecondary));

    let xPos = 17;
    for (const col of playerColumns) {
      doc.text(col.label, xPos, y + 5);
      xPos += col.width;
    }
    y += 9;

    // Player rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    const sortedPlayers = [...data.players].sort((a, b) => a.number - b.number);

    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];

      // Check for page break
      if (y > A4_HEIGHT - 20) {
        y = addNewPage();
      }

      // Alternate row background
      if (i % 2 === 1) {
        doc.setFillColor(...hexToRgb(colors.card));
        doc.rect(15, y - 1, pageWidth - 30, 6, "F");
      }

      xPos = 17;

      // Number
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(player.number.toString(), xPos, y + 3);
      xPos += 10;

      // Name
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...hexToRgb(colors.text));
      doc.text(player.name.slice(0, 20), xPos, y + 3);
      doc.setFont("helvetica", "normal");
      xPos += 45;

      // Position
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(player.position || "-", xPos, y + 3);
      xPos += 15;

      // Stats (GP, PPG, RPG, APG, FG%, 3P%, FT%)
      const stats = player.stats || {};
      const statValues = [
        player.gamesPlayed?.toString() || "-",
        stats.avgPoints?.toFixed(1) || "-",
        stats.avgRebounds?.toFixed(1) || "-",
        stats.avgAssists?.toFixed(1) || "-",
        stats.fieldGoalPercentage ? `${(stats.fieldGoalPercentage * 100).toFixed(1)}` : "-",
        stats.threePointPercentage ? `${(stats.threePointPercentage * 100).toFixed(1)}` : "-",
        stats.freeThrowPercentage ? `${(stats.freeThrowPercentage * 100).toFixed(1)}` : "-",
      ];

      const statWidths = [12, 15, 15, 15, 18, 18, 18];
      for (let j = 0; j < statValues.length; j++) {
        doc.text(statValues[j], xPos + statWidths[j] / 2, y + 3, { align: "center" });
        xPos += statWidths[j];
      }

      y += 6;
    }

    y += 10;
  }

  // Game Log Section
  if (sections.gameLog && data.games.length > 0) {
    if (y > A4_HEIGHT - 80) {
      y = addNewPage();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text("GAME LOG", 15, y);
    y += 8;

    // Table header
    const gameColumns = [
      { label: "Date", width: 30 },
      { label: "Opponent", width: 50 },
      { label: "H/A", width: 15 },
      { label: "Result", width: 20 },
      { label: "Score", width: 25 },
    ];

    // Header background
    doc.setFillColor(...hexToRgb(theme === "dark" ? "#3d3835" : "#f3f0ed"));
    doc.rect(15, y, 140, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(colors.textSecondary));

    let xPos = 17;
    for (const col of gameColumns) {
      doc.text(col.label, xPos, y + 5);
      xPos += col.width;
    }
    y += 9;

    // Game rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    // Sort games by date descending
    const sortedGames = [...data.games].sort((a, b) => (b.date || 0) - (a.date || 0));

    for (let i = 0; i < Math.min(sortedGames.length, 20); i++) {
      const game = sortedGames[i];

      if (y > A4_HEIGHT - 20) {
        y = addNewPage();
      }

      // Alternate row background
      if (i % 2 === 1) {
        doc.setFillColor(...hexToRgb(colors.card));
        doc.rect(15, y - 1, 140, 6, "F");
      }

      xPos = 17;

      // Date
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      const dateStr = game.date ? new Date(game.date).toLocaleDateString() : "TBD";
      doc.text(dateStr, xPos, y + 3);
      xPos += 30;

      // Opponent
      doc.setTextColor(...hexToRgb(colors.text));
      doc.text((game.opponent || "TBD").slice(0, 22), xPos, y + 3);
      xPos += 50;

      // H/A
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(game.homeGame ? "Home" : "Away", xPos, y + 3);
      xPos += 15;

      // Result
      if (game.result === "W") {
        doc.setTextColor(...hexToRgb(COLORS.success));
        doc.setFont("helvetica", "bold");
      } else if (game.result === "L") {
        doc.setTextColor(...hexToRgb(COLORS.danger));
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(...hexToRgb(colors.textSecondary));
      }
      doc.text(game.result, xPos, y + 3);
      doc.setFont("helvetica", "normal");
      xPos += 20;

      // Score
      doc.setTextColor(...hexToRgb(colors.text));
      doc.text(`${game.teamScore}-${game.opponentScore}`, xPos, y + 3);

      y += 6;
    }

    if (data.games.length > 20) {
      y += 2;
      doc.setFontSize(6);
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(`... and ${data.games.length - 20} more games`, 17, y + 3);
      y += 6;
    }

    y += 10;
  }

  // Lineup Analysis Section
  if (sections.lineupAnalysis && (data.lineups.length > 0 || data.pairs.length > 0)) {
    if (y > A4_HEIGHT - 80) {
      y = addNewPage();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text("LINEUP ANALYSIS", 15, y);
    y += 8;

    // Top 5-man Lineups
    if (data.lineups.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text("Top 5-Man Lineups", 15, y);
      y += 6;

      for (let i = 0; i < Math.min(data.lineups.length, 5); i++) {
        const lineup = data.lineups[i];

        if (y > A4_HEIGHT - 20) {
          y = addNewPage();
        }

        // Background
        doc.setFillColor(...hexToRgb(i % 2 === 0 ? colors.card : colors.bg));
        doc.rect(15, y - 1, pageWidth - 30, 12, "F");

        // Rank
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...hexToRgb(COLORS.primary));
        doc.text(`#${i + 1}`, 17, y + 4);

        // Players
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb(colors.text));
        const playerNames = lineup.players.map((p) => `#${p.number} ${p.name}`).join(" • ");
        doc.text(playerNames.slice(0, 80), 28, y + 4);

        // Stats
        doc.setTextColor(...hexToRgb(colors.textSecondary));
        doc.text(`${Math.round(lineup.minutesPlayed)} min`, 28, y + 9);

        const pmColor =
          lineup.plusMinus > 0
            ? COLORS.success
            : lineup.plusMinus < 0
              ? COLORS.danger
              : colors.textSecondary;
        doc.setTextColor(...hexToRgb(pmColor));
        doc.setFont("helvetica", "bold");
        doc.text(`${lineup.plusMinus > 0 ? "+" : ""}${lineup.plusMinus}`, pageWidth - 35, y + 6, {
          align: "right",
        });

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...hexToRgb(colors.textSecondary));
        doc.text(`Net: ${lineup.netRating.toFixed(1)}`, pageWidth - 18, y + 6, { align: "right" });

        y += 13;
      }

      y += 5;
    }

    // Top Pairs
    if (data.pairs.length > 0) {
      if (y > A4_HEIGHT - 60) {
        y = addNewPage();
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text("Top Player Pairs", 15, y);
      y += 6;

      for (let i = 0; i < Math.min(data.pairs.length, 8); i++) {
        const pair = data.pairs[i];

        if (y > A4_HEIGHT - 15) {
          y = addNewPage();
        }

        // Background
        if (i % 2 === 0) {
          doc.setFillColor(...hexToRgb(colors.card));
          doc.rect(15, y - 1, pageWidth - 30, 6, "F");
        }

        // Rank
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...hexToRgb(colors.textSecondary));
        doc.text(`${i + 1}.`, 17, y + 3);

        // Players
        doc.setTextColor(...hexToRgb(colors.text));
        doc.text(
          `#${pair.player1.number} ${pair.player1.name} + #${pair.player2.number} ${pair.player2.name}`,
          25,
          y + 3
        );

        // Stats
        doc.setTextColor(...hexToRgb(colors.textSecondary));
        doc.text(`${Math.round(pair.minutesTogether)} min`, 130, y + 3);

        const pmColor =
          pair.plusMinus > 0
            ? COLORS.success
            : pair.plusMinus < 0
              ? COLORS.danger
              : colors.textSecondary;
        doc.setTextColor(...hexToRgb(pmColor));
        doc.text(`${pair.plusMinus > 0 ? "+" : ""}${pair.plusMinus}`, 155, y + 3);

        y += 6;
      }
    }
  }

  // Advanced Stats Section
  if (sections.advancedStats && data.players.length > 0) {
    // Check if any players have advanced stats
    const playersWithAdvStats = data.players.filter(
      (p) =>
        p.stats?.trueShootingPercentage !== undefined ||
        p.stats?.playerEfficiencyRating !== undefined
    );

    if (playersWithAdvStats.length > 0) {
      if (y > A4_HEIGHT - 80) {
        y = addNewPage();
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...hexToRgb(colors.text));
      doc.text("ADVANCED ANALYTICS", 15, y);
      y += 8;

      // Table header
      const advColumns = [
        { label: "#", width: 10 },
        { label: "Player", width: 45 },
        { label: "GP", width: 12 },
        { label: "PPG", width: 15 },
        { label: "TS%", width: 18 },
        { label: "eFG%", width: 18 },
        { label: "PER", width: 15 },
        { label: "A/TO", width: 15 },
      ];

      // Header background
      doc.setFillColor(...hexToRgb(theme === "dark" ? "#3d3835" : "#f3f0ed"));
      doc.rect(15, y, 148, 7, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...hexToRgb(colors.textSecondary));

      let xPos = 17;
      for (const col of advColumns) {
        doc.text(col.label, xPos, y + 5);
        xPos += col.width;
      }
      y += 9;

      // Sort by PER or points
      const sortedPlayers = [...playersWithAdvStats].sort((a, b) => {
        const aVal = a.stats?.playerEfficiencyRating ?? a.stats?.avgPoints ?? 0;
        const bVal = b.stats?.playerEfficiencyRating ?? b.stats?.avgPoints ?? 0;
        return bVal - aVal;
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      for (let i = 0; i < Math.min(sortedPlayers.length, 12); i++) {
        const player = sortedPlayers[i];
        const stats = player.stats || {};

        if (y > A4_HEIGHT - 20) {
          y = addNewPage();
        }

        // Alternate row background
        if (i % 2 === 1) {
          doc.setFillColor(...hexToRgb(colors.card));
          doc.rect(15, y - 1, 148, 6, "F");
        }

        xPos = 17;

        // Number
        doc.setTextColor(...hexToRgb(colors.textSecondary));
        doc.text(player.number.toString(), xPos, y + 3);
        xPos += 10;

        // Name
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...hexToRgb(colors.text));
        doc.text(player.name.slice(0, 18), xPos, y + 3);
        doc.setFont("helvetica", "normal");
        xPos += 45;

        // GP
        doc.setTextColor(...hexToRgb(colors.textSecondary));
        doc.text((player.gamesPlayed ?? 0).toString(), xPos + 6, y + 3, { align: "center" });
        xPos += 12;

        // PPG
        doc.text((stats.avgPoints ?? 0).toFixed(1), xPos + 7.5, y + 3, { align: "center" });
        xPos += 15;

        // TS% - color coded
        const ts = stats.trueShootingPercentage ?? 0;
        const tsColor = ts >= 55 ? COLORS.success : ts < 45 ? COLORS.danger : colors.text;
        doc.setTextColor(...hexToRgb(tsColor));
        doc.text(ts.toFixed(1), xPos + 9, y + 3, { align: "center" });
        xPos += 18;

        // eFG% - color coded
        const efg = stats.effectiveFieldGoalPercentage ?? 0;
        const efgColor = efg >= 50 ? COLORS.success : efg < 40 ? COLORS.danger : colors.text;
        doc.setTextColor(...hexToRgb(efgColor));
        doc.text(efg.toFixed(1), xPos + 9, y + 3, { align: "center" });
        xPos += 18;

        // PER - color coded
        const per = stats.playerEfficiencyRating ?? 0;
        const perColor = per >= 15 ? COLORS.success : per < 10 ? COLORS.danger : colors.text;
        doc.setTextColor(...hexToRgb(perColor));
        doc.text(per.toFixed(1), xPos + 7.5, y + 3, { align: "center" });
        xPos += 15;

        // A/TO
        const ato = stats.assistToTurnoverRatio ?? 0;
        doc.setTextColor(...hexToRgb(colors.textSecondary));
        doc.text(ato.toFixed(1), xPos + 7.5, y + 3, { align: "center" });

        y += 6;
      }

      y += 10;
    }
  }

  // Shot Charts Section (Zone Breakdown)
  if (sections.shotCharts && (data.shootingByZone || data.shotChartImage)) {
    if (y > A4_HEIGHT - 80) {
      y = addNewPage();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text("TEAM SHOOTING BREAKDOWN", 15, y);
    y += 10;

    // Add visual shot chart if provided
    if (data.shotChartImage) {
      const chartWidth = 120;
      const chartHeight = 113; // Maintains court aspect ratio
      const chartX = (pageWidth - chartWidth) / 2;

      // Add the shot chart image centered
      doc.addImage(data.shotChartImage, "PNG", chartX, y, chartWidth, chartHeight);
      y += chartHeight + 10;
    }

    // Zone breakdown cards (only if zone data is available)
    if (data.shootingByZone) {
      const zones = [
        {
          name: "Paint / Restricted Area",
          icon: "🎯",
          data: data.shootingByZone.paint,
          benchmark: 60, // Good FG% in paint
        },
        {
          name: "Mid-Range",
          icon: "📍",
          data: data.shootingByZone.midRange,
          benchmark: 42, // Good mid-range %
        },
        {
          name: "Three-Point",
          icon: "🏀",
          data: data.shootingByZone.threePoint,
          benchmark: 36, // Good 3PT%
        },
      ];

      const totalAttempts = zones.reduce((sum, z) => sum + z.data.attempted, 0) || 1;

      // Create zone cards
      const cardWidth = (pageWidth - 40) / 3;
      let cardX = 15;

      for (const zone of zones) {
        const pct = zone.data.attempted > 0 ? (zone.data.made / zone.data.attempted) * 100 : 0;
        const shotShare = (zone.data.attempted / totalAttempts) * 100;

        // Card background
        doc.setFillColor(...hexToRgb(colors.card));
        doc.roundedRect(cardX, y, cardWidth, 45, 2, 2, "F");

        // Zone name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...hexToRgb(colors.text));
        doc.text(zone.name, cardX + cardWidth / 2, y + 8, { align: "center" });

        // Percentage (large)
        const pctColor =
          pct >= zone.benchmark
            ? COLORS.success
            : pct < zone.benchmark - 10
              ? COLORS.danger
              : colors.text;
        doc.setFontSize(18);
        doc.setTextColor(...hexToRgb(pctColor));
        doc.text(`${pct.toFixed(1)}%`, cardX + cardWidth / 2, y + 22, { align: "center" });

        // Made/Attempted
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...hexToRgb(colors.textSecondary));
        doc.text(`${zone.data.made}/${zone.data.attempted}`, cardX + cardWidth / 2, y + 30, {
          align: "center",
        });

        // Shot share
        doc.setFontSize(6);
        doc.text(`${shotShare.toFixed(0)}% of shots`, cardX + cardWidth / 2, y + 38, {
          align: "center",
        });

        cardX += cardWidth + 5;
      }

      y += 55;
    }
  }

  // Footer
  addFooter(doc, theme);

  return doc.output("blob");
}

// ============================================
// Player Season PDF
// ============================================

export interface PlayerSeasonPDFInput {
  player: {
    id: string;
    name: string;
    number: number;
    position?: string;
    team?: {
      id: string;
      name: string;
    };
  };
  season: string;
  stats: {
    gamesPlayed: number;
    avgPoints: number;
    avgRebounds: number;
    avgAssists: number;
    avgSteals: number;
    avgBlocks: number;
    avgTurnovers: number;
    avgMinutes: number;
    totalPoints: number;
    totalRebounds: number;
    totalAssists: number;
    totalSteals: number;
    totalBlocks: number;
    totalTurnovers: number;
    totalFouls: number;
    totalFieldGoalsMade: number;
    totalFieldGoalsAttempted: number;
    totalThreePointersMade: number;
    totalThreePointersAttempted: number;
    totalFreeThrowsMade: number;
    totalFreeThrowsAttempted: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
    // Advanced stats
    trueShootingPercentage?: number;
    effectiveFieldGoalPercentage?: number;
    playerEfficiencyRating?: number;
  };
  games: Array<{
    id: string;
    date?: number;
    opponent?: string;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    minutes: number;
  }>;
  // Pre-captured shot chart image (base64)
  shotChartImage?: string;
  // Shot zone stats for text breakdown
  shootingByZone?: {
    paint: { made: number; attempted: number };
    midRange: { made: number; attempted: number };
    threePoint: { made: number; attempted: number };
  };
  options: {
    sections: {
      seasonSummary: boolean;
      shotChart: boolean;
      gameLog: boolean;
      advancedStats: boolean;
    };
    theme: "light" | "dark";
  };
}

/**
 * Generate Player Season PDF
 */
export async function generatePlayerSeasonPDF(data: PlayerSeasonPDFInput): Promise<Blob> {
  const theme = data.options.theme;
  const sections = data.options.sections;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const colors = getColors(theme);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Helper to add page with dark theme background
  const addNewPage = () => {
    doc.addPage();
    if (theme === "dark") {
      doc.setFillColor(...hexToRgb(colors.bg));
      doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
    }
    return 20;
  };

  // Set page background
  if (theme === "dark") {
    doc.setFillColor(...hexToRgb(colors.bg));
    doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
  }

  // Header
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  let y = addHeader(doc, `${data.player.name} - Season Report`, generatedDate, theme);

  // Player Info Card
  if (sections.seasonSummary) {
    // Player header card
    doc.setFillColor(...hexToRgb(COLORS.primary));
    doc.roundedRect(15, y, pageWidth - 30, 40, 3, 3, "F");

    // Player number circle
    doc.setFillColor(255, 255, 255);
    doc.circle(35, y + 20, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...hexToRgb(COLORS.primary));
    doc.text(`#${data.player.number}`, 35, y + 23, { align: "center" });

    // Player name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(data.player.name, 55, y + 16);

    // Position and team
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    const positionText = data.player.position || "N/A";
    const teamText = data.player.team?.name || "No Team";
    doc.text(`${positionText} • ${teamText}`, 55, y + 26);

    // Season
    doc.setFontSize(9);
    doc.text(`${data.season} Season`, 55, y + 34);

    y += 50;

    // Stats grid
    const statBoxWidth = (pageWidth - 40) / 4;
    const stats = data.stats;

    const keyStats = [
      { label: "PPG", value: stats.avgPoints.toFixed(1), highlight: true },
      { label: "RPG", value: stats.avgRebounds.toFixed(1), highlight: true },
      { label: "APG", value: stats.avgAssists.toFixed(1), highlight: true },
      { label: "GP", value: stats.gamesPlayed.toString(), highlight: false },
    ];

    let statX = 15;
    for (const stat of keyStats) {
      doc.setFillColor(...hexToRgb(colors.card));
      doc.roundedRect(statX, y, statBoxWidth, 35, 2, 2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(stat.label, statX + statBoxWidth / 2, y + 10, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(...hexToRgb(stat.highlight ? COLORS.primary : colors.text));
      doc.text(stat.value, statX + statBoxWidth / 2, y + 26, { align: "center" });

      statX += statBoxWidth + 5;
    }

    y += 45;

    // Secondary stats row
    const secondaryStats = [
      { label: "FG%", value: `${stats.fieldGoalPercentage.toFixed(1)}%` },
      { label: "3P%", value: `${stats.threePointPercentage.toFixed(1)}%` },
      { label: "FT%", value: `${stats.freeThrowPercentage.toFixed(1)}%` },
      { label: "SPG", value: stats.avgSteals.toFixed(1) },
      { label: "BPG", value: stats.avgBlocks.toFixed(1) },
      { label: "MPG", value: stats.avgMinutes.toFixed(1) },
    ];

    const smallStatWidth = (pageWidth - 40) / 6;
    statX = 15;
    for (const stat of secondaryStats) {
      doc.setFillColor(...hexToRgb(colors.card));
      doc.roundedRect(statX, y, smallStatWidth, 25, 2, 2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(stat.label, statX + smallStatWidth / 2, y + 8, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...hexToRgb(colors.text));
      doc.text(stat.value, statX + smallStatWidth / 2, y + 19, { align: "center" });

      statX += smallStatWidth + 2;
    }

    y += 35;
  }

  // Shot Chart Section
  if (sections.shotChart && (data.shotChartImage || data.shootingByZone)) {
    if (y > A4_HEIGHT - 150) {
      y = addNewPage();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text("SHOT CHART", 15, y);
    y += 8;

    // Add visual shot chart if provided
    if (data.shotChartImage) {
      const chartWidth = 130;
      const chartHeight = 122; // Maintains court aspect ratio
      const chartX = (pageWidth - chartWidth) / 2;

      doc.addImage(data.shotChartImage, "PNG", chartX, y, chartWidth, chartHeight);
      y += chartHeight + 8;
    }

    // Zone breakdown cards
    if (data.shootingByZone) {
      const zones = [
        { name: "Paint", data: data.shootingByZone.paint, benchmark: 60 },
        { name: "Mid-Range", data: data.shootingByZone.midRange, benchmark: 42 },
        { name: "3-Point", data: data.shootingByZone.threePoint, benchmark: 36 },
      ];

      const cardWidth = (pageWidth - 40) / 3;
      let cardX = 15;

      for (const zone of zones) {
        const pct = zone.data.attempted > 0 ? (zone.data.made / zone.data.attempted) * 100 : 0;

        doc.setFillColor(...hexToRgb(colors.card));
        doc.roundedRect(cardX, y, cardWidth, 30, 2, 2, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...hexToRgb(colors.text));
        doc.text(zone.name, cardX + cardWidth / 2, y + 8, { align: "center" });

        const pctColor =
          pct >= zone.benchmark
            ? COLORS.success
            : pct < zone.benchmark - 10
              ? COLORS.danger
              : colors.text;
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(pctColor));
        doc.text(`${pct.toFixed(1)}%`, cardX + cardWidth / 2, y + 19, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb(colors.textSecondary));
        doc.text(`${zone.data.made}/${zone.data.attempted}`, cardX + cardWidth / 2, y + 26, {
          align: "center",
        });

        cardX += cardWidth + 5;
      }

      y += 40;
    }
  }

  // Game Log Section
  if (sections.gameLog && data.games.length > 0) {
    if (y > A4_HEIGHT - 80) {
      y = addNewPage();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text("GAME LOG", 15, y);
    y += 8;

    // Table header
    const gameColumns = [
      { label: "Date", width: 28 },
      { label: "Opponent", width: 35 },
      { label: "PTS", width: 15 },
      { label: "REB", width: 15 },
      { label: "AST", width: 15 },
      { label: "FG", width: 22 },
      { label: "3PT", width: 22 },
      { label: "MIN", width: 15 },
    ];

    // Header background
    doc.setFillColor(...hexToRgb(theme === "dark" ? "#3d3835" : "#f3f0ed"));
    doc.rect(15, y, pageWidth - 30, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...hexToRgb(colors.textSecondary));

    let xPos = 17;
    for (const col of gameColumns) {
      doc.text(col.label, xPos, y + 5);
      xPos += col.width;
    }
    y += 9;

    // Game rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);

    const gamesToShow = data.games.slice(0, 15);
    for (let i = 0; i < gamesToShow.length; i++) {
      const game = gamesToShow[i];

      if (y > A4_HEIGHT - 15) {
        y = addNewPage();
      }

      // Alternate row background
      if (i % 2 === 1) {
        doc.setFillColor(...hexToRgb(colors.card));
        doc.rect(15, y - 1, pageWidth - 30, 6, "F");
      }

      xPos = 17;

      // Date
      doc.setTextColor(...hexToRgb(colors.text));
      const dateStr = game.date
        ? new Date(game.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "N/A";
      doc.text(dateStr, xPos, y + 3);
      xPos += 28;

      // Opponent
      doc.text((game.opponent || "TBD").slice(0, 15), xPos, y + 3);
      xPos += 35;

      // Points
      doc.setFont("helvetica", "bold");
      doc.text(game.points.toString(), xPos + 7.5, y + 3, { align: "center" });
      doc.setFont("helvetica", "normal");
      xPos += 15;

      // Rebounds
      doc.text(game.rebounds.toString(), xPos + 7.5, y + 3, { align: "center" });
      xPos += 15;

      // Assists
      doc.text(game.assists.toString(), xPos + 7.5, y + 3, { align: "center" });
      xPos += 15;

      // FG
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(`${game.fieldGoalsMade}/${game.fieldGoalsAttempted}`, xPos + 11, y + 3, {
        align: "center",
      });
      xPos += 22;

      // 3PT
      doc.text(`${game.threePointersMade}/${game.threePointersAttempted}`, xPos + 11, y + 3, {
        align: "center",
      });
      xPos += 22;

      // Minutes
      doc.text(Math.round(game.minutes).toString(), xPos + 7.5, y + 3, { align: "center" });

      y += 6;
    }

    if (data.games.length > 15) {
      y += 2;
      doc.setFontSize(6);
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(`... and ${data.games.length - 15} more games`, 17, y + 3);
      y += 6;
    }

    y += 10;
  }

  // Advanced Stats Section
  if (sections.advancedStats && data.stats.trueShootingPercentage !== undefined) {
    if (y > A4_HEIGHT - 60) {
      y = addNewPage();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text("ADVANCED ANALYTICS", 15, y);
    y += 10;

    const advancedStats = [
      {
        label: "True Shooting %",
        value: data.stats.trueShootingPercentage?.toFixed(1) || "N/A",
        benchmark: 55,
      },
      {
        label: "Effective FG%",
        value: data.stats.effectiveFieldGoalPercentage?.toFixed(1) || "N/A",
        benchmark: 50,
      },
      {
        label: "Player Efficiency",
        value: data.stats.playerEfficiencyRating?.toFixed(1) || "N/A",
        benchmark: 15,
      },
    ];

    const advCardWidth = (pageWidth - 40) / 3;
    let advX = 15;

    for (const stat of advancedStats) {
      doc.setFillColor(...hexToRgb(colors.card));
      doc.roundedRect(advX, y, advCardWidth, 35, 2, 2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(stat.label, advX + advCardWidth / 2, y + 10, { align: "center" });

      const numValue = parseFloat(stat.value);
      const statColor = !isNaN(numValue)
        ? numValue >= stat.benchmark
          ? COLORS.success
          : numValue < stat.benchmark - 10
            ? COLORS.danger
            : colors.text
        : colors.text;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...hexToRgb(statColor));
      doc.text(
        stat.value !== "N/A" ? `${stat.value}%` : stat.value,
        advX + advCardWidth / 2,
        y + 26,
        {
          align: "center",
        }
      );

      advX += advCardWidth + 5;
    }

    y += 45;

    // Career totals section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text("Season Totals", 15, y);
    y += 8;

    const totals = [
      { label: "Points", value: data.stats.totalPoints },
      { label: "Rebounds", value: data.stats.totalRebounds },
      { label: "Assists", value: data.stats.totalAssists },
      { label: "Steals", value: data.stats.totalSteals },
      { label: "Blocks", value: data.stats.totalBlocks },
      { label: "Turnovers", value: data.stats.totalTurnovers },
    ];

    doc.setFillColor(...hexToRgb(colors.card));
    doc.roundedRect(15, y, pageWidth - 30, 20, 2, 2, "F");

    const totalWidth = (pageWidth - 40) / totals.length;
    let totalX = 20;

    for (const total of totals) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(...hexToRgb(colors.textSecondary));
      doc.text(total.label, totalX + totalWidth / 2, y + 6, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...hexToRgb(colors.text));
      doc.text(total.value.toString(), totalX + totalWidth / 2, y + 15, { align: "center" });

      totalX += totalWidth;
    }
  }

  // Footer
  addFooter(doc, theme);

  return doc.output("blob");
}
