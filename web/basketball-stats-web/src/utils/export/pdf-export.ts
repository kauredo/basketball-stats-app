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
