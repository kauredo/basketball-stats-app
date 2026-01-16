# Deployment Guide

This guide explains how to deploy the Basketball Stats App. The application consists of multiple components (backend, web, mobile, shared) that can be deployed together using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Node.js (for local development)
- Ruby (for local development)
- Git

## Deployment Options

### Option 1: Local Docker Deployment

This is the simplest way to run the entire stack locally:

```bash
# Clone the repository
git clone https://github.com/your-username/basketball-stats-app.git
cd basketball-stats-app

# Make the deploy script executable
chmod +x deploy.sh

# Deploy in development mode (interactive with logs)
./deploy.sh development

# Or deploy in production mode (detached)
./deploy.sh production
```

Alternatively, you can use the Makefile:

```bash
# Setup dependencies
make setup

# Build and start the application
make build
make start

# View logs
make logs

# Stop the application
make stop
```

### Option 2: Production Deployment with Docker

For production environments:

1. Set required environment variables:

```bash
export RAILS_MASTER_KEY=your_rails_master_key
export DB_PASSWORD=your_secure_database_password
```

2. Deploy:

```bash
make deploy-prod
```

### Option 3: Deploying Individual Components

If you prefer to deploy components separately:

#### Backend (Rails API)

```bash
cd backend
# Deploy using your preferred Rails hosting (Heroku, Railway, etc.)
# Example for Heroku:
heroku create
git subtree push --prefix backend heroku main
```

#### Web Application (React)

```bash
cd web/basketball-stats-web
# Build the application
npm run build
# Deploy to Netlify, Vercel, etc.
```

#### Mobile Application (React Native)

```bash
cd mobile/BasketballStatsMobile
# Build for iOS/Android
expo build:ios
expo build:android
# Submit to app stores
```

## Environment Configuration

For production deployments, make sure to set the appropriate environment variables:

- `RAILS_MASTER_KEY`: Required for Rails credentials
- `DB_PASSWORD`: Secure password for the PostgreSQL database
- `REACT_APP_API_URL`: URL of the backend API for the web app
- `NODE_ENV`: Set to "production" for optimized builds

## Continuous Integration / Continuous Deployment

For CI/CD, you can use GitHub Actions or similar services:

1. Create `.github/workflows/deploy.yml` with appropriate steps
2. Configure secrets in your GitHub repository settings
3. Deploy automatically on pushes to the main branch

## Troubleshooting

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify environment variables are set correctly
3. Ensure all containers are running: `docker-compose ps`
4. Restart the application: `make restart`

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Rails Deployment Guides: https://guides.rubyonrails.org/deployment.html
- React Deployment: https://create-react-app.dev/docs/deployment/
- Expo Deployment: https://docs.expo.dev/distribution/app-stores/
