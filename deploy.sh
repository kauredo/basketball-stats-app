#!/bin/bash
# Basketball Stats App Deployment Script

set -e  # Exit on error

# Configuration
ENV=${1:-production}  # Default to production if not specified
DOCKER_REGISTRY=${DOCKER_REGISTRY:-""}  # Set your registry if using one

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying Basketball Stats App in ${YELLOW}$ENV${GREEN} environment${NC}"

# Check if we have the master key for Rails
if [ "$ENV" = "production" ] && [ -z "$RAILS_MASTER_KEY" ]; then
  if [ -f ./backend/config/master.key ]; then
    export RAILS_MASTER_KEY=$(cat ./backend/config/master.key)
    echo -e "${YELLOW}Using Rails master key from config/master.key${NC}"
  else
    echo -e "${RED}Error: RAILS_MASTER_KEY environment variable is not set and config/master.key file not found${NC}"
    echo -e "${YELLOW}For production deployments, you must provide the Rails master key${NC}"
    echo -e "Set it with: ${GREEN}export RAILS_MASTER_KEY=your_key_here${NC}"
    exit 1
  fi
fi

# 1. Build the shared library first
echo -e "${GREEN}Building shared library...${NC}"
cd ./shared
npm install
npm run build
cd ..

# 2. Build the containers
echo -e "${GREEN}Building Docker containers...${NC}"
if [ "$ENV" = "production" ]; then
  # For production, we build optimized images
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
else
  # For development or staging
  docker-compose build
fi

# 3. Deploy
echo -e "${GREEN}Deploying the application...${NC}"
if [ "$ENV" = "production" ]; then
  # Push to registry if specified
  if [ -n "$DOCKER_REGISTRY" ]; then
    echo -e "${GREEN}Pushing images to registry: $DOCKER_REGISTRY${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml push
  fi
  
  # Start the application in detached mode
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
else
  # Start in development mode with logs visible
  docker-compose up
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "Backend API:  ${YELLOW}http://localhost:3000${NC}"
echo -e "Web App:      ${YELLOW}http://localhost:3001${NC}"

if [ "$ENV" != "production" ]; then
  echo -e "Expo Server:  ${YELLOW}http://localhost:19002${NC}"
fi

echo -e "${GREEN}To view logs: ${YELLOW}docker-compose logs -f${NC}"
echo -e "${GREEN}To stop the application: ${YELLOW}docker-compose down${NC}"
