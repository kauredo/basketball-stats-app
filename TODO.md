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

- [ ] **Team colors** - Allow teams to have custom primary/secondary colors
  - **Schema change**: Add `primaryColor` and `secondaryColor` fields to `teams` table in `convex/schema.ts`
  - **Backend**: Update `convex/teams.ts` create/update mutations to accept color values
  - **Web UI**: Add color picker inputs to create/edit team modals in `Teams.tsx`
  - **Mobile UI**: Add color picker to `CreateTeamScreen.tsx` and team edit flow
  - **Display**: Use team colors in game pages, box scores, and standings where home/away colors currently hardcoded (blue/orange)
  - **Validation**: Accept hex color strings (e.g., `#FF5733`) or predefined palette

- [ ] **Team website link** - Add optional website URL field for teams
  - **Schema change**: Add `websiteUrl` field (optional string) to `teams` table
  - **Backend**: Update create/update mutations in `convex/teams.ts`
  - **Web UI**: Add URL input to team forms, display as clickable link in `TeamDetail.tsx` header
  - **Mobile UI**: Add to team forms, display with external link icon on team detail screen
  - **Validation**: Validate URL format before saving

- [ ] **Team social media links** - Add optional social media URLs for teams
  - **Schema change**: Add `socialLinks` object field to `teams` table with optional properties: `twitter`, `instagram`, `facebook`, `youtube`, `tiktok`
  - **Backend**: Update create/update mutations to handle social links object
  - **Web UI**: Add social link inputs to team forms, display as icon row in `TeamDetail.tsx`
  - **Mobile UI**: Add social link inputs, display icons that open external apps
  - **Icons**: Use Lucide icons (Twitter/X, Instagram, Facebook, Youtube, etc.)

- [ ] **Team logo on game page** - Display team logos during live games and analysis
  - **Status**: Schema already supports `logoUrl` and `logoStorageId` on teams
  - **Web**: Update `GameAnalysis.tsx` and `LiveGameLayout.tsx` to show team logos next to team names in scoreboard
  - **Mobile**: Update `LiveGameScreen.tsx` and `GameAnalysisScreen.tsx` similarly
  - **Fallback**: Show team initial in colored circle if no logo

### Player Enhancements

- [ ] **Player emails with user profile linking** - Link player records to user accounts
  - **Schema change**: Add `email` (optional string) and `userId` (optional reference to users) fields to `players` table
  - **Backend**:
    - Update `convex/players.ts` mutations to accept email
    - Add function to link player to user account when email matches
    - Add `getPlayerByUserId` query for profile lookups
  - **Web UI**: Add email input to player forms, show "linked" badge if userId exists
  - **Mobile UI**: Same as web
  - **Profile integration**: When viewing a player who is linked to the current user, show "This is you" indicator
  - **Privacy**: Email should only be visible to league admins/coaches, not public

### User-Team Relationships

- [ ] **Link users to teams (coaches/players)** - Connect user accounts to teams with roles
  - **Schema change**: Create new `teamMemberships` table:
    ```
    teamMemberships: {
      teamId: v.id("teams"),
      userId: v.id("users"),
      role: v.union(v.literal("coach"), v.literal("assistant"), v.literal("player"), v.literal("manager")),
      status: v.union(v.literal("active"), v.literal("pending"), v.literal("removed")),
      playerId: v.optional(v.id("players")), // Link to player record if role is "player"
      joinedAt: v.number(),
    }
    ```
  - **Backend**: Create `convex/teamMemberships.ts` with CRUD functions
  - **Web UI**:
    - Add "Team Staff" section to `TeamDetail.tsx` showing coaches/managers
    - Add "Manage Team Members" modal for admins
    - Show user avatars and roles in roster section
  - **Mobile UI**: Similar sections on team detail screen
  - **Invitation flow**: Allow inviting users by email to join team with specific role

### Game Enhancements

- [ ] **YouTube video embedding in game page** - Embed live or recorded game videos
  - **Schema change**: Add `videoUrl` (optional string) field to `games` table in `convex/schema.ts`
  - **Backend**: Update `convex/games.ts` create/update mutations to accept video URL
  - **Web UI**:
    - Add video URL input when creating/editing games
    - In `GameAnalysis.tsx`, display embedded YouTube player if videoUrl exists
    - Support YouTube live streams and regular videos
    - Use responsive embed (16:9 aspect ratio)
  - **Mobile UI**:
    - Add video URL input to game creation
    - In game analysis, show YouTube embed or link to open in YouTube app
  - **URL parsing**: Extract YouTube video ID from various URL formats (youtube.com/watch, youtu.be, etc.)
  - **Position**: Place video above or alongside the game analysis content

### Permissions & Access Control

- [ ] **Role-based permissions (team level)** - Extend permission system to team-specific access
  - **Current state**: League-level permissions exist in `leagueMemberships` table with roles: admin, coach, scorekeeper, member, viewer
  - **Backend changes** (`convex/lib/auth.ts`):
    - Add `canEditTeam(userId, teamId)` - owner, league admin, or team coach
    - Add `canScoreGame(userId, gameId)` - owner, admin, coach, or scorekeeper
    - Add `canViewTeamDetails(userId, teamId)` - any league member
    - Add `isTeamCoach(userId, teamId)` - check teamMemberships
  - **Web UI**:
    - Hide edit/delete buttons for teams if user lacks permission
    - Hide "Track Game" button if not scorekeeper/coach/admin
    - Show "View Only" badge for viewers
  - **Mobile UI**: Same permission checks
  - **Integration**: Wire permission checks to existing mutations (updateTeam, deleteTeam, recordStat, etc.)

### Cross-Promotion

- [ ] **Link related apps** - Promote calendariofpb.pt and basketballvideoanalyzer.com
  - **Sites owned**:
    - `calendariofpb.pt` - FPB calendar (Portuguese basketball federation schedule)
    - `basketballvideoanalyzer.com` - Basketball video analysis tool
  - **Integration opportunities**:
    - Add "Related Tools" section to `AboutPage.tsx` with links and descriptions
    - Add footer links in `PublicLayout.tsx` to related apps
    - In game analysis, add "Analyze with Video Analyzer" call-to-action linking to basketballvideoanalyzer.com
    - Consider deep linking: pass game ID or stats to video analyzer if APIs align
  - **Footer**: Add "More Tools" or "By the same team" section with links
  - **SEO**: Cross-link in schema.org structured data where appropriate

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

## Recently Completed (January 28, 2026)

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
