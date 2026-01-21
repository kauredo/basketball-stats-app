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
