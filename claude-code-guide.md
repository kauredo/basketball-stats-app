# Claude Code Implementation Guide - Convex + React Stack

## Current Architecture Overview

This is a cross-platform basketball statistics tracking application with the following architecture:

- **Backend**: Convex (real-time serverless backend)
- **Web**: React 19 + TypeScript + React Router 7 + Tailwind CSS + Recharts
- **Mobile**: React Native 0.79 + Expo 53 + React Navigation
- **Shared**: Common TypeScript types, components, and utilities
- **Monorepo**: Turborepo for workspace management

## Project Structure

```
basketball-stats-app/
├── convex/                           # Convex backend
│   ├── schema.ts                     # Database schema (11 tables)
│   ├── auth.ts                       # Authentication mutations/queries
│   ├── games.ts                      # Game management
│   ├── leagues.ts                    # League management
│   ├── teams.ts                      # Team management
│   ├── players.ts                    # Player management
│   ├── stats.ts                      # Game statistics
│   ├── statistics.ts                 # Advanced statistics calculations
│   ├── lib/
│   │   └── auth.ts                   # Auth utilities (tokens, hashing)
│   └── _generated/                   # Auto-generated Convex types
│
├── shared/                           # @basketball-stats/shared package
│   ├── src/
│   │   ├── components/               # Modal, Button, Input, Card, Layout
│   │   ├── types/                    # TypeScript domain types
│   │   ├── constants/                # Basketball constants (positions)
│   │   └── utils/                    # Basketball utilities
│   └── dist/                         # Compiled output
│
├── web/basketball-stats-web/         # React web app
│   ├── src/
│   │   ├── pages/                    # Dashboard, Games, Teams, Players, Statistics, LiveGame, etc.
│   │   ├── components/               # Auth forms, Layout, Icons
│   │   ├── contexts/                 # AuthContext
│   │   ├── hooks/
│   │   └── services/
│   └── package.json
│
├── mobile/BasketballStatsMobile/     # React Native mobile app
│   ├── src/
│   │   ├── screens/                  # Home, LiveGame, Games, Teams, Players, Statistics, Profile
│   │   ├── navigation/               # AppNavigator, AuthNavigator
│   │   ├── components/
│   │   ├── contexts/
│   │   └── hooks/
│   └── package.json
│
├── turbo.json                        # Turborepo configuration
└── package.json                      # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- Convex account (https://convex.dev)

### Initial Setup

```bash
# Clone and install dependencies
cd basketball-stats-app
npm install

# Set up Convex (first time only)
npx convex dev

# This will prompt you to:
# 1. Log in to Convex
# 2. Create or link a project
# 3. Generate the _generated/ types
```

### Development Commands

```bash
# Start Convex development server (run in separate terminal)
npm run convex:dev

# Start web app
cd web/basketball-stats-web
npm start

# Start mobile app
cd mobile/BasketballStatsMobile
npx expo start

# Build shared package (if you modify it)
cd shared
npm run build

# Run all type checks
npm run typecheck

# Format code
npm run format
```

## Convex Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts with email/password auth |
| `sessions` | Token management (access + refresh tokens) |
| `leagues` | League configuration (type, season, public/private) |
| `leagueMemberships` | User-to-league relationships with roles |
| `teams` | Teams within leagues |
| `players` | Player roster with positions and attributes |
| `games` | Game scheduling and live state tracking |
| `playerStats` | Per-game player statistics |

### User Roles (leagueMemberships)

- `admin` - Full league management
- `coach` - Team management, game control
- `scorekeeper` - Record stats during games
- `member` - View and participate
- `viewer` - Read-only access

## Implemented Features

### Authentication
- Email/password signup and login
- Token-based sessions (24h access, 7d refresh)
- Password reset flow
- League selection after login

### League Management
- Create public/private leagues
- Join public leagues
- Invite-based membership for private leagues
- Role-based permissions

### Team & Player Management
- Create teams within leagues
- Add players with positions (PG, SG, SF, PF, C)
- Track player attributes (height, weight, jersey number)

### Live Game Tracking
- Game states: scheduled → active/paused → completed
- Real-time timer with play/pause/resume
- Quarter/period tracking
- Live score updates

### Statistics Recording
- Shot tracking (2PT, 3PT, FT with makes/attempts)
- Rebounds (offensive/defensive)
- Assists, steals, blocks
- Turnovers, fouls
- Minutes played
- Plus/minus tracking

### Analytics
- Dashboard with live games and stat leaders
- Player efficiency calculations
- Team performance charts (Recharts)
- Game analysis views

## Working with Claude Code

### Adding New Features

```bash
# Example: Add a new Convex function
claude-code "Add a Convex mutation to record a player substitution during a game.
It should update the players on court and track minutes played.
Follow the existing patterns in convex/games.ts and convex/stats.ts"
```

### Modifying the Schema

```bash
# Example: Add a new field
claude-code "Add a 'notes' field to the games table in convex/schema.ts
for coaches to add game notes. Update the games.ts functions to support this."
```

### Frontend Changes

```bash
# Example: Add a new page
claude-code "Create a new 'Standings' page in web/basketball-stats-web
that shows league standings calculated from game results.
Use the existing page patterns and Tailwind styling."
```

### Mobile-Specific Work

```bash
# Example: Add mobile feature
claude-code "Add pull-to-refresh functionality to the GamesScreen
in the mobile app using React Native's RefreshControl"
```

## Key Patterns

### Convex Queries and Mutations

```typescript
// In React components, use Convex hooks
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Query (real-time, auto-updates)
const games = useQuery(api.games.list, { leagueId });

// Mutation
const createGame = useMutation(api.games.create);
await createGame({ homeTeamId, awayTeamId, scheduledAt });
```

### Authentication Context

```typescript
// AuthContext provides user state across the app
const { user, token, login, logout, selectLeague } = useAuth();
```

### Shared Package Usage

```typescript
// Import from shared package
import { Button, Card, Modal } from "@basketball-stats/shared";
import { Position, PlayerStats } from "@basketball-stats/shared/types";
import { POSITIONS } from "@basketball-stats/shared/constants";
```

## Deployment

### Convex Deployment

```bash
# Deploy Convex functions to production
npm run convex:deploy
```

Current deployment: `dev:quick-spaniel-801.convex.cloud`

### Web Deployment

The web app can be deployed to Vercel, Netlify, or similar:

```bash
cd web/basketball-stats-web
npm run build
# Deploy the build/ folder
```

### Mobile Deployment

```bash
cd mobile/BasketballStatsMobile
# For Expo builds
eas build --platform ios
eas build --platform android
```

## What's Not Yet Implemented

- [ ] Test suites (unit, integration, e2e)
- [ ] CI/CD pipeline
- [ ] Data export (PDF, CSV)
- [ ] Push notifications
- [ ] Offline mode with sync
- [ ] Public game sharing / spectator mode
- [ ] Historical season analytics
- [ ] Player comparison tools

## Troubleshooting

### Convex types not updating
```bash
# Regenerate Convex types
npx convex dev
# or
npx convex codegen
```

### Shared package changes not reflected
```bash
cd shared
npm run build
# Then restart the web/mobile dev server
```

### Mobile app not connecting to Convex
Check that `convex.json` has the correct deployment URL and the mobile app's Convex provider is configured correctly.

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [React Router 7 Docs](https://reactrouter.com)
- [Expo Documentation](https://docs.expo.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org)
