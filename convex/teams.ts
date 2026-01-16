import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken, canAccessLeague, canManageLeague } from "./lib/auth";

// List teams in a league
export const list = query({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const formattedTeams = await Promise.all(
      teams.map(async (team) => {
        // Get active players count
        const players = await ctx.db
          .query("players")
          .withIndex("by_team_active", (q) =>
            q.eq("teamId", team._id).eq("active", true)
          )
          .collect();

        // Get completed games for win/loss record
        const homeGames = await ctx.db
          .query("games")
          .withIndex("by_home_team", (q) => q.eq("homeTeamId", team._id))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        const awayGames = await ctx.db
          .query("games")
          .withIndex("by_away_team", (q) => q.eq("awayTeamId", team._id))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        let wins = 0;
        let losses = 0;

        for (const game of homeGames) {
          if (game.homeScore > game.awayScore) wins++;
          else losses++;
        }

        for (const game of awayGames) {
          if (game.awayScore > game.homeScore) wins++;
          else losses++;
        }

        const gamesPlayed = wins + losses;
        const winPercentage = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

        // Get owner info if exists
        const owner = team.userId ? await ctx.db.get(team.userId) : null;

        return {
          id: team._id,
          name: team.name,
          city: team.city,
          logoUrl: team.logoUrl,
          description: team.description,
          activePlayersCount: players.length,
          wins,
          losses,
          gamesPlayed,
          winPercentage: Math.round(winPercentage * 10) / 10,
          owner: owner
            ? {
                id: owner._id,
                name: `${owner.firstName} ${owner.lastName}`,
              }
            : null,
          createdAt: team._creationTime,
        };
      })
    );

    return { teams: formattedTeams };
  },
});

// Get single team with players
export const get = query({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const hasAccess = await canAccessLeague(ctx, user._id, team.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    // Get players
    const players = await ctx.db
      .query("players")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();

    // Get win/loss record
    const homeGames = await ctx.db
      .query("games")
      .withIndex("by_home_team", (q) => q.eq("homeTeamId", team._id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const awayGames = await ctx.db
      .query("games")
      .withIndex("by_away_team", (q) => q.eq("awayTeamId", team._id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    let wins = 0;
    let losses = 0;

    for (const game of homeGames) {
      if (game.homeScore > game.awayScore) wins++;
      else losses++;
    }

    for (const game of awayGames) {
      if (game.awayScore > game.homeScore) wins++;
      else losses++;
    }

    const gamesPlayed = wins + losses;
    const winPercentage = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    const owner = team.userId ? await ctx.db.get(team.userId) : null;
    const league = await ctx.db.get(team.leagueId);

    return {
      team: {
        id: team._id,
        name: team.name,
        city: team.city,
        logoUrl: team.logoUrl,
        description: team.description,
        activePlayersCount: players.filter((p) => p.active).length,
        wins,
        losses,
        gamesPlayed,
        winPercentage: Math.round(winPercentage * 10) / 10,
        league: league
          ? {
              id: league._id,
              name: league.name,
              leagueType: league.leagueType,
            }
          : null,
        owner: owner
          ? {
              id: owner._id,
              name: `${owner.firstName} ${owner.lastName}`,
            }
          : null,
        players: players.map((player) => ({
          id: player._id,
          name: player.name,
          number: player.number,
          position: player.position,
          heightCm: player.heightCm,
          weightKg: player.weightKg,
          active: player.active,
        })),
        createdAt: team._creationTime,
      },
    };
  },
});

// Create team
export const create = mutation({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
    name: v.string(),
    city: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const canManage = await canManageLeague(ctx, user._id, args.leagueId);
    if (!canManage) throw new Error("Access denied - must be league admin or owner");

    // Check for duplicate team name in league
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_name_league", (q) =>
        q.eq("leagueId", args.leagueId).eq("name", args.name)
      )
      .first();

    if (existingTeam) {
      throw new Error("A team with this name already exists in the league");
    }

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      city: args.city,
      logoUrl: args.logoUrl,
      description: args.description,
      leagueId: args.leagueId,
      userId: user._id,
    });

    const team = await ctx.db.get(teamId);

    return {
      team: {
        id: team!._id,
        name: team!.name,
        city: team!.city,
        logoUrl: team!.logoUrl,
        description: team!.description,
        createdAt: team!._creationTime,
      },
      message: "Team created successfully",
    };
  },
});

// Update team
export const update = mutation({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    city: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
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

    // Check for duplicate name if changing
    if (args.name && args.name !== team.name) {
      const newName = args.name;
      const existingTeam = await ctx.db
        .query("teams")
        .withIndex("by_name_league", (q) =>
          q.eq("leagueId", team.leagueId).eq("name", newName)
        )
        .first();

      if (existingTeam) {
        throw new Error("A team with this name already exists in the league");
      }
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.city !== undefined) updates.city = args.city;
    if (args.logoUrl !== undefined) updates.logoUrl = args.logoUrl;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.teamId, updates);

    const updatedTeam = await ctx.db.get(args.teamId);

    return {
      team: {
        id: updatedTeam!._id,
        name: updatedTeam!.name,
        city: updatedTeam!.city,
        logoUrl: updatedTeam!.logoUrl,
        description: updatedTeam!.description,
        createdAt: updatedTeam!._creationTime,
      },
      message: "Team updated successfully",
    };
  },
});

// Delete team
export const remove = mutation({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
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

    // Check if team has games
    const homeGame = await ctx.db
      .query("games")
      .withIndex("by_home_team", (q) => q.eq("homeTeamId", args.teamId))
      .first();

    const awayGame = await ctx.db
      .query("games")
      .withIndex("by_away_team", (q) => q.eq("awayTeamId", args.teamId))
      .first();

    if (homeGame || awayGame) {
      throw new Error("Cannot delete team with existing games");
    }

    // Delete all players first
    const players = await ctx.db
      .query("players")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const player of players) {
      await ctx.db.delete(player._id);
    }

    // Delete team
    await ctx.db.delete(args.teamId);

    return { message: "Team deleted successfully" };
  },
});
