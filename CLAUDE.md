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

Both apps import from `@shared`:

```typescript
import { BasketballUtils, CONSTANTS, THEME } from "@shared";
import type { Player, Game, PlayerStat } from "@shared";
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
