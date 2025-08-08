# Basketball Stats Assistant - React + Rails Architecture

A cross-platform basketball statistics tracking application with React Native mobile app, React web app, and Ruby on Rails API backend.

## Project Overview

This application provides real-time basketball game statistics tracking with an intuitive drag-and-drop interface for recording player actions during live games. Built with a modern React frontend and robust Rails API backend for optimal development velocity and maintainability.

## Architecture Overview

```
React Native App (iOS/Android)
              ↓
React Web App              →  Rails API Server  →  PostgreSQL
              ↓                     ↓                    ↓
         Shared Components    Action Cable        Game Statistics
                             (WebSockets)         Player Data
                                  ↓               Team Management
                              Redis Cache         Real-time Updates
```

## Core Features

### 🎯 Primary Features

- **Cross-Platform Frontend**: React Native mobile apps + React web app with shared components
- **Real-time Game Tracking**: Live statistics updates via Action Cable WebSockets
- **Drag & Drop Interface**: Intuitive stat recording by dragging actions onto players
- **Live Game Timer**: Play/pause game clock with quarter tracking and manual time editing
- **Comprehensive Stats**: Points, shots, rebounds, assists, steals, blocks, turnovers, fouls
- **Shot Tracking**: Made/missed field goals, 3-pointers, and free throws with confirmation
- **Live Sharing**: Real-time game statistics sharing with spectators and coaches
- **Box Score Generation**: Traditional basketball statistics export and sharing

### 📊 Statistics Tracked

- Points scored (2-point, 3-point, free throws)
- Field goals (made/attempted with percentages)
- Rebounds (offensive/defensive)
- Assists and turnovers
- Steals and blocks
- Personal fouls
- Player efficiency ratings
- Plus/minus calculations
- Minutes played

## Technical Stack

### **Frontend**

- **React Native 0.73+**: iOS and Android mobile applications
- **React 18+**: Web application with shared component architecture
- **TypeScript**: Type safety across frontend codebase
- **React Navigation**: Navigation for mobile app
- **React Router**: Routing for web app
- **Zustand**: Lightweight state management
- **React Query**: Server state management and caching
- **Tailwind CSS**: Utility-first styling (web)
- **NativeWind**: Tailwind for React Native
- **Socket.io Client**: Real-time communication with Rails backend

### **Backend**

- **Ruby on Rails 7.1+**: API-only mode for backend services
- **Ruby 3.2+**: Latest Ruby version for performance
- **PostgreSQL 15+**: Primary database for game and player data
- **Redis 7+**: Caching and Action Cable adapter
- **Action Cable**: WebSocket server for real-time updates
- **Sidekiq**: Background job processing
- **Puma**: Multi-threaded web server

### **Development & Infrastructure**

- **Docker**: Containerized development and deployment
- **GitHub Actions**: CI/CD pipeline
- **Heroku/Railway**: Rails-friendly hosting
- **AWS S3**: File storage for exports and images

## Project Structure

```
basketball-stats-app/
├── mobile/                          # React Native mobile app
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/
│   │   │   ├── player/
│   │   │   ├── stats/
│   │   │   └── shared/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── metro.config.js
├── web/                            # React web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/
│   │   │   ├── player/
│   │   │   ├── stats/
│   │   │   └── shared/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── shared/                         # Shared React components
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── services/
├── backend/                        # Rails API application
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── api/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── games_controller.rb
│   │   │   │   │   ├── players_controller.rb
│   │   │   │   │   ├── stats_controller.rb
│   │   │   │   │   └── teams_controller.rb
│   │   │   └── application_controller.rb
│   │   ├── models/
│   │   │   ├── game.rb
│   │   │   ├── player.rb
│   │   │   ├── team.rb
│   │   │   ├── player_stat.rb
│   │   │   └── play.rb
│   │   ├── channels/
│   │   │   ├── application_cable/
│   │   │   ├── game_channel.rb
│   │   │   └── stats_channel.rb
│   │   ├── jobs/
│   │   │   ├── stats_calculation_job.rb
│   │   │   └── game_summary_job.rb
│   │   ├── serializers/
│   │   │   ├── game_serializer.rb
│   │   │   ├── player_serializer.rb
│   │   │   └── stats_serializer.rb
│   │   └── services/
│   │       ├── stats_calculator.rb
│   │       ├── game_manager.rb
│   │       └── realtime_broadcaster.rb
│   ├── config/
│   │   ├── routes.rb
│   │   ├── database.yml
│   │   ├── cable.yml
│   │   └── application.rb
│   ├── db/
│   │   ├── migrate/
│   │   └── seeds.rb
│   ├── Gemfile
│   └── Dockerfile
├── docs/                           # Documentation
├── docker-compose.yml
└── README.md
```

## Key Components & Models

### Rails Models

```ruby
# Core basketball entities
class Team < ApplicationRecord
  has_many :players
  has_many :games
end

class Player < ApplicationRecord
  belongs_to :team
  has_many :player_stats
  has_many :games, through: :player_stats
end

class Game < ApplicationRecord
  belongs_to :home_team, class_name: 'Team'
  belongs_to :away_team, class_name: 'Team'
  has_many :player_stats
  has_many :plays
  has_many :players, through: :player_stats
end

class PlayerStat < ApplicationRecord
  belongs_to :player
  belongs_to :game
  # Comprehensive basketball statistics
end
```

### React Components Architecture

- **Shared Components**: Common UI components used across mobile and web
- **Game Components**: Real-time game tracking and timer functionality
- **Player Components**: Player management and stat recording interfaces
- **Stats Components**: Statistics display and box score generation

## Development Guidelines

### Rails API Conventions

- **RESTful Design**: Standard REST endpoints with nested resources
- **JSON API Format**: Consistent API response structure
- **Version Control**: API versioning with `/api/v1/` namespace
- **Error Handling**: Standardized error responses and HTTP status codes
- **Authentication**: JWT or session-based auth with proper CORS configuration

### Frontend State Management

- **Game State**: Timer, score, quarter, active players
- **Player Stats**: Real-time statistics for all players
- **UI State**: Selected players, modal states, drag operations
- **Server State**: API data with React Query for caching and synchronization

### Real-time Architecture

- **Action Cable Channels**: Game-specific channels for real-time updates
- **Event Broadcasting**: Stat updates, game state changes, timer updates
- **Client Synchronization**: Automatic reconnection and state reconciliation
- **Conflict Resolution**: Optimistic updates with server reconciliation

### Database Design

- **Normalized Schema**: Proper relationships between teams, players, games, and stats
- **Indexing Strategy**: Optimized indexes for frequent queries (game lookups, player stats)
- **Constraints**: Database-level validation for data integrity
- **Migrations**: Version-controlled schema changes

## API Endpoints

### Core Resources

```
GET    /api/v1/teams                 # List all teams
POST   /api/v1/teams                 # Create team
GET    /api/v1/teams/:id             # Get team details
PUT    /api/v1/teams/:id             # Update team

GET    /api/v1/teams/:team_id/players # List team players
POST   /api/v1/teams/:team_id/players # Add player to team
PUT    /api/v1/players/:id           # Update player
DELETE /api/v1/players/:id           # Remove player

GET    /api/v1/games                 # List games
POST   /api/v1/games                 # Create new game
GET    /api/v1/games/:id             # Get game details
PUT    /api/v1/games/:id             # Update game state
POST   /api/v1/games/:id/start       # Start game
POST   /api/v1/games/:id/pause       # Pause game
POST   /api/v1/games/:id/end         # End game

GET    /api/v1/games/:game_id/stats  # Get game statistics
POST   /api/v1/games/:game_id/stats  # Record player stat
PUT    /api/v1/stats/:id             # Update stat record
DELETE /api/v1/stats/:id             # Remove stat record

GET    /api/v1/games/:game_id/box_score # Generate box score
```

### WebSocket Channels

```
GameChannel                          # Game state updates
StatsChannel                         # Real-time stat updates
TimerChannel                         # Game timer synchronization
```

## Getting Started

### Backend Setup (Rails)

```bash
cd backend
bundle install
rails db:create db:migrate db:seed
rails server
```

### Frontend Setup

```bash
# Shared components
cd shared && npm install

# Web app
cd web && npm install && npm run dev

# Mobile app
cd mobile && npm install
npx react-native run-ios
npx react-native run-android
```

### Docker Development

```bash
docker-compose up -d
```

## Real-time Features Implementation

### Action Cable Integration

- **Game State Broadcasting**: Timer updates, score changes, quarter progression
- **Stat Updates**: Live player statistics as they're recorded
- **Connection Management**: Automatic reconnection and presence indicators
- **Scalability**: Redis adapter for multi-server deployment

### Frontend Real-time Handling

- **Socket.io Client**: Connection management and event handling
- **Optimistic Updates**: Immediate UI feedback with server confirmation
- **Conflict Resolution**: Handle simultaneous updates from multiple devices
- **Offline Support**: Queue actions when disconnected, sync when reconnected

## Testing Strategy

### Backend Testing (Rails)

- **RSpec**: Model, controller, and integration tests
- **FactoryBot**: Test data generation
- **Shoulda**: Model validation and association testing
- **VCR**: API testing with recorded HTTP interactions

### Frontend Testing

- **React Testing Library**: Component behavior testing
- **Jest**: Unit tests for utilities and hooks
- **E2E Testing**: Detox (React Native) and Playwright (web)
- **Integration Tests**: API communication and real-time features

## Deployment Strategy

### Production Environment

- **Backend**: Heroku/Railway with PostgreSQL and Redis add-ons
- **Web Frontend**: Vercel/Netlify for static hosting
- **Mobile Apps**: App Store and Google Play Store
- **CDN**: CloudFlare for API and static asset caching

### CI/CD Pipeline

- **Testing**: Automated test suite on all pull requests
- **Linting**: Code quality checks with RuboCop (Rails) and ESLint (React)
- **Deployment**: Automatic deployment on merge to main branch
- **Monitoring**: Error tracking with Sentry, performance monitoring

## Future Enhancements

### Advanced Analytics

- **Shot Charts**: Visual court representation with shot tracking
- **Advanced Metrics**: Player efficiency rating, true shooting percentage
- **Team Analytics**: Offensive/defensive ratings, pace calculations
- **Trends Analysis**: Performance trends over multiple games

### Platform Extensions

- **Desktop App**: Electron wrapper for web application
- **Apple Watch**: Quick stat recording for coaches
- **TV Dashboard**: Large screen display for scoreboards
- **Tablet Optimization**: iPad-specific interfaces for scorekeepers

### Integration Features

- **League Management**: Multi-team league tracking and standings
- **Player Profiles**: Detailed player pages with career statistics
- **Game Recording**: Video integration with timestamp syncing
- **Social Features**: Team sharing, fan following, social media integration
