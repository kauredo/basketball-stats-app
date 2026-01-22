import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getUserFromToken, canAccessLeague } from "./lib/auth";

/**
 * Helper to sort player IDs consistently for lineup comparison
 */
function sortPlayerIds(players: Id<"players">[]): Id<"players">[] {
  return [...players].sort();
}

/**
 * Helper to create a lineup key for comparison
 */
function getLineupKey(players: Id<"players">[]): string {
  return sortPlayerIds(players).join(",");
}

// ============================================
// Internal Mutations (called by other mutations)
// ============================================

/**
 * Start a new lineup stint for a team
 * Called when game starts or when a substitution occurs
 */
export const startLineupStint = internalMutation({
  args: {
    gameId: v.id("games"),
    teamId: v.id("teams"),
    players: v.array(v.id("players")),
    quarter: v.number(),
    gameTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Only create a stint if we have exactly 5 players
    if (args.players.length !== 5) {
      return null;
    }

    const sortedPlayers = sortPlayerIds(args.players);
    const now = Date.now();

    const stintId = await ctx.db.insert("lineupStints", {
      gameId: args.gameId,
      teamId: args.teamId,
      players: sortedPlayers,
      startQuarter: args.quarter,
      startGameTime: args.gameTime,
      startTimestamp: now,
      secondsPlayed: 0,
      pointsScored: 0,
      pointsAllowed: 0,
      plusMinus: 0,
      isActive: true,
    });

    return stintId;
  },
});

/**
 * End the current active lineup stint for a team
 * Called when a substitution occurs or game ends
 */
export const endLineupStint = internalMutation({
  args: {
    gameId: v.id("games"),
    teamId: v.id("teams"),
    quarter: v.number(),
    gameTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Find the active stint for this team
    const activeStints = await ctx.db
      .query("lineupStints")
      .withIndex("by_game_team", (q) =>
        q.eq("gameId", args.gameId).eq("teamId", args.teamId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (activeStints.length === 0) {
      return null;
    }

    const now = Date.now();

    // End all active stints (should typically be just one)
    for (const stint of activeStints) {
      // Calculate seconds played based on game time
      // Note: Game time counts down, so start - end = seconds elapsed
      let secondsPlayed = 0;

      if (stint.startQuarter === args.quarter) {
        // Same quarter: simple subtraction
        secondsPlayed = stint.startGameTime - args.gameTime;
      } else {
        // Different quarters: calculate based on quarters elapsed
        // Assume 12 minute quarters (720 seconds) - could be made configurable
        const quarterLength = 720;
        const fullQuarters = args.quarter - stint.startQuarter - 1;
        const startQuarterTime = stint.startGameTime;
        const endQuarterTime = quarterLength - args.gameTime;

        secondsPlayed = startQuarterTime + (fullQuarters * quarterLength) + endQuarterTime;
      }

      // Ensure non-negative
      secondsPlayed = Math.max(0, secondsPlayed);

      await ctx.db.patch(stint._id, {
        endQuarter: args.quarter,
        endGameTime: args.gameTime,
        endTimestamp: now,
        secondsPlayed: stint.secondsPlayed + secondsPlayed,
        isActive: false,
      });
    }

    return activeStints.length;
  },
});

/**
 * Update lineup stats when points are scored
 * Called when a shot is made (by either team)
 */
export const updateLineupStats = internalMutation({
  args: {
    gameId: v.id("games"),
    scoringTeamId: v.id("teams"),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return;

    // Get all active stints for this game
    const activeStints = await ctx.db
      .query("lineupStints")
      .withIndex("by_game_active", (q) =>
        q.eq("gameId", args.gameId).eq("isActive", true)
      )
      .collect();

    for (const stint of activeStints) {
      if (stint.teamId === args.scoringTeamId) {
        // This team scored
        await ctx.db.patch(stint._id, {
          pointsScored: stint.pointsScored + args.points,
          plusMinus: stint.plusMinus + args.points,
        });
      } else {
        // Opposing team scored (points allowed)
        await ctx.db.patch(stint._id, {
          pointsAllowed: stint.pointsAllowed + args.points,
          plusMinus: stint.plusMinus - args.points,
        });
      }
    }
  },
});

/**
 * End all active stints for a game (called when game ends)
 */
export const endAllGameStints = internalMutation({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
    gameTime: v.number(),
  },
  handler: async (ctx, args) => {
    const activeStints = await ctx.db
      .query("lineupStints")
      .withIndex("by_game_active", (q) =>
        q.eq("gameId", args.gameId).eq("isActive", true)
      )
      .collect();

    const now = Date.now();

    for (const stint of activeStints) {
      // Calculate seconds played
      let secondsPlayed = 0;

      if (stint.startQuarter === args.quarter) {
        secondsPlayed = stint.startGameTime - args.gameTime;
      } else {
        const quarterLength = 720;
        const fullQuarters = args.quarter - stint.startQuarter - 1;
        const startQuarterTime = stint.startGameTime;
        const endQuarterTime = quarterLength - args.gameTime;

        secondsPlayed = startQuarterTime + (fullQuarters * quarterLength) + endQuarterTime;
      }

      secondsPlayed = Math.max(0, secondsPlayed);

      await ctx.db.patch(stint._id, {
        endQuarter: args.quarter,
        endGameTime: args.gameTime,
        endTimestamp: now,
        secondsPlayed: stint.secondsPlayed + secondsPlayed,
        isActive: false,
      });
    }
  },
});

// ============================================
// Public Queries
// ============================================

/**
 * Get aggregated 5-man lineup stats for a team across all games
 */
export const getTeamLineupStats = query({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const hasAccess = await canAccessLeague(ctx, user._id, team.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    // Get all stints for this team
    const stints = await ctx.db
      .query("lineupStints")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Aggregate by lineup (unique combination of 5 players)
    const lineupMap = new Map<
      string,
      {
        players: Id<"players">[];
        secondsPlayed: number;
        pointsScored: number;
        pointsAllowed: number;
        plusMinus: number;
        gamesPlayed: Set<string>;
      }
    >();

    for (const stint of stints) {
      const key = getLineupKey(stint.players);

      if (!lineupMap.has(key)) {
        lineupMap.set(key, {
          players: stint.players,
          secondsPlayed: 0,
          pointsScored: 0,
          pointsAllowed: 0,
          plusMinus: 0,
          gamesPlayed: new Set(),
        });
      }

      const lineupData = lineupMap.get(key)!;
      lineupData.secondsPlayed += stint.secondsPlayed;
      lineupData.pointsScored += stint.pointsScored;
      lineupData.pointsAllowed += stint.pointsAllowed;
      lineupData.plusMinus += stint.plusMinus;
      lineupData.gamesPlayed.add(stint.gameId);
    }

    // Convert to array and calculate derived stats
    const lineups = await Promise.all(
      Array.from(lineupMap.values()).map(async (lineup) => {
        // Fetch player details
        const playerDetails = await Promise.all(
          lineup.players.map(async (playerId) => {
            const player = await ctx.db.get(playerId);
            return player
              ? { id: player._id, name: player.name, number: player.number }
              : { id: playerId, name: "Unknown", number: 0 };
          })
        );

        const minutesPlayed = lineup.secondsPlayed / 60;
        const netRating =
          minutesPlayed > 0
            ? ((lineup.pointsScored - lineup.pointsAllowed) / minutesPlayed) * 36
            : 0;

        return {
          players: playerDetails,
          playerIds: lineup.players,
          minutesPlayed: Math.round(minutesPlayed * 10) / 10,
          pointsScored: lineup.pointsScored,
          pointsAllowed: lineup.pointsAllowed,
          plusMinus: lineup.plusMinus,
          gamesPlayed: lineup.gamesPlayed.size,
          netRating: Math.round(netRating * 10) / 10,
        };
      })
    );

    // Sort by minutes played (descending)
    lineups.sort((a, b) => b.minutesPlayed - a.minutesPlayed);

    // Apply limit if specified
    const limitedLineups = args.limit ? lineups.slice(0, args.limit) : lineups;

    return { lineups: limitedLineups };
  },
});

/**
 * Get 2-man pair stats derived from 5-man lineup data
 */
export const getTeamPairStats = query({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const hasAccess = await canAccessLeague(ctx, user._id, team.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    // Get all stints for this team
    const stints = await ctx.db
      .query("lineupStints")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Aggregate by player pairs (10 pairs per 5-man lineup)
    const pairMap = new Map<
      string,
      {
        player1Id: Id<"players">;
        player2Id: Id<"players">;
        secondsPlayed: number;
        plusMinus: number;
        gamesPlayed: Set<string>;
      }
    >();

    for (const stint of stints) {
      // Generate all 10 pairs from the 5 players
      for (let i = 0; i < stint.players.length; i++) {
        for (let j = i + 1; j < stint.players.length; j++) {
          const [p1, p2] =
            stint.players[i] < stint.players[j]
              ? [stint.players[i], stint.players[j]]
              : [stint.players[j], stint.players[i]];

          const key = `${p1},${p2}`;

          if (!pairMap.has(key)) {
            pairMap.set(key, {
              player1Id: p1,
              player2Id: p2,
              secondsPlayed: 0,
              plusMinus: 0,
              gamesPlayed: new Set(),
            });
          }

          const pairData = pairMap.get(key)!;
          pairData.secondsPlayed += stint.secondsPlayed;
          pairData.plusMinus += stint.plusMinus;
          pairData.gamesPlayed.add(stint.gameId);
        }
      }
    }

    // Convert to array and calculate derived stats
    const pairs = await Promise.all(
      Array.from(pairMap.values()).map(async (pair) => {
        const player1 = await ctx.db.get(pair.player1Id);
        const player2 = await ctx.db.get(pair.player2Id);

        const minutesTogether = pair.secondsPlayed / 60;
        const netRating =
          minutesTogether > 0 ? (pair.plusMinus / minutesTogether) * 36 : 0;

        return {
          player1: player1
            ? { id: player1._id, name: player1.name, number: player1.number }
            : { id: pair.player1Id, name: "Unknown", number: 0 },
          player2: player2
            ? { id: player2._id, name: player2.name, number: player2.number }
            : { id: pair.player2Id, name: "Unknown", number: 0 },
          player1Id: pair.player1Id,
          player2Id: pair.player2Id,
          minutesTogether: Math.round(minutesTogether * 10) / 10,
          plusMinus: pair.plusMinus,
          gamesPlayed: pair.gamesPlayed.size,
          netRating: Math.round(netRating * 10) / 10,
        };
      })
    );

    // Sort by minutes together (descending)
    pairs.sort((a, b) => b.minutesTogether - a.minutesTogether);

    // Apply limit if specified
    const limitedPairs = args.limit ? pairs.slice(0, args.limit) : pairs;

    return { pairs: limitedPairs };
  },
});

/**
 * Get lineup stints for a specific game
 */
export const getGameLineupStints = query({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const hasAccess = await canAccessLeague(ctx, user._id, game.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    let stints;
    if (args.teamId) {
      stints = await ctx.db
        .query("lineupStints")
        .withIndex("by_game_team", (q) =>
          q.eq("gameId", args.gameId).eq("teamId", args.teamId!)
        )
        .collect();
    } else {
      stints = await ctx.db
        .query("lineupStints")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .collect();
    }

    // Enrich with player details
    const enrichedStints = await Promise.all(
      stints.map(async (stint) => {
        const playerDetails = await Promise.all(
          stint.players.map(async (playerId) => {
            const player = await ctx.db.get(playerId);
            return player
              ? { id: player._id, name: player.name, number: player.number }
              : { id: playerId, name: "Unknown", number: 0 };
          })
        );

        const team = await ctx.db.get(stint.teamId);

        return {
          id: stint._id,
          team: team ? { id: team._id, name: team.name } : null,
          players: playerDetails,
          startQuarter: stint.startQuarter,
          startGameTime: stint.startGameTime,
          endQuarter: stint.endQuarter,
          endGameTime: stint.endGameTime,
          minutesPlayed: Math.round((stint.secondsPlayed / 60) * 10) / 10,
          pointsScored: stint.pointsScored,
          pointsAllowed: stint.pointsAllowed,
          plusMinus: stint.plusMinus,
          isActive: stint.isActive,
        };
      })
    );

    return { stints: enrichedStints };
  },
});
