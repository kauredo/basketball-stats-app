# Deployment Guide

This guide explains how to deploy the Basketball Stats App.

## Architecture

- **Backend**: Convex (serverless, managed by Convex)
- **Web**: React app (deploy to Vercel/Netlify)
- **Mobile**: React Native + Expo (deploy via EAS)

## Prerequisites

- Node.js 18+
- npm 10+
- Convex account ([convex.dev](https://convex.dev))
- Expo account (for mobile builds)

## Backend Deployment (Convex)

Convex handles backend infrastructure automatically. To deploy:

```bash
# Deploy to production
npx convex deploy
```

This deploys all functions in `convex/` to your Convex project.

### Environment Variables

Set production environment variables in the Convex dashboard:
1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project
3. Go to Settings → Environment Variables
4. Add any required variables

## Web Deployment

### Option 1: Vercel (Recommended)

```bash
cd web/basketball-stats-web

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Option 2: Netlify

```bash
cd web/basketball-stats-web

# Build
npm run build

# Deploy build/ folder to Netlify
```

### Environment Variables

Set in your hosting platform:
- `REACT_APP_CONVEX_URL` - Your Convex deployment URL (if not hardcoded)

## Mobile Deployment

### Setup EAS (Expo Application Services)

```bash
cd mobile/BasketballStatsMobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

### Build for App Stores

```bash
# iOS (requires Apple Developer account)
eas build --platform ios

# Android
eas build --platform android

# Both platforms
eas build --platform all
```

### Submit to Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## CI/CD

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-convex:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npx convex deploy
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: cd web/basketball-stats-web && npm run build
      # Add your hosting provider's deploy action here
```

## Monitoring

- **Convex Dashboard**: View logs, data, and function performance at [dashboard.convex.dev](https://dashboard.convex.dev)
- **Web**: Use your hosting provider's analytics
- **Mobile**: Use Expo's crash reporting and analytics

## Troubleshooting

### Convex deployment fails
- Check `npx convex dev` works locally first
- Verify schema changes are valid
- Check the Convex dashboard for error logs

### Web build fails
- Run `npm run typecheck` to find type errors
- Ensure shared package is built: `cd shared && npm run build`

### Mobile build fails
- Check Expo status: [status.expo.dev](https://status.expo.dev)
- Review EAS build logs in Expo dashboard
- Ensure `app.json` configuration is correct
