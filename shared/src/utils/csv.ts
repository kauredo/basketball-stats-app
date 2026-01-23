/**
 * CSV Utility Functions
 * Platform-agnostic utilities for CSV generation
 */

/**
 * Column definition for CSV export
 */
export interface CSVColumn<T> {
  key: keyof T;
  label: string;
}

/**
 * Convert array of objects to CSV string
 *
 * @param data - Array of objects to convert
 * @param columns - Column definitions with keys and labels
 * @returns CSV-formatted string
 *
 * @example
 * const data = [{ name: 'John', score: 100 }];
 * const columns = [
 *   { key: 'name', label: 'Player Name' },
 *   { key: 'score', label: 'Score' }
 * ];
 * const csv = toCSV(data, columns);
 * // Returns: "Player Name","Score"\n"John","100"
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CSVColumn<T>[]
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
