# Basketball Stats App - TODO

> Remember to check TODO-min.md for any TODOs that the user has added. Update this TODO.md TODOs with more details.
> Last audit: January 28, 2026 (P2 features added)

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

### Team Enhancements

- [x] **Team colors** - Allow teams to have custom primary/secondary colors
  - **Schema change**: Added `primaryColor` and `secondaryColor` fields to `teams` table
  - **Backend**: Updated `convex/teams.ts` create/update mutations
  - **Shared**: Created `shared/src/utils/teamColors.ts` with palette and resolution functions
  - **Web UI**: Added `ColorPicker.tsx` component, integrated into `TeamFormModal.tsx`
  - **Mobile UI**: Added `ColorPicker.tsx` component, integrated into `CreateTeamScreen.tsx` and `TeamDetailScreen.tsx`
  - **Display**: Updated `EnhancedScoreboard.tsx` (mobile) to use team colors for score display

- [x] **Team website link** - Add optional website URL field for teams
  - **Schema change**: Added `websiteUrl` field to `teams` table
  - **Backend**: Updated create/update mutations in `convex/teams.ts`
  - **Web UI**: URL input in `TeamFormModal.tsx`, clickable link in `TeamDetail.tsx`
  - **Mobile UI**: URL input in `CreateTeamScreen.tsx`/`TeamDetailScreen.tsx`, opens in browser

- [x] **Team social media links** - Add optional social media URLs for teams
  - **Schema change**: Added `socialLinks` object field to `teams` table
  - **Shared**: Created `shared/src/constants/social.ts` with platform definitions
  - **Backend**: Updated create/update mutations to handle social links object
  - **Web UI**: Social link inputs in `TeamFormModal.tsx`, icon row in `TeamDetail.tsx`
  - **Mobile UI**: Expandable social links section in team forms, icon buttons on team detail

- [x] **Team logo on game page** - Display team logos during live games and analysis
  - **Status**: Already implemented in `GameAnalysis.tsx` (web) with logo display

### Player Enhancements

- [x] **Player emails with user profile linking** - Link player records to user accounts
  - **Schema change**: Added `email` and `userId` fields to `players` table
  - **Backend**: Updated `convex/players.ts` mutations to accept email, auto-linking logic added
  - **Web UI**: Email input in `PlayerFormModal.tsx` with helper text
  - **Mobile UI**: Email input in `CreatePlayerScreen.tsx` with helper text

### User-Team Relationships

- [x] **Link users to teams (coaches/players)** - Full implementation complete
  - **Schema**: Created `teamMemberships` table with roles (coach, assistant, player, manager) and status tracking
  - **Backend**: Created `convex/teamMemberships.ts` with full CRUD functions (add, update, remove, list queries)
  - **Web UI**: Added "Team Staff" section to `TeamDetail.tsx` showing coaches/managers with avatars and roles
  - **Mobile UI**: Added "Team Staff" section to `TeamDetailScreen.tsx` with similar display

### Game Enhancements

- [x] **YouTube video embedding in game page** - Embed live or recorded game videos
  - **Schema change**: Added `videoUrl` field to `games` table
  - **Backend**: Updated `convex/games.ts` create/update mutations
  - **Shared**: Created `shared/src/utils/youtube.ts` with URL parsing utilities
  - **Web UI**: `YouTubeEmbed.tsx` component, integrated into `GameAnalysis.tsx`
  - **Mobile UI**: `YouTubeEmbed.tsx` component (thumbnail + link to YouTube app), integrated into `GameAnalysisScreen.tsx`

### Permissions & Access Control

- [x] **Role-based permissions (team level)** - Full implementation complete
  - **Backend** (`convex/lib/auth.ts`): Added `canManageTeam(userId, teamId)` helper
  - **Integration**: Updated `teams.ts`, `players.ts`, `teamMemberships.ts` mutations to use `canManageTeam`
  - **Security**: Team coaches now properly have permission to manage their teams
  - **Backend**: `teams.get` query now returns `canManage` boolean for UI use
  - **Web UI**: Edit/delete buttons and "Add Player" button hidden when user lacks permission
  - **Mobile UI**: Edit/delete options in team menu hidden when user lacks permission

### Cross-Promotion

- [x] **Link related apps** - Promote calendariofpb.pt and basketballvideoanalyzer.com
  - **Footer**: Added "More Tools" section in `Footer.tsx` with external links to both sites

---

## P3 - Low Priority / Enhancements

### Web

- [ ] **No undo outside live game** - Only live game has undo capability. Would require audit logging and backend changes.

### Mobile

- [ ] **Expo notifications warnings** - expo-notifications shows warnings in Expo Go. Requires building a development client to resolve.
- [ ] **Source map ENOENT warnings** - Metro bundler shows cosmetic path resolution warnings. Does not affect functionality.

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

## Recently Completed (January 28, 2026 - Evening)

### P2 Features Implementation

- [x] **Team colors** - Full implementation across backend, web, and mobile
  - Created `shared/src/utils/teamColors.ts` with color palette and resolution functions
  - Created `ColorPicker.tsx` components for both web and mobile
  - Updated `EnhancedScoreboard.tsx` (mobile) to display team color indicators
  - Integrated into team creation and editing flows on both platforms

- [x] **Team website & social links** - Full implementation
  - Added `websiteUrl` and `socialLinks` fields to schema
  - Created `shared/src/constants/social.ts` with platform definitions
  - Added inputs to `TeamFormModal.tsx` (web) and `CreateTeamScreen.tsx`/`TeamDetailScreen.tsx` (mobile)
  - Display clickable links and social icons on team detail pages

- [x] **Player email with user linking** - Full implementation
  - Added `email` and `userId` fields to players schema
  - Email input added to `PlayerFormModal.tsx` (web) and `CreatePlayerScreen.tsx` (mobile)
  - Auto-linking logic in backend mutations

- [x] **YouTube video embedding** - Full implementation
  - Added `videoUrl` field to games schema
  - Created `shared/src/utils/youtube.ts` with URL parsing utilities
  - Created `YouTubeEmbed.tsx` components for web (iframe) and mobile (thumbnail + external link)
  - Integrated into `GameAnalysis.tsx` (web) and `GameAnalysisScreen.tsx` (mobile)

- [x] **Team memberships backend** - `convex/teamMemberships.ts` created with full CRUD

- [x] **Permission system** - Security fix
  - Added `canManageTeam()` helper to `convex/lib/auth.ts`
  - Updated `teams.ts`, `players.ts`, `teamMemberships.ts` mutations to use unified permission check
  - Team coaches now properly have permission to manage their teams

- [x] **Cross-promotion links** - Added "More Tools" section in Footer with links to calendariofpb.pt and basketballvideoanalyzer.com

- [x] **PublicLayout Header auth check** - Shows "Go to Dashboard" instead of Login/Signup when user is authenticated

---

## Recently Completed (January 28, 2026 - Morning)

### UX Improvements

- [x] **Team separation in web stat modals** - Added team headers with color coding (blue for home, orange for away) to `QuickStatModal` and `ShotRecordingModal` on web, matching mobile implementation
- [x] **PlayerDetail mobile responsive** - Optimized header layout with stacking buttons on mobile, smaller avatar, and proper text sizing
- [x] **Standardized team colors** - Unified team colors across all components: **Home = Blue, Away = Orange**
  - Updated `ActiveLineupPanel` (position labels, jerseys, header accent)
  - Updated `EnhancedScoreboard` (added team color indicator bars next to team names)
  - Updated `TeamBoxScore` (header backgrounds)
  - Updated `GameEventCard` (play-by-play border colors)
  - Updated `GameFlowChart` (scoring run fills, line gradient)
- [x] **Play-by-play team colors** - Fixed GameEventCard to properly determine team from event details or teamId fallback
- [x] **Substitution events in play-by-play** - Now logged when players enter/exit game or swap
- [x] **Quarter start/end events in play-by-play** - Comprehensive game flow logging:
  - Game start logs Q1 start event
  - Quarter timer expiration logs quarter end + next quarter start
  - Game end logs final quarter end with final score
  - Manual quarter changes via setQuarter also log transition events

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
