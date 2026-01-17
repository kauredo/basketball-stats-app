# Architecture

This document describes the system architecture of the Basketball Stats App.

## Overview

Basketball Stats is a monorepo containing three main packages:
- **convex/** - Serverless backend (database + functions)
- **web/** - React web application
- **mobile/** - React Native mobile application
- **shared/** - Shared TypeScript types

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
├─────────────────────────────┬───────────────────────────────────┤
│                             │                                    │
│  ┌───────────────────┐      │      ┌───────────────────┐        │
│  │    React Web      │      │      │  React Native     │        │
│  │  (Vite + Tailwind)│      │      │  (Expo + NativeWind)       │
│  └─────────┬─────────┘      │      └─────────┬─────────┘        │
│            │                │                │                   │
│            │    ┌───────────┴───────────┐    │                   │
│            └────┤  @basketball-stats/   ├────┘                   │
│                 │       shared          │                        │
│                 │   (TypeScript Types)  │                        │
│                 └───────────┬───────────┘                        │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              │ WebSocket + HTTP
                              │
┌─────────────────────────────┼────────────────────────────────────┐
│                             │                                    │
│                    ┌────────┴────────┐                           │
│                    │     Convex      │                           │
│                    │    Backend      │                           │
│                    └────────┬────────┘                           │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐                │
│         │                   │                   │                │
│  ┌──────┴──────┐    ┌───────┴───────┐   ┌──────┴──────┐         │
│  │   Queries   │    │   Mutations   │   │   Actions   │         │
│  │ (read-only) │    │   (writes)    │   │ (external)  │         │
│  └──────┬──────┘    └───────┬───────┘   └─────────────┘         │
│         │                   │                                    │
│         └─────────┬─────────┘                                    │
│                   │                                              │
│          ┌────────┴────────┐                                     │
│          │    Database     │                                     │
│          │   (Document)    │                                     │
│          └─────────────────┘                                     │
│                                                                  │
│                        Convex Cloud                              │
└──────────────────────────────────────────────────────────────────┘
```

## Backend (Convex)

### Why Convex?

- **Real-time by default** - All queries automatically subscribe to updates
- **Type-safe** - End-to-end TypeScript from database to client
- **Serverless** - No infrastructure to manage
- **Transactional** - ACID transactions for data consistency

### Database Schema

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│    users    │────<│ leagueMemberships│>────│   leagues   │
└─────────────┘     └──────────────────┘     └──────┬──────┘
       │                                           │
       │            ┌──────────────────────────────┘
       │            │
       │     ┌──────┴──────┐
       │     │    teams    │
       │     └──────┬──────┘
       │            │
       │     ┌──────┴──────┐
       │     │   players   │
       │     └──────┬──────┘
       │            │
       │     ┌──────┴──────┐     ┌─────────────┐
       │     │    games    │────<│ playerStats │
       │     └──────┬──────┘     └─────────────┘
       │            │
       │     ┌──────┴──────┐
       │     │    shots    │
       │     └─────────────┘
       │
┌──────┴──────┐     ┌────────────────────────┐
│notifications│     │notificationPreferences │
└─────────────┘     └────────────────────────┘
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | email, passwordHash, firstName, lastName, role |
| `sessions` | Auth tokens | userId, token, expiresAt, refreshToken |
| `leagues` | League configuration | name, leagueType, season, status, ownerId |
| `leagueMemberships` | User-league access | userId, leagueId, role, status |
| `teams` | Teams in leagues | name, leagueId, city, logoUrl |
| `players` | Player rosters | teamId, name, number, position |
| `games` | Game state | homeTeamId, awayTeamId, status, scores, quarter |
| `playerStats` | Per-game stats | playerId, gameId, points, rebounds, assists... |
| `shots` | Shot locations | playerId, gameId, x, y, shotType, made |
| `notifications` | In-app notifications | userId, type, title, body, read |

### Function Organization

```
convex/
├── auth.ts          # Authentication (login, signup, logout, sessions)
├── leagues.ts       # League CRUD and membership management
├── teams.ts         # Team management
├── players.ts       # Player management
├── games.ts         # Game lifecycle (create, start, end, scoring)
├── stats.ts         # Basic stat recording and queries
├── statistics.ts    # Advanced aggregations (averages, leaders, standings)
├── shots.ts         # Shot tracking for shot charts
└── notifications.ts # Notification creation and management
```

## Frontend Architecture

### Web (React)

```
┌──────────────────────────────────────────────────────────────┐
│                        App.tsx                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    ThemeProvider                         │ │
│  │  ┌───────────────────────────────────────────────────┐  │ │
│  │  │                   AuthProvider                     │  │ │
│  │  │  ┌─────────────────────────────────────────────┐  │  │ │
│  │  │  │               Router                         │  │  │ │
│  │  │  │  ┌───────────────────────────────────────┐  │  │  │ │
│  │  │  │  │           Layout (Sidebar)            │  │  │  │ │
│  │  │  │  │  ┌─────────────────────────────────┐  │  │  │  │ │
│  │  │  │  │  │           Pages                  │  │  │  │  │ │
│  │  │  │  │  └─────────────────────────────────┘  │  │  │  │ │
│  │  │  │  └───────────────────────────────────────┘  │  │  │ │
│  │  │  └─────────────────────────────────────────────┘  │  │ │
│  │  └───────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Key Contexts:**
- `ThemeContext` - Light/dark mode management
- `AuthContext` - User authentication state
- `NotificationContext` - In-app notification management

### Mobile (React Native)

```
┌──────────────────────────────────────────────────────────────┐
│                        App.tsx                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   ConvexProvider                         │ │
│  │  ┌───────────────────────────────────────────────────┐  │ │
│  │  │                  ThemeProvider                     │  │ │
│  │  │  ┌─────────────────────────────────────────────┐  │  │ │
│  │  │  │                 AuthProvider                 │  │  │ │
│  │  │  │  ┌───────────────────────────────────────┐  │  │  │ │
│  │  │  │  │         NavigationContainer           │  │  │  │ │
│  │  │  │  │  ┌─────────────────────────────────┐  │  │  │  │ │
│  │  │  │  │  │    Tab Navigator (Bottom Tabs)  │  │  │  │  │ │
│  │  │  │  │  │    Stack Navigator (Screens)    │  │  │  │  │ │
│  │  │  │  │  └─────────────────────────────────┘  │  │  │  │ │
│  │  │  │  └───────────────────────────────────────┘  │  │  │ │
│  │  │  └─────────────────────────────────────────────┘  │  │ │
│  │  └───────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Navigation Structure:**
- Bottom Tabs: Home, Statistics, Teams, Games, Profile
- Stack screens for details and modals

## Data Flow

### Real-Time Updates

```
┌─────────┐    useQuery()     ┌─────────┐    subscribe    ┌──────────┐
│ Client  │ ───────────────> │ Convex  │ ──────────────> │ Database │
│         │ <─────────────── │ Client  │ <────────────── │          │
└─────────┘   auto-updates    └─────────┘    changes      └──────────┘
```

1. Client calls `useQuery(api.games.get, { gameId })`
2. Convex client establishes WebSocket subscription
3. Initial data is returned immediately
4. Any database changes automatically push updates to client

### Mutations

```
┌─────────┐   useMutation()   ┌─────────┐    write      ┌──────────┐
│ Client  │ ───────────────> │ Convex  │ ────────────> │ Database │
│         │ <─────────────── │ Server  │ <──────────── │          │
└─────────┘     result        └─────────┘    commit     └──────────┘
```

1. Client calls `mutation({ playerId, stat: "points", value: 2 })`
2. Convex executes mutation in a transaction
3. All subscribed clients receive updates

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         Login Flow                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────┐  email/password  ┌────────┐  validate  ┌──────────┐  │
│  │ Client │ ───────────────> │ auth.  │ ─────────> │  users   │  │
│  │        │                  │ login  │            │  table   │  │
│  │        │ <─────────────── │        │ <───────── │          │  │
│  │        │  tokens + user   │        │   user     │          │  │
│  └───┬────┘                  └────────┘            └──────────┘  │
│      │                                                           │
│      │ store token                                               │
│      v                                                           │
│  ┌────────┐                                                      │
│  │ Local  │  (localStorage / SecureStore)                        │
│  │Storage │                                                      │
│  └────────┘                                                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Theming

Both web and mobile support light/dark mode:

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  User Toggle   │ ──> │ ThemeContext   │ ──> │   UI Update    │
│ (or system)    │     │  setMode()     │     │  (dark: class) │
└────────────────┘     └───────┬────────┘     └────────────────┘
                               │
                               v
                       ┌───────────────┐
                       │   Persisted   │
                       │   Storage     │
                       │ (localStorage/│
                       │  SecureStore) │
                       └───────────────┘
```

**Theme Modes:**
- `light` - Light theme
- `dark` - Dark theme
- `system` - Follow OS preference

## Security Considerations

### Authentication
- Passwords hashed with bcrypt (via Convex)
- JWT-like tokens with expiration
- Refresh token rotation

### Authorization
- League membership checked on all operations
- Role-based permissions (admin > coach > scorekeeper > member > viewer)
- Token validation on every request

### Data Isolation
- All queries filter by user's league memberships
- No cross-league data access
