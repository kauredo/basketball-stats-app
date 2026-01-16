import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getUserFromToken, canAccessLeague, getUserLeagueRole } from "./lib/auth";

// List games
export const list = query({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed")
      )
    ),
    teamId: v.optional(v.id("teams")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    let games;

    if (args.status) {
      games = await ctx.db
        .query("games")
        .withIndex("by_league_status", (q) =>
          q.eq("leagueId", args.leagueId).eq("status", args.status!)
        )
        .collect();
    } else {
      games = await ctx.db
        .query("games")
        .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
        .collect();
    }

    // Filter by team if specified
    if (args.teamId) {
      games = games.filter((g) => g.homeTeamId === args.teamId || g.awayTeamId === args.teamId);
    }

    // Sort by scheduled date (newest first)
    games.sort((a, b) => (b.scheduledAt || 0) - (a.scheduledAt || 0));

    // Apply limit
    if (args.limit) {
      games = games.slice(0, args.limit);
    }

    // Format games
    const formattedGames = await Promise.all(
      games.map(async (game) => {
        const homeTeam = await ctx.db.get(game.homeTeamId);
        const awayTeam = await ctx.db.get(game.awayTeamId);

        return {
          id: game._id,
          scheduledAt: game.scheduledAt,
          startedAt: game.startedAt,
          endedAt: game.endedAt,
          status: game.status,
          currentQuarter: game.currentQuarter,
          timeRemainingSeconds: game.timeRemainingSeconds,
          timeDisplay: formatTime(game.timeRemainingSeconds),
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          homeTeam: homeTeam
            ? {
                id: homeTeam._id,
                name: homeTeam.name,
                city: homeTeam.city,
                logoUrl: homeTeam.logoUrl,
              }
            : null,
          awayTeam: awayTeam
            ? {
                id: awayTeam._id,
                name: awayTeam.name,
                city: awayTeam.city,
                logoUrl: awayTeam.logoUrl,
              }
            : null,
          createdAt: game._creationTime,
        };
      })
    );

    return { games: formattedGames };
  },
});

// Get single game with full details
export const get = query({
  args: {
    token: v.string(),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const hasAccess = await canAccessLeague(ctx, user._id, game.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const homeTeam = await ctx.db.get(game.homeTeamId);
    const awayTeam = await ctx.db.get(game.awayTeamId);

    // Get players for both teams
    const homePlayers = homeTeam
      ? await ctx.db
          .query("players")
          .withIndex("by_team_active", (q) => q.eq("teamId", homeTeam._id).eq("active", true))
          .collect()
      : [];

    const awayPlayers = awayTeam
      ? await ctx.db
          .query("players")
          .withIndex("by_team_active", (q) => q.eq("teamId", awayTeam._id).eq("active", true))
          .collect()
      : [];

    // Get player stats for this game
    const playerStats = await ctx.db
      .query("playerStats")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Format stats with player info
    const formattedStats = await Promise.all(
      playerStats.map(async (stat) => {
        const player = await ctx.db.get(stat.playerId);
        const team = player ? await ctx.db.get(player.teamId) : null;

        return {
          id: stat._id,
          points: stat.points,
          fieldGoalsMade: stat.fieldGoalsMade,
          fieldGoalsAttempted: stat.fieldGoalsAttempted,
          fieldGoalPercentage:
            stat.fieldGoalsAttempted > 0
              ? Math.round((stat.fieldGoalsMade / stat.fieldGoalsAttempted) * 1000) / 10
              : 0,
          threePointersMade: stat.threePointersMade,
          threePointersAttempted: stat.threePointersAttempted,
          threePointPercentage:
            stat.threePointersAttempted > 0
              ? Math.round((stat.threePointersMade / stat.threePointersAttempted) * 1000) / 10
              : 0,
          freeThrowsMade: stat.freeThrowsMade,
          freeThrowsAttempted: stat.freeThrowsAttempted,
          freeThrowPercentage:
            stat.freeThrowsAttempted > 0
              ? Math.round((stat.freeThrowsMade / stat.freeThrowsAttempted) * 1000) / 10
              : 0,
          rebounds: stat.rebounds,
          assists: stat.assists,
          steals: stat.steals,
          blocks: stat.blocks,
          turnovers: stat.turnovers,
          fouls: stat.fouls,
          minutesPlayed: stat.minutesPlayed,
          plusMinus: stat.plusMinus,
          isOnCourt: stat.isOnCourt,
          player: player
            ? {
                id: player._id,
                name: player.name,
                number: player.number,
                position: player.position,
                team: team
                  ? {
                      id: team._id,
                      name: team.name,
                    }
                  : null,
              }
            : null,
        };
      })
    );

    return {
      game: {
        id: game._id,
        scheduledAt: game.scheduledAt,
        startedAt: game.startedAt,
        endedAt: game.endedAt,
        status: game.status,
        currentQuarter: game.currentQuarter,
        timeRemainingSeconds: game.timeRemainingSeconds,
        timeDisplay: formatTime(game.timeRemainingSeconds),
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        gameSettings: game.gameSettings,
        homeTeam: homeTeam
          ? {
              id: homeTeam._id,
              name: homeTeam.name,
              city: homeTeam.city,
              logoUrl: homeTeam.logoUrl,
              players: homePlayers.map((p) => ({
                id: p._id,
                name: p.name,
                number: p.number,
                position: p.position,
              })),
            }
          : null,
        awayTeam: awayTeam
          ? {
              id: awayTeam._id,
              name: awayTeam.name,
              city: awayTeam.city,
              logoUrl: awayTeam.logoUrl,
              players: awayPlayers.map((p) => ({
                id: p._id,
                name: p.name,
                number: p.number,
                position: p.position,
              })),
            }
          : null,
        playerStats: formattedStats,
        createdAt: game._creationTime,
      },
    };
  },
});

// Create game
export const create = mutation({
  args: {
    token: v.string(),
    homeTeamId: v.id("teams"),
    awayTeamId: v.id("teams"),
    scheduledAt: v.optional(v.number()),
    quarterMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const homeTeam = await ctx.db.get(args.homeTeamId);
    const awayTeam = await ctx.db.get(args.awayTeamId);

    if (!homeTeam || !awayTeam) {
      throw new Error("Teams not found");
    }

    if (homeTeam.leagueId !== awayTeam.leagueId) {
      throw new Error("Teams must be in the same league");
    }

    // Check user has permission to create games
    const role = await getUserLeagueRole(ctx, user._id, homeTeam.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied - insufficient permissions");
    }

    const quarterMinutes = args.quarterMinutes || 12;

    const gameId = await ctx.db.insert("games", {
      homeTeamId: args.homeTeamId,
      awayTeamId: args.awayTeamId,
      leagueId: homeTeam.leagueId,
      scheduledAt: args.scheduledAt,
      status: "scheduled",
      currentQuarter: 1,
      timeRemainingSeconds: quarterMinutes * 60,
      homeScore: 0,
      awayScore: 0,
      gameSettings: { quarterMinutes },
      userId: user._id,
    });

    // Initialize player stats for all active players from both teams
    const homePlayers = await ctx.db
      .query("players")
      .withIndex("by_team_active", (q) => q.eq("teamId", args.homeTeamId).eq("active", true))
      .collect();

    const awayPlayers = await ctx.db
      .query("players")
      .withIndex("by_team_active", (q) => q.eq("teamId", args.awayTeamId).eq("active", true))
      .collect();

    // Create player stat records
    const allPlayers = [...homePlayers, ...awayPlayers];
    for (const player of allPlayers) {
      await ctx.db.insert("playerStats", {
        playerId: player._id,
        gameId,
        teamId: player.teamId,
        points: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
        minutesPlayed: 0,
        plusMinus: 0,
        isOnCourt: false,
      });
    }

    const game = await ctx.db.get(gameId);

    return {
      game: {
        id: gameId,
        homeTeam: { id: homeTeam._id, name: homeTeam.name },
        awayTeam: { id: awayTeam._id, name: awayTeam.name },
        status: game!.status,
        scheduledAt: game!.scheduledAt,
        createdAt: game!._creationTime,
      },
      message: "Game created successfully",
    };
  },
});

// Start game - begins the server-authoritative timer
export const start = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
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

    if (game.status !== "scheduled" && game.status !== "paused") {
      throw new Error("Game cannot be started from current state");
    }

    await ctx.db.patch(args.gameId, {
      status: "active",
      startedAt: game.startedAt || Date.now(),
    });

    // Schedule the first timer tick
    await ctx.scheduler.runAfter(1000, internal.games.timerTick, {
      gameId: args.gameId,
    });

    return { message: "Game started", status: "active" };
  },
});

// Pause game
export const pause = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
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

    if (game.status !== "active") {
      throw new Error("Game is not active");
    }

    await ctx.db.patch(args.gameId, {
      status: "paused",
    });

    // Timer tick will see paused status and stop

    return { message: "Game paused", status: "paused" };
  },
});

// Resume game (alias for start when paused)
export const resume = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
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

    if (game.status !== "paused") {
      throw new Error("Game is not paused");
    }

    await ctx.db.patch(args.gameId, {
      status: "active",
    });

    // Resume timer ticks
    await ctx.scheduler.runAfter(1000, internal.games.timerTick, {
      gameId: args.gameId,
    });

    return { message: "Game resumed", status: "active" };
  },
});

// End game
export const end = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
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

    await ctx.db.patch(args.gameId, {
      status: "completed",
      endedAt: Date.now(),
    });

    return { message: "Game ended", status: "completed" };
  },
});

// Internal: Timer tick - runs every second when game is active
export const timerTick = internalMutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return;

    // Stop if game is not active
    if (game.status !== "active") return;

    const newTime = Math.max(0, game.timeRemainingSeconds - 1);
    const quarterMinutes = (game.gameSettings as any)?.quarterMinutes || 12;

    if (newTime === 0) {
      if (game.currentQuarter < 4) {
        // Quarter ended - move to next quarter
        await ctx.db.patch(args.gameId, {
          timeRemainingSeconds: quarterMinutes * 60,
          currentQuarter: game.currentQuarter + 1,
          status: "paused", // Pause for quarter break
        });
        // Don't schedule next tick - game is paused
        return;
      } else {
        // Game ended
        await ctx.db.patch(args.gameId, {
          status: "completed",
          endedAt: Date.now(),
          timeRemainingSeconds: 0,
        });
        return;
      }
    }

    // Update time
    await ctx.db.patch(args.gameId, {
      timeRemainingSeconds: newTime,
    });

    // Schedule next tick
    await ctx.scheduler.runAfter(1000, internal.games.timerTick, {
      gameId: args.gameId,
    });
  },
});

// Get box score
export const getBoxScore = query({
  args: {
    token: v.string(),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const hasAccess = await canAccessLeague(ctx, user._id, game.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const homeTeam = await ctx.db.get(game.homeTeamId);
    const awayTeam = await ctx.db.get(game.awayTeamId);

    // Get stats by team
    const homeStats = await ctx.db
      .query("playerStats")
      .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", game.homeTeamId))
      .collect();

    const awayStats = await ctx.db
      .query("playerStats")
      .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", game.awayTeamId))
      .collect();

    const formatStats = async (stats: typeof homeStats) => {
      return Promise.all(
        stats.map(async (stat) => {
          const player = await ctx.db.get(stat.playerId);
          return {
            player: player
              ? {
                  id: player._id,
                  name: player.name,
                  number: player.number,
                  position: player.position,
                }
              : null,
            points: stat.points,
            rebounds: stat.rebounds,
            assists: stat.assists,
            steals: stat.steals,
            blocks: stat.blocks,
            turnovers: stat.turnovers,
            fouls: stat.fouls,
            fieldGoals: `${stat.fieldGoalsMade}/${stat.fieldGoalsAttempted}`,
            threePointers: `${stat.threePointersMade}/${stat.threePointersAttempted}`,
            freeThrows: `${stat.freeThrowsMade}/${stat.freeThrowsAttempted}`,
            minutesPlayed: stat.minutesPlayed,
            plusMinus: stat.plusMinus,
          };
        })
      );
    };

    return {
      game: {
        id: game._id,
        status: game.status,
        currentQuarter: game.currentQuarter,
        timeDisplay: formatTime(game.timeRemainingSeconds),
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      },
      boxScore: {
        homeTeam: {
          team: homeTeam ? { id: homeTeam._id, name: homeTeam.name, city: homeTeam.city } : null,
          score: game.homeScore,
          players: await formatStats(homeStats),
        },
        awayTeam: {
          team: awayTeam ? { id: awayTeam._id, name: awayTeam.name, city: awayTeam.city } : null,
          score: game.awayScore,
          players: await formatStats(awayStats),
        },
      },
    };
  },
});

// Helper function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
