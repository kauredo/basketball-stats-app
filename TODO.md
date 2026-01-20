# Basketball Stats App - TODO

> Last audit: January 2026

---

## P0 - Critical Issues

### Shared/Backend

- [x] **Removed unused API config** - ~~`shared/src/constants/basketball.ts` had API_CONFIG and WEBSOCKET_EVENTS~~ Removed: App uses Convex directly, no REST API needed.
- [x] **Untyped gameSettings** - ~~`convex/schema.ts` uses `v.any()` for gameSettings~~ Fixed: Added proper typed schema with all game settings fields.

### Web

- [x] **Game Analysis page is a stub** - ~~`web/.../pages/GameAnalysis.tsx` shows only placeholder text.~~ Fixed: Full implementation with box scores, team comparison charts, shooting stats, and play-by-play log with quarter filtering.
- [x] **Edit/Delete Team buttons broken** - ~~`web/.../pages/Teams.tsx` renders edit/delete buttons with no onClick handlers.~~ Fixed: Added full edit/delete modals with mutations.
- [x] **Edit/Delete Player missing** - ~~No way to edit or delete players from web UI.~~ Fixed: Added edit/delete buttons and modals to Players page.

### Mobile

- [x] **Recent games hardcoded empty** - ~~`mobile/.../screens/PlayerStatsScreen.tsx` has `recentGames` as empty array~~ Fixed: Backend now returns player's recent game log in `getPlayerSeasonStats`.
- [x] **Touch selector rendering wrong** - ~~Court touch location registers correctly but renders in wrong position~~ Fixed: Corrected `getShotZone` coordinate system and added `is3pt` to persisted shots.

---

## P1 - High Priority

### Web

- [x] **Notification click does nothing** - ~~`web/.../components/NotificationBell.tsx` has TODO for navigation.~~ Fixed: Added navigation based on notification type (games, stats, teams).
- [x] **"View Stats" button broken** - ~~Player cards in `web/.../pages/Players.tsx` have View Stats button that doesn't navigate.~~ Fixed: Now navigates to shot charts with player pre-selected.
- [x] **No success/error toasts** - ~~Game/team/player creation has no user feedback.~~ Fixed: Added ToastContext with success/error/info/warning toasts. Integrated into Teams, Players, and Games pages.
- [x] **No player detail page** - ~~Cannot view individual player stats~~ Fixed: Added PlayerDetail page with route `/players/:playerId`.
- [x] **Live screen court cutoff** - ~~Court is too big and gets cut off~~ Fixed: Added overflow-hidden and proper constraints to court containers.

### Mobile

- [x] **No notification system** - ~~Mobile has no notification bell, inbox, or preferences.~~ Fixed: Added NotificationContext, NotificationBell component, and NotificationsScreen. Bell icon in Home tab header shows unread count.
- [x] **Duplicate player stats screens** - ~~`PlayerStatsScreen.tsx` and `PlayerStatisticsScreen.tsx` duplicated~~ Fixed: Removed unused `PlayerStatisticsScreen.tsx`.
- [x] **Notification toggles don't persist** - ~~Settings screen toggles were local state only~~ Fixed: Now loads/saves preferences via `api.notifications` endpoints.
- [x] **No dedicated Standings screen** - ~~Only available as tab in Statistics.~~ Fixed: Added dedicated StandingsScreen with detailed team stats, export functionality, and navigation from Statistics tab.
- [x] **VirtualizedList nesting error** - ~~"Plays" tab shows console error~~ Already fixed: PlayByPlayTab renders outside ScrollView.
- [x] **Landscape view cutoff** - ~~Live game in landscape mode cut off~~ Fixed: Adjusted ScrollView flexGrow and MiniCourt sizing for landscape.
- [x] **Could not end period** - ~~Issue ending period in live game~~ Fixed: `setQuarter` now allows overtime periods (>4) and uses overtime minutes.
- [x] **Statistics tab styling inconsistent** - ~~Statistics tab and settings header look different from rest of app.~~ Fixed: Removed duplicate custom header from StatisticsScreen, now uses navigator header like other screens.

### Backend

- [ ] **Push notifications not wired** - `convex/notifications.ts` has infrastructure but `sendPushNotification()` returns null. Complete implementation.
- [x] **Team owner permission** - ~~Team owner can update team without being league admin~~ Verified: Intentional design - team owners should be able to edit their own teams.
- [x] **Missing shot chart indices** - ~~No `by_made` or `by_zone` indices~~ Fixed: Added `by_player_made`, `by_player_zone`, and `by_team_zone` indices.

---

## P2 - Medium Priority

### Web

- [x] **No form validation feedback** - ~~Team/player forms accept invalid data without real-time validation.~~ Fixed: Added validation to Teams.tsx (team name, player name, jersey number) and Players.tsx (player name, jersey number) with error states and messages.
- [x] **Sort state not persisted** - ~~Standings and Statistics sorting resets on page refresh.~~ Fixed: Added URL search params persistence for sort state and active tab in Statistics and Standings pages.
- [ ] **No breadcrumb navigation** - Easy to get lost in deep pages.
- [x] **Error messages generic** - ~~"Failed to create team" doesn't explain why.~~ Fixed: Added error utility to extract meaningful messages from Convex errors. Updated Teams, Players, and Games pages.
- [ ] **Charts hardcoded** - Radar chart only shows top 3 players, no customization.
- [ ] **No pagination** - Standings and statistics tables load all data at once.
- [x] **Foul out logic** - ~~`LiveGameNew.tsx` checks `fouls >= foulLimit - 1`~~ Verified correct: query data shows BEFORE count, so `-1` compensates.

### Mobile

- [x] **Player list fetched inefficiently** - ~~`PlayerComparisonScreen.tsx` and `ShotChartScreen.tsx` build player list by iterating teams instead of using `api.players.list`.~~ Fixed: Both screens now use direct `api.players.list` query.
- [x] **Team logos not displayed** - ~~`logoUrl` exists in schema but never rendered in Teams list.~~ Fixed: Added team logo display in TeamsScreen with fallback icon.
- [x] **No team edit capability** - ~~Cannot edit team details from mobile.~~ Fixed: Added edit/delete options menu and edit modal to TeamDetailScreen.
- [x] **No player edit capability** - ~~Cannot edit player details from mobile.~~ Fixed: Added edit/delete options menu and edit modal to PlayerStatsScreen.
- [x] **Settings should be in Profile** - ~~Settings currently in Dashboard, should move to Profile tab.~~ Fixed: Integrated theme and notification settings directly into ProfileScreen, removed separate Settings navigation.
- [ ] **No calendar date picker** - Game creation uses +/- buttons instead of proper date picker.
- [ ] **No loading skeletons** - Most screens show "Loading..." text instead of proper skeletons.

### Both Apps

- [ ] **Starting lineup selection** - Need to set starting 5 before game starts (partially implemented).
- [ ] **Heatmaps verification** - Verify heatmaps are working as expected on both platforms.
- [ ] **No offline support** - Neither app works offline.
- [ ] **No image/avatar upload** - Players and users cannot upload photos.
- [ ] **Stale season averages** - Player stats not recalculated in real-time.

### Backend

- [ ] **Game events no public query** - `gameEvents` table logged but no query endpoint for play-by-play viewing.
- [ ] **Rebound tracking inconsistent** - Player rebounds vs team rebounds tracked differently.
- [ ] **No cascade delete** - Deleting league/team can leave orphaned records.

---

## P3 - Low Priority / Enhancements

### Web

- [ ] **No dark mode persistence verification** - Theme preference may not persist across sessions.
- [ ] **Mobile responsiveness** - Grid columns may stack awkwardly on small screens.
- [ ] **Accessibility (a11y)** - Missing ARIA labels, keyboard navigation, focus management.
- [ ] **No undo outside live game** - Only live game has undo capability.
- [ ] **Export only player stats** - CSV export doesn't include team stats.

### Mobile

- [ ] **No advanced analytics** - Missing PER, TS%, and other advanced metrics.
- [ ] **No game replay** - Cannot review plays after game.
- [ ] **No multi-player radar charts** - Comparison limited to 2 players.
- [ ] **Shot clock not integrated** - Shot clock is local state, doesn't sync with game clock.
- [ ] **No halftime indicator** - No visual break between Q2 and Q3.
- [ ] **Export may timeout** - Large dataset CSV export may fail.

### Backend

- [ ] **No input limits** - Description fields have no character limits.
- [ ] **No duplicate prevention** - Can create duplicate teams/players.
- [ ] **Viewer role unused** - "viewer" role defined but never specifically checked.

---

## Feature Parity Checklist

| Feature            | Web | Mobile | Action Needed       |
| ------------------ | --- | ------ | ------------------- |
| Dashboard          | ✅  | ✅     | -                   |
| Games List         | ✅  | ✅     | -                   |
| Create Game        | ✅  | ✅     | -                   |
| Live Game          | ✅  | ✅     | -                   |
| Teams List         | ✅  | ✅     | -                   |
| Create Team        | ✅  | ✅     | -                   |
| Edit Team          | ✅  | ✅     | -                   |
| Delete Team        | ✅  | ✅     | -                   |
| Players List       | ✅  | ✅     | -                   |
| Create Player      | ✅  | ✅     | -                   |
| Edit Player        | ✅  | ✅     | -                   |
| Delete Player      | ✅  | ✅     | -                   |
| Player Detail      | ✅  | ✅     | -                   |
| Statistics         | ✅  | ✅     | -                   |
| Standings          | ✅  | ✅     | -                   |
| Shot Charts        | ✅  | ✅     | -                   |
| Player Comparison  | ✅  | ✅     | -                   |
| Game Analysis      | ✅  | ❌     | Implement mobile    |
| Notifications Bell | ✅  | ✅     | -                   |
| Notification Prefs | ✅  | ✅     | -                   |
| Profile/Settings   | ✅  | ✅     | -                   |
| League Selection   | ✅  | ✅     | -                   |
| League Management  | ❌  | ❌     | Implement both      |
| CSV Export         | ✅  | ✅     | -                   |
| Print/PDF          | ✅  | ❌     | Consider for mobile |
| Dark Mode          | ✅  | ✅     | -                   |
| Haptic Feedback    | ❌  | ✅     | Consider for web    |
| Sound Feedback     | ❌  | ✅     | Consider for web    |

---

## Notes

### Architecture Decisions Needed

1. Should we consolidate the two mobile player stats screens?
2. Should notifications be real-time (WebSocket) or polling?
3. Should we add offline-first capability with sync?
4. Should league management be admin-only or available to all?

### Performance Considerations

1. Add pagination to large tables (standings, statistics)
2. Add query caching for repeated data fetches
3. Optimize shot chart queries with proper indices
4. Consider lazy loading for charts

---

## Completed Items

### January 2026

- [x] **Hardcoded API IP** - Changed from `192.168.1.55` to `localhost` with environment variable support
- [x] **API Config with env vars** - Added `getApiConfig()` helper function and updated .env files for web and mobile
- [x] **Removed unused API config** - Removed API_CONFIG and WEBSOCKET_EVENTS since app uses Convex directly
- [x] **Edit/Delete Team buttons (Web)** - Added working edit modal and delete confirmation with backend mutations
- [x] **Edit/Delete Player (Web)** - Added edit modal with all fields and delete confirmation
- [x] **Notification click navigation (Web)** - Notifications now navigate to games, stats, or teams based on type
- [x] **View Stats button (Web)** - Player cards now navigate to shot charts with player pre-selected
- [x] **Game Analysis page (Web)** - Full implementation with box scores, team comparison charts, shooting percentages, and play-by-play with quarter filtering
- [x] **Typed gameSettings schema (Backend)** - Replaced `v.any()` with proper typed schema for all game settings
- [x] **Recent games on mobile** - Added player game log data to `getPlayerSeasonStats` query
- [x] **Court touch rendering (Mobile)** - Fixed `getShotZone` coordinate system and added `is3pt` to persisted shots
- [x] **Shot chart indices (Backend)** - Added `by_player_made`, `by_player_zone`, `by_team_zone` indices to shots table
- [x] **Live screen court cutoff (Web)** - Added overflow-hidden and proper constraints to court containers
- [x] **Duplicate player stats screens (Mobile)** - Removed unused `PlayerStatisticsScreen.tsx`
- [x] **Foul out logic** - Verified current implementation is correct (checks BEFORE count with `-1` offset)
- [x] **VirtualizedList nesting (Mobile)** - Already fixed: PlayByPlayTab renders outside ScrollView
- [x] **Notification toggles persistence (Mobile)** - Now loads/saves preferences via backend API
- [x] **Team owner permission (Backend)** - Verified: Intentional design for team owners to edit their teams
- [x] **Could not end period (Mobile)** - Fixed `setQuarter` to allow overtime periods and use overtime minutes
- [x] **Landscape view cutoff (Mobile)** - Adjusted ScrollView and MiniCourt sizing for landscape mode
- [x] **Player detail page (Web)** - Added PlayerDetail page with stats, recent games, and quick links
- [x] **Toast notifications (Web)** - Added ToastContext with success/error/info/warning toasts for Teams, Players, and Games pages
- [x] **Statistics tab styling (Mobile)** - Removed duplicate header from StatisticsScreen, now uses navigator header consistently
- [x] **Dedicated Standings screen (Mobile)** - Added StandingsScreen with detailed stats, export, and expandable team rows
- [x] **Notification system (Mobile)** - Added NotificationContext, NotificationBell component with unread count badge, and NotificationsScreen with full inbox
- [x] **Team edit/delete (Mobile)** - Added options menu and edit modal to TeamDetailScreen with full CRUD support
- [x] **Player edit/delete (Mobile)** - Added options menu and edit modal to PlayerStatsScreen with full CRUD support
- [x] **Player list fetch efficiency (Mobile)** - PlayerComparisonScreen and ShotChartScreen now use direct `api.players.list` query
- [x] **Form validation feedback (Web)** - Added validation to Teams.tsx and Players.tsx with error states, messages, and disabled submit buttons
- [x] **Settings in Profile tab (Mobile)** - Integrated theme toggle, notification preferences, and app info directly into ProfileScreen
- [x] **Team logos display (Mobile)** - Added team logo images with fallback icons in TeamsScreen
- [x] **Sort state persistence (Web)** - Statistics and Standings pages now persist sort state via URL search params
- [x] **Improved error messages (Web)** - Added getErrorMessage utility to extract meaningful messages from Convex errors
