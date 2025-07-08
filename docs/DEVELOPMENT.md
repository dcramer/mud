# Development Setup

## Prerequisites

- Node.js 20+
- pnpm
- Docker and Docker Compose

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mud
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start Docker services**
   ```bash
   make up
   # or
   pnpm docker:up
   ```

5. **Run database migrations**
   ```bash
   make migrate
   # or
   pnpm db:migrate
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

## Docker Services

The project uses Docker Compose to manage development services:

- **PostgreSQL** (port 5432) - Main database
- **PostgreSQL Test** (port 5433) - Test database
- **Redis** (port 6379) - Caching and session storage

### Common Docker Commands

```bash
# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Reset database
make reset-db

# Reset test database
make reset-test-db
```

## Database Management

### Migrations

```bash
# Generate a new migration
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema changes (development only)
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Test Database

The test database runs on port 5433 to avoid conflicts with the main database. Tests automatically use this database when running:

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Testing

We use Vitest for testing with real PostgreSQL integration tests:

- Tests run sequentially for database isolation
- Each test starts with a clean database state
- Test database is automatically created on first run

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

## Code Quality

### Linting and Formatting

```bash
# Check code style
pnpm lint

# Fix code style issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm typecheck
```

### Pre-commit Hooks

The project uses git hooks to ensure code quality. These run automatically on commit:
- Linting with Biome
- Type checking
- Format checking

## Troubleshooting

### PostgreSQL Connection Issues

If you can't connect to PostgreSQL:

1. Ensure Docker is running
2. Check if containers are up: `docker-compose ps`
3. Check logs: `docker-compose logs postgres`
4. Try restarting: `make down && make up`

### Port Conflicts

If ports are already in use:

1. Check what's using the port: `lsof -i :5432`
2. Stop the conflicting service
3. Or modify ports in `docker-compose.yml`

### Test Failures

If tests fail with connection errors:

1. Ensure test database is running: `docker-compose ps postgres_test`
2. Check test database logs: `docker-compose logs postgres_test`
3. Reset test database: `make reset-test-db`