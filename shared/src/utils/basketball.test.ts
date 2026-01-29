import { describe, it, expect } from "vitest";
import { BasketballUtils, StatInput } from "./basketball";
import type { Game, PlayerStat, Position } from "../types";

// Helper to create a stat object with default values
const createStat = (overrides: Partial<StatInput> = {}): StatInput => ({
  points: 0,
  rebounds: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0,
  fieldGoalsMade: 0,
  fieldGoalsAttempted: 0,
  threePointersMade: 0,
  threePointersAttempted: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
  minutesPlayed: 0,
  ...overrides,
});

describe("BasketballUtils", () => {
  describe("calculatePercentage", () => {
    it("returns 0 when attempted is 0", () => {
      expect(BasketballUtils.calculatePercentage(5, 0)).toBe(0);
    });

    it("calculates percentage correctly", () => {
      expect(BasketballUtils.calculatePercentage(7, 10)).toBe(70);
    });

    it("rounds to one decimal place", () => {
      expect(BasketballUtils.calculatePercentage(1, 3)).toBe(33.3);
    });

    it("returns 100 for perfect shooting", () => {
      expect(BasketballUtils.calculatePercentage(10, 10)).toBe(100);
    });

    it("returns 0 when made is 0", () => {
      expect(BasketballUtils.calculatePercentage(0, 10)).toBe(0);
    });
  });

  describe("fieldGoalPercentage", () => {
    it("calculates FG% correctly", () => {
      const stat = createStat({ fieldGoalsMade: 5, fieldGoalsAttempted: 10 });
      expect(BasketballUtils.fieldGoalPercentage(stat)).toBe(50);
    });

    it("handles missing field goal data", () => {
      const stat = createStat();
      expect(BasketballUtils.fieldGoalPercentage(stat)).toBe(0);
    });
  });

  describe("threePointPercentage", () => {
    it("calculates 3P% correctly", () => {
      const stat = createStat({
        threePointersMade: 3,
        threePointersAttempted: 8,
      });
      expect(BasketballUtils.threePointPercentage(stat)).toBe(37.5);
    });

    it("handles no three-point attempts", () => {
      const stat = createStat();
      expect(BasketballUtils.threePointPercentage(stat)).toBe(0);
    });
  });

  describe("freeThrowPercentage", () => {
    it("calculates FT% correctly", () => {
      const stat = createStat({ freeThrowsMade: 8, freeThrowsAttempted: 10 });
      expect(BasketballUtils.freeThrowPercentage(stat)).toBe(80);
    });

    it("handles no free throw attempts", () => {
      const stat = createStat();
      expect(BasketballUtils.freeThrowPercentage(stat)).toBe(0);
    });
  });

  describe("effectiveFieldGoalPercentage", () => {
    it("calculates eFG% correctly with three pointers", () => {
      // eFG% = (FGM + 0.5 * 3PM) / FGA
      const stat = createStat({
        fieldGoalsMade: 8,
        fieldGoalsAttempted: 16,
        threePointersMade: 4,
      });
      // (8 + 0.5*4) / 16 = 10 / 16 = 62.5%
      expect(BasketballUtils.effectiveFieldGoalPercentage(stat)).toBe(62.5);
    });

    it("equals FG% when no three pointers", () => {
      const stat = createStat({
        fieldGoalsMade: 6,
        fieldGoalsAttempted: 12,
        threePointersMade: 0,
      });
      expect(BasketballUtils.effectiveFieldGoalPercentage(stat)).toBe(50);
    });

    it("returns 0 when no attempts", () => {
      const stat = createStat();
      expect(BasketballUtils.effectiveFieldGoalPercentage(stat)).toBe(0);
    });
  });

  describe("trueShootingPercentage", () => {
    it("calculates TS% correctly", () => {
      // TS% = Points / (2 * (FGA + 0.44 * FTA))
      const stat = createStat({
        points: 25,
        fieldGoalsAttempted: 15,
        freeThrowsAttempted: 8,
      });
      // 25 / (2 * (15 + 0.44*8)) = 25 / (2 * 18.52) = 25 / 37.04 = 67.5%
      expect(BasketballUtils.trueShootingPercentage(stat)).toBe(67.5);
    });

    it("returns 0 when no shooting attempts", () => {
      const stat = createStat({ points: 0 });
      expect(BasketballUtils.trueShootingPercentage(stat)).toBe(0);
    });
  });

  describe("playerEfficiencyRating", () => {
    it("returns 0 when no minutes played", () => {
      const stat = createStat({ points: 20, rebounds: 10 });
      expect(BasketballUtils.playerEfficiencyRating(stat)).toBe(0);
    });

    it("calculates PER correctly", () => {
      const stat = createStat({
        points: 20,
        rebounds: 8,
        assists: 5,
        steals: 2,
        blocks: 1,
        turnovers: 3,
        fouls: 2,
        fieldGoalsMade: 7,
        fieldGoalsAttempted: 14,
        freeThrowsMade: 4,
        freeThrowsAttempted: 5,
        minutesPlayed: 30,
      });
      // Positive: 20 + 8 + 5 + 2 + 1 = 36
      // Negative: (14-7) + (5-4) + 3 + 2 = 7 + 1 + 3 + 2 = 13
      // PER = (36 - 13) / 30 = 0.77
      expect(BasketballUtils.playerEfficiencyRating(stat)).toBe(0.8);
    });

    it("handles negative efficiency", () => {
      const stat = createStat({
        turnovers: 8,
        fouls: 5,
        fieldGoalsAttempted: 10,
        fieldGoalsMade: 2,
        minutesPlayed: 20,
      });
      expect(BasketballUtils.playerEfficiencyRating(stat)).toBeLessThan(0);
    });
  });

  describe("gameEfficiencyRating", () => {
    it("calculates game efficiency without per-minute normalization", () => {
      const stat = createStat({
        points: 15,
        rebounds: 5,
        assists: 3,
        steals: 1,
        blocks: 1,
        turnovers: 2,
        fouls: 3,
        fieldGoalsMade: 5,
        fieldGoalsAttempted: 10,
        freeThrowsMade: 3,
        freeThrowsAttempted: 4,
      });
      // Positive: 15 + 5 + 3 + 1 + 1 = 25
      // Negative: (10-5) + (4-3) + 2 + 3 = 5 + 1 + 2 + 3 = 11
      // GER = 25 - 11 = 14
      expect(BasketballUtils.gameEfficiencyRating(stat)).toBe(14);
    });
  });

  describe("assistToTurnoverRatio", () => {
    it("returns assists when no turnovers", () => {
      const stat = createStat({ assists: 8, turnovers: 0 });
      expect(BasketballUtils.assistToTurnoverRatio(stat)).toBe(8);
    });

    it("calculates ratio correctly", () => {
      const stat = createStat({ assists: 6, turnovers: 2 });
      expect(BasketballUtils.assistToTurnoverRatio(stat)).toBe(3);
    });

    it("rounds to one decimal", () => {
      const stat = createStat({ assists: 7, turnovers: 3 });
      expect(BasketballUtils.assistToTurnoverRatio(stat)).toBe(2.3);
    });
  });

  describe("Four Factors Metrics", () => {
    describe("turnoverRate", () => {
      it("calculates turnover rate correctly", () => {
        // TO% = TO / (FGA + 0.44*FTA + TO)
        const result = BasketballUtils.turnoverRate(5, 80, 20);
        // 5 / (80 + 8.8 + 5) = 5 / 93.8 = 5.3%
        expect(result).toBe(5.3);
      });

      it("returns 0 when no possessions", () => {
        expect(BasketballUtils.turnoverRate(0, 0, 0)).toBe(0);
      });
    });

    describe("offensiveReboundPercent", () => {
      it("calculates OREB% correctly", () => {
        const result = BasketballUtils.offensiveReboundPercent(10, 30);
        // 10 / (10 + 30) = 25%
        expect(result).toBe(25);
      });

      it("returns 0 when no opportunities", () => {
        expect(BasketballUtils.offensiveReboundPercent(0, 0)).toBe(0);
      });
    });

    describe("defensiveReboundPercent", () => {
      it("calculates DREB% correctly", () => {
        const result = BasketballUtils.defensiveReboundPercent(25, 5);
        // 25 / (25 + 5) = 83.3%
        expect(result).toBe(83.3);
      });
    });

    describe("freeThrowRate", () => {
      it("calculates FT rate correctly", () => {
        const result = BasketballUtils.freeThrowRate(20, 80);
        expect(result).toBe(25);
      });

      it("returns 0 when no FGA", () => {
        expect(BasketballUtils.freeThrowRate(10, 0)).toBe(0);
      });
    });
  });

  describe("Possession-Based Metrics", () => {
    describe("estimatePossessions", () => {
      it("estimates possessions correctly", () => {
        // Poss = FGA - OREB + TO + 0.44*FTA
        const result = BasketballUtils.estimatePossessions(80, 10, 15, 25);
        // 80 - 10 + 15 + 11 = 96
        expect(result).toBe(96);
      });
    });

    describe("offensiveRating", () => {
      it("calculates offensive rating per 100 possessions", () => {
        const result = BasketballUtils.offensiveRating(110, 100);
        expect(result).toBe(110);
      });

      it("returns 0 when no possessions", () => {
        expect(BasketballUtils.offensiveRating(50, 0)).toBe(0);
      });
    });

    describe("defensiveRating", () => {
      it("calculates defensive rating per 100 possessions", () => {
        const result = BasketballUtils.defensiveRating(95, 100);
        expect(result).toBe(95);
      });
    });

    describe("netRating", () => {
      it("calculates net rating correctly", () => {
        expect(BasketballUtils.netRating(115.5, 105.5)).toBe(10);
      });

      it("handles negative net rating", () => {
        expect(BasketballUtils.netRating(100, 110)).toBe(-10);
      });
    });

    describe("pace", () => {
      it("calculates pace per 40 minutes", () => {
        const result = BasketballUtils.pace(100, 40);
        expect(result).toBe(100);
      });

      it("returns 0 when no minutes", () => {
        expect(BasketballUtils.pace(50, 0)).toBe(0);
      });
    });
  });

  describe("calculateFourFactors", () => {
    it("calculates all four factors correctly", () => {
      const teamStats = {
        fieldGoalsMade: 35,
        fieldGoalsAttempted: 80,
        threePointersMade: 10,
        freeThrowsAttempted: 20,
        turnovers: 12,
        offensiveRebounds: 10,
        opponentDefensiveRebounds: 30,
      };

      const result = BasketballUtils.calculateFourFactors(teamStats);

      expect(result.effectiveFieldGoalPct).toBe(50); // (35 + 5) / 80
      expect(result.turnoverRate).toBeDefined();
      expect(result.offensiveReboundPct).toBe(25); // 10 / (10 + 30)
      expect(result.freeThrowRate).toBe(25); // 20 / 80
    });

    it("handles zero attempts", () => {
      const teamStats = {
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        freeThrowsAttempted: 0,
        turnovers: 0,
        offensiveRebounds: 0,
        opponentDefensiveRebounds: 0,
      };

      const result = BasketballUtils.calculateFourFactors(teamStats);

      expect(result.effectiveFieldGoalPct).toBe(0);
      expect(result.freeThrowRate).toBe(0);
    });
  });

  describe("formatGameTime", () => {
    it("formats full minutes correctly", () => {
      expect(BasketballUtils.formatGameTime(720)).toBe("12:00");
    });

    it("formats mixed time correctly", () => {
      expect(BasketballUtils.formatGameTime(125)).toBe("2:05");
    });

    it("handles zero seconds", () => {
      expect(BasketballUtils.formatGameTime(0)).toBe("0:00");
    });

    it("pads single-digit seconds", () => {
      expect(BasketballUtils.formatGameTime(65)).toBe("1:05");
    });
  });

  describe("getQuarterName", () => {
    it("returns ordinal for quarters 1-4", () => {
      expect(BasketballUtils.getQuarterName(1)).toBe("1st");
      expect(BasketballUtils.getQuarterName(2)).toBe("2nd");
      expect(BasketballUtils.getQuarterName(3)).toBe("3rd");
      expect(BasketballUtils.getQuarterName(4)).toBe("4th");
    });

    it("handles overtime periods", () => {
      expect(BasketballUtils.getQuarterName(5)).toBe("5th");
      expect(BasketballUtils.getQuarterName(6)).toBe("6th");
    });
  });

  describe("getGameStatusDisplayName", () => {
    it("returns display names for all statuses", () => {
      expect(BasketballUtils.getGameStatusDisplayName("scheduled")).toBe("Scheduled");
      expect(BasketballUtils.getGameStatusDisplayName("active")).toBe("Live");
      expect(BasketballUtils.getGameStatusDisplayName("paused")).toBe("Paused");
      expect(BasketballUtils.getGameStatusDisplayName("completed")).toBe("Final");
    });

    it("returns raw status for unknown values", () => {
      expect(BasketballUtils.getGameStatusDisplayName("unknown")).toBe("unknown");
    });
  });

  describe("getPositionFullName", () => {
    it("returns full names for all positions", () => {
      expect(BasketballUtils.getPositionFullName("PG")).toBe("Point Guard");
      expect(BasketballUtils.getPositionFullName("SG")).toBe("Shooting Guard");
      expect(BasketballUtils.getPositionFullName("SF")).toBe("Small Forward");
      expect(BasketballUtils.getPositionFullName("PF")).toBe("Power Forward");
      expect(BasketballUtils.getPositionFullName("C")).toBe("Center");
    });

    it("returns Unknown for undefined", () => {
      expect(BasketballUtils.getPositionFullName(undefined)).toBe("Unknown");
    });
  });

  describe("getPlayerHeight", () => {
    it("converts cm to feet and inches", () => {
      expect(BasketballUtils.getPlayerHeight(183)).toBe("6'0\"");
      expect(BasketballUtils.getPlayerHeight(198)).toBe("6'6\"");
    });

    it("returns N/A for undefined", () => {
      expect(BasketballUtils.getPlayerHeight(undefined)).toBe("N/A");
    });
  });

  describe("getPlayerWeight", () => {
    it("converts kg to pounds", () => {
      expect(BasketballUtils.getPlayerWeight(100)).toBe("221 lbs");
    });

    it("returns N/A for undefined", () => {
      expect(BasketballUtils.getPlayerWeight(undefined)).toBe("N/A");
    });
  });

  describe("getPlayerAge", () => {
    it("returns null for undefined birthDate", () => {
      expect(BasketballUtils.getPlayerAge(undefined)).toBeNull();
    });

    it("calculates age correctly", () => {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 25);
      const age = BasketballUtils.getPlayerAge(tenYearsAgo.toISOString());
      expect(age).toBe(25);
    });
  });

  describe("Game utilities", () => {
    const createGame = (overrides: Partial<Game> = {}): Game =>
      ({
        id: "game-1",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        leagueId: "league-1",
        status: "completed",
        currentQuarter: 4,
        timeRemainingSeconds: 0,
        homeScore: 100,
        awayScore: 95,
        ...overrides,
      }) as Game;

    describe("getWinningTeam", () => {
      it("returns home when home team wins", () => {
        const game = createGame({ homeScore: 100, awayScore: 95 });
        expect(BasketballUtils.getWinningTeam(game)).toBe("home");
      });

      it("returns away when away team wins", () => {
        const game = createGame({ homeScore: 90, awayScore: 100 });
        expect(BasketballUtils.getWinningTeam(game)).toBe("away");
      });

      it("returns tie when scores are equal", () => {
        const game = createGame({ homeScore: 100, awayScore: 100 });
        expect(BasketballUtils.getWinningTeam(game)).toBe("tie");
      });
    });

    describe("getPointDifferential", () => {
      it("returns absolute point difference", () => {
        const game = createGame({ homeScore: 110, awayScore: 100 });
        expect(BasketballUtils.getPointDifferential(game)).toBe(10);
      });

      it("returns positive for away win too", () => {
        const game = createGame({ homeScore: 95, awayScore: 105 });
        expect(BasketballUtils.getPointDifferential(game)).toBe(10);
      });
    });

    describe("isGameLive", () => {
      it("returns true for active games", () => {
        const game = createGame({ status: "active" });
        expect(BasketballUtils.isGameLive(game)).toBe(true);
      });

      it("returns false for completed games", () => {
        const game = createGame({ status: "completed" });
        expect(BasketballUtils.isGameLive(game)).toBe(false);
      });
    });

    describe("isGameComplete", () => {
      it("returns true for completed games", () => {
        const game = createGame({ status: "completed" });
        expect(BasketballUtils.isGameComplete(game)).toBe(true);
      });

      it("returns false for active games", () => {
        const game = createGame({ status: "active" });
        expect(BasketballUtils.isGameComplete(game)).toBe(false);
      });
    });
  });

  describe("validateStatEntry", () => {
    it("returns empty array for valid stats", () => {
      const stat = createStat({
        points: 15,
        fieldGoalsMade: 5,
        fieldGoalsAttempted: 10,
        threePointersMade: 1,
        threePointersAttempted: 3,
        freeThrowsMade: 4,
        freeThrowsAttempted: 5,
      });
      expect(BasketballUtils.validateStatEntry(stat)).toEqual([]);
    });

    it("catches FGM > FGA", () => {
      const stat = createStat({
        points: 10,
        fieldGoalsMade: 8,
        fieldGoalsAttempted: 5,
      });
      const errors = BasketballUtils.validateStatEntry(stat);
      expect(errors).toContain("Field goals made cannot exceed attempts");
    });

    it("catches 3PM > 3PA", () => {
      const stat = createStat({
        points: 9,
        fieldGoalsMade: 3,
        fieldGoalsAttempted: 5,
        threePointersMade: 4,
        threePointersAttempted: 3,
      });
      const errors = BasketballUtils.validateStatEntry(stat);
      expect(errors).toContain("Three-pointers made cannot exceed attempts");
    });

    it("catches FTM > FTA", () => {
      const stat = createStat({
        points: 5,
        freeThrowsMade: 6,
        freeThrowsAttempted: 4,
      });
      const errors = BasketballUtils.validateStatEntry(stat);
      expect(errors).toContain("Free throws made cannot exceed attempts");
    });

    it("catches 3PM > FGM", () => {
      const stat = createStat({
        points: 9,
        fieldGoalsMade: 2,
        fieldGoalsAttempted: 5,
        threePointersMade: 3,
        threePointersAttempted: 5,
      });
      const errors = BasketballUtils.validateStatEntry(stat);
      expect(errors).toContain("Three-pointers made cannot exceed total field goals made");
    });

    it("catches 3PA > FGA", () => {
      const stat = createStat({
        points: 6,
        fieldGoalsMade: 2,
        fieldGoalsAttempted: 4,
        threePointersMade: 2,
        threePointersAttempted: 5,
      });
      const errors = BasketballUtils.validateStatEntry(stat);
      expect(errors).toContain("Three-pointer attempts cannot exceed total field goal attempts");
    });

    it("catches points mismatch", () => {
      const stat = createStat({
        points: 20,
        fieldGoalsMade: 5,
        fieldGoalsAttempted: 10,
        threePointersMade: 2,
        threePointersAttempted: 5,
        freeThrowsMade: 1,
        freeThrowsAttempted: 2,
      });
      // Expected: (5-2)*2 + 2*3 + 1 = 6 + 6 + 1 = 13
      const errors = BasketballUtils.validateStatEntry(stat);
      expect(errors.some((e) => e.includes("Points mismatch"))).toBe(true);
    });
  });

  describe("Sorting utilities", () => {
    const createPlayerStat = (overrides: Partial<PlayerStat> = {}): PlayerStat =>
      ({
        id: "stat-1",
        playerId: "player-1",
        gameId: "game-1",
        teamId: "team-1",
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        minutesPlayed: 0,
        plusMinus: 0,
        isOnCourt: false,
        ...overrides,
      }) as PlayerStat;

    it("sorts players by points descending", () => {
      const stats = [
        createPlayerStat({ id: "1", points: 10 }),
        createPlayerStat({ id: "2", points: 25 }),
        createPlayerStat({ id: "3", points: 15 }),
      ];

      const sorted = BasketballUtils.sortPlayersByPoints(stats);

      expect(sorted[0].points).toBe(25);
      expect(sorted[1].points).toBe(15);
      expect(sorted[2].points).toBe(10);
    });

    it("sorts players by rebounds descending", () => {
      const stats = [
        createPlayerStat({ id: "1", rebounds: 5 }),
        createPlayerStat({ id: "2", rebounds: 12 }),
        createPlayerStat({ id: "3", rebounds: 8 }),
      ];

      const sorted = BasketballUtils.sortPlayersByRebounds(stats);

      expect(sorted[0].rebounds).toBe(12);
      expect(sorted[1].rebounds).toBe(8);
    });

    it("sorts players by assists descending", () => {
      const stats = [
        createPlayerStat({ id: "1", assists: 3 }),
        createPlayerStat({ id: "2", assists: 10 }),
      ];

      const sorted = BasketballUtils.sortPlayersByAssists(stats);

      expect(sorted[0].assists).toBe(10);
    });

    it("does not mutate original array", () => {
      const original = [
        createPlayerStat({ id: "1", points: 10 }),
        createPlayerStat({ id: "2", points: 25 }),
      ];

      BasketballUtils.sortPlayersByPoints(original);

      expect(original[0].points).toBe(10);
    });
  });

  describe("generateQuickStats", () => {
    const createPlayerStat = (overrides: Partial<PlayerStat> = {}): PlayerStat =>
      ({
        id: "stat-1",
        playerId: "player-1",
        gameId: "game-1",
        teamId: "team-1",
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        minutesPlayed: 0,
        plusMinus: 0,
        isOnCourt: false,
        ...overrides,
      }) as PlayerStat;

    it("aggregates stats from multiple players", () => {
      const stats = [
        createPlayerStat({
          points: 20,
          rebounds: 5,
          assists: 3,
          fieldGoalsMade: 7,
          fieldGoalsAttempted: 14,
        }),
        createPlayerStat({
          points: 15,
          rebounds: 8,
          assists: 7,
          fieldGoalsMade: 5,
          fieldGoalsAttempted: 10,
        }),
      ];

      const result = BasketballUtils.generateQuickStats(stats);

      expect(result.points).toBe(35);
      expect(result.rebounds).toBe(13);
      expect(result.assists).toBe(10);
      expect(result.fieldGoalsMade).toBe(12);
      expect(result.fieldGoalsAttempted).toBe(24);
      expect(result.fieldGoalPercentage).toBe(50);
    });

    it("handles empty array", () => {
      const result = BasketballUtils.generateQuickStats([]);

      expect(result.points).toBe(0);
      expect(result.fieldGoalPercentage).toBe(0);
    });
  });
});
