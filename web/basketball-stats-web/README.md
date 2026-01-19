# Basketball Stats Web

React web application for the Basketball Stats platform.

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router 7** - Client-side routing
- **Convex** - Real-time backend
- **Recharts** - Charts and data visualization
- **Heroicons** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+
- Convex backend running (`npx convex dev` from root)

### Installation

```bash
# From repository root
npm install

# Or from this directory
npm install
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:5173
```

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication forms
│   ├── GameCard.tsx     # Game display card
│   ├── Icon.tsx         # Icon component
│   ├── Layout.tsx       # Main app layout with sidebar
│   ├── Logo.tsx         # App logo
│   ├── NotificationBell.tsx  # Notification dropdown
│   ├── PlayerAvatar.tsx # Player avatar component
│   ├── ShotChart.tsx    # Basketball court shot chart
│   ├── Skeleton.tsx     # Loading skeletons
│   └── StatButton.tsx   # Stat recording button
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication state
│   ├── NotificationContext.tsx  # Notifications
│   └── ThemeContext.tsx # Light/dark mode
├── pages/               # Route pages
│   ├── AuthPage.tsx     # Login/signup
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Games.tsx        # Games list
│   ├── GameAnalysis.tsx # Post-game analysis
│   ├── LeagueSelectionPage.tsx  # League picker
│   ├── LiveGame.tsx     # Live game scoring
│   ├── Players.tsx      # Players list
│   ├── PlayerComparison.tsx  # Player comparison tool
│   ├── PlayerProfile.tsx # Player details
│   ├── Profile.tsx      # User profile
│   ├── ShotCharts.tsx   # Shot chart analysis
│   ├── Standings.tsx    # League standings
│   ├── Statistics.tsx   # Statistics dashboard
│   ├── Teams.tsx        # Teams list
│   └── TeamDetail.tsx   # Team details
├── App.tsx              # Root component
└── index.tsx            # Entry point
```

## Key Features

### Authentication

- Email/password authentication
- Session management via Convex
- Protected routes

### Live Game Scoring

- Real-time stat recording
- Player substitutions
- Game clock management
- Shot location tracking

### Statistics & Analytics

- Player stats with averages
- Team comparisons
- Shot charts with heatmaps
- League standings

### Theming

- Light and dark mode
- System preference detection
- Persisted preference

## Available Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start dev server at localhost:5173 |
| `npm run build`     | Build for production               |
| `npm run preview`   | Preview production build           |
| `npm run typecheck` | Run TypeScript type checking       |
| `npm run lint`      | Run ESLint                         |

## Environment Variables

Create a `.env` file:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

## Styling

This app uses Tailwind CSS with custom configuration:

- **Dark mode**: Uses `class` strategy (`dark:` variants)
- **Colors**: Custom orange primary, gray neutrals
- **Responsive**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build
npm run build

# Deploy dist/ folder
```

### Environment Variables

Set `VITE_CONVEX_URL` in your hosting platform's environment settings.
