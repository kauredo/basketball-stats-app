import type { PlayerStat, Game, Position } from "../types";
import { format, formatDistanceToNow } from "date-fns";

// Basketball calculation utilities
export class BasketballUtils {
  // Percentage calculations
  static calculatePercentage(made: number, attempted: number): number {
    if (attempted === 0) return 0;
    return Math.round((made / attempted) * 100 * 10) / 10; // Round to 1 decimal
  }

  static fieldGoalPercentage(stat: PlayerStat): number {
    return this.calculatePercentage(stat.fieldGoalsMade, stat.fieldGoalsAttempted);
  }

  static threePointPercentage(stat: PlayerStat): number {
    return this.calculatePercentage(stat.threePointersMade, stat.threePointersAttempted);
  }

  static freeThrowPercentage(stat: PlayerStat): number {
    return this.calculatePercentage(stat.freeThrowsMade, stat.freeThrowsAttempted);
  }

  static effectiveFieldGoalPercentage(stat: PlayerStat): number {
    if (stat.fieldGoalsAttempted === 0) return 0;
    const effectiveFGM = stat.fieldGoalsMade + 0.5 * stat.threePointersMade;
    return this.calculatePercentage(effectiveFGM, stat.fieldGoalsAttempted);
  }

  static trueShootingPercentage(stat: PlayerStat): number {
    const trueShootingAttempts = stat.fieldGoalsAttempted + 0.44 * stat.freeThrowsAttempted;
    if (trueShootingAttempts === 0) return 0;
    return Math.round((stat.points / (2 * trueShootingAttempts)) * 100 * 10) / 10;
  }

  // Player efficiency rating (simplified)
  static playerEfficiencyRating(stat: PlayerStat): number {
    if (stat.minutesPlayed === 0) return 0;

    const positive = stat.points + stat.rebounds + stat.assists + stat.steals + stat.blocks;
    const negative =
      stat.fieldGoalsAttempted -
      stat.fieldGoalsMade +
      stat.freeThrowsAttempted -
      stat.freeThrowsMade +
      stat.turnovers +
      stat.fouls;

    return Math.round(((positive - negative) / stat.minutesPlayed) * 10) / 10;
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
  static validateStatEntry(stat: PlayerStat): string[] {
    const errors: string[] = [];

    if (stat.fieldGoalsMade > stat.fieldGoalsAttempted) {
      errors.push("Field goals made cannot exceed attempts");
    }

    if (stat.threePointersMade > stat.threePointersAttempted) {
      errors.push("Three-pointers made cannot exceed attempts");
    }

    if (stat.freeThrowsMade > stat.freeThrowsAttempted) {
      errors.push("Free throws made cannot exceed attempts");
    }

    if (stat.threePointersMade > stat.fieldGoalsMade) {
      errors.push("Three-pointers made cannot exceed total field goals made");
    }

    if (stat.threePointersAttempted > stat.fieldGoalsAttempted) {
      errors.push("Three-pointer attempts cannot exceed total field goal attempts");
    }

    // Validate points calculation
    const calculatedPoints =
      (stat.fieldGoalsMade - stat.threePointersMade) * 2 +
      stat.threePointersMade * 3 +
      stat.freeThrowsMade;

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
