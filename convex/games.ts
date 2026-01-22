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

    // Shot clock state - return raw values, client calculates current time
    const shotClockSeconds = game.shotClockSeconds ?? 24;
    const shotClockIsRunning = !!game.shotClockStartedAt;

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
        // Shot clock state for cross-instance sync
        shotClockSeconds,
        shotClockStartedAt: game.shotClockStartedAt,
        shotClockIsRunning,
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

    // Get league settings for defaults
    const league = await ctx.db.get(homeTeam.leagueId);
    const leagueSettings = league?.settings || {};

    // Use provided quarterMinutes or fall back to league settings or default
    const quarterMinutes = args.quarterMinutes || leagueSettings.quarterMinutes || 12;

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
      gameSettings: {
        quarterMinutes,
        foulLimit: leagueSettings.foulLimit,
        timeoutsPerTeam: leagueSettings.timeoutsPerTeam,
        overtimeMinutes: leagueSettings.overtimeMinutes,
        bonusMode: leagueSettings.bonusMode,
      },
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

    // If starting from scheduled, set starters on court (configured or default to first 5)
    if (game.status === "scheduled") {
      const settings = game.gameSettings as any;
      let startingFive = settings?.startingFive;

      // If no starting five configured, default to first 5 players from each team
      if (!startingFive || (!startingFive.homeTeam?.length && !startingFive.awayTeam?.length)) {
        // Get first 5 home team players
        const homePlayerStats = await ctx.db
          .query("playerStats")
          .withIndex("by_game_team", (q) =>
            q.eq("gameId", args.gameId).eq("teamId", game.homeTeamId)
          )
          .take(5);

        // Get first 5 away team players
        const awayPlayerStats = await ctx.db
          .query("playerStats")
          .withIndex("by_game_team", (q) =>
            q.eq("gameId", args.gameId).eq("teamId", game.awayTeamId)
          )
          .take(5);

        startingFive = {
          homeTeam: homePlayerStats.map((ps) => ps.playerId),
          awayTeam: awayPlayerStats.map((ps) => ps.playerId),
        };

        // Save the default starters to gameSettings
        const newSettings = { ...settings, startingFive };
        await ctx.db.patch(args.gameId, { gameSettings: newSettings });
      }

      // Set home team starters on court
      for (const playerId of startingFive.homeTeam || []) {
        const playerStat = await ctx.db
          .query("playerStats")
          .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", playerId))
          .first();
        if (playerStat) {
          await ctx.db.patch(playerStat._id, { isOnCourt: true });
        }
      }

      // Set away team starters on court
      for (const playerId of startingFive.awayTeam || []) {
        const playerStat = await ctx.db
          .query("playerStats")
          .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", playerId))
          .first();
        if (playerStat) {
          await ctx.db.patch(playerStat._id, { isOnCourt: true });
        }
      }

      // Start lineup stints for both teams
      const quarterMinutes = settings?.quarterMinutes || 12;
      const startingGameTime = quarterMinutes * 60;

      if (startingFive.homeTeam && startingFive.homeTeam.length === 5) {
        await ctx.runMutation(internal.lineups.startLineupStint, {
          gameId: args.gameId,
          teamId: game.homeTeamId,
          players: startingFive.homeTeam,
          quarter: 1,
          gameTime: startingGameTime,
        });
      }

      if (startingFive.awayTeam && startingFive.awayTeam.length === 5) {
        await ctx.runMutation(internal.lineups.startLineupStint, {
          gameId: args.gameId,
          teamId: game.awayTeamId,
          players: startingFive.awayTeam,
          quarter: 1,
          gameTime: startingGameTime,
        });
      }
    }

    const now = Date.now();
    const shotClockSeconds = game.shotClockSeconds ?? 24;

    // Start game in paused state - user must press play to start clock
    // This matches real basketball where clock only runs on live play
    await ctx.db.patch(args.gameId, {
      status: "paused",
      startedAt: game.startedAt || now,
      shotClockSeconds,
      // Don't set shotClockStartedAt - clock is paused
    });

    // Don't schedule timerTick - game starts paused
    // User will call resume() to start the clock

    return { message: "Game ready - press play to start clock", status: "paused" };
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

    // Calculate current shot clock value before pausing
    let shotClockSeconds = game.shotClockSeconds ?? 24;
    if (game.shotClockStartedAt) {
      const elapsed = (Date.now() - game.shotClockStartedAt) / 1000;
      shotClockSeconds = Math.max(0, shotClockSeconds - elapsed);
    }

    await ctx.db.patch(args.gameId, {
      status: "paused",
      // Pause shot clock (store current value, clear start time)
      shotClockSeconds,
      shotClockStartedAt: undefined,
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

    const now = Date.now();
    const shotClockSeconds = game.shotClockSeconds ?? 24;

    await ctx.db.patch(args.gameId, {
      status: "active",
      // Resume shot clock from current value
      shotClockSeconds,
      shotClockStartedAt: now,
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
    forceEnd: v.optional(v.boolean()),
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

    // Check if all quarters have been completed
    const settings = game.gameSettings as any;
    const quartersCompleted = settings?.quartersCompleted || [];

    if (!args.forceEnd && quartersCompleted.length < 4) {
      throw new Error(
        "Cannot end game before all 4 quarters are completed. Use forceEnd to override."
      );
    }

    // End all active lineup stints
    await ctx.runMutation(internal.lineups.endAllGameStints, {
      gameId: args.gameId,
      quarter: game.currentQuarter,
      gameTime: game.timeRemainingSeconds,
    });

    await ctx.db.patch(args.gameId, {
      status: "completed",
      endedAt: Date.now(),
    });

    return { message: "Game ended", status: "completed" };
  },
});

// Reactivate a completed game (allows resuming accidentally ended games)
export const reactivate = mutation({
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

    if (game.status !== "completed") {
      throw new Error("Game is not completed");
    }

    // Reactivate the game in paused state so user can review before resuming
    await ctx.db.patch(args.gameId, {
      status: "paused",
      endedAt: undefined,
    });

    return { message: "Game reactivated", status: "paused" };
  },
});

// Set quarter manually
export const setQuarter = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    quarter: v.number(),
    resetTime: v.optional(v.boolean()),
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

    if (game.status === "completed") {
      throw new Error("Cannot change quarter on a completed game");
    }

    if (args.quarter < 1) {
      throw new Error("Quarter must be at least 1");
    }

    const settings = game.gameSettings as any;
    const quarterMinutes = settings?.quarterMinutes || 12;
    const overtimeMinutes = settings?.overtimeMinutes || 5;

    const updates: any = {
      currentQuarter: args.quarter,
    };

    // Reset time to full quarter/overtime if requested
    if (args.resetTime) {
      const periodMinutes = args.quarter > 4 ? overtimeMinutes : quarterMinutes;
      updates.timeRemainingSeconds = periodMinutes * 60;
    }

    // Pause game when changing quarters
    if (game.status === "active") {
      updates.status = "paused";
    }

    await ctx.db.patch(args.gameId, updates);

    return {
      message: `Changed to quarter ${args.quarter}`,
      quarter: args.quarter,
      status: updates.status || game.status,
    };
  },
});

// Update game settings (only allowed before game starts)
export const updateGameSettings = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    quarterMinutes: v.optional(v.number()),
    foulLimit: v.optional(v.number()), // 5 or 6 fouls before foul out
    startingFive: v.optional(
      v.object({
        homeTeam: v.array(v.id("players")),
        awayTeam: v.array(v.id("players")),
      })
    ),
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

    if (game.status !== "scheduled") {
      throw new Error("Can only update settings before game starts");
    }

    const currentSettings = (game.gameSettings as any) || {};
    const newSettings = { ...currentSettings };

    if (args.quarterMinutes !== undefined) {
      if (args.quarterMinutes < 1 || args.quarterMinutes > 20) {
        throw new Error("Quarter minutes must be between 1 and 20");
      }
      newSettings.quarterMinutes = args.quarterMinutes;
    }

    if (args.foulLimit !== undefined) {
      if (args.foulLimit !== 5 && args.foulLimit !== 6) {
        throw new Error("Foul limit must be 5 or 6");
      }
      newSettings.foulLimit = args.foulLimit;
    }

    if (args.startingFive) {
      // Validate players belong to the correct teams
      for (const playerId of args.startingFive.homeTeam) {
        const player = await ctx.db.get(playerId);
        if (!player || player.teamId !== game.homeTeamId) {
          throw new Error("Invalid home team player");
        }
      }
      for (const playerId of args.startingFive.awayTeam) {
        const player = await ctx.db.get(playerId);
        if (!player || player.teamId !== game.awayTeamId) {
          throw new Error("Invalid away team player");
        }
      }

      if (args.startingFive.homeTeam.length > 5 || args.startingFive.awayTeam.length > 5) {
        throw new Error("Starting lineup cannot have more than 5 players");
      }

      newSettings.startingFive = args.startingFive;
    }

    // Update time remaining if quarter minutes changed
    const updates: any = { gameSettings: newSettings };
    if (args.quarterMinutes !== undefined) {
      updates.timeRemainingSeconds = args.quarterMinutes * 60;
    }

    await ctx.db.patch(args.gameId, updates);

    return {
      message: "Game settings updated",
      gameSettings: newSettings,
    };
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

    const settings = (game.gameSettings as any) || {};
    const newTime = Math.max(0, game.timeRemainingSeconds - 1);
    const quarterMinutes = settings.quarterMinutes || 12;

    if (newTime === 0) {
      // Track completed quarters
      const quartersCompleted = settings.quartersCompleted || [];
      if (!quartersCompleted.includes(game.currentQuarter)) {
        quartersCompleted.push(game.currentQuarter);
      }
      const newSettings = { ...settings, quartersCompleted };

      if (game.currentQuarter < 4) {
        // Quarter ended - move to next quarter
        await ctx.db.patch(args.gameId, {
          timeRemainingSeconds: quarterMinutes * 60,
          currentQuarter: game.currentQuarter + 1,
          status: "paused", // Pause for quarter break
          gameSettings: newSettings,
        });
        // Don't schedule next tick - game is paused
        return;
      } else {
        // Game ended - all 4 quarters completed
        await ctx.db.patch(args.gameId, {
          status: "completed",
          endedAt: Date.now(),
          timeRemainingSeconds: 0,
          gameSettings: newSettings,
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
            offensiveRebounds: stat.offensiveRebounds,
            defensiveRebounds: stat.defensiveRebounds,
            assists: stat.assists,
            steals: stat.steals,
            blocks: stat.blocks,
            turnovers: stat.turnovers,
            fouls: stat.fouls,
            // Individual numeric fields for advanced stats calculations
            fieldGoalsMade: stat.fieldGoalsMade,
            fieldGoalsAttempted: stat.fieldGoalsAttempted,
            threePointersMade: stat.threePointersMade,
            threePointersAttempted: stat.threePointersAttempted,
            freeThrowsMade: stat.freeThrowsMade,
            freeThrowsAttempted: stat.freeThrowsAttempted,
            // String format for display
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

// Create quick game without existing teams
export const createQuickGame = mutation({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
    homeTeamName: v.string(),
    awayTeamName: v.string(),
    quarterMinutes: v.optional(v.number()),
    playersPerTeam: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    // Check user has permission to create games
    const role = await getUserLeagueRole(ctx, user._id, args.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied - insufficient permissions");
    }

    // Get league settings for defaults
    const league = await ctx.db.get(args.leagueId);
    const leagueSettings = league?.settings || {};

    // Use provided values or fall back to league settings or defaults
    const quarterMinutes = args.quarterMinutes || leagueSettings.quarterMinutes || 12;
    const playersPerTeam = args.playersPerTeam || leagueSettings.playersPerRoster || 15;

    // Create temporary home team
    const homeTeamId = await ctx.db.insert("teams", {
      name: args.homeTeamName,
      leagueId: args.leagueId,
      userId: user._id,
    });

    // Create temporary away team
    const awayTeamId = await ctx.db.insert("teams", {
      name: args.awayTeamName,
      leagueId: args.leagueId,
      userId: user._id,
    });

    // Create numbered players for home team
    for (let i = 1; i <= playersPerTeam; i++) {
      await ctx.db.insert("players", {
        teamId: homeTeamId,
        name: `Player ${i}`,
        number: i,
        active: true,
      });
    }

    // Create numbered players for away team
    for (let i = 1; i <= playersPerTeam; i++) {
      await ctx.db.insert("players", {
        teamId: awayTeamId,
        name: `Player ${i}`,
        number: i,
        active: true,
      });
    }

    // Create the game
    const gameId = await ctx.db.insert("games", {
      homeTeamId,
      awayTeamId,
      leagueId: args.leagueId,
      status: "scheduled",
      currentQuarter: 1,
      timeRemainingSeconds: quarterMinutes * 60,
      homeScore: 0,
      awayScore: 0,
      gameSettings: {
        quarterMinutes,
        foulLimit: leagueSettings.foulLimit,
        timeoutsPerTeam: leagueSettings.timeoutsPerTeam,
        overtimeMinutes: leagueSettings.overtimeMinutes,
        bonusMode: leagueSettings.bonusMode,
        isQuickGame: true,
        customHomeTeamName: args.homeTeamName,
        customAwayTeamName: args.awayTeamName,
      },
      userId: user._id,
    });

    // Initialize player stats
    const homePlayers = await ctx.db
      .query("players")
      .withIndex("by_team", (q) => q.eq("teamId", homeTeamId))
      .collect();

    const awayPlayers = await ctx.db
      .query("players")
      .withIndex("by_team", (q) => q.eq("teamId", awayTeamId))
      .collect();

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

    return {
      gameId,
      homeTeamId,
      awayTeamId,
      message: "Quick game created successfully",
    };
  },
});

// Helper function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Record timeout
export const recordTimeout = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    teamId: v.id("teams"),
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

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const gameSettings = (game.gameSettings as any) || {};
    const timeoutsPerTeam = gameSettings.timeoutsPerTeam || 4;

    // Get team stats
    let teamStats = await ctx.db
      .query("teamStats")
      .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", args.teamId))
      .first();

    const currentTimeouts = teamStats?.timeoutsRemaining ?? timeoutsPerTeam;

    if (currentTimeouts <= 0) {
      throw new Error("No timeouts remaining");
    }

    const newTimeoutsRemaining = currentTimeouts - 1;

    if (teamStats) {
      await ctx.db.patch(teamStats._id, {
        timeoutsRemaining: newTimeoutsRemaining,
      });
    } else {
      await ctx.db.insert("teamStats", {
        gameId: args.gameId,
        teamId: args.teamId,
        offensiveRebounds: 0,
        defensiveRebounds: 0,
        teamFouls: 0,
        timeoutsRemaining: newTimeoutsRemaining,
      });
    }

    // Pause the game
    if (game.status === "active") {
      await ctx.db.patch(args.gameId, { status: "paused" });
    }

    // Log the event
    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      eventType: "timeout",
      teamId: args.teamId,
      quarter: game.currentQuarter,
      gameTime: game.timeRemainingSeconds,
      timestamp: Date.now(),
      details: {
        timeoutsRemaining: newTimeoutsRemaining,
      },
      description: `Timeout - ${team.name} (${newTimeoutsRemaining} remaining)`,
    });

    return {
      timeoutsRemaining: newTimeoutsRemaining,
      message: `Timeout called by ${team.name}`,
    };
  },
});

// Start overtime
export const startOvertime = mutation({
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

    // Can only start OT after Q4 or later
    if (game.currentQuarter < 4) {
      throw new Error("Cannot start overtime before Q4 is complete");
    }

    const gameSettings = (game.gameSettings as any) || {};
    const overtimeMinutes = gameSettings.overtimeMinutes || 5;
    const currentOvertimes = gameSettings.overtimePeriods || 0;
    const newOvertimeNumber = currentOvertimes + 1;

    // Record score at end of regulation/previous OT
    const scoreByPeriod = gameSettings.scoreByPeriod || {};
    const periodKey = game.currentQuarter === 4 ? "regulation" : `ot${currentOvertimes}`;
    scoreByPeriod[periodKey] = {
      home: game.homeScore,
      away: game.awayScore,
    };

    const newSettings = {
      ...gameSettings,
      overtimePeriods: newOvertimeNumber,
      scoreByPeriod,
    };

    // Reset team fouls for overtime
    const homeTeamStats = await ctx.db
      .query("teamStats")
      .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", game.homeTeamId))
      .first();

    const awayTeamStats = await ctx.db
      .query("teamStats")
      .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", game.awayTeamId))
      .first();

    // Reset fouls for OT period
    if (homeTeamStats) {
      const foulsByQuarter = homeTeamStats.foulsByQuarter || { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 };
      foulsByQuarter.ot = 0;
      await ctx.db.patch(homeTeamStats._id, { foulsByQuarter });
    }

    if (awayTeamStats) {
      const foulsByQuarter = awayTeamStats.foulsByQuarter || { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 };
      foulsByQuarter.ot = 0;
      await ctx.db.patch(awayTeamStats._id, { foulsByQuarter });
    }

    // Update game to OT period
    await ctx.db.patch(args.gameId, {
      currentQuarter: 4 + newOvertimeNumber, // Q5 = OT1, Q6 = OT2, etc.
      timeRemainingSeconds: overtimeMinutes * 60,
      status: "paused",
      gameSettings: newSettings,
    });

    // Log the event
    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      eventType: "overtime_start",
      quarter: 4 + newOvertimeNumber,
      gameTime: overtimeMinutes * 60,
      timestamp: Date.now(),
      details: {
        overtimeNumber: newOvertimeNumber,
      },
      description: `Overtime ${newOvertimeNumber} Started`,
    });

    return {
      overtimeNumber: newOvertimeNumber,
      message: `Overtime ${newOvertimeNumber} started`,
    };
  },
});

// Update score by period when scoring
export const updateScoreByPeriod = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const gameSettings = (game.gameSettings as any) || {};
    const scoreByPeriod = gameSettings.scoreByPeriod || {
      q1: { home: 0, away: 0 },
      q2: { home: 0, away: 0 },
      q3: { home: 0, away: 0 },
      q4: { home: 0, away: 0 },
    };

    // Update current period's score
    const currentQ = game.currentQuarter;
    const periodKey = currentQ <= 4 ? `q${currentQ}` : `ot${currentQ - 4}`;
    scoreByPeriod[periodKey] = {
      home: game.homeScore,
      away: game.awayScore,
    };

    const newSettings = { ...gameSettings, scoreByPeriod };
    await ctx.db.patch(args.gameId, { gameSettings: newSettings });

    return { scoreByPeriod };
  },
});

// Get game events (play-by-play)
export const getGameEvents = query({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    limit: v.optional(v.number()),
    quarter: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const hasAccess = await canAccessLeague(ctx, user._id, game.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    let events;
    if (args.quarter !== undefined) {
      events = await ctx.db
        .query("gameEvents")
        .withIndex("by_game_quarter", (q) =>
          q.eq("gameId", args.gameId).eq("quarter", args.quarter!)
        )
        .order("desc")
        .collect();
    } else {
      events = await ctx.db
        .query("gameEvents")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .order("desc")
        .collect();
    }

    if (args.limit) {
      events = events.slice(0, args.limit);
    }

    // Format events with player info
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        let playerInfo = null;
        if (event.playerId) {
          const player = await ctx.db.get(event.playerId);
          if (player) {
            playerInfo = {
              id: player._id,
              name: player.name,
              number: player.number,
            };
          }
        }

        let teamInfo = null;
        if (event.teamId) {
          const team = await ctx.db.get(event.teamId);
          if (team) {
            teamInfo = {
              id: team._id,
              name: team.name,
            };
          }
        }

        return {
          id: event._id,
          eventType: event.eventType,
          quarter: event.quarter,
          gameTime: event.gameTime,
          gameTimeDisplay: formatTime(event.gameTime),
          timestamp: event.timestamp,
          description: event.description,
          details: event.details,
          player: playerInfo,
          team: teamInfo,
        };
      })
    );

    return { events: formattedEvents };
  },
});

// Add game note
export const addGameNote = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    note: v.string(),
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

    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      eventType: "note",
      quarter: game.currentQuarter,
      gameTime: game.timeRemainingSeconds,
      timestamp: Date.now(),
      details: {
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
      },
      description: args.note,
    });

    return { message: "Note added" };
  },
});

// Retroactive pause - pause game and set time to a specific value
// Used for shot clock violations where the game clock should stop at violation moment
export const retroactivePause = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    timeRemainingSeconds: v.number(),
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

    // Calculate current shot clock value before pausing
    let shotClockSeconds = game.shotClockSeconds ?? 24;
    if (game.shotClockStartedAt) {
      const elapsed = (Date.now() - game.shotClockStartedAt) / 1000;
      shotClockSeconds = Math.max(0, shotClockSeconds - elapsed);
    }

    await ctx.db.patch(args.gameId, {
      status: "paused",
      timeRemainingSeconds: Math.max(0, args.timeRemainingSeconds),
      // Also pause shot clock
      shotClockSeconds,
      shotClockStartedAt: undefined,
    });

    return {
      message: "Game paused retroactively",
      status: "paused",
      timeRemainingSeconds: args.timeRemainingSeconds,
    };
  },
});

// =====================
// Shot Clock Mutations
// =====================

// Start the shot clock
export const startShotClock = mutation({
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

    // Only start if not already running
    if (game.shotClockStartedAt) {
      return { message: "Shot clock already running" };
    }

    const currentSeconds = game.shotClockSeconds ?? 24;

    await ctx.db.patch(args.gameId, {
      shotClockSeconds: currentSeconds,
      shotClockStartedAt: Date.now(),
    });

    return { message: "Shot clock started", seconds: currentSeconds };
  },
});

// Pause the shot clock
export const pauseShotClock = mutation({
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

    // Calculate current seconds remaining
    let currentSeconds = game.shotClockSeconds ?? 24;
    if (game.shotClockStartedAt) {
      const elapsed = (Date.now() - game.shotClockStartedAt) / 1000;
      currentSeconds = Math.max(0, currentSeconds - elapsed);
    }

    await ctx.db.patch(args.gameId, {
      shotClockSeconds: currentSeconds,
      shotClockStartedAt: undefined,
    });

    return { message: "Shot clock paused", seconds: currentSeconds };
  },
});

// Reset shot clock to 24 seconds (or custom value)
export const resetShotClock = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    seconds: v.optional(v.number()),
    autoStart: v.optional(v.boolean()),
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

    const newSeconds = args.seconds ?? 24;
    const shouldStart = args.autoStart && game.status === "active";

    await ctx.db.patch(args.gameId, {
      shotClockSeconds: newSeconds,
      shotClockStartedAt: shouldStart ? Date.now() : undefined,
    });

    return { message: "Shot clock reset", seconds: newSeconds, isRunning: shouldStart };
  },
});

/**
 * Set the game clock time manually (for corrections during game)
 */
export const setGameTime = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    timeRemainingSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const hasAccess = await canAccessLeague(ctx, user._id, game.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const newTime = Math.max(0, Math.floor(args.timeRemainingSeconds));

    await ctx.db.patch(args.gameId, {
      timeRemainingSeconds: newTime,
    });

    return { message: "Game time updated", timeRemainingSeconds: newTime };
  },
});
