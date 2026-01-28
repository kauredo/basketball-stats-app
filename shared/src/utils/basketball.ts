import type { PlayerStat, Game, Position } from "../types";
import { format, formatDistanceToNow } from "date-fns";

// Minimal interface for stat calculations - allows flexibility for different PlayerStat shapes
// Uses optional fields with defaults in implementation for maximum compatibility
export interface StatInput {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  threePointersMade?: number;
  threePointersAttempted?: number;
  freeThrowsMade?: number;
  freeThrowsAttempted?: number;
  minutesPlayed?: number;
}

// Basketball calculation utilities
export class BasketballUtils {
  // Percentage calculations
  static calculatePercentage(made: number, attempted: number): number {
    if (attempted === 0) return 0;
    return Math.round((made / attempted) * 100 * 10) / 10; // Round to 1 decimal
  }

  static fieldGoalPercentage(stat: StatInput): number {
    return this.calculatePercentage(stat.fieldGoalsMade || 0, stat.fieldGoalsAttempted || 0);
  }

  static threePointPercentage(stat: StatInput): number {
    return this.calculatePercentage(stat.threePointersMade || 0, stat.threePointersAttempted || 0);
  }

  static freeThrowPercentage(stat: StatInput): number {
    return this.calculatePercentage(stat.freeThrowsMade || 0, stat.freeThrowsAttempted || 0);
  }

  static effectiveFieldGoalPercentage(stat: StatInput): number {
    const fga = stat.fieldGoalsAttempted || 0;
    if (fga === 0) return 0;
    const effectiveFGM = (stat.fieldGoalsMade || 0) + 0.5 * (stat.threePointersMade || 0);
    return this.calculatePercentage(effectiveFGM, fga);
  }

  static trueShootingPercentage(stat: StatInput): number {
    const fga = stat.fieldGoalsAttempted || 0;
    const fta = stat.freeThrowsAttempted || 0;
    const trueShootingAttempts = fga + 0.44 * fta;
    if (trueShootingAttempts === 0) return 0;
    return Math.round((stat.points / (2 * trueShootingAttempts)) * 100 * 10) / 10;
  }

  // Player efficiency rating (simplified, per-minute)
  static playerEfficiencyRating(stat: StatInput): number {
    const minutesPlayed = stat.minutesPlayed || 0;
    if (minutesPlayed === 0) return 0;

    const positive = stat.points + stat.rebounds + stat.assists + stat.steals + stat.blocks;
    const fga = stat.fieldGoalsAttempted || 0;
    const fgm = stat.fieldGoalsMade || 0;
    const fta = stat.freeThrowsAttempted || 0;
    const ftm = stat.freeThrowsMade || 0;
    const negative = fga - fgm + (fta - ftm) + stat.turnovers + stat.fouls;

    return Math.round(((positive - negative) / minutesPlayed) * 10) / 10;
  }

  // Game efficiency rating (total stats, not per-minute - for in-game context)
  static gameEfficiencyRating(stat: StatInput): number {
    const positive = stat.points + stat.rebounds + stat.assists + stat.steals + stat.blocks;
    const fga = stat.fieldGoalsAttempted || 0;
    const fgm = stat.fieldGoalsMade || 0;
    const fta = stat.freeThrowsAttempted || 0;
    const ftm = stat.freeThrowsMade || 0;
    const negative = fga - fgm + (fta - ftm) + stat.turnovers + stat.fouls;

    return positive - negative;
  }

  // Assist-to-turnover ratio
  static assistToTurnoverRatio(stat: StatInput): number {
    const turnovers = stat.turnovers || 0;
    if (turnovers === 0) {
      // If no turnovers, return assists as the ratio (essentially infinite ratio capped at assists)
      return stat.assists;
    }
    return Math.round((stat.assists / turnovers) * 10) / 10;
  }

  // =====================
  // Four Factors Metrics
  // =====================

  /**
   * Turnover Rate: Percentage of possessions ending in a turnover
   * Formula: TO / (FGA + 0.44*FTA + TO)
   */
  static turnoverRate(turnovers: number, fga: number, fta: number): number {
    const possessionEndings = fga + 0.44 * fta + turnovers;
    if (possessionEndings === 0) return 0;
    return Math.round((turnovers / possessionEndings) * 100 * 10) / 10;
  }

  /**
   * Offensive Rebound Percentage: Share of available offensive rebounds grabbed
   * Formula: OReb / (OReb + Opp DReb)
   * Note: When opponent DReb is unavailable, use total rebound opportunities estimate
   */
  static offensiveReboundPercent(
    offensiveRebounds: number,
    opponentDefensiveRebounds: number
  ): number {
    const totalOpportunities = offensiveRebounds + opponentDefensiveRebounds;
    if (totalOpportunities === 0) return 0;
    return Math.round((offensiveRebounds / totalOpportunities) * 100 * 10) / 10;
  }

  /**
   * Defensive Rebound Percentage: Share of available defensive rebounds grabbed
   * Formula: DReb / (DReb + Opp OReb)
   */
  static defensiveReboundPercent(
    defensiveRebounds: number,
    opponentOffensiveRebounds: number
  ): number {
    const totalOpportunities = defensiveRebounds + opponentOffensiveRebounds;
    if (totalOpportunities === 0) return 0;
    return Math.round((defensiveRebounds / totalOpportunities) * 100 * 10) / 10;
  }

  /**
   * Free Throw Rate: Measures ability to get to the free throw line
   * Formula: FTA / FGA
   */
  static freeThrowRate(fta: number, fga: number): number {
    if (fga === 0) return 0;
    return Math.round((fta / fga) * 100 * 10) / 10;
  }

  // =====================
  // Possession-Based Metrics
  // =====================

  /**
   * Estimate possessions using the standard formula
   * Formula: FGA - OReb + TO + (0.44 × FTA)
   */
  static estimatePossessions(
    fga: number,
    offensiveRebounds: number,
    turnovers: number,
    fta: number
  ): number {
    return Math.round(fga - offensiveRebounds + turnovers + 0.44 * fta);
  }

  /**
   * Offensive Rating: Points scored per 100 possessions
   * Formula: (Points / Possessions) × 100
   */
  static offensiveRating(points: number, possessions: number): number {
    if (possessions === 0) return 0;
    return Math.round((points / possessions) * 100 * 10) / 10;
  }

  /**
   * Defensive Rating: Points allowed per 100 possessions
   * Formula: (Points Allowed / Possessions) × 100
   */
  static defensiveRating(pointsAllowed: number, possessions: number): number {
    if (possessions === 0) return 0;
    return Math.round((pointsAllowed / possessions) * 100 * 10) / 10;
  }

  /**
   * Net Rating: Offensive Rating - Defensive Rating
   */
  static netRating(offRating: number, defRating: number): number {
    return Math.round((offRating - defRating) * 10) / 10;
  }

  /**
   * Pace: Possessions per 40 minutes (standard game length)
   */
  static pace(possessions: number, minutesPlayed: number): number {
    if (minutesPlayed === 0) return 0;
    return Math.round((possessions / minutesPlayed) * 40 * 10) / 10;
  }

  // =====================
  // Four Factors Summary
  // =====================

  /**
   * Calculate all Four Factors for a team
   * Returns: eFG%, TO Rate, OREB%, FT Rate
   */
  static calculateFourFactors(teamStats: {
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    freeThrowsAttempted: number;
    turnovers: number;
    offensiveRebounds: number;
    opponentDefensiveRebounds: number;
  }): {
    effectiveFieldGoalPct: number;
    turnoverRate: number;
    offensiveReboundPct: number;
    freeThrowRate: number;
  } {
    const fga = teamStats.fieldGoalsAttempted;
    const fta = teamStats.freeThrowsAttempted;

    return {
      effectiveFieldGoalPct:
        fga > 0
          ? Math.round(
              ((teamStats.fieldGoalsMade + 0.5 * teamStats.threePointersMade) / fga) * 100 * 10
            ) / 10
          : 0,
      turnoverRate: this.turnoverRate(teamStats.turnovers, fga, fta),
      offensiveReboundPct: this.offensiveReboundPercent(
        teamStats.offensiveRebounds,
        teamStats.opponentDefensiveRebounds
      ),
      freeThrowRate: this.freeThrowRate(fta, fga),
    };
  }

  // Game flow utilities
  static formatGameTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  static getQuarterName(quarter: number): string {
    switch (quarter) {
      case 1:
        return "1st";
      case 2:
        return "2nd";
      case 3:
        return "3rd";
      case 4:
        return "4th";
      default:
        return `${quarter}th`;
    }
  }

  static getGameStatusDisplayName(status: string): string {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "active":
        return "Live";
      case "paused":
        return "Paused";
      case "completed":
        return "Final";
      default:
        return status;
    }
  }

  // Time and date formatting
  static formatGameDate(dateString: string): string {
    return format(new Date(dateString), "MMM d, yyyy");
  }

  static formatGameTime24Hour(dateString: string): string {
    return format(new Date(dateString), "HH:mm");
  }

  static getTimeAgo(dateString: string): string {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  }

  // Player utilities
  static getPositionFullName(position?: Position): string {
    switch (position) {
      case "PG":
        return "Point Guard";
      case "SG":
        return "Shooting Guard";
      case "SF":
        return "Small Forward";
      case "PF":
        return "Power Forward";
      case "C":
        return "Center";
      default:
        return "Unknown";
    }
  }

  static getPlayerHeight(heightCm?: number): string {
    if (!heightCm) return "N/A";
    const feet = Math.floor(heightCm / 30.48);
    const inches = Math.round((heightCm / 2.54) % 12);
    return `${feet}'${inches}"`;
  }

  static getPlayerWeight(weightKg?: number): string {
    if (!weightKg) return "N/A";
    const pounds = Math.round(weightKg * 2.205);
    return `${pounds} lbs`;
  }

  static getPlayerAge(birthDate?: string): number | null {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  }

  // Team and game utilities
  static getWinningTeam(game: Game): "home" | "away" | "tie" {
    if (game.homeScore > game.awayScore) return "home";
    if (game.awayScore > game.homeScore) return "away";
    return "tie";
  }

  static getPointDifferential(game: Game): number {
    return Math.abs(game.homeScore - game.awayScore);
  }

  static isGameLive(game: Game): boolean {
    return game.status === "active";
  }

  static isGameComplete(game: Game): boolean {
    return game.status === "completed";
  }

  // Stat validation
  static validateStatEntry(stat: StatInput): string[] {
    const errors: string[] = [];
    const fgm = stat.fieldGoalsMade || 0;
    const fga = stat.fieldGoalsAttempted || 0;
    const tpm = stat.threePointersMade || 0;
    const tpa = stat.threePointersAttempted || 0;
    const ftm = stat.freeThrowsMade || 0;
    const fta = stat.freeThrowsAttempted || 0;

    if (fgm > fga) {
      errors.push("Field goals made cannot exceed attempts");
    }

    if (tpm > tpa) {
      errors.push("Three-pointers made cannot exceed attempts");
    }

    if (ftm > fta) {
      errors.push("Free throws made cannot exceed attempts");
    }

    if (tpm > fgm) {
      errors.push("Three-pointers made cannot exceed total field goals made");
    }

    if (tpa > fga) {
      errors.push("Three-pointer attempts cannot exceed total field goal attempts");
    }

    // Validate points calculation
    const calculatedPoints = (fgm - tpm) * 2 + tpm * 3 + ftm;

    if (stat.points !== calculatedPoints) {
      errors.push(`Points mismatch: expected ${calculatedPoints}, got ${stat.points}`);
    }

    return errors;
  }

  // Sorting utilities
  static sortPlayersByPoints(stats: PlayerStat[]): PlayerStat[] {
    return [...stats].sort((a, b) => b.points - a.points);
  }

  static sortPlayersByRebounds(stats: PlayerStat[]): PlayerStat[] {
    return [...stats].sort((a, b) => b.rebounds - a.rebounds);
  }

  static sortPlayersByAssists(stats: PlayerStat[]): PlayerStat[] {
    return [...stats].sort((a, b) => b.assists - a.assists);
  }

  static sortPlayersByEfficiency(stats: PlayerStat[]): PlayerStat[] {
    return [...stats].sort(
      (a, b) => this.playerEfficiencyRating(b) - this.playerEfficiencyRating(a)
    );
  }

  // Box score utilities
  static generateQuickStats(stats: PlayerStat[]) {
    const totals = stats.reduce(
      (acc, stat) => ({
        points: acc.points + stat.points,
        rebounds: acc.rebounds + stat.rebounds,
        assists: acc.assists + stat.assists,
        steals: acc.steals + stat.steals,
        blocks: acc.blocks + stat.blocks,
        turnovers: acc.turnovers + stat.turnovers,
        fouls: acc.fouls + stat.fouls,
        fieldGoalsMade: acc.fieldGoalsMade + stat.fieldGoalsMade,
        fieldGoalsAttempted: acc.fieldGoalsAttempted + stat.fieldGoalsAttempted,
        threePointersMade: acc.threePointersMade + stat.threePointersMade,
        threePointersAttempted: acc.threePointersAttempted + stat.threePointersAttempted,
        freeThrowsMade: acc.freeThrowsMade + stat.freeThrowsMade,
        freeThrowsAttempted: acc.freeThrowsAttempted + stat.freeThrowsAttempted,
      }),
      {
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
      }
    );

    return {
      ...totals,
      fieldGoalPercentage: this.calculatePercentage(
        totals.fieldGoalsMade,
        totals.fieldGoalsAttempted
      ),
      threePointPercentage: this.calculatePercentage(
        totals.threePointersMade,
        totals.threePointersAttempted
      ),
      freeThrowPercentage: this.calculatePercentage(
        totals.freeThrowsMade,
        totals.freeThrowsAttempted
      ),
    };
  }
}
