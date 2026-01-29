/**
 * Test fixtures for Convex backend tests
 * Provides helper functions to create test data
 */

import type { Id, TableNames } from "../_generated/dataModel";
import type { SystemTableNames } from "convex/server";

// Helper to create a mock ID
export function mockId<T extends TableNames | SystemTableNames>(table: T): Id<T> {
  return `mock-${table}-${Math.random().toString(36).substr(2, 9)}` as Id<T>;
}

// User fixtures
export const mockUser = {
  _id: mockId("users"),
  _creationTime: Date.now(),
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  passwordHash: "salt:hash",
  role: "user" as const,
  confirmedAt: Date.now(),
};

export const mockAdminUser = {
  _id: mockId("users"),
  _creationTime: Date.now(),
  email: "admin@example.com",
  firstName: "Admin",
  lastName: "User",
  passwordHash: "salt:hash",
  role: "admin" as const,
  confirmedAt: Date.now(),
};

// League fixtures
export const createMockLeague = (ownerId: Id<"users">) => ({
  _id: mockId("leagues"),
  _creationTime: Date.now(),
  name: "Test League",
  leagueType: "recreational" as const,
  season: "2024",
  status: "active" as const,
  isPublic: false,
  ownerId,
  createdById: ownerId,
  inviteCode: "TESTCODE",
  settings: {},
});

// Team fixtures
export const createMockTeam = (leagueId: Id<"leagues">, userId?: Id<"users">) => ({
  _id: mockId("teams"),
  _creationTime: Date.now(),
  name: "Test Team",
  leagueId,
  userId: userId || mockId("users"),
});

// Player fixtures
export const createMockPlayer = (teamId: Id<"teams">) => ({
  _id: mockId("players"),
  _creationTime: Date.now(),
  name: "Test Player",
  number: 23,
  teamId,
  active: true,
});

// Game fixtures
export const createMockGame = (
  leagueId: Id<"leagues">,
  homeTeamId: Id<"teams">,
  awayTeamId: Id<"teams">
) => ({
  _id: mockId("games"),
  _creationTime: Date.now(),
  leagueId,
  homeTeamId,
  awayTeamId,
  status: "scheduled" as const,
  currentQuarter: 1,
  timeRemainingSeconds: 720,
  homeScore: 0,
  awayScore: 0,
});

// Session fixtures
export const createMockSession = (userId: Id<"users">) => ({
  _id: mockId("sessions"),
  _creationTime: Date.now(),
  userId,
  token: "test-access-token",
  refreshToken: "test-refresh-token",
  expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  refreshExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
});

// League membership fixtures
export const createMockLeagueMembership = (
  userId: Id<"users">,
  leagueId: Id<"leagues">,
  role: "admin" | "coach" | "scorekeeper" | "member" | "viewer" = "member"
) => ({
  _id: mockId("leagueMemberships"),
  _creationTime: Date.now(),
  userId,
  leagueId,
  role,
  status: "active" as const,
  joinedAt: Date.now(),
});

// Team membership fixtures
export const createMockTeamMembership = (
  teamId: Id<"teams">,
  userId: Id<"users">,
  role: "coach" | "assistant" | "player" | "manager" = "player"
) => ({
  _id: mockId("teamMemberships"),
  _creationTime: Date.now(),
  teamId,
  userId,
  role,
  status: "active" as const,
  joinedAt: Date.now(),
});

// Player stat fixtures
export const createMockPlayerStat = (
  gameId: Id<"games">,
  playerId: Id<"players">,
  teamId: Id<"teams">
) => ({
  _id: mockId("playerStats"),
  _creationTime: Date.now(),
  gameId,
  playerId,
  teamId,
  points: 0,
  fieldGoalsMade: 0,
  fieldGoalsAttempted: 0,
  threePointersMade: 0,
  threePointersAttempted: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
  rebounds: 0,
  offensiveRebounds: 0,
  defensiveRebounds: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0,
  minutesPlayed: 0,
  plusMinus: 0,
  isOnCourt: false,
});
