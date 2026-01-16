import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    confirmedAt: v.optional(v.number()),
    confirmationToken: v.optional(v.string()),
    resetPasswordToken: v.optional(v.string()),
    resetPasswordSentAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_confirmation_token", ["confirmationToken"])
    .index("by_reset_token", ["resetPasswordToken"]),

  // Sessions for authentication
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    refreshToken: v.string(),
    refreshExpiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_refresh_token", ["refreshToken"])
    .index("by_user", ["userId"]),

  // Leagues
  leagues: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    leagueType: v.union(
      v.literal("professional"),
      v.literal("college"),
      v.literal("high_school"),
      v.literal("youth"),
      v.literal("recreational")
    ),
    season: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    isPublic: v.boolean(),
    createdById: v.id("users"),
    ownerId: v.id("users"),
    inviteCode: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_created_by", ["createdById"])
    .index("by_status", ["status"])
    .index("by_invite_code", ["inviteCode"])
    .index("by_public", ["isPublic"]),

  // League Memberships
  leagueMemberships: defineTable({
    userId: v.id("users"),
    leagueId: v.id("leagues"),
    role: v.union(
      v.literal("admin"),
      v.literal("coach"),
      v.literal("scorekeeper"),
      v.literal("member"),
      v.literal("viewer")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("suspended"),
      v.literal("removed")
    ),
    joinedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_league", ["leagueId"])
    .index("by_user_league", ["userId", "leagueId"])
    .index("by_league_status", ["leagueId", "status"]),

  // Teams
  teams: defineTable({
    name: v.string(),
    city: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    leagueId: v.id("leagues"),
  })
    .index("by_league", ["leagueId"])
    .index("by_name_league", ["leagueId", "name"])
    .index("by_user", ["userId"]),

  // Players
  players: defineTable({
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
    active: v.boolean(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_number", ["teamId", "number"])
    .index("by_team_active", ["teamId", "active"]),

  // Games
  games: defineTable({
    homeTeamId: v.id("teams"),
    awayTeamId: v.id("teams"),
    leagueId: v.id("leagues"),
    scheduledAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
    currentQuarter: v.number(),
    timeRemainingSeconds: v.number(),
    homeScore: v.number(),
    awayScore: v.number(),
    gameSettings: v.optional(v.any()),
    userId: v.optional(v.id("users")),
  })
    .index("by_league", ["leagueId"])
    .index("by_league_status", ["leagueId", "status"])
    .index("by_status", ["status"])
    .index("by_home_team", ["homeTeamId"])
    .index("by_away_team", ["awayTeamId"])
    .index("by_scheduled", ["scheduledAt"]),

  // Player Stats
  playerStats: defineTable({
    playerId: v.id("players"),
    gameId: v.id("games"),
    teamId: v.id("teams"), // Denormalized for easier querying
    points: v.number(),
    fieldGoalsMade: v.number(),
    fieldGoalsAttempted: v.number(),
    threePointersMade: v.number(),
    threePointersAttempted: v.number(),
    freeThrowsMade: v.number(),
    freeThrowsAttempted: v.number(),
    rebounds: v.number(),
    assists: v.number(),
    steals: v.number(),
    blocks: v.number(),
    turnovers: v.number(),
    fouls: v.number(),
    minutesPlayed: v.number(),
    plusMinus: v.number(),
    isOnCourt: v.boolean(),
  })
    .index("by_game", ["gameId"])
    .index("by_player", ["playerId"])
    .index("by_game_player", ["gameId", "playerId"])
    .index("by_team", ["teamId"])
    .index("by_game_team", ["gameId", "teamId"]),
});
