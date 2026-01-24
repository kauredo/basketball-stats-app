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

  // Column headers
  const columns = [
    { label: "Player", width: 45, align: "left" as const },
    { label: "MIN", width: 12, align: "center" as const },
    { label: "PTS", width: 12, align: "center" as const },
    { label: "REB", width: 12, align: "center" as const },
    { label: "AST", width: 12, align: "center" as const },
    { label: "STL", width: 12, align: "center" as const },
    { label: "BLK", width: 12, align: "center" as const },
    { label: "TO", width: 10, align: "center" as const },
    { label: "PF", width: 10, align: "center" as const },
    { label: "FG", width: 18, align: "center" as const },
    { label: "3PT", width: 18, align: "center" as const },
    { label: "FT", width: 18, align: "center" as const },
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

    // Player name with number
    doc.setFont("helvetica", "bold");
    doc.text(`#${player.number} ${player.name}`.slice(0, 22), xPos, y + 3);
    xPos += 45;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...hexToRgb(colors.textSecondary));

    // Stats
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
    ];

    const colWidths = [12, 12, 12, 12, 12, 12, 10, 10, 18, 18, 18];

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
      doc.text(stats[i], xPos + colWidths[i] / 2, y + 3, { align: "center" });
      xPos += colWidths[i];
    }

    y += 6;
  }

  return y + 5;
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

  return y + chartHeight + 20;
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
  } = {}
): Promise<Blob> {
  const settings: PDFSettings = { ...DEFAULT_PDF_SETTINGS, ...options.settings };
  const theme = settings.theme;

  const doc = new jsPDF({
    orientation: settings.orientation,
    unit: "mm",
    format: settings.pageSize,
  });

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
    doc.addPage();
    if (theme === "dark") {
      doc.setFillColor(...hexToRgb(colors.bg));
      doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
    }
    y = 20;
  }

  y = addBoxScoreTable(doc, gameData.awayTeam, y, theme, false);

  // Shot charts (if images provided)
  if (options.homeCourtImage || options.awayCourtImage) {
    // Check if we need a new page
    if (y > A4_HEIGHT - 100) {
      doc.addPage();
      if (theme === "dark") {
        doc.setFillColor(...hexToRgb(colors.bg));
        doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, "F");
      }
      y = 20;
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

  // Footer
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
