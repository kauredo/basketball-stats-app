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
      v.union(v.literal("PG"), v.literal("SG"), v.literal("SF"), v.literal("PF"), v.literal("C"))
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

  // Shot attempts with location data for shot charts
  shots: defineTable({
    playerId: v.id("players"),
    gameId: v.id("games"),
    teamId: v.id("teams"),
    // Court coordinates (0-100 normalized, origin at basket)
    x: v.number(), // -50 to 50 (left to right from shooter's perspective)
    y: v.number(), // 0 to 94 (baseline to opposite baseline)
    // Shot details
    shotType: v.union(
      v.literal("2pt"),
      v.literal("3pt"),
      v.literal("ft") // free throw
    ),
    made: v.boolean(),
    quarter: v.number(),
    timeRemaining: v.number(), // seconds remaining in quarter
    assisted: v.optional(v.boolean()),
    assistedBy: v.optional(v.id("players")),
    shotZone: v.optional(
      v.union(
        v.literal("paint"),
        v.literal("midrange"),
        v.literal("corner3"),
        v.literal("wing3"),
        v.literal("top3"),
        v.literal("ft")
      )
    ),
  })
    .index("by_game", ["gameId"])
    .index("by_player", ["playerId"])
    .index("by_game_player", ["gameId", "playerId"])
    .index("by_team", ["teamId"]),

  // Push subscriptions for web push notifications
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(), // Public key for encryption
    auth: v.string(), // Auth secret
    createdAt: v.number(),
    userAgent: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  // Notification preferences per user per league
  notificationPreferences: defineTable({
    userId: v.id("users"),
    leagueId: v.optional(v.id("leagues")), // null = global preferences
    // Notification types
    gameReminders: v.boolean(), // Remind before games start
    gameStart: v.boolean(), // When a game starts
    gameEnd: v.boolean(), // When a game ends
    scoreUpdates: v.boolean(), // Major score updates during games
    teamUpdates: v.boolean(), // Team roster changes, etc.
    leagueAnnouncements: v.boolean(), // League-wide announcements
    // Timing preferences
    reminderMinutesBefore: v.optional(v.number()), // Minutes before game to send reminder
  })
    .index("by_user", ["userId"])
    .index("by_user_league", ["userId", "leagueId"]),

  // In-app notifications
  notifications: defineTable({
    userId: v.id("users"),
    leagueId: v.optional(v.id("leagues")),
    type: v.union(
      v.literal("game_reminder"),
      v.literal("game_start"),
      v.literal("game_end"),
      v.literal("score_update"),
      v.literal("team_update"),
      v.literal("league_announcement"),
      v.literal("system")
    ),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()), // Additional data like gameId, teamId, etc.
    read: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_user_league", ["userId", "leagueId"])
    .index("by_created", ["createdAt"]),
});
