import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken, canAccessLeague, canManageLeague } from "./lib/auth";

// List players (by team or by league)
export const list = query({
  args: {
    token: v.string(),
    teamId: v.optional(v.id("teams")),
    leagueId: v.optional(v.id("leagues")),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    let players;

    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team) throw new Error("Team not found");

      const hasAccess = await canAccessLeague(ctx, user._id, team.leagueId);
      if (!hasAccess) throw new Error("Access denied");

      if (args.activeOnly) {
        players = await ctx.db
          .query("players")
          .withIndex("by_team_active", (q) =>
            q.eq("teamId", args.teamId!).eq("active", true)
          )
          .collect();
      } else {
        players = await ctx.db
          .query("players")
          .withIndex("by_team", (q) => q.eq("teamId", args.teamId!))
          .collect();
      }
    } else if (args.leagueId) {
      const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
      if (!hasAccess) throw new Error("Access denied");

      // Get all teams in league
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId!))
        .collect();

      const teamIds = teams.map((t) => t._id);

      // Get all players from those teams
      const allPlayers = await Promise.all(
        teamIds.map(async (teamId) => {
          if (args.activeOnly) {
            return ctx.db
              .query("players")
              .withIndex("by_team_active", (q) =>
                q.eq("teamId", teamId).eq("active", true)
              )
              .collect();
          }
          return ctx.db
            .query("players")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .collect();
        })
      );

      players = allPlayers.flat();
    } else {
      throw new Error("Either teamId or leagueId is required");
    }

    // Format players with team info
    const formattedPlayers = await Promise.all(
      players.map(async (player) => {
        const team = await ctx.db.get(player.teamId);

        // Calculate season averages
        const stats = await ctx.db
          .query("playerStats")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();

        // Filter to completed games only
        const completedGameIds = new Set<string>();
        const completedStats = [];

        for (const stat of stats) {
          const game = await ctx.db.get(stat.gameId);
          if (game?.status === "completed") {
            completedGameIds.add(game._id);
            completedStats.push(stat);
          }
        }

        const gamesPlayed = completedStats.length;

        let seasonAverages = {
          gamesPlayed,
          points: 0,
          rebounds: 0,
          assists: 0,
          fieldGoalPercentage: 0,
        };

        if (gamesPlayed > 0) {
          const totals = completedStats.reduce(
            (acc, s) => ({
              points: acc.points + s.points,
              rebounds: acc.rebounds + s.rebounds,
              assists: acc.assists + s.assists,
              fgMade: acc.fgMade + s.fieldGoalsMade,
              fgAttempted: acc.fgAttempted + s.fieldGoalsAttempted,
            }),
            { points: 0, rebounds: 0, assists: 0, fgMade: 0, fgAttempted: 0 }
          );

          seasonAverages = {
            gamesPlayed,
            points: Math.round((totals.points / gamesPlayed) * 10) / 10,
            rebounds: Math.round((totals.rebounds / gamesPlayed) * 10) / 10,
            assists: Math.round((totals.assists / gamesPlayed) * 10) / 10,
            fieldGoalPercentage:
              totals.fgAttempted > 0
                ? Math.round((totals.fgMade / totals.fgAttempted) * 1000) / 10
                : 0,
          };
        }

        // Calculate age if birth date exists
        let age: number | null = null;
        if (player.birthDate) {
          const birthDate = new Date(player.birthDate);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
        }

        return {
          id: player._id,
          name: player.name,
          number: player.number,
          position: player.position,
          heightCm: player.heightCm,
          weightKg: player.weightKg,
          birthDate: player.birthDate,
          age,
          active: player.active,
          team: team
            ? {
                id: team._id,
                name: team.name,
                city: team.city,
              }
            : null,
          seasonAverages,
          gamesPlayed,
          createdAt: player._creationTime,
        };
      })
    );

    return { players: formattedPlayers };
  },
});

// Get single player with detailed stats
export const get = query({
  args: {
    token: v.string(),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const team = await ctx.db.get(player.teamId);
    if (!team) throw new Error("Team not found");

    const hasAccess = await canAccessLeague(ctx, user._id, team.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    // Get all stats for completed games
    const stats = await ctx.db
      .query("playerStats")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .collect();

    const completedStats = [];
    for (const stat of stats) {
      const game = await ctx.db.get(stat.gameId);
      if (game?.status === "completed") {
        completedStats.push({ ...stat, game });
      }
    }

    const gamesPlayed = completedStats.length;

    let seasonAverages = {
      gamesPlayed,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      minutesPlayed: 0,
      fieldGoalPercentage: 0,
      threePointPercentage: 0,
      freeThrowPercentage: 0,
    };

    if (gamesPlayed > 0) {
      const totals = completedStats.reduce(
        (acc, s) => ({
          points: acc.points + s.points,
          rebounds: acc.rebounds + s.rebounds,
          assists: acc.assists + s.assists,
          steals: acc.steals + s.steals,
          blocks: acc.blocks + s.blocks,
          turnovers: acc.turnovers + s.turnovers,
          fouls: acc.fouls + s.fouls,
          minutesPlayed: acc.minutesPlayed + s.minutesPlayed,
          fgMade: acc.fgMade + s.fieldGoalsMade,
          fgAttempted: acc.fgAttempted + s.fieldGoalsAttempted,
          threeMade: acc.threeMade + s.threePointersMade,
          threeAttempted: acc.threeAttempted + s.threePointersAttempted,
          ftMade: acc.ftMade + s.freeThrowsMade,
          ftAttempted: acc.ftAttempted + s.freeThrowsAttempted,
        }),
        {
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          fouls: 0,
          minutesPlayed: 0,
          fgMade: 0,
          fgAttempted: 0,
          threeMade: 0,
          threeAttempted: 0,
          ftMade: 0,
          ftAttempted: 0,
        }
      );

      seasonAverages = {
        gamesPlayed,
        points: Math.round((totals.points / gamesPlayed) * 10) / 10,
        rebounds: Math.round((totals.rebounds / gamesPlayed) * 10) / 10,
        assists: Math.round((totals.assists / gamesPlayed) * 10) / 10,
        steals: Math.round((totals.steals / gamesPlayed) * 10) / 10,
        blocks: Math.round((totals.blocks / gamesPlayed) * 10) / 10,
        turnovers: Math.round((totals.turnovers / gamesPlayed) * 10) / 10,
        fouls: Math.round((totals.fouls / gamesPlayed) * 10) / 10,
        minutesPlayed:
          Math.round((totals.minutesPlayed / gamesPlayed) * 10) / 10,
        fieldGoalPercentage:
          totals.fgAttempted > 0
            ? Math.round((totals.fgMade / totals.fgAttempted) * 1000) / 10
            : 0,
        threePointPercentage:
          totals.threeAttempted > 0
            ? Math.round((totals.threeMade / totals.threeAttempted) * 1000) / 10
            : 0,
        freeThrowPercentage:
          totals.ftAttempted > 0
            ? Math.round((totals.ftMade / totals.ftAttempted) * 1000) / 10
            : 0,
      };
    }

    // Calculate age
    let age: number | null = null;
    if (player.birthDate) {
      const birthDate = new Date(player.birthDate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
    }

    return {
      player: {
        id: player._id,
        name: player.name,
        number: player.number,
        position: player.position,
        heightCm: player.heightCm,
        weightKg: player.weightKg,
        birthDate: player.birthDate,
        age,
        active: player.active,
        team: {
          id: team._id,
          name: team.name,
          city: team.city,
        },
        seasonAverages,
        gamesPlayed,
        createdAt: player._creationTime,
      },
    };
  },
});

// Create player
export const create = mutation({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    name: v.string(),
    number: v.number(),
    position: v.optional(
      v.union(
        v.literal("PG"),
        v.literal("SG"),
        v.literal("SF"),
        v.literal("PF"),
        v.literal("C")
      )
    ),
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    birthDate: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const canManage = await canManageLeague(ctx, user._id, team.leagueId);
    if (!canManage && team.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Check for duplicate jersey number on team
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_team_number", (q) =>
        q.eq("teamId", args.teamId).eq("number", args.number)
      )
      .first();

    if (existingPlayer) {
      throw new Error("Jersey number already taken on this team");
    }

    const playerId = await ctx.db.insert("players", {
      teamId: args.teamId,
      name: args.name,
      number: args.number,
      position: args.position,
      heightCm: args.heightCm,
      weightKg: args.weightKg,
      birthDate: args.birthDate,
      active: args.active ?? true,
    });

    const player = await ctx.db.get(playerId);

    return {
      player: {
        id: player!._id,
        name: player!.name,
        number: player!.number,
        position: player!.position,
        heightCm: player!.heightCm,
        weightKg: player!.weightKg,
        birthDate: player!.birthDate,
        active: player!.active,
        createdAt: player!._creationTime,
      },
      message: "Player created successfully",
    };
  },
});

// Update player
export const update = mutation({
  args: {
    token: v.string(),
    playerId: v.id("players"),
    name: v.optional(v.string()),
    number: v.optional(v.number()),
    position: v.optional(
      v.union(
        v.literal("PG"),
        v.literal("SG"),
        v.literal("SF"),
        v.literal("PF"),
        v.literal("C")
      )
    ),
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    birthDate: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const team = await ctx.db.get(player.teamId);
    if (!team) throw new Error("Team not found");

    const canManage = await canManageLeague(ctx, user._id, team.leagueId);
    if (!canManage && team.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Check for duplicate jersey number if changing
    if (args.number !== undefined && args.number !== player.number) {
      const existingPlayer = await ctx.db
        .query("players")
        .withIndex("by_team_number", (q) =>
          q.eq("teamId", player.teamId).eq("number", args.number!)
        )
        .first();

      if (existingPlayer) {
        throw new Error("Jersey number already taken on this team");
      }
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.number !== undefined) updates.number = args.number;
    if (args.position !== undefined) updates.position = args.position;
    if (args.heightCm !== undefined) updates.heightCm = args.heightCm;
    if (args.weightKg !== undefined) updates.weightKg = args.weightKg;
    if (args.birthDate !== undefined) updates.birthDate = args.birthDate;
    if (args.active !== undefined) updates.active = args.active;

    await ctx.db.patch(args.playerId, updates);

    const updatedPlayer = await ctx.db.get(args.playerId);

    return {
      player: {
        id: updatedPlayer!._id,
        name: updatedPlayer!.name,
        number: updatedPlayer!.number,
        position: updatedPlayer!.position,
        heightCm: updatedPlayer!.heightCm,
        weightKg: updatedPlayer!.weightKg,
        birthDate: updatedPlayer!.birthDate,
        active: updatedPlayer!.active,
        createdAt: updatedPlayer!._creationTime,
      },
      message: "Player updated successfully",
    };
  },
});

// Delete player
export const remove = mutation({
  args: {
    token: v.string(),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const team = await ctx.db.get(player.teamId);
    if (!team) throw new Error("Team not found");

    const canManage = await canManageLeague(ctx, user._id, team.leagueId);
    if (!canManage && team.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Check if player has any stats
    const stats = await ctx.db
      .query("playerStats")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (stats) {
      throw new Error(
        "Cannot delete player with game statistics. Set inactive instead."
      );
    }

    await ctx.db.delete(args.playerId);

    return { message: "Player deleted successfully" };
  },
});
