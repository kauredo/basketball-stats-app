import { describe, it, expect } from "vitest";
import { toCSV, CSVColumn } from "./csv";

describe("CSV Utilities", () => {
  describe("toCSV", () => {
    interface TestData {
      name: string;
      score: number;
      active: boolean;
    }

    const columns: CSVColumn<TestData>[] = [
      { key: "name", label: "Player Name" },
      { key: "score", label: "Score" },
      { key: "active", label: "Active" },
    ];

    it("returns empty string for empty data array", () => {
      expect(toCSV<TestData>([], columns)).toBe("");
    });

    it("generates correct header row", () => {
      const data: TestData[] = [{ name: "John", score: 100, active: true }];
      const csv = toCSV(data, columns);
      const header = csv.split("\n")[0];
      expect(header).toBe('"Player Name","Score","Active"');
    });

    it("generates correct data row", () => {
      const data: TestData[] = [{ name: "John", score: 100, active: true }];
      const csv = toCSV(data, columns);
      const dataRow = csv.split("\n")[1];
      expect(dataRow).toBe('"John","100","true"');
    });

    it("handles multiple rows", () => {
      const data: TestData[] = [
        { name: "John", score: 100, active: true },
        { name: "Jane", score: 95, active: false },
      ];
      const csv = toCSV(data, columns);
      const lines = csv.split("\n");
      expect(lines.length).toBe(3);
      expect(lines[1]).toBe('"John","100","true"');
      expect(lines[2]).toBe('"Jane","95","false"');
    });

    it("escapes double quotes in strings", () => {
      interface QuotedData {
        text: string;
      }
      const data: QuotedData[] = [{ text: 'He said "hello"' }];
      const cols: CSVColumn<QuotedData>[] = [{ key: "text", label: "Text" }];
      const csv = toCSV(data, cols);
      expect(csv).toContain('"He said ""hello"""');
    });

    it("handles null values", () => {
      interface NullableData {
        name: string | null;
        value: number;
      }
      const data = [{ name: null, value: 10 }] as NullableData[];
      const cols: CSVColumn<NullableData>[] = [
        { key: "name", label: "Name" },
        { key: "value", label: "Value" },
      ];
      const csv = toCSV(data, cols);
      expect(csv).toContain('""');
    });

    it("handles undefined values", () => {
      interface OptionalData {
        name?: string;
        value: number;
      }
      const data: OptionalData[] = [{ value: 10 }];
      const cols: CSVColumn<OptionalData>[] = [
        { key: "name", label: "Name" },
        { key: "value", label: "Value" },
      ];
      const csv = toCSV(data, cols);
      expect(csv).toContain('""');
    });

    it("handles array values by joining with space", () => {
      interface ArrayData {
        tags: string[];
      }
      const data: ArrayData[] = [{ tags: ["tag1", "tag2", "tag3"] }];
      const cols: CSVColumn<ArrayData>[] = [{ key: "tags", label: "Tags" }];
      const csv = toCSV(data, cols);
      expect(csv).toContain('"tag1 tag2 tag3"');
    });

    it("handles numeric zero correctly", () => {
      interface NumericData {
        value: number;
      }
      const data: NumericData[] = [{ value: 0 }];
      const cols: CSVColumn<NumericData>[] = [{ key: "value", label: "Value" }];
      const csv = toCSV(data, cols);
      expect(csv).toContain('"0"');
    });

    it("handles boolean false correctly", () => {
      interface BoolData {
        flag: boolean;
      }
      const data: BoolData[] = [{ flag: false }];
      const cols: CSVColumn<BoolData>[] = [{ key: "flag", label: "Flag" }];
      const csv = toCSV(data, cols);
      expect(csv).toContain('"false"');
    });

    it("preserves column order", () => {
      interface OrderedData {
        a: string;
        b: string;
        c: string;
      }
      const data: OrderedData[] = [{ a: "1", b: "2", c: "3" }];
      const cols: CSVColumn<OrderedData>[] = [
        { key: "c", label: "C" },
        { key: "a", label: "A" },
        { key: "b", label: "B" },
      ];
      const csv = toCSV(data, cols);
      const header = csv.split("\n")[0];
      const dataRow = csv.split("\n")[1];
      expect(header).toBe('"C","A","B"');
      expect(dataRow).toBe('"3","1","2"');
    });

    it("handles player stats export scenario", () => {
      interface PlayerStats {
        playerName: string;
        points: number;
        rebounds: number;
        assists: number;
        fieldGoalPct: number;
      }

      const stats: PlayerStats[] = [
        {
          playerName: "LeBron James",
          points: 25,
          rebounds: 8,
          assists: 10,
          fieldGoalPct: 52.5,
        },
        {
          playerName: "Anthony Davis",
          points: 30,
          rebounds: 12,
          assists: 3,
          fieldGoalPct: 55.0,
        },
      ];

      const cols: CSVColumn<PlayerStats>[] = [
        { key: "playerName", label: "Player" },
        { key: "points", label: "PTS" },
        { key: "rebounds", label: "REB" },
        { key: "assists", label: "AST" },
        { key: "fieldGoalPct", label: "FG%" },
      ];

      const csv = toCSV(stats, cols);
      const lines = csv.split("\n");

      expect(lines[0]).toBe('"Player","PTS","REB","AST","FG%"');
      expect(lines[1]).toBe('"LeBron James","25","8","10","52.5"');
      expect(lines[2]).toBe('"Anthony Davis","30","12","3","55"');
    });

    it("handles special characters in strings", () => {
      interface SpecialData {
        text: string;
      }
      const data: SpecialData[] = [
        { text: "Line1\nLine2" },
        { text: "Tab\there" },
        { text: "Comma, here" },
      ];
      const cols: CSVColumn<SpecialData>[] = [{ key: "text", label: "Text" }];
      const csv = toCSV(data, cols);

      // All values should be quoted, handling special characters
      expect(csv).toContain('"Line1\nLine2"');
      expect(csv).toContain('"Tab\there"');
      expect(csv).toContain('"Comma, here"');
    });
  });
});
