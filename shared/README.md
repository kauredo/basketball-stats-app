# Basketball Stats Shared Library

A TypeScript library containing shared components, utilities, and services for the Basketball Stats application, designed to work across React Native mobile and React web applications.

## 🏀 Features

### **Type-Safe API Client**

- Complete TypeScript definitions for basketball domain models
- RESTful API client with automatic request/response handling
- Error handling and retry logic
- Configurable base URLs and authentication

### **Real-Time WebSocket Service**

- Socket.io client for live game updates
- Auto-reconnection with exponential backoff
- Event-driven architecture for game and stats updates
- Connection status monitoring

### **Basketball Utilities**

- Advanced basketball calculations (FG%, eFG%, TS%, PER)
- Time and date formatting utilities
- Player and game data validation
- Sorting and filtering helpers

### **State Management**

- Zustand store for game state management
- Real-time synchronization with backend
- Optimistic updates for better UX
- WebSocket event integration

### **Constants & Configuration**

- Basketball game rules and constants
- Validation parameters
- API configuration
- UI theme constants

## 📦 Installation

```bash
npm install @basketball-stats/shared
```

## 🚀 Usage

### API Client

```typescript
import { basketballAPI, Team, Player } from "@basketball-stats/shared";

// Get teams
const { teams } = await basketballAPI.getTeams();

// Create a player
const { player } = await basketballAPI.createPlayer(teamId, {
  name: "LeBron James",
  number: 6,
  position: "SF",
});

// Record a stat
await basketballAPI.recordStat(gameId, {
  player_id: playerId,
  stat_type: "shot3",
  made: true,
});
```

### WebSocket Service

```typescript
import { basketballWebSocket } from "@basketball-stats/shared";

// Connect to game
basketballWebSocket.connect();
basketballWebSocket.subscribeToGame(gameId);

// Listen for updates
basketballWebSocket.on("stat_update", (data) => {
  console.log("Stat updated:", data.stat);
});

basketballWebSocket.on("game_update", (data) => {
  console.log("Game updated:", data.game);
});
```

### Game Store (React Hook)

```typescript
import { useGameStore } from '@basketball-stats/shared';

function GameComponent() {
  const {
    currentGame,
    playerStats,
    connectionStatus,
    connectToGame,
    recordStat,
    startGame
  } = useGameStore();

  useEffect(() => {
    connectToGame(gameId);
    return () => disconnectFromGame();
  }, [gameId]);

  const handleShot = (playerId: number) => {
    recordStat({
      player_id: playerId,
      stat_type: 'shot2',
      made: true
    });
  };

  return (
    <div>
      <h1>{currentGame?.home_team.name} vs {currentGame?.away_team.name}</h1>
      <div>Status: {connectionStatus}</div>
      {playerStats.map(stat => (
        <div key={stat.id}>
          {stat.player.name}: {stat.points} pts
        </div>
      ))}
    </div>
  );
}
```

### Basketball Utilities

```typescript
import { BasketballUtils, STAT_TYPES, POSITIONS } from "@basketball-stats/shared";

// Calculate shooting percentages
const fgPercent = BasketballUtils.fieldGoalPercentage(playerStat);
const tsPercent = BasketballUtils.trueShootingPercentage(playerStat);

// Format game time
const timeDisplay = BasketballUtils.formatGameTime(seconds);

// Get position info
const positionName = BasketballUtils.getPositionFullName("PG"); // "Point Guard"

// Validate stats
const errors = BasketballUtils.validateStatEntry(playerStat);

// Use constants
const shotTypes = STAT_TYPES.SHOT_3PT; // { code: 'shot3', name: '3-Point Shot', ... }
```

## 📁 Package Structure

```
src/
├── types/           # TypeScript type definitions
├── services/        # API and WebSocket services
├── stores/          # Zustand state management
├── utils/           # Utility functions and calculations
├── constants/       # Basketball constants and configuration
└── index.ts         # Main export file
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Watch for changes
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## 📱 Platform Compatibility

This library is designed to work seamlessly across:

- **React Native** (iOS/Android mobile apps)
- **React Web** (Desktop web applications)
- **Node.js** (Server-side if needed)

## 🏆 Basketball Features

### Comprehensive Statistics

- Points, rebounds, assists, steals, blocks, turnovers, fouls
- Field goals (2pt/3pt), free throws with percentages
- Advanced metrics (eFG%, TS%, PER, +/-)
- Team totals and player comparisons

### Real-Time Game Management

- Live game timer with quarter tracking
- Play-by-play stat recording
- Instant score updates
- WebSocket broadcasting to all connected clients

### Professional Box Scores

- Traditional basketball statistics format
- Team and individual player stats
- Shooting percentages and efficiency metrics
- Game summary and key performances

## 🔗 Integration

This shared library integrates with:

- **Rails API Backend** - Full REST API communication
- **React Native Mobile App** - Touch-optimized stat recording
- **React Web Application** - Desktop coaching interface
- **WebSocket Channels** - Real-time game broadcasting

## 📄 License

MIT License - see LICENSE file for details
