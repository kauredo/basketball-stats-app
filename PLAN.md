# Implementation Plan: Complete TODO Backlog

> Generated: January 26, 2026

This plan addresses all items from TODO.md across backend, web, and mobile platforms.

---

## Phase 1: Quick Fixes (P3 - Minimal effort)

### 1.1 Remove unused ArrowLeftIcon import

- **File:** `web/basketball-stats-web/src/components/livegame/layout/LiveGameLayout.tsx`
- **Change:** Remove `ArrowLeftIcon` from heroicons import on line 3

### 1.2 Enhance PlayerAvatar alt text

- **File:** `web/basketball-stats-web/src/components/PlayerAvatar.tsx`
- **Change:** Update alt from `{name || "Player"}` to `"Profile photo of {name}#{number}"` pattern
- **Lines:** ~72

### 1.3 Dark Mode Persistence

- **Status:** Already working correctly via localStorage with key `basketball_theme`
- **Action:** Remove from TODO (verified functional)

---

## Phase 2: Backend Hardening (P3)

### 2.1 Add input validation limits

**Files:**

- `convex/schema.ts` - Add string length constraints
- `convex/teams.ts` - Validate in create/update mutations
- `convex/players.ts` - Validate in create/update mutations
- `convex/leagues.ts` - Validate in create/update mutations

**Validation rules:**

```
name: max 100 characters
description: max 2000 characters
notes: max 5000 characters
```

**Implementation:** Add validation helper in `convex/lib/validation.ts`:

```typescript
export function validateStringLength(value: string, max: number, field: string) {
  if (value.length > max) {
    throw new Error(`${field} must be ${max} characters or less`);
  }
}
```

### 2.2 Add duplicate prevention

**Teams:** Already checking duplicate names within league (done)
**Players:** Already checking duplicate jersey numbers within team (done)

**Add:**

- League name uniqueness check per owner in `convex/leagues.ts` create/update
- Player name + team uniqueness (soft warning, not block)
- Email case normalization in `convex/auth.ts`

### 2.3 Implement viewer role permissions

**File:** `convex/leagues.ts`

**Add explicit permission:**

```typescript
canViewOnly: membership.role === "viewer",
```

**Update permission checks** to explicitly handle viewer:

- Viewers can: view games, view stats, view standings, view teams
- Viewers cannot: create/edit/delete anything, record stats, manage members

---

## Phase 3: Export Enhancements (P3)

### 3.1 Add team stats to CSV export

**Files:**

- `web/basketball-stats-web/src/pages/TeamDetail.tsx` - Add export button
- Wire up existing `exportLineupStatsCSV()` and `exportPairStatsCSV()` functions

**UI Changes:**

- Add "Export Stats" dropdown to team detail page header
- Options: Team Roster, Lineup Stats, Pair Stats, Shooting Breakdown

### 3.2 Handle export timeouts (Mobile)

**File:** `mobile/BasketballStatsMobile/src/components/export/ExportOptionsSheet.tsx`

**Changes:**

- Add loading state during export redirect
- Configure actual web app URL (currently placeholder)
- Add timeout warning for large datasets
- Consider chunked export for very large game histories

---

## Phase 4: Mobile Analytics & Features (P3)

### 4.1 Add advanced analytics (PER, A/TO)

**File:** `mobile/BasketballStatsMobile/src/components/livegame/AdvancedStats.tsx`

**Add metrics:**

- PER (Player Efficiency Rating) - use `BasketballUtils.playerEfficiencyRating()`
- A/TO (Assist-to-Turnover) ratio - calculate as `assists / Math.max(turnovers, 1)`

**Layout:** Add new rows/cards for these metrics with same styling pattern

### 4.2 Multi-player radar charts

**File:** `mobile/BasketballStatsMobile/src/screens/PlayerComparisonScreen.tsx`

**Current:** 2-player comparison with bar charts only

**Changes:**

1. Install `victory-native` for React Native radar charts
2. Add player selector supporting 2-4 players
3. Create custom radar chart component using victory-native
4. Dynamic color palette: orange, blue, green, purple
5. Legend showing player names

### 4.3 Shot clock integration with game clock

**Files:**

- `mobile/BasketballStatsMobile/src/contexts/LiveGameContext.tsx` - Add shot clock state
- `mobile/BasketballStatsMobile/src/components/livegame/ShotClock.tsx` - Wire to context

**Logic:**

- Reset shot clock to 24s on: made basket, change of possession, certain fouls
- Pause shot clock when game clock pauses
- Sync shot clock violations with game events

**New context state:**

```typescript
shotClockSeconds: number;
shotClockRunning: boolean;
resetShotClock: () => void;
```

### 4.4 Halftime indicator

**Files:**

- `mobile/BasketballStatsMobile/src/components/livegame/QuarterDisplay.tsx` (create new)
- `mobile/BasketballStatsMobile/src/screens/LiveGameScreen.tsx` - Integrate

**Features:**

- Visual "HALFTIME" banner between Q2 and Q3
- Optional halftime break timer
- Halftime stats summary modal

### 4.5 Game replay

**Files:**

- `mobile/BasketballStatsMobile/src/screens/GameReplayScreen.tsx` (new)
- `mobile/BasketballStatsMobile/src/navigation/AppNavigator.tsx` - Add route

**Features:**

- Timeline scrubber showing all game events
- Play-by-play list with timestamps
- Shot chart animation showing shots in sequence
- Score progression graph
- Navigate to any point in game

---

## Phase 5: League Management (Feature Parity - Both Platforms)

### 5.1 Web: Leagues Management Page

**New file:** `web/basketball-stats-web/src/pages/Leagues.tsx`

**Components:**

- League cards grid (name, type, member count, status badge)
- Create league modal (name, type, description, privacy)
- Edit league modal
- Delete confirmation modal

**Integration:**

- Add route `/app/leagues` in `App.tsx`
- Add "Leagues" link in sidebar `Layout.tsx`
- Use existing `api.leagues.*` mutations

### 5.2 Mobile: Leagues Management Screens

**New files:**

- `mobile/BasketballStatsMobile/src/screens/LeaguesScreen.tsx`
- `mobile/BasketballStatsMobile/src/screens/CreateLeagueScreen.tsx`

**Features:**

- FlatList of user's leagues
- Create league form (full screen)
- Navigate to league settings/members
- Empty state with CTA

**Navigation:**

- Add to `AppNavigator.tsx`
- Accessible from Profile/Settings or dedicated tab

---

## Phase 6: Push Notifications (P1 - Highest Priority)

### 6.1 Generate and configure VAPID keys

```bash
npx web-push generate-vapid-keys
```

Store in Convex environment variables:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (mailto: or https:// URL)

### 6.2 Implement sendPushNotification action

**File:** `convex/notifications.ts`

```typescript
export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // 1. Get user's push subscriptions
    // 2. Configure web-push with VAPID
    // 3. Send to each subscription endpoint
    // 4. Handle 410 Gone (remove invalid subscriptions)
  },
});
```

### 6.3 Wire up getVapidPublicKey query

**File:** `convex/notifications.ts` (line 567-576)

- Return actual VAPID public key from environment

### 6.4 Integrate with game workflows

**File:** `convex/games.ts`

Add notification triggers:

- `startGame()` → notify league members with `game_start`
- `endGame()` → notify with `game_end`
- Score milestones → notify with `score_update`
- Scheduled game reminders (cron job)

### 6.5 Mobile Expo Push Integration

**Files:**

- `mobile/BasketballStatsMobile/app.json` - Add expo-notifications plugin
- `mobile/BasketballStatsMobile/src/contexts/NotificationContext.tsx` - Add push registration

**Steps:**

1. `npx expo install expo-notifications`
2. Configure app.json with notification settings
3. Request push permission on app launch
4. Get Expo push token and store in backend
5. Create `expoPushTokens` table in Convex schema
6. Implement Expo push sending in backend action

---

## Phase 7: Cross-Platform Feature Parity (Optional)

### 7.1 Print/PDF for Mobile

**Decision needed:** Mobile currently redirects to web for PDF generation.

**Options:**
A. Keep as-is (web handles PDF) - Recommended
B. Implement native PDF using `expo-print` + `expo-sharing`

**Recommendation:** Keep delegation to web - PDF generation is complex and web does it well.

### 7.2 Haptic/Sound Feedback for Web

**Decision needed:** Mobile has haptic/sound on stat recording.

**Options:**
A. Skip - desktop doesn't benefit from haptics
B. Add subtle sound effects using Web Audio API
C. Add vibration API for touch devices

**Recommendation:** Add optional sound effects toggle in web settings.

---

## Implementation Order

```
Phase 1 (Quick Fixes)     → 30 min
Phase 2 (Backend)         → 2-3 hours
Phase 3 (Exports)         → 1-2 hours
Phase 4 (Mobile Features) → 6-8 hours
Phase 5 (League Mgmt)     → 4-6 hours
Phase 6 (Push Notifs)     → 4-6 hours
Phase 7 (Optional)        → 1-2 hours
```

**Recommended start:** Phase 1 → Phase 2 → Phase 6 (P1 priority) → Phase 5 → Phase 3 → Phase 4 → Phase 7

---

## Files to Create

| File                                                | Platform | Purpose                    |
| --------------------------------------------------- | -------- | -------------------------- |
| `convex/lib/validation.ts`                          | Backend  | Input validation helpers   |
| `web/.../pages/Leagues.tsx`                         | Web      | League management page     |
| `mobile/.../screens/LeaguesScreen.tsx`              | Mobile   | League list screen         |
| `mobile/.../screens/CreateLeagueScreen.tsx`         | Mobile   | Create league form         |
| `mobile/.../screens/GameReplayScreen.tsx`           | Mobile   | Game replay viewer         |
| `mobile/.../components/livegame/QuarterDisplay.tsx` | Mobile   | Quarter/halftime indicator |

## Files to Modify

| File                                    | Changes                                            |
| --------------------------------------- | -------------------------------------------------- |
| `convex/notifications.ts`               | Implement sendPushNotification, getVapidPublicKey  |
| `convex/games.ts`                       | Add notification triggers                          |
| `convex/schema.ts`                      | Add expoPushTokens table, string length validators |
| `convex/leagues.ts`                     | Add duplicate check, viewer permissions            |
| `convex/teams.ts`                       | Add input validation                               |
| `convex/players.ts`                     | Add input validation                               |
| `web/.../App.tsx`                       | Add /leagues route                                 |
| `web/.../Layout.tsx`                    | Add Leagues nav link                               |
| `web/.../LiveGameLayout.tsx`            | Remove unused import                               |
| `web/.../PlayerAvatar.tsx`              | Enhance alt text                                   |
| `web/.../TeamDetail.tsx`                | Add export buttons                                 |
| `mobile/.../app.json`                   | Add expo-notifications                             |
| `mobile/.../AppNavigator.tsx`           | Add new screens                                    |
| `mobile/.../NotificationContext.tsx`    | Add push token registration                        |
| `mobile/.../AdvancedStats.tsx`          | Add PER, A/TO metrics                              |
| `mobile/.../PlayerComparisonScreen.tsx` | Add radar chart, multi-player                      |
| `mobile/.../ShotClock.tsx`              | Wire to context                                    |
| `mobile/.../LiveGameContext.tsx`        | Add shot clock state                               |
