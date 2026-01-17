# Basketball Stats Mobile

React Native mobile application for the Basketball Stats platform, built with Expo.

## Tech Stack

- **React Native 0.79** - Mobile framework
- **Expo 53** - Development platform
- **NativeWind** - Tailwind CSS for React Native
- **React Navigation** - Navigation library
- **Convex** - Real-time backend
- **Expo Secure Store** - Secure storage for tokens

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (for development)
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
# Start Expo development server
npm start

# Or with specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

Scan the QR code with Expo Go (Android) or Camera app (iOS).

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Icon.tsx         # Icon component
│   ├── Logo.tsx         # App logo
│   ├── PlayerAvatar.tsx # Player avatar
│   ├── Skeleton.tsx     # Loading skeletons
│   └── StatButton.tsx   # Stat recording button
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication state
│   └── ThemeContext.tsx # Light/dark mode
├── navigation/          # Navigation configuration
│   ├── AppNavigator.tsx # Main navigator
│   └── AuthNavigator.tsx # Auth flow navigator
├── screens/             # App screens
│   ├── auth/           # Authentication screens
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   └── LeagueSelectionScreen.tsx
│   ├── HomeScreen.tsx   # Dashboard
│   ├── GamesScreen.tsx  # Games list
│   ├── TeamsScreen.tsx  # Teams list
│   ├── StatisticsScreen.tsx  # Stats overview
│   ├── ProfileScreen.tsx # User profile & settings
│   ├── LiveGameScreen.tsx # Live game scoring
│   ├── PlayerStatsScreen.tsx # Player details
│   ├── PlayerStatisticsScreen.tsx # Player stats
│   ├── PlayerComparisonScreen.tsx # Compare players
│   ├── ShotChartScreen.tsx # Shot charts
│   ├── CreateGameScreen.tsx # Create new game
│   ├── CreateTeamScreen.tsx # Create team
│   ├── CreatePlayerScreen.tsx # Add player
│   └── SettingsScreen.tsx # App settings
├── App.tsx              # Root component
└── index.ts             # Entry point
```

## Key Features

### Authentication
- Email/password authentication
- Secure token storage with Expo Secure Store
- Auto-login on app restart

### Navigation
- Bottom tab navigation (Home, Stats, Teams, Games, Profile)
- Stack navigation for detail screens
- Theme-aware navigation colors

### Live Game Scoring
- Real-time stat recording
- Haptic feedback on actions
- Shot location tracking

### Theming
- Light and dark mode
- System preference detection
- Manual toggle in Profile settings
- Persisted preference

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run ios` | Start on iOS Simulator |
| `npm run android` | Start on Android Emulator |
| `npm run web` | Start web version |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |

## Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Styling with NativeWind

This app uses NativeWind (Tailwind CSS for React Native):

```tsx
// Example usage
<View className="flex-1 bg-gray-50 dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-white text-lg font-bold">
    Hello World
  </Text>
</View>
```

### Dark Mode
- Uses NativeWind's `dark:` variants
- Automatically responds to system preference
- Manual override available in Profile settings

### Custom Colors
- `primary-500` - Orange accent (#F97316)
- `dark-950` - Dark background (#0f1419)
- `court-background` - Court green (#1a472a)

## Building for Production

### Using EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project (first time)
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both
eas build --platform all
```

### Submit to App Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## Configuration Files

- `app.json` - Expo configuration
- `eas.json` - EAS Build configuration
- `tailwind.config.js` - Tailwind/NativeWind configuration
- `babel.config.js` - Babel configuration with NativeWind

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache and restart
npx expo start --clear
```

### NativeWind Not Working
```bash
# Rebuild native cache
npx expo prebuild --clean
```

### TypeScript Errors
```bash
# Check types
npm run typecheck
```
