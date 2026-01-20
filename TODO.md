# Basketball Stats App - TODO

> Last audit: January 20, 2026

---

## P0 - Critical Issues

### Web

- [ ] **Dynamic Tailwind classes don't compile** - `QuickStatModal.tsx:83`, `LiveGame.tsx:806,836` use `` `bg-${color}-100` `` which Tailwind purges at build time. Colors don't render. **Fix**: Create color mapping object with static class names. `/normalize`

- [ ] **Modal focus trap missing** - `QuickStatModal.tsx`, `AssistPromptModal.tsx`, `ReboundPromptModal.tsx` lack focus trapping. Users can tab to elements behind modal overlay. WCAG 2.4.3 violation. **Fix**: Implement focus trap using `focus-trap-react`. `/harden`

---

## P1 - High Priority

### Web

- [ ] **QuarterFilterTabs touch targets too small** - `QuarterFilterTabs.tsx:33` uses `px-2 py-1` (~28x24px), below 44px minimum. **Fix**: Increase to `min-h-[44px] min-w-[44px]` or `py-2.5 px-3`. `/harden`

- [ ] **Box score table missing accessibility** - `TeamBoxScore.tsx:73-188` lacks `<caption>`, `scope` attributes on headers, `aria-describedby` for stat abbreviations. WCAG 1.3.1 violation. **Fix**: Add `scope="col"` to headers, caption, aria-labels for abbreviations. `/harden`

- [ ] **110 hard-coded hex colors** - `Dashboard.tsx`, `Games.tsx`, `Statistics.tsx`, `ShotChart.tsx`, `InteractiveCourt.tsx` and 6 more files use hex colors like `#EF4444` instead of theme tokens. **Fix**: Replace with Tailwind design tokens. `/normalize`

- [ ] **Sidebar has no mobile responsive variant** - `Layout.tsx:61` uses fixed `w-64`, no hamburger menu for mobile. **Fix**: Add responsive collapse with hamburger for `md:` breakpoint. `/adapt`

- [ ] **QuickStatModal missing role="dialog"** - `QuickStatModal.tsx:50` lacks `role="dialog"` and `aria-modal="true"`. WCAG 4.1.2 violation. **Fix**: Add proper ARIA attributes. `/harden`

- [ ] **Loading states may not respect reduced-motion** - `Dashboard.tsx:163-211` skeletons use `animate-pulse`. Verify CSS media query covers all cases. `/harden`

### Backend

- [ ] **Push notifications not wired** - `convex/notifications.ts` has infrastructure but `sendPushNotification()` returns null. Complete implementation.

---

## P2 - Medium Priority

### Web

- [ ] **User menu dropdown not keyboard accessible** - `Layout.tsx:134-186` opens on click but lacks arrow key navigation. **Fix**: Implement roving tabindex or use headless UI library. `/harden`

- [ ] **Interactive court SVG missing accessible name** - `InteractiveCourt.tsx:186-418` lacks `role="img"` and `aria-label`. **Fix**: Add `role="application" aria-label="Interactive basketball court for recording shots"`. `/harden`

- [ ] **Theme toggle could be more descriptive** - `Layout.tsx:84-99` uses `aria-label={option.label}` but "Switch to light theme" would be clearer. `/clarify`

- [ ] **Form validation errors not announced** - `SignupForm.tsx`, `LoginForm.tsx`, `ForgotPasswordForm.tsx` need `aria-live="polite"` on error containers. WCAG 3.3.1. `/harden`

- [ ] **animate-bounce causes layout recalculation** - 12 files use `animate-bounce` on loaders. **Fix**: Use `animate-pulse` or transform-based animation. `/optimize`

- [ ] **No skip link for main content** - `Layout.tsx`, `PublicLayout.tsx` missing "Skip to main content" link. WCAG 2.4.1 violation. **Fix**: Add visually hidden skip link. `/harden`

- [ ] **Features grid focus ring never shows** - `Features.tsx:63-88` has `focus-within:ring-2` but cards aren't focusable. `/harden`

- [ ] **LiveGame layout gradient uses inline styles** - `LiveGameLayout.tsx:83-90` complex gradient should be in CSS/Tailwind for dark mode support. `/normalize`

### Mobile

- [ ] **StatButton haptics without fallback** - `mobile/.../StatButton.tsx:43` calls `Haptics.impactAsync` without checking device capability. **Fix**: Wrap in try-catch or check `Haptics.isAvailableAsync()`. `/harden`

---

## P3 - Low Priority / Enhancements

### Web

- [ ] **Duplicate CSS keyframes** - `tailwind.config.js:71-86` and `index.css:66-86` both define `fadeIn` and `slideIn`. Remove CSS duplicates. `/optimize`

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

## Systemic Patterns to Address

| Pattern | Occurrences | Fix Command |
|---------|-------------|-------------|
| Hard-coded hex colors | 110+ | `/normalize` |
| Dynamic Tailwind classes | 3 | `/normalize` |
| Modals missing focus trap | 4 of 6 | `/harden` |
| Touch targets < 44px | ~5 components | `/harden` |
| Tables missing scope/headers | 1+ | `/harden` |

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

## Fix Commands Quick Reference

| Command | Issues | Description |
|---------|--------|-------------|
| `/harden` | 12 | Accessibility, edge cases, keyboard nav |
| `/normalize` | 4 | Theme tokens, design system alignment |
| `/adapt` | 1 | Responsive sidebar |
| `/optimize` | 2 | Animations, bundle size |
| `/clarify` | 2 | Copy, labels |
