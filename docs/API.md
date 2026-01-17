# API Reference

This document describes the Convex backend API for the Basketball Stats App.

## Overview

The backend uses [Convex](https://convex.dev) serverless functions. All functions are type-safe and automatically generate TypeScript types.

### Function Types

| Type | Description | Usage |
|------|-------------|-------|
| **Query** | Read-only, real-time subscriptions | `useQuery(api.module.function, args)` |
| **Mutation** | Write operations, transactional | `useMutation(api.module.function)` |
| **Action** | External API calls, side effects | `useAction(api.module.function)` |

### Authentication

Most functions require a `token` parameter for authentication:

```typescript
const games = useQuery(api.games.list, { token, leagueId });
```

---

## Auth (`convex/auth.ts`)

### Mutations

#### `signup`
Create a new user account.

```typescript
const result = await signup({
  email: string,
  password: string,
  passwordConfirmation: string,
  firstName: string,
  lastName: string,
});
// Returns: { user, tokens: { accessToken, refreshToken } }
```

#### `login`
Authenticate an existing user.

```typescript
const result = await login({
  email: string,
  password: string,
});
// Returns: { user, tokens: { accessToken, refreshToken } }
```

#### `logout`
Invalidate current session.

```typescript
await logout({ token: string });
```

#### `refreshToken`
Get new tokens using refresh token.

```typescript
const tokens = await refreshToken({ refreshToken: string });
// Returns: { accessToken, refreshToken }
```

#### `requestPasswordReset`
Send password reset email.

```typescript
await requestPasswordReset({ email: string });
```

#### `resetPassword`
Reset password with token.

```typescript
await resetPassword({
  token: string,
  password: string,
  passwordConfirmation: string,
});
```

#### `updateProfile`
Update user profile.

```typescript
await updateProfile({
  token: string,
  firstName?: string,
  lastName?: string,
});
```

#### `changePassword`
Change user password.

```typescript
await changePassword({
  token: string,
  currentPassword: string,
  newPassword: string,
});
```

### Queries

#### `validateToken`
Check if token is valid.

```typescript
const result = useQuery(api.auth.validateToken, { token: string });
// Returns: { valid: boolean, user?: User }
```

#### `getCurrentUser`
Get current user from token.

```typescript
const user = useQuery(api.auth.getCurrentUser, { token: string });
```

---

## Leagues (`convex/leagues.ts`)

### Queries

#### `list`
List all leagues accessible to user.

```typescript
const leagues = useQuery(api.leagues.list, { token: string });
// Returns: { leagues: League[] }
```

#### `get`
Get single league by ID.

```typescript
const league = useQuery(api.leagues.get, { token: string, leagueId: Id });
```

#### `getMembers`
Get league members.

```typescript
const members = useQuery(api.leagues.getMembers, { token: string, leagueId: Id });
// Returns: LeagueMember[]
```

#### `getStandings`
Get league standings.

```typescript
const standings = useQuery(api.leagues.getStandings, { token: string, leagueId: Id });
// Returns: { teamId, teamName, wins, losses, pct, streak, ... }[]
```

#### `getInviteCode`
Get league invite code (admin only).

```typescript
const code = useQuery(api.leagues.getInviteCode, { token: string, leagueId: Id });
```

### Mutations

#### `create`
Create a new league.

```typescript
const leagueId = await create({
  token: string,
  name: string,
  description?: string,
  leagueType: "professional" | "college" | "high_school" | "youth" | "recreational",
  season: string,
  isPublic?: boolean,
});
```

#### `update`
Update league settings.

```typescript
await update({
  token: string,
  leagueId: Id,
  name?: string,
  description?: string,
  status?: "draft" | "active" | "completed" | "archived",
});
```

#### `join`
Join a public league.

```typescript
await join({ token: string, leagueId: Id });
```

#### `joinByCode`
Join league with invite code.

```typescript
await joinByCode({ token: string, inviteCode: string });
```

#### `leave`
Leave a league.

```typescript
await leave({ token: string, leagueId: Id });
```

---

## Teams (`convex/teams.ts`)

### Queries

#### `list`
List teams in a league.

```typescript
const teams = useQuery(api.teams.list, { token: string, leagueId: Id });
```

#### `get`
Get team with players.

```typescript
const team = useQuery(api.teams.get, { token: string, teamId: Id });
// Returns: { team, players, stats }
```

### Mutations

#### `create`
Create a new team.

```typescript
const teamId = await create({
  token: string,
  leagueId: Id,
  name: string,
  city?: string,
  description?: string,
});
```

#### `update`
Update team.

```typescript
await update({
  token: string,
  teamId: Id,
  name?: string,
  city?: string,
  description?: string,
});
```

#### `remove`
Delete team.

```typescript
await remove({ token: string, teamId: Id });
```

---

## Players (`convex/players.ts`)

### Queries

#### `list`
List players (optionally filtered by team).

```typescript
const players = useQuery(api.players.list, {
  token: string,
  leagueId: Id,
  teamId?: Id,
});
```

#### `get`
Get player with stats.

```typescript
const player = useQuery(api.players.get, { token: string, playerId: Id });
// Returns: { player, team, seasonStats, recentGames }
```

### Mutations

#### `create`
Create a new player.

```typescript
const playerId = await create({
  token: string,
  teamId: Id,
  name: string,
  number: number,
  position?: "PG" | "SG" | "SF" | "PF" | "C",
  heightCm?: number,
  weightKg?: number,
  birthDate?: string,
});
```

#### `update`
Update player.

```typescript
await update({
  token: string,
  playerId: Id,
  name?: string,
  number?: number,
  position?: string,
  active?: boolean,
});
```

#### `remove`
Delete player.

```typescript
await remove({ token: string, playerId: Id });
```

---

## Games (`convex/games.ts`)

### Queries

#### `list`
List games in a league.

```typescript
const games = useQuery(api.games.list, {
  token: string,
  leagueId: Id,
  status?: "scheduled" | "active" | "paused" | "completed",
  teamId?: Id,
});
```

#### `get`
Get game with full details.

```typescript
const game = useQuery(api.games.get, { token: string, gameId: Id });
// Returns: { game, homeTeam, awayTeam, homeStats, awayStats }
```

#### `getBoxScore`
Get complete box score.

```typescript
const boxScore = useQuery(api.games.getBoxScore, { token: string, gameId: Id });
// Returns: { game, homeTeam, awayTeam, homePlayerStats, awayPlayerStats }
```

### Mutations

#### `create`
Create a new game.

```typescript
const gameId = await create({
  token: string,
  leagueId: Id,
  homeTeamId: Id,
  awayTeamId: Id,
  scheduledAt?: number,
});
```

#### `start`
Start a game.

```typescript
await start({ token: string, gameId: Id });
```

#### `pause`
Pause a game.

```typescript
await pause({ token: string, gameId: Id });
```

#### `resume`
Resume a paused game.

```typescript
await resume({ token: string, gameId: Id });
```

#### `end`
End a game.

```typescript
await end({ token: string, gameId: Id });
```

---

## Stats (`convex/stats.ts`)

### Queries

#### `getLiveStats`
Get live stats for a game.

```typescript
const stats = useQuery(api.stats.getLiveStats, { token: string, gameId: Id });
// Returns: { homeStats: PlayerStat[], awayStats: PlayerStat[] }
```

### Mutations

#### `recordStat`
Record a stat event.

```typescript
await recordStat({
  token: string,
  gameId: Id,
  playerId: Id,
  stat: "points" | "fieldGoalsMade" | "threePointersMade" | "freeThrowsMade" |
        "rebounds" | "assists" | "steals" | "blocks" | "turnovers" | "fouls",
  value: number,
  shotLocation?: { x: number, y: number },
});
```

#### `undoStat`
Undo the last stat.

```typescript
await undoStat({ token: string, gameId: Id, playerId: Id, stat: string });
```

#### `substitute`
Substitute players.

```typescript
await substitute({
  token: string,
  gameId: Id,
  playerIn: Id,
  playerOut: Id,
});
```

---

## Shots (`convex/shots.ts`)

### Queries

#### `getGameShots`
Get all shots from a game.

```typescript
const shots = useQuery(api.shots.getGameShots, {
  token: string,
  gameId: Id,
  playerId?: Id,
  teamId?: Id,
});
```

#### `getPlayerShotChart`
Get player's shot data for shot charts.

```typescript
const data = useQuery(api.shots.getPlayerShotChart, {
  token: string,
  playerId: Id,
  leagueId: Id,
});
// Returns: { shots, stats: { made, attempted, pct by zone } }
```

#### `getTeamShotChart`
Get team's shot data.

```typescript
const data = useQuery(api.shots.getTeamShotChart, {
  token: string,
  teamId: Id,
  leagueId: Id,
});
```

### Mutations

#### `recordShot`
Record a shot with location.

```typescript
await recordShot({
  token: string,
  gameId: Id,
  playerId: Id,
  x: number,  // -50 to 50
  y: number,  // 0 to 94
  shotType: "2pt" | "3pt" | "ft",
  made: boolean,
  quarter: number,
  timeRemaining: number,
});
```

---

## Statistics (`convex/statistics.ts`)

### Queries

#### `getDashboard`
Get dashboard data.

```typescript
const dashboard = useQuery(api.statistics.getDashboard, {
  token: string,
  leagueId: Id,
});
// Returns: { recentGames, upcomingGames, leaderboards, standings }
```

#### `getPlayerSeasonStats`
Get player's season statistics.

```typescript
const stats = useQuery(api.statistics.getPlayerSeasonStats, {
  token: string,
  playerId: Id,
  leagueId: Id,
});
```

#### `getPlayersStats`
Get stats for multiple players.

```typescript
const stats = useQuery(api.statistics.getPlayersStats, {
  token: string,
  leagueId: Id,
  teamId?: Id,
});
```

#### `getTeamsStats`
Get team statistics.

```typescript
const stats = useQuery(api.statistics.getTeamsStats, {
  token: string,
  leagueId: Id,
});
```

#### `getLeagueLeaders`
Get statistical leaders.

```typescript
const leaders = useQuery(api.statistics.getLeagueLeaders, {
  token: string,
  leagueId: Id,
  category: "points" | "rebounds" | "assists" | "steals" | "blocks",
  limit?: number,
});
```

#### `comparePlayersStats`
Compare two players.

```typescript
const comparison = useQuery(api.statistics.comparePlayersStats, {
  token: string,
  player1Id: Id,
  player2Id: Id,
  leagueId: Id,
});
```

#### `getStandings`
Get league standings.

```typescript
const standings = useQuery(api.statistics.getStandings, {
  token: string,
  leagueId: Id,
});
```

---

## Notifications (`convex/notifications.ts`)

### Queries

#### `getNotifications`
Get user notifications.

```typescript
const notifications = useQuery(api.notifications.getNotifications, {
  token: string,
  leagueId?: Id,
  unreadOnly?: boolean,
  limit?: number,
});
```

#### `getPreferences`
Get notification preferences.

```typescript
const prefs = useQuery(api.notifications.getPreferences, {
  token: string,
  leagueId?: Id,
});
```

### Mutations

#### `markAsRead`
Mark notification as read.

```typescript
await markAsRead({ token: string, notificationId: Id });
```

#### `markAllAsRead`
Mark all notifications as read.

```typescript
await markAllAsRead({ token: string, leagueId?: Id });
```

#### `updatePreferences`
Update notification preferences.

```typescript
await updatePreferences({
  token: string,
  leagueId?: Id,
  gameReminders?: boolean,
  gameStart?: boolean,
  gameEnd?: boolean,
  scoreUpdates?: boolean,
  teamUpdates?: boolean,
  leagueAnnouncements?: boolean,
  reminderMinutesBefore?: number,
});
```

---

## Error Handling

All functions may throw errors with descriptive messages:

```typescript
try {
  await mutation(args);
} catch (error) {
  // error.message contains the error description
  console.error(error.message);
}
```

Common errors:
- `"Not authenticated"` - Invalid or missing token
- `"Not authorized"` - Insufficient permissions
- `"Not found"` - Resource doesn't exist
- `"Invalid input"` - Validation failed
