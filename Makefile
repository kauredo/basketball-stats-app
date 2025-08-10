# Basketball Stats App Makefile

.PHONY: setup build start stop restart logs deploy-prod clean

# Default environment
ENV ?= development

# Setup the project for development
setup:
	@echo "Setting up Basketball Stats App..."
	@cd shared && npm install && npm run build
	@cd web/basketball-stats-web && npm install
	@cd mobile/BasketballStatsMobile && npm install
	@cd backend && bundle install
	@echo "Setup completed successfully!"

# Build all containers
build:
	@echo "Building Docker containers..."
	@if [ "$(ENV)" = "production" ]; then \
		docker-compose -f docker-compose.yml -f docker-compose.prod.yml build; \
	else \
		docker-compose build; \
	fi

# Start the application
start:
	@echo "Starting the application in $(ENV) mode..."
	@if [ "$(ENV)" = "production" ]; then \
		docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d; \
	else \
		docker-compose up -d; \
	fi

# Stop the application
stop:
	@echo "Stopping the application..."
	@if [ "$(ENV)" = "production" ]; then \
		docker-compose -f docker-compose.yml -f docker-compose.prod.yml down; \
	else \
		docker-compose down; \
	fi

# Restart the application
restart: stop start

# View logs
logs:
	@echo "Showing logs..."
	@docker-compose logs -f

# Deploy to production
deploy-prod:
	@echo "Deploying to production..."
	@ENV=production ./deploy.sh

# Clean up development environment
clean:
	@echo "Cleaning up..."
	@docker-compose down -v
	@echo "Removing node_modules..."
	@rm -rf shared/node_modules
	@rm -rf web/basketball-stats-web/node_modules
	@rm -rf mobile/BasketballStatsMobile/node_modules
	@echo "Cleanup complete!"

# Display help information
help:
	@echo "Basketball Stats App - Make commands:"
	@echo "  setup         - Install dependencies and build shared library"
	@echo "  build         - Build Docker containers"
	@echo "  start         - Start the application (ENV=development or ENV=production)"
	@echo "  stop          - Stop the application"
	@echo "  restart       - Restart the application"
	@echo "  logs          - View logs"
	@echo "  deploy-prod   - Deploy to production"
	@echo "  clean         - Clean up development environment"
	@echo "  help          - Display this help information"
