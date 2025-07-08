# D1 Development Setup Guide

## Prerequisites

1. **Node.js** (v18 or later)
2. **pnpm** package manager
3. **Cloudflare account** (for remote deployment)

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Wrangler

Login to Cloudflare (for remote deployment):
```bash
npx wrangler auth login
```

### 3. Create Local D1 Databases

Create the main database for local development:
```bash
npx wrangler d1 create mud-game --local
```

This creates a SQLite database in `.wrangler/state/v3/d1/`.

### 4. Generate and Apply Migrations

Generate migrations from our schema:
```bash
pnpm db:generate
```

Apply migrations to local database:
```bash
pnpm d1:migrations:apply
```

### 5. Start Development Server

Run the local development server:
```bash
pnpm dev:local
```

This starts the Cloudflare Worker locally with D1 database access.

## Database Operations

### Generate Schema Changes
```bash
pnpm db:generate
```

### Apply Migrations Locally
```bash
pnpm d1:migrations:apply
```

### View Database with Drizzle Studio
```bash
pnpm db:studio
```

### Run Tests
```bash
pnpm test
```

Tests use in-memory SQLite via better-sqlite3.

## Development Workflow

### 1. Making Schema Changes

1. Update `src/server/database/schema-d1.ts`
2. Generate migrations: `pnpm db:generate`
3. Apply locally: `pnpm d1:migrations:apply`
4. Update repositories if needed
5. Run tests: `pnpm test`

### 2. Testing Endpoints

The development server exposes these endpoints:

- `GET /health` - Health check
- `POST /api/players` - Create player
- `GET /api/players` - List players (stub)

Example creating a player:
```bash
curl -X POST http://localhost:8787/api/players \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com"}'
```

### 3. Repository Development

Repositories are tested with integration tests using real SQLite databases:

```typescript
// Example test
import { createRepositoryTest } from '@/test/repository-test-base.js';
import { PlayerRepository } from './player-repository.js';

const testContext = createRepositoryTest(
  (db) => new PlayerRepository(db)
);

const player = await testContext.repository.create({
  username: 'testuser',
  email: 'test@example.com'
});
```

## Remote Deployment (Optional)

### 1. Create Remote D1 Databases

```bash
# Create production databases
npx wrangler d1 create mud-auth
npx wrangler d1 create mud-game-main
npx wrangler d1 create mud-social
npx wrangler d1 create mud-analytics
```

### 2. Update wrangler.toml

Update the database IDs in `wrangler.toml` with the ones returned from the create commands.

### 3. Apply Migrations to Remote

```bash
pnpm d1:migrations:apply:remote
```

### 4. Deploy Worker

```bash
npx wrangler deploy
```

## Troubleshooting

### Database Not Found Error

If you get "Database not found" errors:

1. Ensure you've created the local database: `npx wrangler d1 create mud-game --local`
2. Check migrations have been applied: `pnpm d1:migrations:apply`
3. Verify `.wrangler/state/v3/d1/` directory exists

### Migration Errors

If migrations fail:

1. Check your schema syntax in `schema-d1.ts`
2. Ensure you're not using PostgreSQL-specific features
3. Try regenerating: `pnpm db:generate`

### TypeScript Errors

Common issues:

1. Missing `@cloudflare/workers-types` - should be in devDependencies
2. Drizzle types not matching - ensure you're using `schema-d1.ts` imports
3. Type imports - use `import type` for type-only imports

### Test Database Issues

If tests fail with database errors:

1. Check `better-sqlite3` is installed
2. Ensure test setup is importing `test-setup-d1.js`
3. Clear test database: tests should handle this automatically

## File Structure

```
src/
├── server/
│   ├── worker.ts              # Cloudflare Worker entry point
│   └── database/
│       ├── d1-connection.ts   # D1 connection factory
│       ├── schema-d1.ts       # SQLite schema for D1
│       ├── test-setup-d1.ts   # Test database setup
│       └── repositories/      # Database repositories
├── test/
│   ├── fixtures-d1.ts         # Test data fixtures
│   └── repository-test-base.ts # Test utilities
wrangler.toml                   # Cloudflare Worker configuration
drizzle.config.ts              # Drizzle ORM configuration
```

## Next Steps

After completing local setup:

1. Implement remaining repositories (SSH keys, auth tokens, characters)
2. Add authentication services
3. Implement WebSocket handling for real-time game features
4. Set up Durable Objects for game rooms