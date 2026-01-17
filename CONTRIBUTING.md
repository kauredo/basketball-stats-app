# Contributing

Thank you for your interest in contributing to Basketball Stats App!

## Development Setup

### Prerequisites

- Node.js 18+
- npm 10+
- Git
- [Convex](https://convex.dev) account

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd basketball-stats-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Convex**
   ```bash
   npx convex login
   npx convex dev
   ```

4. **Start development**
   ```bash
   # Terminal 1: Convex
   npm run convex:dev

   # Terminal 2: Web
   cd web/basketball-stats-web && npm run dev

   # Terminal 3: Mobile (optional)
   cd mobile/BasketballStatsMobile && npm start
   ```

## Project Structure

```
basketball-stats-app/
├── convex/          # Backend (Convex functions)
├── web/             # Web app (React)
├── mobile/          # Mobile app (React Native/Expo)
├── shared/          # Shared TypeScript types
└── docs/            # Documentation
```

## Code Style

### General

- Use TypeScript for all code
- Follow existing patterns in the codebase
- Keep functions small and focused
- Write descriptive variable and function names

### Formatting

We use Prettier for code formatting:

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Linting

```bash
# Lint all packages
npm run lint
```

### Type Checking

```bash
# Type check all packages
npm run typecheck
```

## Git Workflow

### Branch Naming

- `feature/` - New features (e.g., `feature/shot-charts`)
- `fix/` - Bug fixes (e.g., `fix/login-error`)
- `docs/` - Documentation (e.g., `docs/api-reference`)
- `refactor/` - Code refactoring

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, no code change
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance

Examples:
```
feat(games): add live game timer
fix(auth): handle expired tokens correctly
docs(api): add shots endpoint documentation
```

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and type checking
4. Push and create a pull request
5. Fill out the PR template
6. Request review

## Making Changes

### Backend (Convex)

Location: `convex/`

1. Add/modify functions in the appropriate file
2. Update schema in `schema.ts` if needed
3. Run `npx convex dev` to push changes
4. Test with the web or mobile app

### Web App

Location: `web/basketball-stats-web/`

1. Follow React best practices
2. Use Tailwind CSS for styling
3. Add `dark:` variants for dark mode support
4. Test at different screen sizes

### Mobile App

Location: `mobile/BasketballStatsMobile/`

1. Follow React Native best practices
2. Use NativeWind (Tailwind) for styling
3. Add `dark:` variants for dark mode
4. Test on both iOS and Android

### Shared Types

Location: `shared/`

1. Add types to `src/types/`
2. Rebuild: `cd shared && npm run build`
3. Types are auto-imported in web and mobile

## Testing

### Manual Testing

- Test all user flows affected by your changes
- Test on both web and mobile if applicable
- Test light and dark modes
- Test error states

### Type Checking

```bash
npm run typecheck
```

## Documentation

- Update README files if adding features
- Add JSDoc comments for complex functions
- Update API.md for backend changes
- Keep ARCHITECTURE.md current

## Common Tasks

### Adding a New Page (Web)

1. Create component in `web/.../src/pages/`
2. Add route in `App.tsx`
3. Add navigation link in `Layout.tsx`
4. Add dark mode support

### Adding a New Screen (Mobile)

1. Create screen in `mobile/.../src/screens/`
2. Add to navigator in `navigation/`
3. Add dark mode support

### Adding a New Convex Function

1. Add function to appropriate file in `convex/`
2. Export from the file
3. Function is auto-available via `api.module.function`
4. Document in `docs/API.md`

### Adding a New Database Table

1. Add table definition in `convex/schema.ts`
2. Add indexes for common queries
3. Run `npx convex dev` to apply
4. Document in ARCHITECTURE.md

## Questions?

- Check existing documentation
- Look at similar code in the codebase
- Open an issue for discussion
