# Basketball Stats App - TODO

> Last audit: January 20, 2026

---

## P0 - Critical Issues

*All P0 issues resolved*

---

## P1 - High Priority

### Backend

- [ ] **Push notifications not wired** - `convex/notifications.ts` has infrastructure but `sendPushNotification()` returns null. Complete implementation.

---

## P2 - Medium Priority

*All P2 issues resolved*

---

## P3 - Low Priority / Enhancements

### Web

- [ ] **Unused ArrowLeftIcon import** - `LiveGameLayout.tsx:94-102` imports ArrowLeftIcon but uses XMarkIcon. Clean up.

- [ ] **PlayerAvatar alt text could be enhanced** - Use "Profile photo of {name}" instead of just name. `/clarify`

- [ ] **No dark mode persistence verification** - Theme preference may not persist across sessions.

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
| Game Analysis      | ✅  | ✅     | -                   |
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

## Recently Completed (January 20, 2026)

### P1/P2 Fixes
- [x] **Mobile responsive sidebar** - Added hamburger menu, slide-out drawer, overlay backdrop, and escape key handling to Layout.tsx
- [x] **Theme toggle aria-labels** - Changed from "Light" to "Switch to light theme" for better screen reader clarity
- [x] **animate-bounce investigation** - Verified Tailwind's bounce uses `transform: translateY()` (GPU-accelerated). No fix needed; issue was incorrectly identified.

### /harden - Accessibility & Edge Cases
- [x] **Modal focus traps** - Added `useFocusTrap` hook and applied to QuickStatModal, AssistPromptModal, ReboundPromptModal, FoulRecordingModal, ShotRecordingModal
- [x] **ARIA attributes** - Added `role="dialog"`, `aria-modal`, `aria-labelledby` to all modals
- [x] **QuarterFilterTabs touch targets** - Increased to `min-h-[44px] min-w-[44px]` with proper ARIA tablist
- [x] **TeamBoxScore table accessibility** - Added `scope`, `caption`, `aria-label` for stat abbreviations
- [x] **Skip links** - Added "Skip to main content" to Layout and PublicLayout
- [x] **Form error announcements** - Added `aria-live="polite"` to LoginForm, SignupForm, ForgotPasswordForm
- [x] **InteractiveCourt SVG** - Added `role="application"` and descriptive `aria-label`
- [x] **User menu keyboard nav** - Added arrow key navigation, escape handling, proper ARIA menu attributes
- [x] **Features grid** - Changed div to article for proper semantics
- [x] **Mobile haptics fallback** - Wrapped `Haptics.impactAsync` in try-catch

### /normalize - Design System Alignment
- [x] **Dynamic Tailwind classes** - Replaced `bg-${color}-100` with static STAT_STYLES mapping in QuickStatModal and LiveGame.tsx
- [x] **Status color tokens** - Replaced hex colors with Tailwind classes (`bg-red-500`, `bg-amber-500`, etc.) in Dashboard.tsx and Games.tsx
- [x] **Duplicate CSS keyframes** - Removed fadeIn/slideIn duplicates from index.css, consolidated in tailwind.config.js

---

## Fix Commands Quick Reference

| Command | Remaining | Description |
|---------|-----------|-------------|
| `/clarify` | 1 | PlayerAvatar alt text |
