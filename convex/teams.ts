import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken, canAccessLeague, canManageLeague, canManageTeam } from "./lib/auth";
import { validateName, validateEntityFields } from "./lib/validation";

// Helper to resolve logo URL from either logoUrl or logoStorageId
async function resolveLogoUrl(
  ctx: any,
  logoUrl: string | undefined,
  logoStorageId: any | undefined
): Promise<string | undefined> {
  if (logoStorageId) {
    const url = await ctx.storage.getUrl(logoStorageId);
    return url || undefined;
  }
  return logoUrl;
}

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
          .withIndex("by_team_active", (q) => q.eq("teamId", team._id).eq("active", true))
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

        // Resolve logo URL
        const logoUrl = await resolveLogoUrl(ctx, team.logoUrl, team.logoStorageId);

        return {
          id: team._id,
          name: team.name,
          city: team.city,
          logoUrl,
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
          // Team colors
          primaryColor: team.primaryColor,
          secondaryColor: team.secondaryColor,
          // Team links
          websiteUrl: team.websiteUrl,
          socialLinks: team.socialLinks,
          // Include players for frontend use (player comparison, shot charts, etc.)
          players: players.map((p) => ({
            id: p._id,
            name: p.name,
            number: p.number,
            position: p.position,
            active: p.active,
          })),
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

    // Resolve logo URL
    const logoUrl = await resolveLogoUrl(ctx, team.logoUrl, team.logoStorageId);

    // Check if user can manage this team
    const userCanManage = await canManageTeam(ctx, user._id, args.teamId);

    return {
      team: {
        id: team._id,
        name: team.name,
        city: team.city,
        logoUrl,
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
        // Team colors
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        // Team links
        websiteUrl: team.websiteUrl,
        socialLinks: team.socialLinks,
        // Permission flag for UI
        canManage: userCanManage,
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
    logoStorageId: v.optional(v.id("_storage")),
    description: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        twitter: v.optional(v.string()),
        facebook: v.optional(v.string()),
        youtube: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        linkedin: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const canManage = await canManageLeague(ctx, user._id, args.leagueId);
    if (!canManage) throw new Error("Access denied - must be league admin or owner");

    // Validate input lengths
    validateName(args.name, "Team name");
    validateEntityFields({ description: args.description, city: args.city });

    // Check for duplicate team name in league
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_name_league", (q) => q.eq("leagueId", args.leagueId).eq("name", args.name))
      .first();

    if (existingTeam) {
      throw new Error("A team with this name already exists in the league");
    }

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      city: args.city,
      logoUrl: args.logoUrl,
      logoStorageId: args.logoStorageId,
      description: args.description,
      leagueId: args.leagueId,
      userId: user._id,
      primaryColor: args.primaryColor,
      secondaryColor: args.secondaryColor,
      websiteUrl: args.websiteUrl,
      socialLinks: args.socialLinks,
    });

    const team = await ctx.db.get(teamId);
    const logoUrl = await resolveLogoUrl(ctx, team!.logoUrl, team!.logoStorageId);

    return {
      team: {
        id: team!._id,
        name: team!.name,
        city: team!.city,
        logoUrl,
        description: team!.description,
        primaryColor: team!.primaryColor,
        secondaryColor: team!.secondaryColor,
        websiteUrl: team!.websiteUrl,
        socialLinks: team!.socialLinks,
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
    logoStorageId: v.optional(v.id("_storage")),
    clearLogo: v.optional(v.boolean()),
    description: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        twitter: v.optional(v.string()),
        facebook: v.optional(v.string()),
        youtube: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        linkedin: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const hasPermission = await canManageTeam(ctx, user._id, args.teamId);
    if (!hasPermission) {
      throw new Error("Access denied - must be league admin, team owner, or team coach");
    }

    // Validate input lengths
    if (args.name) validateName(args.name, "Team name");
    validateEntityFields({ description: args.description, city: args.city });

    // Check for duplicate name if changing
    if (args.name && args.name !== team.name) {
      const newName = args.name;
      const existingTeam = await ctx.db
        .query("teams")
        .withIndex("by_name_league", (q) => q.eq("leagueId", team.leagueId).eq("name", newName))
        .first();

      if (existingTeam) {
        throw new Error("A team with this name already exists in the league");
      }
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.city !== undefined) updates.city = args.city;
    if (args.description !== undefined) updates.description = args.description;
    if (args.primaryColor !== undefined) updates.primaryColor = args.primaryColor;
    if (args.secondaryColor !== undefined) updates.secondaryColor = args.secondaryColor;
    if (args.websiteUrl !== undefined) updates.websiteUrl = args.websiteUrl;
    if (args.socialLinks !== undefined) updates.socialLinks = args.socialLinks;

    // Handle logo updates
    if (args.clearLogo) {
      // Delete old storage file if exists
      if (team.logoStorageId) {
        await ctx.storage.delete(team.logoStorageId);
      }
      updates.logoUrl = undefined;
      updates.logoStorageId = undefined;
    } else if (args.logoStorageId !== undefined) {
      // New storage-based logo - delete old storage file if exists
      if (team.logoStorageId && team.logoStorageId !== args.logoStorageId) {
        await ctx.storage.delete(team.logoStorageId);
      }
      updates.logoStorageId = args.logoStorageId;
      updates.logoUrl = undefined; // Clear URL-based logo
    } else if (args.logoUrl !== undefined) {
      // URL-based logo - delete old storage file if exists
      if (team.logoStorageId) {
        await ctx.storage.delete(team.logoStorageId);
      }
      updates.logoUrl = args.logoUrl;
      updates.logoStorageId = undefined;
    }

    await ctx.db.patch(args.teamId, updates);

    const updatedTeam = await ctx.db.get(args.teamId);
    const logoUrl = await resolveLogoUrl(ctx, updatedTeam!.logoUrl, updatedTeam!.logoStorageId);

    return {
      team: {
        id: updatedTeam!._id,
        name: updatedTeam!.name,
        city: updatedTeam!.city,
        logoUrl,
        description: updatedTeam!.description,
        primaryColor: updatedTeam!.primaryColor,
        secondaryColor: updatedTeam!.secondaryColor,
        websiteUrl: updatedTeam!.websiteUrl,
        socialLinks: updatedTeam!.socialLinks,
        createdAt: updatedTeam!._creationTime,
      },
      message: "Team updated successfully",
    };
  },
});

// Delete team (with cascade delete of all related data)
export const remove = mutation({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    force: v.optional(v.boolean()), // Force delete with all related data
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const hasPermission = await canManageTeam(ctx, user._id, args.teamId);
    if (!hasPermission) {
      throw new Error("Access denied - must be league admin, team owner, or team coach");
    }

    // Check if team has games
    const homeGames = await ctx.db
      .query("games")
      .withIndex("by_home_team", (q) => q.eq("homeTeamId", args.teamId))
      .collect();

    const awayGames = await ctx.db
      .query("games")
      .withIndex("by_away_team", (q) => q.eq("awayTeamId", args.teamId))
      .collect();

    const allGames = [...homeGames, ...awayGames];

    if (allGames.length > 0 && !args.force) {
      throw new Error(
        `This team has ${allGames.length} game(s). Use force=true to delete all related data.`
      );
    }

    // Cascade delete all related data if force is true
    if (args.force && allGames.length > 0) {
      for (const game of allGames) {
        // Delete player stats for this game
        const playerStats = await ctx.db
          .query("playerStats")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();
        for (const stat of playerStats) {
          await ctx.db.delete(stat._id);
        }

        // Delete team stats for this game
        const teamStats = await ctx.db
          .query("teamStats")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();
        for (const stat of teamStats) {
          await ctx.db.delete(stat._id);
        }

        // Delete shots for this game
        const shots = await ctx.db
          .query("shots")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();
        for (const shot of shots) {
          await ctx.db.delete(shot._id);
        }

        // Delete game events for this game
        const events = await ctx.db
          .query("gameEvents")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();
        for (const event of events) {
          await ctx.db.delete(event._id);
        }

        // Delete the game
        await ctx.db.delete(game._id);
      }
    }

    // Delete all players
    const players = await ctx.db
      .query("players")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const player of players) {
      // Delete any remaining player stats (from other teams' games)
      const playerStatRecords = await ctx.db
        .query("playerStats")
        .withIndex("by_player", (q) => q.eq("playerId", player._id))
        .collect();
      for (const stat of playerStatRecords) {
        await ctx.db.delete(stat._id);
      }

      // Delete any remaining shots
      const playerShots = await ctx.db
        .query("shots")
        .withIndex("by_player", (q) => q.eq("playerId", player._id))
        .collect();
      for (const shot of playerShots) {
        await ctx.db.delete(shot._id);
      }

      await ctx.db.delete(player._id);
    }

    // Delete team stats
    const teamStatRecords = await ctx.db
      .query("teamStats")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .collect();
    for (const stat of teamStatRecords) {
      await ctx.db.delete(stat._id);
    }

    // Delete logo file from storage if exists
    if (team.logoStorageId) {
      await ctx.storage.delete(team.logoStorageId);
    }

    // Delete team
    await ctx.db.delete(args.teamId);

    return { message: "Team and all related data deleted successfully" };
  },
});
