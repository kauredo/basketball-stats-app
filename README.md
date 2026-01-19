# Basketball Stats App

A full-stack basketball statistics tracking application with real-time game scoring, player analytics, shot charts, and cross-platform support.

## Features

- **Live Game Scoring** - Track games in real-time with intuitive stat recording
- **Shot Charts** - Visual shot location tracking with heatmaps and zone analysis
- **Player Statistics** - Comprehensive stats: points, rebounds, assists, steals, blocks, turnovers, fouls
- **Player Comparison** - Compare players side-by-side with radar charts
- **League Standings** - Automatic standings and rankings calculations
- **Team Management** - Create teams and manage player rosters
- **League System** - Role-based access (admin, coach, scorekeeper, member, viewer)
- **Notifications** - In-app notifications for game events
- **Light/Dark Mode** - System-aware theming with manual override
- **Cross-Platform** - Web and mobile (iOS/Android) apps with shared backend

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   React Web     │     │  React Native   │
│   (Tailwind)    │     │  (NativeWind)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    ┌─────────────┐    │
         └────┤   Shared    ├────┘
              │   Types     │
              └──────┬──────┘
                     │
              ┌──────┴──────┐
              │   Convex    │
              │  (Backend)  │
              └─────────────┘
```

## Tech Stack

| Layer        | Technology                                                               |
| ------------ | ------------------------------------------------------------------------ |
| **Backend**  | [Convex](https://convex.dev) - Serverless database & real-time functions |
| **Web**      | React 19, Vite, Tailwind CSS, React Router 7, Recharts                   |
| **Mobile**   | React Native 0.79, Expo 53, NativeWind, React Navigation                 |
| **Shared**   | TypeScript types package                                                 |
| **Monorepo** | Turborepo, npm workspaces                                                |

## Project Structure

```
basketball-stats-app/
├── convex/                        # Backend - Convex functions & schema
│   ├── schema.ts                  # Database schema
│   ├── auth.ts                    # Authentication
│   ├── games.ts                   # Game management
│   ├── players.ts                 # Player management
│   ├── teams.ts                   # Team management
│   ├── leagues.ts                 # League management
│   ├── stats.ts                   # Basic statistics
│   ├── statistics.ts              # Advanced statistics & aggregations
│   ├── shots.ts                   # Shot tracking for shot charts
│   └── notifications.ts           # Notification system
├── web/basketball-stats-web/      # React web application
│   └── src/
│       ├── pages/                 # Route pages
│       ├── components/            # UI components
│       └── contexts/              # React contexts (Auth, Theme, etc.)
├── mobile/BasketballStatsMobile/  # React Native application
│   └── src/
│       ├── screens/               # App screens
│       ├── navigation/            # Navigation configuration
│       ├── components/            # Mobile components
│       └── contexts/              # React contexts
├── shared/                        # @basketball-stats/shared package
│   └── src/
│       ├── types/                 # TypeScript type definitions
│       └── constants/             # Shared constants
├── docs/                          # Documentation
├── turbo.json                     # Turborepo configuration
└── package.json                   # Root workspace
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- [Convex](https://convex.dev) account (free tier available)
- [Expo](https://expo.dev) account (for mobile development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd basketball-stats-app

# Install dependencies
npm install

# Build shared package
cd shared && npm run build && cd ..
```

### Development

```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start web app
cd web/basketball-stats-web
npm run dev

# Terminal 3: Start mobile app (optional)
cd mobile/BasketballStatsMobile
npm start
```

**Access the apps:**

- Web: http://localhost:5173
- Mobile: Scan QR code with Expo Go

### Available Scripts

**Root (Monorepo)**

| Command                 | Description                 |
| ----------------------- | --------------------------- |
| `npm run build`         | Build all packages          |
| `npm run typecheck`     | Type check all packages     |
| `npm run lint`          | Lint all packages           |
| `npm run format`        | Format code with Prettier   |
| `npm run convex:dev`    | Start Convex dev server     |
| `npm run convex:deploy` | Deploy Convex to production |

**Web** (`web/basketball-stats-web`)

| Command             | Description              |
| ------------------- | ------------------------ |
| `npm run dev`       | Start development server |
| `npm run build`     | Build for production     |
| `npm run typecheck` | Type check               |

**Mobile** (`mobile/BasketballStatsMobile`)

| Command             | Description            |
| ------------------- | ---------------------- |
| `npm start`         | Start Expo server      |
| `npm run ios`       | Start iOS simulator    |
| `npm run android`   | Start Android emulator |
| `npm run typecheck` | Type check             |

## Environment Variables

**.env.local** (root)

```env
CONVEX_DEPLOYMENT=dev:your-deployment-name
```

**web/.env**

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

**mobile/.env**

```env
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Database Schema

| Table                     | Purpose                              |
| ------------------------- | ------------------------------------ |
| `users`                   | User accounts and authentication     |
| `sessions`                | Auth tokens and sessions             |
| `leagues`                 | League configuration                 |
| `leagueMemberships`       | User-league relationships with roles |
| `teams`                   | Teams within leagues                 |
| `players`                 | Player rosters                       |
| `games`                   | Game state and scheduling            |
| `playerStats`             | Per-game player statistics           |
| `shots`                   | Shot locations for shot charts       |
| `notifications`           | In-app notifications                 |
| `notificationPreferences` | User notification settings           |

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and data flow
- [API Reference](./docs/API.md) - Convex backend API documentation
- [Deployment Guide](./docs/deployment-guide.md) - Production deployment
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines

## Deployment

See [Deployment Guide](./docs/deployment-guide.md) for detailed instructions.

**Quick Deploy:**

```bash
# Backend
npm run convex:deploy

# Web (Vercel)
cd web/basketball-stats-web && npm run build

# Mobile (EAS)
cd mobile/BasketballStatsMobile
eas build --platform all
```

## License

Private - All rights reserved
