/**
 * Data Export Utilities
 * Functions for exporting data to CSV and triggering PDF export via print
 */

/**
 * Convert array of objects to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return "";

  // Header row
  const header = columns.map((col) => `"${col.label}"`).join(",");

  // Data rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
        if (Array.isArray(value)) return `"${value.join(" ")}"`;
        return `"${value}"`;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

/**
 * Download a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
): void {
  const csv = toCSV(data, columns);
  downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
}

/**
 * Print the current page (useful for PDF export via browser print dialog)
 */
export function printPage(): void {
  window.print();
}

/**
 * Standings export columns
 */
export const standingsColumns = [
  { key: "rank" as const, label: "Rank" },
  { key: "teamName" as const, label: "Team" },
  { key: "wins" as const, label: "Wins" },
  { key: "losses" as const, label: "Losses" },
  { key: "winPercentage" as const, label: "Win %" },
  { key: "gamesBack" as const, label: "GB" },
  { key: "homeRecord" as const, label: "Home" },
  { key: "awayRecord" as const, label: "Away" },
  { key: "avgPointsFor" as const, label: "PPG" },
  { key: "avgPointsAgainst" as const, label: "OPPG" },
  { key: "pointDiff" as const, label: "Diff" },
  { key: "streak" as const, label: "Streak" },
];

/**
 * Player stats export columns
 */
export const playerStatsColumns = [
  { key: "playerName" as const, label: "Player" },
  { key: "team" as const, label: "Team" },
  { key: "gamesPlayed" as const, label: "GP" },
  { key: "avgPoints" as const, label: "PPG" },
  { key: "avgRebounds" as const, label: "RPG" },
  { key: "avgAssists" as const, label: "APG" },
  { key: "avgSteals" as const, label: "SPG" },
  { key: "avgBlocks" as const, label: "BPG" },
  { key: "fieldGoalPercentage" as const, label: "FG%" },
  { key: "threePointPercentage" as const, label: "3P%" },
  { key: "freeThrowPercentage" as const, label: "FT%" },
];

/**
 * Game results export columns
 */
export const gameResultsColumns = [
  { key: "date" as const, label: "Date" },
  { key: "homeTeam" as const, label: "Home Team" },
  { key: "homeScore" as const, label: "Home Score" },
  { key: "awayTeam" as const, label: "Away Team" },
  { key: "awayScore" as const, label: "Away Score" },
  { key: "winner" as const, label: "Winner" },
];
