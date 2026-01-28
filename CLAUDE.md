# Claude Code Guide

## Design Context

### Users

Basketball coaches, scorekeepers, and players who need to track game statistics in real-time. They use the app during live games (high pressure, fast-paced environment) and for post-game analysis (reflective, detail-oriented). The primary job: record stats quickly and accurately during games, then gain insights to improve team performance.

### Brand Personality

**Professional, Accessible, Clean**

The interface should feel like a trusted tool for serious basketball work—reliable and precise—while remaining approachable enough that volunteer scorekeepers can use it without training. No unnecessary complexity, no frivolous decoration. Every element earns its place.

### Emotional Goals

- **Control & Focus**: During live games, users should feel calm and in command despite the chaos around them. The interface is their control center.
- **Confidence & Clarity**: Data presented should feel trustworthy. Clear hierarchy, no ambiguity about what numbers mean.
- **Speed & Efficiency**: Zero friction for common actions. Recording a basket should take one tap, not three.

### Aesthetic Direction

**Modern Sports Professional** — Draws inspiration from the NBA official app's data density and Notion/Linear's clean, functional minimalism.

**Visual tone**: Clean lines, purposeful whitespace, confident typography. Sports-informed but not sports-cliché. Orange (#F97316) as primary accent captures basketball energy without overwhelming.

**References**:

- NBA app: Professional league-standard feel, stats-heavy, authoritative
- Notion/Linear: Minimal, functional, respects user intelligence

**Anti-references** (explicitly avoid):

- Cluttered sports websites with overwhelming information density
- Generic SaaS dashboards with no personality
- Overly playful or gamified interfaces that undermine credibility
- Dated 2000s sports aesthetics (gradients, bevels, busy backgrounds)

### Theme

Both light and dark modes supported, switching based on system preference with manual toggle. Dark mode is optimized for gym/arena environments with low ambient light. Neither mode is "secondary"—both should feel intentional.

### Design Principles

1. **Clarity Over Density**
   Show exactly what's needed, when it's needed. During live tracking, hide analytical views. During analysis, surface deep data. Progressive disclosure over information overload.

2. **Speed Is Respect**
   Every tap, every second matters during a live game. Design for one-handed operation, generous touch targets, and instant feedback. If an action takes more than 2 taps, question it.

3. **Data Confidence**
   Numbers are why users are here. Use clear typographic hierarchy, consistent formatting, and honest precision. Don't round 47.6% to 48%—accuracy builds trust.

4. **Quiet Until Active**
   The interface should recede when idle and respond with clarity when engaged. Subtle resting states, confident active states. Live game indicators pulse; everything else breathes.

5. **Sports Context, Not Sports Cliché**
   Use basketball-native concepts (quarters, positions, shot types) but avoid gratuitous sports imagery. The orange accent and court green are sufficient basketball references—no flames, no swooshes, no excessive ball graphics.

### Existing Design Tokens

**Colors** (defined in tailwind.config.js):

- Primary: Orange scale (#F97316 main)
- Court: Dark green (#1a472a background, #234a1f paint)
- Dark: Slate scale (#0f1419 darkest)
- Status: Red (active), Amber (paused), Green (completed), Blue (scheduled)
- Shots: Blue (made 2pt), Green (made 3pt), Amber (missed 2pt), Red (missed 3pt)

**Typography**: Inter/system-ui sans-serif stack

**Spacing & Radius**: Tailwind defaults. Cards use rounded-lg (8px) or rounded-xl (12px).

**Animations**: Subtle fade-in (0.4s), slide-in (0.3s), pulse for live indicators

### Accessibility

- WCAG AA compliance required
- Keyboard navigation for all interactive elements
- Screen reader support with semantic HTML
- Color is never the only indicator—always pair with icons, text, or patterns
- Focus states visible and obvious (orange ring)

---

## Code Structure

This is a **monorepo** with separate mobile (React Native/Expo) and web (React/Vite) applications that share a common backend and code library.

### Directory Layout

```
basketball-stats-app/
├── mobile/BasketballStatsMobile/   # React Native app (Expo)
│   └── src/
│       ├── components/             # Mobile-specific UI components
│       ├── screens/                # Screen components (pages)
│       ├── contexts/               # React contexts
│       ├── hooks/                  # Custom hooks
│       ├── navigation/             # Navigation configuration
│       └── utils/                  # Mobile-specific utilities
│
├── web/basketball-stats-web/       # React web app (Vite)
│   └── src/
│       ├── components/             # Web-specific UI components
│       ├── pages/                  # Page components
│       ├── contexts/               # React contexts
│       ├── hooks/                  # Custom hooks
│       └── utils/                  # Web-specific utilities
│
├── shared/                         # Shared code library (npm package)
│   └── src/
│       ├── components/             # Shared component style definitions
│       ├── constants/              # Basketball rules, theme tokens
│       ├── types/                  # TypeScript type definitions
│       └── utils/                  # Basketball calculations, helpers
│
└── convex/                         # Backend (Convex)
    ├── schema.ts                   # Database schema
    ├── games.ts                    # Game-related functions
    ├── teams.ts                    # Team management
    ├── players.ts                  # Player management
    ├── stats.ts                    # Statistics calculations
    └── ...                         # Other backend modules
```

### Adding Features: Cross-Platform Development

**Every new feature must be implemented in both mobile and web apps.**

When adding a feature:

1. **Start with shared code** — Add types, constants, and business logic to `/shared` first
2. **Implement in both apps** — Build the UI in both `mobile/` and `web/`
3. **Add backend if needed** — Create/update Convex functions in `/convex`

### What Goes Where

| Code Type                 | Location                     | Notes                                           |
| ------------------------- | ---------------------------- | ----------------------------------------------- |
| TypeScript types          | `shared/src/types/`          | All shared interfaces and type definitions      |
| Constants (rules, limits) | `shared/src/constants/`      | Basketball rules, stat categories, theme tokens |
| Business logic            | `shared/src/utils/`          | Calculations, formatters, validators            |
| Backend functions         | `convex/`                    | Database queries, mutations, actions            |
| Mobile UI                 | `mobile/.../src/components/` | React Native components                         |
| Web UI                    | `web/.../src/components/`    | React DOM components                            |

### Using the Shared Package

Both apps import from the shared package:

```typescript
import { BasketballUtils, CONSTANTS, THEME } from "@basketball-stats/shared";
import type { Player, Game, PlayerStat } from "@basketball-stats/shared";
```

**Maximize shared code usage:**

- All type definitions should live in `shared/src/types/`
- All basketball calculations (points, percentages, averages) should use `BasketballUtils`
- All magic numbers should be constants in `shared/src/constants/`
- If you write logic that could be reused, put it in shared

### Platform-Specific Considerations

- **Mobile** uses React Native components (`View`, `Text`, `TouchableOpacity`)
- **Web** uses HTML elements with Tailwind CSS (`div`, `span`, `button`)
- Both apps share the same Convex backend and use similar hooks patterns
- Styling: Mobile uses NativeWind (Tailwind for RN), Web uses Tailwind CSS

---

## Development Workflow

### Running Checks

Before committing, run the full check to ensure code quality:

```bash
npm run full_check    # Runs typecheck + lint + format (must pass before commit)
npm run typecheck     # TypeScript only (all packages + Convex)
npm run lint          # ESLint only
npm run format        # Prettier formatting
npm run convex:dev    # Start Convex dev server
```

Warnings are acceptable but errors must be zero.

### Type Patterns

**Extending Convex return types**: When a query returns data that needs additional computed fields in the frontend, extend the type:

```typescript
// Convex query returns Team, but we add computed fields
interface ExtendedTeamData extends Team {
  wins: number;
  losses: number;
  canManage: boolean; // Permission check result from backend
}
```

**Prefer backend computation**: Add computed fields like `canManage` in the Convex query rather than computing permissions client-side.

---

## Permission System

### Backend Authorization

Use helpers from `convex/lib/auth.ts` for permission checks:

```typescript
import { canManageTeam, canManageLeague } from "./lib/auth";

// In mutations - check before allowing changes
const hasPermission = await canManageTeam(ctx, user._id, args.teamId);
if (!hasPermission) {
  throw new Error("Access denied");
}
```

**Permission hierarchy** (checked by `canManageTeam`):

1. League admin/owner → can manage all teams in their league
2. Team owner (`team.userId`) → can manage their own team
3. Team coach (via `teamMemberships`) → can manage teams they coach

### Frontend Permission-Based UI

Add `canManage` to query responses, then conditionally render actions:

```tsx
// Only show edit/delete buttons if user has permission
{
  team?.canManage && <button onClick={handleEdit}>Edit Team</button>;
}
```

---

## Shared Utilities

The `shared/src/utils/` directory contains cross-platform helpers:

| Utility         | Purpose                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `teamColors.ts` | `resolveTeamColor()`, `isLightColor()`, `TEAM_COLOR_PALETTE`             |
| `youtube.ts`    | `extractYouTubeId()`, `getYouTubeEmbedUrl()`, `getYouTubeThumbnailUrl()` |
| `social.ts`     | `SOCIAL_PLATFORMS` array with icons and URL patterns                     |

Import from the shared package:

```typescript
import { resolveTeamColor, extractYouTubeId, TEAM_COLOR_PALETTE } from "@basketball-stats/shared";
```

---

## Convex Backend Patterns

### File Organization

Each Convex module (`teams.ts`, `players.ts`, etc.) follows this structure:

1. Imports from `convex/values`, `_generated/server`, and `lib/auth`
2. Helper functions (private to module)
3. Queries (read operations)
4. Mutations (write operations)

### Authentication Pattern

**Every query and mutation requires a token:**

```typescript
import { getUserFromToken, canAccessLeague } from "./lib/auth";

export const list = query({
  args: {
    token: v.string(), // Required for all operations
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    // ... rest of handler
  },
});
```

### Common Query Patterns

```typescript
// Index-based filtering (preferred - uses database indexes)
const teams = await ctx.db
  .query("teams")
  .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
  .collect();

// Additional filtering after index
const activeGames = await ctx.db
  .query("games")
  .withIndex("by_home_team", (q) => q.eq("homeTeamId", teamId))
  .filter((q) => q.eq(q.field("status"), "active"))
  .collect();
```

### Validation

Use helpers from `./lib/validation`:

```typescript
import { validateName, validateEntityFields } from "./lib/validation";

// In mutation handler
validateName(args.name); // Throws on invalid
validateEntityFields(args);
```

---

## Web Component Patterns

### Modal System

Use the `BaseModal` composition pattern from `components/ui/BaseModal.tsx`:

```tsx
import { BaseModal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton } from "../ui/BaseModal";

<BaseModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Edit Team"
  maxWidth="lg" // sm | md | lg | xl
>
  <ModalHeader title="Edit Team" subtitle="Update team details" />
  <ModalBody padding="lg">{/* Form content */}</ModalBody>
  <ModalFooter>
    <ModalCancelButton onClick={() => setShowModal(false)} />
    <button onClick={handleSave}>Save</button>
  </ModalFooter>
</BaseModal>;
```

### Using Convex in Components

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api"; // Relative path from component
import type { Id } from "../../../../convex/_generated/dataModel";

function MyComponent() {
  const { token, selectedLeague } = useAuth();

  // Queries - use "skip" when dependencies aren't ready
  const teams = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Mutations
  const updateTeam = useMutation(api.teams.update);

  const handleUpdate = async () => {
    await updateTeam({ token, teamId, name: "New Name" });
  };
}
```

### Context Usage

The `AuthContext` provides authentication state:

```tsx
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const {
    user, // Current user or null
    isAuthenticated, // Boolean
    token, // Auth token for API calls
    selectedLeague, // Currently selected league
    isLoading, // True during auth initialization
  } = useAuth();
}
```

---

## Mobile Patterns

### Screen vs Component

- **Screens** (`screens/`): Full-page views, receive navigation props
- **Components** (`components/`): Reusable UI pieces

### Navigation

```tsx
// Navigate to screen
navigation.navigate("TeamDetail", { teamId: team.id });

// Go back
navigation.goBack();

// In screen component
function TeamDetailScreen({ route, navigation }) {
  const { teamId } = route.params;
}
```

### Bottom Sheets (Mobile Modals)

Use `components/common/BottomSheet.tsx` for mobile modal-like UI.

---

## Naming Conventions

### Cross-Platform Component Pairs

When the same feature exists on both platforms, use matching names:

| Web                                          | Mobile                                       |
| -------------------------------------------- | -------------------------------------------- |
| `components/ui/ColorPicker.tsx`              | `components/ui/ColorPicker.tsx`              |
| `components/livegame/EnhancedScoreboard.tsx` | `components/livegame/EnhancedScoreboard.tsx` |
| `pages/TeamDetail.tsx`                       | `screens/TeamDetailScreen.tsx`               |

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `camelCase.ts` (exports SCREAMING_SNAKE_CASE)
- Types: `camelCase.ts` (exports PascalCase types)

---

## Adding Dependencies

```bash
# Add to specific workspace
npm install package-name -w web/basketball-stats-web
npm install package-name -w mobile/BasketballStatsMobile
npm install package-name -w shared

# Add to root (dev tools like prettier, turbo)
npm install -D package-name
```
