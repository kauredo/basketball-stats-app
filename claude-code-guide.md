# Claude Code Implementation Guide - React + Rails Stack

## Getting Started with Claude Code CLI

### 1. Initial Project Setup

```bash
# Create project directory structure
mkdir basketball-stats-app
cd basketball-stats-app

# Initialize with Claude Code
claude-code init

# Create directory structure
mkdir backend mobile web shared docs
```

### 2. Project Initialization Prompt for Claude Code

When starting with Claude Code, use this comprehensive prompt:

```
I want to build a cross-platform basketball statistics tracking application with the following architecture:

- Backend: Ruby on Rails 7.1+ API with PostgreSQL, Redis, and Action Cable
- Mobile: React Native for iOS and Android
- Web: React with TypeScript
- Shared: Common React components and utilities

Please set up the project structure following the technical requirements in technical-requirements.md and create:

1. Rails API backend with proper MVC structure
2. React Native mobile application
3. React web application with shared components
4. Real-time functionality using Action Cable and WebSocket clients
5. Comprehensive basketball statistics tracking system

Start with the Rails backend setup including models, controllers, channels, and database structure.
```

## Step-by-Step Implementation with Claude Code

### Phase 1: Rails Backend Foundation

#### 1.1 Rails Application Setup

```bash
claude-code "Create a new Rails 7.1 API application in the backend directory with the following structure:
- API-only configuration
- PostgreSQL database setup
- Redis for Action Cable
- CORS configuration for React frontends
- JWT authentication setup
- Comprehensive basketball data models (Team, Player, Game, PlayerStat)
- RESTful API controllers with proper error handling
- Action Cable channels for real-time updates

Follow the exact model structure and relationships defined in technical-requirements.md"
```

#### 1.2 Database Models and Migrations

```bash
claude-code "Create the complete database schema with migrations for:
- Teams table with name, city, logo
- Players table with team relationship, number, position, stats
- Games table with home/away teams, timing, scores
- PlayerStats table with comprehensive basketball statistics
- Proper indexes and foreign key constraints
- Validation rules as specified in the Rails models section

Include seed data for testing with sample teams and players."
```

#### 1.3 API Controllers and Routes

```bash
claude-code "Implement the complete API controller structure:
- Nested resource routes for teams/players and games/stats
- Game management endpoints (start, pause, resume, end)
- Real-time stat recording endpoints
- Box score generation
- Proper error handling and status codes
- JSON API serialization
- Authentication middleware

Follow the exact API endpoints structure from technical-requirements.md"
```

#### 1.4 Real-time Action Cable Setup

```bash
claude-code "Implement Action Cable real-time functionality:
- GameChannel for game state updates
- StatsChannel for live statistics
- Connection authentication with JWT
- Broadcasting for stat updates, timer changes, game events
- Redis adapter configuration
- WebSocket security and CORS setup

Ensure compatibility with Socket.io clients on React frontends."
```

### Phase 2: Shared Frontend Components

#### 2.1 Shared Component Library

```bash
claude-code "Create a shared component library in the shared directory:
- TypeScript configuration
- Common basketball UI components (PlayerCard, StatDisplay, GameTimer)
- Utility functions for basketball calculations
- API service layer for Rails backend communication
- WebSocket connection management
- State management utilities
- Shared types and interfaces

Components should work in both React Native and React web environments."
```

#### 2.2 API Services and State Management

```bash
claude-code "Implement shared services and state management:
- API client with axios for Rails backend
- WebSocket client for real-time updates
- React Query configuration for server state
- Zustand stores for local state management
- Authentication context and token management
- Error handling and retry logic
- Offline support utilities"
```

### Phase 3: React Native Mobile Application

#### 3.1 React Native Project Setup

```bash
claude-code "Create React Native application in mobile directory:
- TypeScript configuration
- Navigation setup with React Navigation
- Integration with shared component library
- NativeWind for styling (Tailwind CSS)
- Platform-specific optimizations
- Development and build configurations
- Metro bundler configuration for shared components"
```

#### 3.2 Mobile Game Interface

```bash
claude-code "Implement the mobile game tracking interface:
- Game timer with start/pause functionality
- Player grid with drag-and-drop stat recording
- Real-time statistics display
- Touch-optimized controls for quick stat entry
- Offline stat queuing with sync when online
- Native performance optimizations
- Haptic feedback for user interactions"
```

#### 3.3 Mobile-Specific Features

```bash
claude-code "Add mobile-specific functionality:
- Background timer continuation
- Push notifications for game events
- Device orientation handling
- Touch gestures for quick stat recording
- Native navigation patterns
- Platform-specific UI components (iOS/Android)
- Performance monitoring and optimization"
```

### Phase 4: React Web Application

#### 4.1 Web Application Setup

```bash
claude-code "Create React web application in web directory:
- Vite configuration for fast development
- TypeScript setup
- React Router for navigation
- Tailwind CSS configuration
- Integration with shared components
- Responsive design patterns
- PWA configuration for offline support"
```

#### 4.2 Web Game Interface

```bash
claude-code "Implement the web game interface:
- Desktop-optimized game tracking layout
- Keyboard shortcuts for rapid stat entry
- Multi-monitor support for coaches
- Advanced analytics dashboard
- Export functionality for game reports
- Printable box scores and statistics
- Admin interface for team/player management"
```

#### 4.3 Advanced Web Features

```bash
claude-code "Add advanced web-specific features:
- Real-time spectator view with live sharing
- Advanced statistics visualization
- Historical game analysis
- Team management interface
- Season statistics and reports
- Data export in multiple formats (PDF, CSV, JSON)
- Integration with external basketball databases"
```

### Phase 5: Real-time Integration

#### 5.1 WebSocket Implementation

```bash
claude-code "Implement comprehensive real-time functionality:
- Socket.io client for both mobile and web
- Connection management with automatic reconnection
- Real-time synchronization of game state
- Conflict resolution for simultaneous updates
- Optimistic updates with server confirmation
- Connection status indicators
- Offline/online state handling"
```

#### 5.2 Live Game Features

```bash
claude-code "Add live game streaming features:
- Public game sharing with read-only access
- Live commentary integration
- Real-time spectator count
- Social media integration
- Live statistics widgets for embedding
- QR code sharing for quick access
- Notification system for game events"
```

### Phase 6: Testing and Quality Assurance

#### 6.1 Backend Testing

```bash
claude-code "Implement comprehensive Rails testing:
- RSpec configuration with FactoryBot
- Model tests with validation and association testing
- Controller tests for all API endpoints
- Integration tests for real-time functionality
- Performance tests for concurrent users
- Authentication and authorization tests
- Database constraint and migration tests"
```

#### 6.2 Frontend Testing

```bash
claude-code "Add frontend testing suite:
- Jest configuration for shared utilities
- React Testing Library for component tests
- E2E testing with Detox (mobile) and Playwright (web)
- Real-time functionality testing
- Cross-platform component testing
- Accessibility testing
- Performance testing for large stat datasets
- Visual regression testing
- API integration testing"
```

### Phase 7: Deployment and DevOps

#### 7.1 Backend Deployment

```bash
claude-code "Set up Rails production deployment:
- Docker configuration for Rails app
- PostgreSQL and Redis setup for production
- Heroku/Railway deployment configuration
- Environment variable management
- Database migration strategies
- Background job processing with Sidekiq
- Monitoring and logging setup
- SSL and security configuration"
```

#### 7.2 Frontend Deployment

```bash
claude-code "Configure frontend deployments:
- Web app deployment to Vercel/Netlify
- React Native build configuration for App Store/Google Play
- CI/CD pipeline with GitHub Actions
- Environment-specific configurations
- Code signing for mobile releases
- Progressive Web App deployment
- CDN configuration for static assets"
```

## Detailed Implementation Requests

### Core Rails Backend Commands

#### 1. Complete Rails Setup

```bash
claude-code "Create a complete Rails 7.1 API backend following these specifications:

- Generate new Rails API app with PostgreSQL
- Add all gems from technical-requirements.md Gemfile
- Configure CORS for React frontends
- Set up Action Cable with Redis adapter
- Create JWT authentication system
- Configure API versioning with /api/v1 namespace
- Set up proper error handling and logging
- Include comprehensive basketball data models with validations
- Add database seeds for testing

Structure the app exactly as outlined in the technical requirements document."
```

#### 2. Basketball Data Models

```bash
claude-code "Implement the complete basketball data model system:

Create migrations and models for:
- Team model with players association
- Player model with team and stats relationships
- Game model with home/away teams and timing
- PlayerStat model with comprehensive basketball statistics
- Proper database indexes and constraints
- Model validations and business logic methods
- Calculated fields (percentages, efficiency ratings)
- Callbacks for real-time broadcasting

Include all the methods and relationships specified in technical-requirements.md"
```

#### 3. API Controllers and Routes

```bash
claude-code "Build the complete API controller structure:

- RESTful controllers for teams, players, games, stats
- Nested routing for logical resource relationships
- Game management actions (start, pause, resume, end)
- Real-time stat recording endpoints
- Box score generation and export
- Authentication middleware and JWT handling
- Proper HTTP status codes and error responses
- JSON API serialization with relationships
- Rate limiting and security measures

Follow the exact controller structure from technical-requirements.md"
```

#### 4. Real-time Action Cable Channels

```bash
claude-code "Implement Action Cable real-time functionality:

- GameChannel for game state synchronization
- StatsChannel for live statistics updates
- Connection authentication with JWT tokens
- Broadcasting methods for all game events
- Redis adapter configuration for scaling
- WebSocket security and CORS setup
- Connection management and cleanup
- Error handling for dropped connections
- Integration with Rails controllers for automatic broadcasting

Ensure compatibility with Socket.io clients from React applications."
```

### Frontend Development Commands

#### 5. Shared Component Library

```bash
claude-code "Create a comprehensive shared component library:

- TypeScript configuration for type safety
- Common basketball UI components (GameTimer, PlayerCard, StatDisplay, ActionPanel)
- Utility functions for basketball calculations and formatting
- API service layer with axios for Rails communication
- WebSocket client for real-time updates
- Authentication context and token management
- Shared state management with Zustand
- Cross-platform styling utilities
- Error boundary components
- Loading and skeleton components

Components must work in both React Native and React web environments."
```

#### 6. React Native Mobile App

```bash
claude-code "Build the React Native mobile application:

- Initialize React Native project with TypeScript
- Set up React Navigation for screen management
- Configure NativeWind for Tailwind CSS styling
- Implement drag-and-drop stat recording interface
- Add real-time game timer with background support
- Create touch-optimized player selection grid
- Integrate with shared component library
- Add offline stat queuing with sync
- Implement haptic feedback for interactions
- Configure platform-specific optimizations (iOS/Android)
- Set up development and production build configurations

Focus on performance and native feel for basketball game tracking."
```

#### 7. React Web Application

```bash
claude-code "Create the React web application:

- Set up Vite project with TypeScript and React
- Configure React Router for navigation
- Set up Tailwind CSS with responsive design
- Implement desktop-optimized game interface
- Add keyboard shortcuts for rapid stat entry
- Create advanced analytics dashboard
- Build admin interface for team management
- Add export functionality for reports
- Implement PWA features for offline support
- Configure responsive layouts for different screen sizes
- Integrate real-time spectator sharing features

Optimize for desktop coaches and stat keepers."
```

### Integration and Testing Commands

#### 8. Real-time Integration

```bash
claude-code "Implement comprehensive real-time functionality:

- Socket.io client for both mobile and web platforms
- Connection management with automatic reconnection
- Real-time game state synchronization
- Optimistic updates with server reconciliation
- Conflict resolution for simultaneous stat updates
- Connection status indicators
- Offline mode with action queuing
- Error handling for network issues
- Performance optimization for high-frequency updates
- Integration testing for real-time features

Ensure seamless real-time experience across all platforms."
```

#### 9. Testing Suite Implementation

```bash
claude-code "Create comprehensive testing suites:

Backend (Rails):
- RSpec configuration with FactoryBot and database cleaning
- Model tests for validations, associations, and business logic
- Controller tests for all API endpoints
- Integration tests for Action Cable channels
- Authentication and authorization tests
- Performance tests for concurrent users

Frontend:
- Jest setup for shared utilities and components
- React Testing Library for component behavior
- E2E tests with Detox (mobile) and Playwright (web)
- Real-time functionality testing
- Cross-platform component compatibility tests
- API integration tests with mock servers

Include CI/CD pipeline configuration for automated testing."
```

#### 10. Deployment Configuration

```bash
claude-code "Set up production deployment infrastructure:

Rails Backend:
- Docker configuration for containerized deployment
- Heroku/Railway deployment with PostgreSQL and Redis
- Environment variable management for secrets
- Database migration and seed strategies
- Sidekiq configuration for background jobs
- SSL termination and security headers
- Monitoring with logging and error tracking

Frontend Deployment:
- Vercel/Netlify configuration for web app
- React Native build scripts for App Store/Google Play
- GitHub Actions CI/CD pipeline
- Environment-specific configuration management
- Code signing and release automation
- Performance monitoring and analytics
- CDN setup for static assets and API caching

Include staging and production environment separation."
```

## Sample Development Session Flow

### 1. Foundation Phase

```bash
# Initialize the complete project structure
claude-code "Set up the basketball stats app foundation following the architecture in README.md and technical-requirements.md. Create Rails backend, React Native mobile app, React web app, and shared component library."

# Create the Rails backend
claude-code "Build the complete Rails API backend with basketball data models, RESTful controllers, Action Cable channels, and authentication system as specified in technical-requirements.md"

# Set up shared components
claude-code "Create the shared component library with TypeScript, common UI components, API services, and state management utilities that work across mobile and web platforms"
```

### 2. Core Functionality Phase

```bash
# Build mobile app
claude-code "Implement the React Native mobile application with drag-and-drop stat recording, real-time game timer, and integration with Rails backend via API and WebSockets"

# Build web app
claude-code "Create the React web application with desktop-optimized interface, advanced analytics, team management, and real-time spectator features"

# Add real-time features
claude-code "Implement comprehensive real-time functionality with WebSocket connections, automatic synchronization, and offline support across all platforms"
```

### 3. Testing and Polish Phase

```bash
# Add comprehensive testing
claude-code "Create complete testing suites for Rails backend and React frontends including unit, integration, and E2E tests"

# Optimize performance
claude-code "Optimize application performance with caching, database optimization, real-time connection management, and mobile-specific optimizations"

# Set up deployment
claude-code "Configure production deployment for Rails backend and React frontends with CI/CD pipeline, monitoring, and security measures"
```

## Tips for Successful Claude Code Usage

### 1. Be Specific and Reference Documentation

Always include references to the technical requirements:

```bash
claude-code "Following the database schema in technical-requirements.md, create the Rails models with all specified relationships, validations, and business logic methods"
```

### 2. Build Incrementally

Start with one platform and expand:

```bash
# First, get Rails backend working
claude-code "Create and test the Rails API backend completely before moving to frontend"

# Then add mobile
claude-code "Build React Native app that integrates with the working Rails API"

# Finally add web
claude-code "Create React web app that shares components with mobile where possible"
```

### 3. Test Early and Often

```bash
claude-code "After implementing each major feature, add comprehensive tests and verify the API endpoints work correctly"
```

### 4. Provide Context for Complex Features

```bash
claude-code "Implement the drag-and-drop stat recording system that allows coaches to drag action types (shots, rebounds, assists) onto player cards to record statistics in real-time during basketball games. This should work on both mobile (touch) and web (mouse) interfaces."
```

### 5. Reference Basketball Domain Knowledge

```bash
claude-code "Create the basketball statistics calculation methods including field goal percentage, effective field goal percentage, true shooting percentage, and player efficiency rating using standard basketball formulas"
```

This comprehensive guide provides a structured approach to building your cross-platform basketball stats application with Claude Code, ensuring you get professional-quality results by providing clear context and following a logical development progression.
