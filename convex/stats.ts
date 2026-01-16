import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken, getUserLeagueRole } from "./lib/auth";

// Record a stat action
export const recordStat = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    statType: v.union(
      v.literal("shot2"),
      v.literal("shot3"),
      v.literal("freethrow"),
      v.literal("rebound"),
      v.literal("assist"),
      v.literal("steal"),
      v.literal("block"),
      v.literal("turnover"),
      v.literal("foul")
    ),
    made: v.optional(v.boolean()), // For shots
    value: v.optional(v.number()), // For custom increment
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Check permission
    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    // Find player stat
    const playerStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId))
      .first();

    if (!playerStat) throw new Error("Player stat not found");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const isHomeTeam = player.teamId === game.homeTeamId;
    const updates: Partial<typeof playerStat> = {};
    let pointsScored = 0;
    const increment = args.value || 1;

    switch (args.statType) {
      case "shot2":
        updates.fieldGoalsAttempted = playerStat.fieldGoalsAttempted + 1;
        if (args.made) {
          updates.fieldGoalsMade = playerStat.fieldGoalsMade + 1;
          updates.points = playerStat.points + 2;
          pointsScored = 2;
        }
        break;

      case "shot3":
        updates.fieldGoalsAttempted = playerStat.fieldGoalsAttempted + 1;
        updates.threePointersAttempted = playerStat.threePointersAttempted + 1;
        if (args.made) {
          updates.fieldGoalsMade = playerStat.fieldGoalsMade + 1;
          updates.threePointersMade = playerStat.threePointersMade + 1;
          updates.points = playerStat.points + 3;
          pointsScored = 3;
        }
        break;

      case "freethrow":
        updates.freeThrowsAttempted = playerStat.freeThrowsAttempted + 1;
        if (args.made) {
          updates.freeThrowsMade = playerStat.freeThrowsMade + 1;
          updates.points = playerStat.points + 1;
          pointsScored = 1;
        }
        break;

      case "rebound":
        updates.rebounds = playerStat.rebounds + increment;
        break;

      case "assist":
        updates.assists = playerStat.assists + increment;
        break;

      case "steal":
        updates.steals = playerStat.steals + increment;
        break;

      case "block":
        updates.blocks = playerStat.blocks + increment;
        break;

      case "turnover":
        updates.turnovers = playerStat.turnovers + increment;
        break;

      case "foul":
        updates.fouls = playerStat.fouls + increment;
        break;
    }

    // Update player stat
    await ctx.db.patch(playerStat._id, updates);

    // Update game score if points were scored
    if (pointsScored > 0) {
      const scoreUpdate = isHomeTeam
        ? { homeScore: game.homeScore + pointsScored }
        : { awayScore: game.awayScore + pointsScored };
      await ctx.db.patch(args.gameId, scoreUpdate);
    }

    // Get updated game for response
    const updatedGame = await ctx.db.get(args.gameId);
    const updatedStat = await ctx.db.get(playerStat._id);

    return {
      stat: {
        id: updatedStat!._id,
        points: updatedStat!.points,
        rebounds: updatedStat!.rebounds,
        assists: updatedStat!.assists,
        steals: updatedStat!.steals,
        blocks: updatedStat!.blocks,
        turnovers: updatedStat!.turnovers,
        fouls: updatedStat!.fouls,
        fieldGoalsMade: updatedStat!.fieldGoalsMade,
        fieldGoalsAttempted: updatedStat!.fieldGoalsAttempted,
        threePointersMade: updatedStat!.threePointersMade,
        threePointersAttempted: updatedStat!.threePointersAttempted,
        freeThrowsMade: updatedStat!.freeThrowsMade,
        freeThrowsAttempted: updatedStat!.freeThrowsAttempted,
      },
      gameScore: {
        homeScore: updatedGame!.homeScore,
        awayScore: updatedGame!.awayScore,
      },
      message: `${args.statType} recorded for ${player.name}`,
    };
  },
});

// Undo a stat (decrement)
export const undoStat = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    statType: v.union(
      v.literal("shot2"),
      v.literal("shot3"),
      v.literal("freethrow"),
      v.literal("rebound"),
      v.literal("assist"),
      v.literal("steal"),
      v.literal("block"),
      v.literal("turnover"),
      v.literal("foul")
    ),
    wasMade: v.optional(v.boolean()), // For shots - was it a made shot being undone?
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    const playerStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId))
      .first();

    if (!playerStat) throw new Error("Player stat not found");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const isHomeTeam = player.teamId === game.homeTeamId;
    const updates: Partial<typeof playerStat> = {};
    let pointsRemoved = 0;

    switch (args.statType) {
      case "shot2":
        updates.fieldGoalsAttempted = Math.max(0, playerStat.fieldGoalsAttempted - 1);
        if (args.wasMade) {
          updates.fieldGoalsMade = Math.max(0, playerStat.fieldGoalsMade - 1);
          updates.points = Math.max(0, playerStat.points - 2);
          pointsRemoved = 2;
        }
        break;

      case "shot3":
        updates.fieldGoalsAttempted = Math.max(0, playerStat.fieldGoalsAttempted - 1);
        updates.threePointersAttempted = Math.max(0, playerStat.threePointersAttempted - 1);
        if (args.wasMade) {
          updates.fieldGoalsMade = Math.max(0, playerStat.fieldGoalsMade - 1);
          updates.threePointersMade = Math.max(0, playerStat.threePointersMade - 1);
          updates.points = Math.max(0, playerStat.points - 3);
          pointsRemoved = 3;
        }
        break;

      case "freethrow":
        updates.freeThrowsAttempted = Math.max(0, playerStat.freeThrowsAttempted - 1);
        if (args.wasMade) {
          updates.freeThrowsMade = Math.max(0, playerStat.freeThrowsMade - 1);
          updates.points = Math.max(0, playerStat.points - 1);
          pointsRemoved = 1;
        }
        break;

      case "rebound":
        updates.rebounds = Math.max(0, playerStat.rebounds - 1);
        break;

      case "assist":
        updates.assists = Math.max(0, playerStat.assists - 1);
        break;

      case "steal":
        updates.steals = Math.max(0, playerStat.steals - 1);
        break;

      case "block":
        updates.blocks = Math.max(0, playerStat.blocks - 1);
        break;

      case "turnover":
        updates.turnovers = Math.max(0, playerStat.turnovers - 1);
        break;

      case "foul":
        updates.fouls = Math.max(0, playerStat.fouls - 1);
        break;
    }

    await ctx.db.patch(playerStat._id, updates);

    // Update game score if points were removed
    if (pointsRemoved > 0) {
      const scoreUpdate = isHomeTeam
        ? { homeScore: Math.max(0, game.homeScore - pointsRemoved) }
        : { awayScore: Math.max(0, game.awayScore - pointsRemoved) };
      await ctx.db.patch(args.gameId, scoreUpdate);
    }

    const updatedGame = await ctx.db.get(args.gameId);

    return {
      gameScore: {
        homeScore: updatedGame!.homeScore,
        awayScore: updatedGame!.awayScore,
      },
      message: `${args.statType} undone for ${player.name}`,
    };
  },
});

// Toggle player on/off court (substitution)
export const substitute = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    isOnCourt: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    const playerStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId))
      .first();

    if (!playerStat) throw new Error("Player stat not found");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    await ctx.db.patch(playerStat._id, {
      isOnCourt: args.isOnCourt,
    });

    return {
      message: args.isOnCourt ? `${player.name} entered the game` : `${player.name} left the game`,
      isOnCourt: args.isOnCourt,
    };
  },
});

// Get live stats for a game
export const getLiveStats = query({
  args: {
    token: v.string(),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Get all player stats for this game
    const stats = await ctx.db
      .query("playerStats")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const formattedStats = await Promise.all(
      stats.map(async (stat) => {
        const player = await ctx.db.get(stat.playerId);
        const team = player ? await ctx.db.get(player.teamId) : null;

        return {
          id: stat._id,
          playerId: stat.playerId,
          teamId: stat.teamId,
          points: stat.points,
          rebounds: stat.rebounds,
          assists: stat.assists,
          steals: stat.steals,
          blocks: stat.blocks,
          turnovers: stat.turnovers,
          fouls: stat.fouls,
          fieldGoalsMade: stat.fieldGoalsMade,
          fieldGoalsAttempted: stat.fieldGoalsAttempted,
          threePointersMade: stat.threePointersMade,
          threePointersAttempted: stat.threePointersAttempted,
          freeThrowsMade: stat.freeThrowsMade,
          freeThrowsAttempted: stat.freeThrowsAttempted,
          minutesPlayed: stat.minutesPlayed,
          plusMinus: stat.plusMinus,
          isOnCourt: stat.isOnCourt,
          player: player
            ? {
                id: player._id,
                name: player.name,
                number: player.number,
                position: player.position,
              }
            : null,
          isHomeTeam: stat.teamId === game.homeTeamId,
        };
      })
    );

    return {
      game: {
        id: game._id,
        status: game.status,
        currentQuarter: game.currentQuarter,
        timeRemainingSeconds: game.timeRemainingSeconds,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      },
      stats: formattedStats,
    };
  },
});

// Update player minutes
export const updateMinutes = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    minutes: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    const playerStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId))
      .first();

    if (!playerStat) throw new Error("Player stat not found");

    await ctx.db.patch(playerStat._id, {
      minutesPlayed: args.minutes,
    });

    return { message: "Minutes updated" };
  },
});
