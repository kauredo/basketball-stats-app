import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// Generate a secure random token
export function generateToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

// Simple hash function for passwords (using Web Crypto API)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  // Add a salt prefix to make it more secure
  const salt = generateToken(16);
  return `${salt}:${hashHex}`;
}

// Verify password against hash
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex === originalHash;
}

// Session token expiry times
export const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
export const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  return { valid: true };
}

// Get user from session token
export async function getUserFromToken(
  ctx: QueryCtx | MutationCtx,
  token: string
): Promise<Doc<"users"> | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session) return null;
  if (session.expiresAt < Date.now()) return null;

  return ctx.db.get(session.userId);
}

// Get user from refresh token
export async function getUserFromRefreshToken(
  ctx: QueryCtx | MutationCtx,
  refreshToken: string
): Promise<{ user: Doc<"users">; sessionId: Id<"sessions"> } | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_refresh_token", (q) => q.eq("refreshToken", refreshToken))
    .first();

  if (!session) return null;
  if (session.refreshExpiresAt < Date.now()) return null;

  const user = await ctx.db.get(session.userId);
  if (!user) return null;

  return { user, sessionId: session._id };
}

// Format user for response (exclude sensitive fields)
export function formatUser(user: Doc<"users">) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    role: user.role,
    confirmed: !!user.confirmedAt,
    createdAt: user._creationTime,
  };
}

// Check if user can access a league
export async function canAccessLeague(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  leagueId: Id<"leagues">
): Promise<boolean> {
  const league = await ctx.db.get(leagueId);
  if (!league) return false;

  // Owner always has access
  if (league.ownerId === userId) return true;

  // Check membership
  const membership = await ctx.db
    .query("leagueMemberships")
    .withIndex("by_user_league", (q) => q.eq("userId", userId).eq("leagueId", leagueId))
    .first();

  return membership?.status === "active";
}

// Check if user can manage a league (owner or admin)
export async function canManageLeague(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  leagueId: Id<"leagues">
): Promise<boolean> {
  const league = await ctx.db.get(leagueId);
  if (!league) return false;

  // Owner always has access
  if (league.ownerId === userId) return true;

  // Check if admin membership
  const membership = await ctx.db
    .query("leagueMemberships")
    .withIndex("by_user_league", (q) => q.eq("userId", userId).eq("leagueId", leagueId))
    .first();

  return membership?.status === "active" && membership?.role === "admin";
}

// Get user's role in a league
export async function getUserLeagueRole(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  leagueId: Id<"leagues">
): Promise<string | null> {
  const league = await ctx.db.get(leagueId);
  if (!league) return null;

  if (league.ownerId === userId) return "owner";

  const membership = await ctx.db
    .query("leagueMemberships")
    .withIndex("by_user_league", (q) => q.eq("userId", userId).eq("leagueId", leagueId))
    .first();

  if (!membership || membership.status !== "active") return null;

  return membership.role;
}

// Check if user can manage a team (league admin/owner or team coach)
export async function canManageTeam(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  teamId: Id<"teams">
): Promise<boolean> {
  const team = await ctx.db.get(teamId);
  if (!team) return false;

  // Check league-level permission first
  const canManageLeagueResult = await canManageLeague(ctx, userId, team.leagueId);
  if (canManageLeagueResult) return true;

  // Check if user is the team owner
  if (team.userId === userId) return true;

  // Check team membership for coach role
  const teamMembership = await ctx.db
    .query("teamMemberships")
    .withIndex("by_team_user", (q) => q.eq("teamId", teamId).eq("userId", userId))
    .first();

  return teamMembership?.status === "active" && teamMembership?.role === "coach";
}

// Get user's role in a team
export async function getTeamRole(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  teamId: Id<"teams">
): Promise<string | null> {
  const team = await ctx.db.get(teamId);
  if (!team) return null;

  // Check if user is the team owner
  if (team.userId === userId) return "owner";

  // Check team membership
  const teamMembership = await ctx.db
    .query("teamMemberships")
    .withIndex("by_team_user", (q) => q.eq("teamId", teamId).eq("userId", userId))
    .first();

  if (!teamMembership || teamMembership.status !== "active") {
    // Fall back to league role if no team membership
    const leagueRole = await getUserLeagueRole(ctx, userId, team.leagueId);
    return leagueRole;
  }

  return teamMembership.role;
}
