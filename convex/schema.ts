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
    // League-wide default settings for games
    settings: v.optional(
      v.object({
        quarterMinutes: v.optional(v.number()),
        foulLimit: v.optional(v.number()),
        timeoutsPerTeam: v.optional(v.number()),
        overtimeMinutes: v.optional(v.number()),
        bonusMode: v.optional(v.union(v.literal("college"), v.literal("nba"))),
        playersPerRoster: v.optional(v.number()),
        trackAdvancedStats: v.optional(v.boolean()),
      })
    ),
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
    logoUrl: v.optional(v.string()), // External URL (legacy support)
    logoStorageId: v.optional(v.id("_storage")), // Convex file storage ID
    description: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    leagueId: v.id("leagues"),
    // Team colors
    primaryColor: v.optional(v.string()), // Hex color "#3B82F6"
    secondaryColor: v.optional(v.string()), // Hex color "#FFFFFF"
    // Team links
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
    imageUrl: v.optional(v.string()), // External URL (legacy support)
    imageStorageId: v.optional(v.id("_storage")), // Convex file storage ID
    // User linking
    email: v.optional(v.string()),
    userId: v.optional(v.id("users")), // Links player to user account
  })
    .index("by_team", ["teamId"])
    .index("by_team_number", ["teamId", "number"])
    .index("by_team_active", ["teamId", "active"])
    .index("by_email", ["email"])
    .index("by_user", ["userId"]),

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
    gameSettings: v.optional(
      v.object({
        quarterMinutes: v.optional(v.number()),
        foulLimit: v.optional(v.number()),
        timeoutsPerTeam: v.optional(v.number()),
        overtimeMinutes: v.optional(v.number()),
        overtimePeriods: v.optional(v.number()),
        bonusMode: v.optional(v.union(v.literal("college"), v.literal("nba"))),
        startingFive: v.optional(
          v.object({
            home: v.optional(v.array(v.id("players"))),
            away: v.optional(v.array(v.id("players"))),
            homeTeam: v.optional(v.array(v.id("players"))),
            awayTeam: v.optional(v.array(v.id("players"))),
          })
        ),
        scoreByPeriod: v.optional(
          v.record(
            v.string(),
            v.object({
              home: v.number(),
              away: v.number(),
            })
          )
        ),
        homeTimeouts: v.optional(v.number()),
        awayTimeouts: v.optional(v.number()),
        isQuickGame: v.optional(v.boolean()),
        customHomeTeamName: v.optional(v.string()),
        customAwayTeamName: v.optional(v.string()),
        // Active roster for this game (players who can play, limited by league settings)
        activeRoster: v.optional(
          v.object({
            homeTeam: v.optional(v.array(v.id("players"))),
            awayTeam: v.optional(v.array(v.id("players"))),
          })
        ),
        // Override the league roster limit for this game
        rosterLimitOverride: v.optional(v.number()),
      })
    ),
    userId: v.optional(v.id("users")),
    // Shot clock state (for cross-instance sync)
    shotClockSeconds: v.optional(v.number()), // Seconds remaining when paused/reset
    shotClockStartedAt: v.optional(v.number()), // Server timestamp when clock started (null = paused)
    // Game video
    videoUrl: v.optional(v.string()), // YouTube URL for game recording
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
    offensiveRebounds: v.optional(v.number()), // New: offensive rebounds
    defensiveRebounds: v.optional(v.number()), // New: defensive rebounds
    assists: v.number(),
    steals: v.number(),
    blocks: v.number(),
    turnovers: v.number(),
    fouls: v.number(),
    fouledOut: v.optional(v.boolean()), // New: player fouled out
    minutesPlayed: v.number(),
    plusMinus: v.number(),
    isOnCourt: v.boolean(),
    // For minutes tracking: timestamp when player subbed in (null if on bench)
    subInTimestamp: v.optional(v.number()),
  })
    .index("by_game", ["gameId"])
    .index("by_player", ["playerId"])
    .index("by_game_player", ["gameId", "playerId"])
    .index("by_team", ["teamId"])
    .index("by_game_team", ["gameId", "teamId"]),

  // Team Stats (for team rebounds and fouls)
  teamStats: defineTable({
    gameId: v.id("games"),
    teamId: v.id("teams"),
    offensiveRebounds: v.number(),
    defensiveRebounds: v.number(),
    teamFouls: v.number(),
    // Track fouls by quarter for bonus calculation
    foulsByQuarter: v.optional(
      v.object({
        q1: v.number(),
        q2: v.number(),
        q3: v.number(),
        q4: v.number(),
        ot: v.number(),
      })
    ),
    // Track timeouts remaining
    timeoutsRemaining: v.optional(v.number()),
  })
    .index("by_game", ["gameId"])
    .index("by_game_team", ["gameId", "teamId"]),

  // Game Events for play-by-play logging
  gameEvents: defineTable({
    gameId: v.id("games"),
    eventType: v.string(), // "shot", "foul", "timeout", "substitution", "rebound", etc.
    playerId: v.optional(v.id("players")),
    teamId: v.optional(v.id("teams")),
    quarter: v.number(),
    gameTime: v.number(), // seconds remaining in quarter
    timestamp: v.number(),
    details: v.optional(v.any()), // Additional event-specific data
    description: v.string(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_quarter", ["gameId", "quarter"]),

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
    .index("by_team", ["teamId"])
    .index("by_player_made", ["playerId", "made"])
    .index("by_player_zone", ["playerId", "shotZone"])
    .index("by_team_zone", ["teamId", "shotZone"]),

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

  // Lineup stints for tracking player combinations
  lineupStints: defineTable({
    gameId: v.id("games"),
    teamId: v.id("teams"),
    players: v.array(v.id("players")), // Sorted array of 5 player IDs
    startQuarter: v.number(),
    startGameTime: v.number(), // Seconds remaining when stint started
    startTimestamp: v.number(), // Server timestamp when stint started
    endQuarter: v.optional(v.number()),
    endGameTime: v.optional(v.number()),
    endTimestamp: v.optional(v.number()),
    secondsPlayed: v.number(),
    pointsScored: v.number(),
    pointsAllowed: v.number(),
    plusMinus: v.number(),
    isActive: v.boolean(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_team", ["gameId", "teamId"])
    .index("by_team", ["teamId"])
    .index("by_game_active", ["gameId", "isActive"]),

  // Team Memberships - links users to teams with roles
  teamMemberships: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(
      v.literal("coach"),
      v.literal("assistant"),
      v.literal("player"),
      v.literal("manager")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("removed")
    ),
    playerId: v.optional(v.id("players")), // Link to player record if role is "player"
    joinedAt: v.optional(v.number()),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_user", ["teamId", "userId"])
    .index("by_team_status", ["teamId", "status"]),
});
