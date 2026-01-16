# Basketball Stats App

A cross-platform basketball statistics tracking application with React web, React Native mobile, and Convex serverless backend.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   React Web     │     │  React Native   │
│   (Tailwind)    │     │    (Expo)       │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    ┌─────────────┐    │
         └────┤   Shared    ├────┘
              │  (Types,    │
              │ Components) │
              └──────┬──────┘
                     │
              ┌──────┴──────┐
              │   Convex    │
              │  (Backend)  │
              └─────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Convex (real-time serverless) |
| **Web** | React 19, React Router 7, Tailwind CSS, Recharts |
| **Mobile** | React Native 0.79, Expo 53, React Navigation |
| **Shared** | TypeScript types, components, utilities |
| **Monorepo** | Turborepo, npm workspaces |

## Features

### Implemented
- User authentication (signup/login/logout)
- League management with role-based access (admin, coach, scorekeeper, member, viewer)
- Team and player management
- Live game tracking with real-time timer
- Comprehensive stat recording (shots, rebounds, assists, steals, blocks, turnovers, fouls)
- Analytics dashboard with charts
- Cross-platform (web + mobile)

### Planned
- Data export (PDF, CSV)
- Push notifications
- Offline mode with sync
- Public game sharing / spectator mode

## Project Structure

```
basketball-stats-app/
├── convex/                    # Convex backend
│   ├── schema.ts              # Database schema
│   ├── auth.ts                # Authentication
│   ├── games.ts               # Game management
│   ├── leagues.ts             # League management
│   ├── teams.ts               # Team management
│   ├── players.ts             # Player management
│   └── stats.ts               # Statistics
├── shared/                    # @basketball-stats/shared
│   └── src/
│       ├── components/        # Shared UI components
│       ├── types/             # TypeScript types
│       ├── constants/         # Basketball constants
│       └── utils/             # Utilities
├── web/basketball-stats-web/  # React web app
│   └── src/
│       ├── pages/             # Route pages
│       ├── components/        # Web components
│       └── contexts/          # React contexts
├── mobile/BasketballStatsMobile/  # React Native app
│   └── src/
│       ├── screens/           # App screens
│       ├── navigation/        # Navigation config
│       └── components/        # Mobile components
├── turbo.json                 # Turborepo config
└── package.json               # Root workspace
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- Convex account ([convex.dev](https://convex.dev))

### Setup

```bash
# Install dependencies
npm install

# Start Convex (first time will prompt for login/project setup)
npx convex dev

# In a new terminal, start the web app
cd web/basketball-stats-web
npm start

# Or start the mobile app
cd mobile/BasketballStatsMobile
npx expo start
```

### Development Commands

```bash
# Root commands (via Turborepo)
npm run build          # Build all packages
npm run typecheck      # Type check all packages
npm run lint           # Lint all packages
npm run format         # Format with Prettier

# Convex
npm run convex:dev     # Start Convex dev server
npm run convex:deploy  # Deploy to production

# Shared library (if modified)
cd shared && npm run build
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `sessions` | Auth tokens |
| `leagues` | League configuration |
| `leagueMemberships` | User-league relationships |
| `teams` | Teams in leagues |
| `players` | Player roster |
| `games` | Game scheduling and state |
| `playerStats` | Per-game statistics |

## Deployment

### Convex Backend

```bash
npm run convex:deploy
```

### Web App

Deploy to Vercel, Netlify, or similar:

```bash
cd web/basketball-stats-web
npm run build
# Deploy build/ folder
```

### Mobile App

```bash
cd mobile/BasketballStatsMobile
eas build --platform ios
eas build --platform android
```

## Documentation

- [claude-code-guide.md](./claude-code-guide.md) - Implementation guide and patterns
- [Convex Docs](https://docs.convex.dev)
- [Expo Docs](https://docs.expo.dev)
