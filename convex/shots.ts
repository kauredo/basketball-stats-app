import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken, canAccessLeague } from "./lib/auth";

// Record a shot attempt
export const recordShot = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    x: v.number(),
    y: v.number(),
    shotType: v.union(v.literal("2pt"), v.literal("3pt"), v.literal("ft")),
    made: v.boolean(),
    quarter: v.number(),
    timeRemaining: v.number(),
    assisted: v.optional(v.boolean()),
    assistedBy: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const hasAccess = await canAccessLeague(ctx, user._id, game.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    // Determine shot zone based on coordinates
    const shotZone = determineShotZone(args.x, args.y, args.shotType);

    const shotId = await ctx.db.insert("shots", {
      playerId: args.playerId,
      gameId: args.gameId,
      teamId: player.teamId,
      x: args.x,
      y: args.y,
      shotType: args.shotType,
      made: args.made,
      quarter: args.quarter,
      timeRemaining: args.timeRemaining,
      assisted: args.assisted,
      assistedBy: args.assistedBy,
      shotZone,
    });

    return { shotId };
  },
});

// Get shots for a player in a specific game
export const getGameShots = query({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const hasAccess = await canAccessLeague(ctx, user._id, game.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    let shots;
    if (args.playerId) {
      shots = await ctx.db
        .query("shots")
        .withIndex("by_game_player", (q) =>
          q.eq("gameId", args.gameId).eq("playerId", args.playerId!)
        )
        .collect();
    } else {
      shots = await ctx.db
        .query("shots")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .collect();
    }

    // Get player info for each shot
    const playerIds = Array.from(new Set(shots.map((s) => s.playerId)));
    const players = await Promise.all(playerIds.map((id) => ctx.db.get(id)));
    const playerMap = new Map(
      players.filter((p): p is NonNullable<typeof p> => p !== null).map((p) => [p._id, p])
    );

    return {
      shots: shots.map((shot) => {
        const player = playerMap.get(shot.playerId);
        return {
          ...shot,
          playerName: player?.name || "Unknown",
          playerNumber: player?.number || 0,
        };
      }),
    };
  },
});

// Get shot chart data for a player across all games in a league
export const getPlayerShotChart = query({
  args: {
    token: v.string(),
    playerId: v.id("players"),
    leagueId: v.id("leagues"),
    gameId: v.optional(v.id("games")), // Optional: filter to specific game
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const team = await ctx.db.get(player.teamId);

    // Get all shots for this player
    let allShots = await ctx.db
      .query("shots")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Filter by game if specified
    if (args.gameId) {
      allShots = allShots.filter((s) => s.gameId === args.gameId);
    } else {
      // Filter to only completed games in this league
      const games = await ctx.db
        .query("games")
        .withIndex("by_league_status", (q) =>
          q.eq("leagueId", args.leagueId).eq("status", "completed")
        )
        .collect();
      const gameIds = new Set(games.map((g) => g._id));
      allShots = allShots.filter((s) => gameIds.has(s.gameId));
    }

    // Calculate zone statistics
    const zoneStats = calculateZoneStats(allShots);

    // Calculate overall shooting stats
    const totalShots = allShots.length;
    const madeShots = allShots.filter((s) => s.made).length;
    const twoPointers = allShots.filter((s) => s.shotType === "2pt");
    const threePointers = allShots.filter((s) => s.shotType === "3pt");
    const freeThrows = allShots.filter((s) => s.shotType === "ft");

    return {
      player: {
        id: player._id,
        name: player.name,
        number: player.number,
        position: player.position,
        team: team?.name || "Unknown",
      },
      shots: allShots.map((s) => ({
        id: s._id,
        x: s.x,
        y: s.y,
        shotType: s.shotType,
        made: s.made,
        quarter: s.quarter,
        shotZone: s.shotZone,
      })),
      stats: {
        totalShots,
        madeShots,
        overallPercentage: totalShots > 0 ? Math.round((madeShots / totalShots) * 1000) / 10 : 0,
        twoPoint: {
          made: twoPointers.filter((s) => s.made).length,
          attempted: twoPointers.length,
          percentage:
            twoPointers.length > 0
              ? Math.round((twoPointers.filter((s) => s.made).length / twoPointers.length) * 1000) /
                10
              : 0,
        },
        threePoint: {
          made: threePointers.filter((s) => s.made).length,
          attempted: threePointers.length,
          percentage:
            threePointers.length > 0
              ? Math.round(
                  (threePointers.filter((s) => s.made).length / threePointers.length) * 1000
                ) / 10
              : 0,
        },
        freeThrow: {
          made: freeThrows.filter((s) => s.made).length,
          attempted: freeThrows.length,
          percentage:
            freeThrows.length > 0
              ? Math.round((freeThrows.filter((s) => s.made).length / freeThrows.length) * 1000) /
                10
              : 0,
        },
      },
      zoneStats,
    };
  },
});

// Get team shot chart data
export const getTeamShotChart = query({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Get completed games in this league
    const games = await ctx.db
      .query("games")
      .withIndex("by_league_status", (q) =>
        q.eq("leagueId", args.leagueId).eq("status", "completed")
      )
      .collect();
    const gameIds = new Set(games.map((g) => g._id));

    // Get all shots for this team
    const allShots = await ctx.db
      .query("shots")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const filteredShots = allShots.filter((s) => gameIds.has(s.gameId));

    // Calculate zone statistics
    const zoneStats = calculateZoneStats(filteredShots);

    return {
      team: {
        id: team._id,
        name: team.name,
      },
      shots: filteredShots.map((s) => ({
        id: s._id,
        x: s.x,
        y: s.y,
        shotType: s.shotType,
        made: s.made,
        shotZone: s.shotZone,
      })),
      zoneStats,
      totalShots: filteredShots.length,
      madeShots: filteredShots.filter((s) => s.made).length,
    };
  },
});

// Helper function to determine shot zone based on coordinates
function determineShotZone(
  x: number,
  y: number,
  shotType: "2pt" | "3pt" | "ft"
): "paint" | "midrange" | "corner3" | "wing3" | "top3" | "ft" {
  if (shotType === "ft") return "ft";

  // Paint area (roughly within the key)
  if (Math.abs(x) <= 8 && y <= 19) return "paint";

  // Three point zones
  if (shotType === "3pt") {
    // Corner 3s (y < 14 feet from baseline)
    if (y <= 14) return "corner3";
    // Wing 3s
    if (Math.abs(x) >= 15) return "wing3";
    // Top of the key 3s
    return "top3";
  }

  // Everything else is midrange
  return "midrange";
}

// Helper function to calculate zone statistics
function calculateZoneStats(
  shots: Array<{ shotZone?: string; made: boolean }>
): Record<string, { made: number; attempted: number; percentage: number }> {
  const zones = ["paint", "midrange", "corner3", "wing3", "top3", "ft"] as const;
  const stats: Record<string, { made: number; attempted: number; percentage: number }> = {};

  for (const zone of zones) {
    const zoneShots = shots.filter((s) => s.shotZone === zone);
    const made = zoneShots.filter((s) => s.made).length;
    const attempted = zoneShots.length;
    stats[zone] = {
      made,
      attempted,
      percentage: attempted > 0 ? Math.round((made / attempted) * 1000) / 10 : 0,
    };
  }

  return stats;
}
