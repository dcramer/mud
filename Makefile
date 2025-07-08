.PHONY: help up down logs ps migrate test clean

help: ## Show this help
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all services
	docker-compose up -d
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 5
	@echo "Services started! Run 'make migrate' to set up the database."

down: ## Stop all services
	docker-compose down

logs: ## Show logs for all services
	docker-compose logs -f

ps: ## Show running services
	docker-compose ps

migrate: ## Run database migrations
	pnpm db:migrate

migrate-test: ## Run test database migrations
	DATABASE_URL=$$TEST_DATABASE_URL pnpm db:migrate

test: ## Run tests
	pnpm test

test-watch: ## Run tests in watch mode
	pnpm test:watch

clean: ## Remove all containers and volumes
	docker-compose down -v

reset-db: ## Reset database (drop and recreate)
	docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS mud;"
	docker-compose exec postgres psql -U postgres -c "CREATE DATABASE mud;"
	make migrate

reset-test-db: ## Reset test database
	docker-compose exec postgres_test psql -U postgres -c "DROP DATABASE IF EXISTS mud_test;"
	docker-compose exec postgres_test psql -U postgres -c "CREATE DATABASE mud_test;"
	make migrate-test