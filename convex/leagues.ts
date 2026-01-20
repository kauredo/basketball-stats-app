import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getUserFromToken, canAccessLeague, canManageLeague, generateToken } from "./lib/auth";

// List leagues (user's leagues + public leagues)
export const list = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    // Get user's memberships
    const memberships = await ctx.db
      .query("leagueMemberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const memberLeagueIds = memberships.map((m) => m.leagueId);

    // Get leagues user owns
    const ownedLeagues = await ctx.db
      .query("leagues")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    // Get public leagues
    const publicLeagues = await ctx.db
      .query("leagues")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Combine and deduplicate
    const allLeagueIds = new Set<string>();
    const leagues = [];

    for (const league of [...ownedLeagues, ...publicLeagues]) {
      if (!allLeagueIds.has(league._id)) {
        allLeagueIds.add(league._id);
        leagues.push(league);
      }
    }

    // Add member leagues
    for (const leagueId of memberLeagueIds) {
      if (!allLeagueIds.has(leagueId)) {
        const league = await ctx.db.get(leagueId);
        if (league) {
          allLeagueIds.add(leagueId);
          leagues.push(league);
        }
      }
    }

    // Format with additional data
    const formattedLeagues = await Promise.all(
      leagues.map(async (league) => {
        const owner = await ctx.db.get(league.ownerId);
        const membership = memberships.find((m) => m.leagueId === league._id);

        // Get counts
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_league", (q) => q.eq("leagueId", league._id))
          .collect();

        const members = await ctx.db
          .query("leagueMemberships")
          .withIndex("by_league_status", (q) => q.eq("leagueId", league._id).eq("status", "active"))
          .collect();

        const games = await ctx.db
          .query("games")
          .withIndex("by_league", (q) => q.eq("leagueId", league._id))
          .collect();

        return {
          id: league._id,
          name: league.name,
          description: league.description,
          leagueType: league.leagueType,
          season: league.season,
          status: league.status,
          isPublic: league.isPublic,
          owner: owner
            ? {
                id: owner._id,
                name: `${owner.firstName} ${owner.lastName}`,
                email: owner.email,
              }
            : null,
          teamsCount: teams.length,
          membersCount: members.length,
          gamesCount: games.length,
          membership: membership
            ? {
                id: membership._id,
                role: membership.role,
                status: membership.status,
                joinedAt: membership.joinedAt,
              }
            : league.ownerId === user._id
              ? { role: "owner", status: "active" }
              : null,
          createdAt: league._creationTime,
        };
      })
    );

    return { leagues: formattedLeagues };
  },
});

// Get single league with details
export const get = query({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    const owner = await ctx.db.get(league.ownerId);

    // Get counts
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_league", (q) => q.eq("leagueId", league._id))
      .collect();

    const members = await ctx.db
      .query("leagueMemberships")
      .withIndex("by_league_status", (q) => q.eq("leagueId", league._id).eq("status", "active"))
      .collect();

    const games = await ctx.db
      .query("games")
      .withIndex("by_league", (q) => q.eq("leagueId", league._id))
      .collect();

    // Get user's membership
    const membership = await ctx.db
      .query("leagueMemberships")
      .withIndex("by_user_league", (q) => q.eq("userId", user._id).eq("leagueId", league._id))
      .first();

    return {
      league: {
        id: league._id,
        name: league.name,
        description: league.description,
        leagueType: league.leagueType,
        season: league.season,
        status: league.status,
        isPublic: league.isPublic,
        owner: owner
          ? {
              id: owner._id,
              name: `${owner.firstName} ${owner.lastName}`,
              email: owner.email,
            }
          : null,
        teamsCount: teams.length,
        membersCount: members.length,
        gamesCount: games.length,
        membership: membership
          ? {
              id: membership._id,
              role: membership.role,
              status: membership.status,
              joinedAt: membership.joinedAt,
              canManageTeams: ["admin", "coach"].includes(membership.role),
              canRecordStats: ["admin", "coach", "scorekeeper"].includes(membership.role),
              canViewAnalytics: ["admin", "coach"].includes(membership.role),
              canManageLeague: membership.role === "admin",
            }
          : league.ownerId === user._id
            ? {
                role: "owner",
                status: "active",
                canManageTeams: true,
                canRecordStats: true,
                canViewAnalytics: true,
                canManageLeague: true,
              }
            : null,
        createdAt: league._creationTime,
      },
    };
  },
});

// Create new league
export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    leagueType: v.union(
      v.literal("professional"),
      v.literal("college"),
      v.literal("high_school"),
      v.literal("youth"),
      v.literal("recreational")
    ),
    season: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    // Generate current season if not provided (e.g., "2024-2025")
    const currentYear = new Date().getFullYear();
    const season = args.season || `${currentYear}-${currentYear + 1}`;

    // Generate invite code
    const inviteCode = `${args.name.toLowerCase().replace(/\s+/g, "-")}-${generateToken(6)}`;

    const leagueId = await ctx.db.insert("leagues", {
      name: args.name,
      description: args.description,
      leagueType: args.leagueType,
      season,
      status: "draft",
      isPublic: args.isPublic ?? false,
      createdById: user._id,
      ownerId: user._id,
      inviteCode,
    });

    // Add owner as admin member
    await ctx.db.insert("leagueMemberships", {
      userId: user._id,
      leagueId,
      role: "admin",
      status: "active",
      joinedAt: Date.now(),
    });

    const league = await ctx.db.get(leagueId);

    return {
      league: {
        id: leagueId,
        name: league!.name,
        description: league!.description,
        leagueType: league!.leagueType,
        season: league!.season,
        status: league!.status,
        isPublic: league!.isPublic,
        inviteCode: league!.inviteCode,
        createdAt: league!._creationTime,
      },
      message: "League created successfully",
    };
  },
});

// Update league
export const update = mutation({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    leagueType: v.optional(
      v.union(
        v.literal("professional"),
        v.literal("college"),
        v.literal("high_school"),
        v.literal("youth"),
        v.literal("recreational")
      )
    ),
    season: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const canManage = await canManageLeague(ctx, user._id, args.leagueId);
    if (!canManage) throw new Error("Access denied");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.leagueType !== undefined) updates.leagueType = args.leagueType;
    if (args.season !== undefined) updates.season = args.season;
    if (args.status !== undefined) updates.status = args.status;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.leagueId, updates);

    const league = await ctx.db.get(args.leagueId);

    return {
      league: {
        id: league!._id,
        name: league!.name,
        description: league!.description,
        leagueType: league!.leagueType,
        season: league!.season,
        status: league!.status,
        isPublic: league!.isPublic,
        createdAt: league!._creationTime,
      },
      message: "League updated successfully",
    };
  },
});

// Delete league (with cascade delete of all related data)
export const remove = mutation({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
    force: v.optional(v.boolean()), // Force delete with all related data
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    // Only owner can delete
    if (league.ownerId !== user._id) {
      throw new Error("Only the league owner can delete the league");
    }

    // Get all teams in the league
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    // If there are teams and force is not true, return warning
    if (teams.length > 0 && !args.force) {
      const games = await ctx.db
        .query("games")
        .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
        .collect();

      throw new Error(
        `This league has ${teams.length} team(s) and ${games.length} game(s). ` +
        `Use force=true to delete all related data.`
      );
    }

    // Cascade delete all related data
    // 1. Delete all games and their related data
    const games = await ctx.db
      .query("games")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    for (const game of games) {
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

    // 2. Delete all teams and their players
    for (const team of teams) {
      // Delete all players on this team
      const players = await ctx.db
        .query("players")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();
      for (const player of players) {
        await ctx.db.delete(player._id);
      }

      // Delete team logo from storage if exists
      if (team.logoStorageId) {
        await ctx.storage.delete(team.logoStorageId);
      }

      // Delete the team
      await ctx.db.delete(team._id);
    }

    // 3. Delete all memberships
    const memberships = await ctx.db
      .query("leagueMemberships")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // 4. Delete all notifications for this league
    const notifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("leagueId"), args.leagueId))
      .collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // 5. Delete all notification preferences for this league
    const prefs = await ctx.db
      .query("notificationPreferences")
      .filter((q) => q.eq(q.field("leagueId"), args.leagueId))
      .collect();
    for (const pref of prefs) {
      await ctx.db.delete(pref._id);
    }

    // Finally, delete the league
    await ctx.db.delete(args.leagueId);

    return { message: "League and all related data deleted successfully" };
  },
});

// Join league
export const join = mutation({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
    role: v.optional(v.union(v.literal("member"), v.literal("viewer"), v.literal("scorekeeper"))),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    // Check if already a member
    const existingMembership = await ctx.db
      .query("leagueMemberships")
      .withIndex("by_user_league", (q) => q.eq("userId", user._id).eq("leagueId", args.leagueId))
      .first();

    if (existingMembership) {
      throw new Error("Already a member of this league");
    }

    // Create membership
    const membershipId = await ctx.db.insert("leagueMemberships", {
      userId: user._id,
      leagueId: args.leagueId,
      role: args.role || "member",
      status: "active",
      joinedAt: Date.now(),
    });

    const membership = await ctx.db.get(membershipId);

    return {
      league: {
        id: league._id,
        name: league.name,
      },
      membership: {
        id: membership!._id,
        role: membership!.role,
        status: membership!.status,
        joinedAt: membership!.joinedAt,
      },
      message: "Successfully joined league",
    };
  },
});

// Join league by invite code
export const joinByCode = mutation({
  args: {
    token: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const league = await ctx.db
      .query("leagues")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.code))
      .first();

    if (!league) throw new Error("Invalid invite code");

    // Check if already a member
    const existingMembership = await ctx.db
      .query("leagueMemberships")
      .withIndex("by_user_league", (q) => q.eq("userId", user._id).eq("leagueId", league._id))
      .first();

    if (existingMembership) {
      throw new Error("Already a member of this league");
    }

    // Create membership
    const membershipId = await ctx.db.insert("leagueMemberships", {
      userId: user._id,
      leagueId: league._id,
      role: "member",
      status: "active",
      joinedAt: Date.now(),
    });

    const membership = await ctx.db.get(membershipId);

    return {
      league: {
        id: league._id,
        name: league.name,
      },
      membership: {
        id: membership!._id,
        role: membership!.role,
        status: membership!.status,
        joinedAt: membership!.joinedAt,
      },
      message: "Successfully joined league",
    };
  },
});

// Leave league
export const leave = mutation({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    // Owner cannot leave
    if (league.ownerId === user._id) {
      throw new Error("League owner cannot leave. Transfer ownership first.");
    }

    const membership = await ctx.db
      .query("leagueMemberships")
      .withIndex("by_user_league", (q) => q.eq("userId", user._id).eq("leagueId", args.leagueId))
      .first();

    if (!membership) {
      throw new Error("Not a member of this league");
    }

    await ctx.db.delete(membership._id);

    return { message: "Successfully left league" };
  },
});

// Get league members
export const getMembers = query({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const memberships = await ctx.db
      .query("leagueMemberships")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const memberUser = await ctx.db.get(membership.userId);
        return {
          id: membership._id,
          role: membership.role,
          displayRole: membership.role.charAt(0).toUpperCase() + membership.role.slice(1),
          status: membership.status,
          joinedAt: membership.joinedAt,
          user: memberUser
            ? {
                id: memberUser._id,
                name: `${memberUser.firstName} ${memberUser.lastName}`,
                email: memberUser.email,
              }
            : null,
          permissions: {
            canManageTeams: ["admin", "coach"].includes(membership.role),
            canRecordStats: ["admin", "coach", "scorekeeper"].includes(membership.role),
            canViewAnalytics: ["admin", "coach"].includes(membership.role),
            canManageLeague: membership.role === "admin",
          },
        };
      })
    );

    return { members };
  },
});

// Get league standings
export const getStandings = query({
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

    const standings = await Promise.all(
      teams.map(async (team) => {
        // Get completed games for this team
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

        return {
          id: team._id,
          name: team.name,
          city: team.city,
          wins,
          losses,
          gamesPlayed,
          winPercentage: Math.round(winPercentage * 10) / 10,
        };
      })
    );

    // Sort by wins (descending), then win percentage
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winPercentage - a.winPercentage;
    });

    return { standings };
  },
});

// Get league invite code
export const getInviteCode = query({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const canManage = await canManageLeague(ctx, user._id, args.leagueId);
    if (!canManage) throw new Error("Access denied");

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    return {
      inviteCode: league.inviteCode,
      inviteUrl: `https://basketballstats.app/join/${league.inviteCode}`,
    };
  },
});
