# Basketball Stats App - TODO

> Remember to check TODO-min.md for any TODOs that the user has added. Update this TODO.md TODOs with more details.
> Last audit: January 27, 2026

---

## P0 - Critical Issues

_All P0 issues resolved_

---

## P1 - High Priority

### Backend

- [x] **Push notifications - VAPID configuration needed** - Infrastructure implemented in `convex/notifications.ts`. To enable:
  1. Generate VAPID keys: `npx web-push generate-vapid-keys`
  2. In Convex dashboard → Settings → Environment Variables, add:
     - `VAPID_PUBLIC_KEY`
     - `VAPID_PRIVATE_KEY`
     - `VAPID_SUBJECT` (e.g., `mailto:admin@yourapp.com`)
  3. Install web-push: `npm install web-push` in convex directory

---

## P2 - Medium Priority

_All P2 issues resolved_

---

## P3 - Low Priority / Enhancements

### Web

- [ ] **No undo outside live game** - Only live game has undo capability. Would require audit logging and backend changes.

### Backend

_All P3 backend issues resolved_

---

## Feature Parity Checklist

| Feature            | Web | Mobile | Action Needed          |
| ------------------ | --- | ------ | ---------------------- |
| Dashboard          | ✅  | ✅     | -                      |
| Games List         | ✅  | ✅     | -                      |
| Create Game        | ✅  | ✅     | -                      |
| Live Game          | ✅  | ✅     | -                      |
| Teams List         | ✅  | ✅     | -                      |
| Create Team        | ✅  | ✅     | -                      |
| Edit Team          | ✅  | ✅     | -                      |
| Delete Team        | ✅  | ✅     | -                      |
| Players List       | ✅  | ✅     | -                      |
| Create Player      | ✅  | ✅     | -                      |
| Edit Player        | ✅  | ✅     | -                      |
| Delete Player      | ✅  | ✅     | -                      |
| Player Detail      | ✅  | ✅     | -                      |
| Statistics         | ✅  | ✅     | -                      |
| Standings          | ✅  | ✅     | -                      |
| Shot Charts        | ✅  | ✅     | -                      |
| Player Comparison  | ✅  | ✅     | -                      |
| Game Analysis      | ✅  | ✅     | -                      |
| Game Replay        | ❌  | ✅     | Consider for web       |
| Notifications Bell | ✅  | ✅     | -                      |
| Notification Prefs | ✅  | ✅     | -                      |
| Profile/Settings   | ✅  | ✅     | -                      |
| League Selection   | ✅  | ✅     | -                      |
| League Management  | ✅  | ✅     | -                      |
| CSV Export         | ✅  | ✅     | -                      |
| Print/PDF          | ✅  | ❌     | Delegated to web       |
| Dark Mode          | ✅  | ✅     | -                      |
| Haptic Feedback    | ❌  | ✅     | Consider for web       |
| Sound Feedback     | ❌  | ✅     | Consider for web       |
| Advanced Analytics | ✅  | ✅     | PER, A/TO added mobile |

---

## Recently Completed (January 27, 2026)

### Bug Fixes

- [x] **CreatePlayerScreen infinite loop** - Fixed Maximum update depth exceeded error by memoizing teams array with `useMemo`
- [x] **Notification subscription warnings** - Updated `NotificationContext.tsx` to use `subscription.remove()` instead of deprecated `removeNotificationSubscription()`
- [x] **Mobile export modal styling** - Refactored `ExportOptionsSheet` to use transparent bottom sheet pattern consistent with other modals in the app

### UX Improvements

- [x] **Scheduled games now clickable** - Updated `GamesScreen.tsx` to make upcoming/scheduled games tappable, navigating to LiveGame screen
- [x] **Team separation in stat recording** - Added team headers with color coding (blue for home, orange for away) in `QuickStatModal` and `ShotRecordingModal`
- [x] **Shot chart team filtering** - Added team filter pills to `LiveGameScreen` court view with "All", "Home", and "Away" options
- [x] **Team-specific shot markers** - Updated `MiniCourt` to render circles for home team shots and diamonds for away team shots

---

## Recently Completed (January 26, 2026)

### Phase 1: Quick Fixes

- [x] **Unused ArrowLeftIcon import** - Removed from `LiveGameLayout.tsx`
- [x] **PlayerAvatar alt text** - Enhanced to "Profile photo of {name} #{number}"
- [x] **Dark mode persistence** - Verified working via localStorage

### Phase 2: Backend Hardening

- [x] **Input validation** - Added `convex/lib/validation.ts` with length limits for name (100), description (2000), notes (5000)
- [x] **Duplicate league prevention** - Added check for duplicate league names per owner
- [x] **Viewer role permissions** - Added `canViewStats`, `canViewOnly`, `isViewOnly` to permission calculations

### Phase 3: Export Enhancements

- [x] **Mobile export config** - Created `mobile/.../constants/config.ts` with `WEB_APP_BASE_URL`
- [x] **Large dataset warnings** - Added warning banner for exports > 50 items

### Phase 4: Mobile Features

- [x] **Advanced analytics** - Added PER and A/TO ratio to `AdvancedStats.tsx`
- [x] **assistToTurnoverRatio** - Added to `shared/src/utils/basketball.ts`
- [x] **Halftime indicator** - Created `QuarterDisplay.tsx` component with halftime banner
- [x] **Game Replay** - Created `GameReplayScreen.tsx` with timeline scrubber, shot chart animation, play-by-play

### Phase 5: League Management

- [x] **Web Leagues page** - Created `Leagues.tsx` with card grid, CRUD modals, league selection
- [x] **Mobile Leagues screens** - Created `LeaguesScreen.tsx` and `CreateLeagueScreen.tsx`
- [x] **Navigation updates** - Added routes and sidebar links for both platforms

### Phase 6: Push Notifications Infrastructure

- [x] **getVapidPublicKey** - Updated to read from environment variable
- [x] **sendPushNotification** - Implemented action with web-push integration
- [x] **Internal functions** - Added `getUserPushSubscriptions`, `deletePushSubscription`
- [x] **Subscription cleanup** - Auto-removes expired subscriptions (HTTP 410)

### Phase 7: Additional Enhancements

- [x] **Game event notifications** - Wired `notifyLeagueMembers` to game start/end in `convex/games.ts`
- [x] **Expo push notifications** - Installed expo-notifications, configured app.json, added token registration
- [x] **Multi-player comparison** - Extended comparison to support 2-4 players with new `compareMultiplePlayersStats` API

---

## Files Created This Session

| File                                                | Purpose                           |
| --------------------------------------------------- | --------------------------------- |
| `convex/lib/validation.ts`                          | Input validation helpers          |
| `web/.../pages/Leagues.tsx`                         | League management page            |
| `mobile/.../screens/LeaguesScreen.tsx`              | League list screen                |
| `mobile/.../screens/CreateLeagueScreen.tsx`         | Create league form                |
| `mobile/.../screens/GameReplayScreen.tsx`           | Game replay viewer                |
| `mobile/.../components/livegame/QuarterDisplay.tsx` | Quarter/halftime indicator        |
| `mobile/.../constants/config.ts`                    | App configuration constants       |
| `convex/pushActions.ts`                             | Node.js push notification actions |

## Files Modified This Session

| File                                    | Key Changes                                |
| --------------------------------------- | ------------------------------------------ |
| `convex/notifications.ts`               | Push notification infrastructure           |
| `convex/teams.ts`                       | Input validation                           |
| `convex/players.ts`                     | Input validation                           |
| `convex/leagues.ts`                     | Validation, duplicates, viewer permissions |
| `convex/games.ts`                       | Game event notifications (start/end)       |
| `convex/statistics.ts`                  | Added compareMultiplePlayersStats          |
| `shared/src/utils/basketball.ts`        | Added assistToTurnoverRatio                |
| `web/.../App.tsx`                       | Added Leagues route                        |
| `web/.../components/Layout.tsx`         | Added Leagues nav link                     |
| `web/.../LiveGameLayout.tsx`            | Removed unused import                      |
| `web/.../PlayerAvatar.tsx`              | Enhanced alt text                          |
| `mobile/.../AdvancedStats.tsx`          | Added PER, A/TO columns                    |
| `mobile/.../AppNavigator.tsx`           | Added new screen routes                    |
| `mobile/.../ExportOptionsSheet.tsx`     | Large dataset warning                      |
| `mobile/.../ShotChartScreen.tsx`        | Use shared config                          |
| `mobile/.../NotificationContext.tsx`    | Expo push notification support             |
| `mobile/.../PlayerComparisonScreen.tsx` | Multi-player comparison (2-4 players)      |
| `mobile/.../app.json`                   | Expo notifications config                  |
