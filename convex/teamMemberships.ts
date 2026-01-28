import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken, canAccessLeague, canManageLeague } from "./lib/auth";

// List team memberships
export const list = query({
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

    const memberships = await ctx.db
      .query("teamMemberships")
      .withIndex("by_team_status", (q) => q.eq("teamId", args.teamId).eq("status", "active"))
      .collect();

    // Enrich with user and player data
    const enrichedMemberships = await Promise.all(
      memberships.map(async (membership) => {
        const memberUser = await ctx.db.get(membership.userId);
        const player = membership.playerId ? await ctx.db.get(membership.playerId) : null;

        return {
          id: membership._id,
          teamId: membership.teamId,
          userId: membership.userId,
          role: membership.role,
          status: membership.status,
          joinedAt: membership.joinedAt,
          user: memberUser
            ? {
                id: memberUser._id,
                firstName: memberUser.firstName,
                lastName: memberUser.lastName,
                email: memberUser.email,
              }
            : null,
          player: player
            ? {
                id: player._id,
                name: player.name,
                number: player.number,
              }
            : null,
        };
      })
    );

    return { memberships: enrichedMemberships };
  },
});

// Add a member to a team
export const add = mutation({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(
      v.literal("coach"),
      v.literal("assistant"),
      v.literal("player"),
      v.literal("manager")
    ),
    playerId: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Must be league admin/owner or team coach to add members
    const canManage = await canManageLeague(ctx, user._id, team.leagueId);
    const isTeamCoach = await isCoachOfTeam(ctx, user._id, args.teamId);
    if (!canManage && !isTeamCoach) {
      throw new Error("Access denied - must be league admin or team coach");
    }

    // Check if membership already exists
    const existing = await ctx.db
      .query("teamMemberships")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .first();

    if (existing) {
      if (existing.status === "active") {
        throw new Error("User is already a member of this team");
      }
      // Reactivate removed membership
      await ctx.db.patch(existing._id, {
        status: "active",
        role: args.role,
        playerId: args.playerId,
        joinedAt: Date.now(),
      });
      return { id: existing._id, message: "Membership reactivated" };
    }

    // Validate player belongs to team if provided
    if (args.playerId) {
      const player = await ctx.db.get(args.playerId);
      if (!player || player.teamId !== args.teamId) {
        throw new Error("Player does not belong to this team");
      }
    }

    const membershipId = await ctx.db.insert("teamMemberships", {
      teamId: args.teamId,
      userId: args.userId,
      role: args.role,
      status: "active",
      playerId: args.playerId,
      joinedAt: Date.now(),
    });

    return { id: membershipId, message: "Member added successfully" };
  },
});

// Update a membership (change role)
export const update = mutation({
  args: {
    token: v.string(),
    membershipId: v.id("teamMemberships"),
    role: v.optional(
      v.union(
        v.literal("coach"),
        v.literal("assistant"),
        v.literal("player"),
        v.literal("manager")
      )
    ),
    playerId: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error("Membership not found");

    const team = await ctx.db.get(membership.teamId);
    if (!team) throw new Error("Team not found");

    // Must be league admin/owner or team coach
    const canManage = await canManageLeague(ctx, user._id, team.leagueId);
    const isTeamCoach = await isCoachOfTeam(ctx, user._id, membership.teamId);
    if (!canManage && !isTeamCoach) {
      throw new Error("Access denied");
    }

    const updates: any = {};
    if (args.role !== undefined) updates.role = args.role;
    if (args.playerId !== undefined) updates.playerId = args.playerId;

    await ctx.db.patch(args.membershipId, updates);

    return { message: "Membership updated successfully" };
  },
});

// Remove a member from a team
export const remove = mutation({
  args: {
    token: v.string(),
    membershipId: v.id("teamMemberships"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error("Membership not found");

    const team = await ctx.db.get(membership.teamId);
    if (!team) throw new Error("Team not found");

    // Must be league admin/owner or team coach
    const canManage = await canManageLeague(ctx, user._id, team.leagueId);
    const isTeamCoach = await isCoachOfTeam(ctx, user._id, membership.teamId);
    if (!canManage && !isTeamCoach) {
      throw new Error("Access denied");
    }

    // Soft delete by setting status to removed
    await ctx.db.patch(args.membershipId, {
      status: "removed",
    });

    return { message: "Member removed successfully" };
  },
});

// Get user's teams (teams where user has a membership)
export const getUserTeams = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const memberships = await ctx.db
      .query("teamMemberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        return team
          ? {
              id: team._id,
              name: team.name,
              city: team.city,
              logoUrl: team.logoUrl,
              role: membership.role,
            }
          : null;
      })
    );

    return { teams: teams.filter(Boolean) };
  },
});

// Helper function to check if user is a coach of a team
async function isCoachOfTeam(
  ctx: any,
  userId: any,
  teamId: any
): Promise<boolean> {
  const membership = await ctx.db
    .query("teamMemberships")
    .withIndex("by_team_user", (q: any) => q.eq("teamId", teamId).eq("userId", userId))
    .first();

  return membership?.status === "active" && membership?.role === "coach";
}
