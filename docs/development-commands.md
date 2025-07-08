# Development Commands

Local development and testing commands for the MUD game project.

## Quick Start

### Test Without Setup
```bash
pnpm demo
```
Runs standalone terminal UI demonstration showing character creation, combat simulation, and interface features. No server or database required.

### Full Local Testing
```bash
pnpm db:init    # Initialize database (first time only)
pnpm start      # Launch game client with authentication
```

## Primary Commands

### Game Client
- `pnpm start` - Launch terminal game client
- `pnpm demo` - Run standalone UI demonstration

### Database Operations
- `pnpm db:init` - Initialize local SQLite database with schema
- `pnpm db:studio` - Open Drizzle Studio database GUI

### Server Development
- `pnpm dev` - Start Cloudflare Workers development server
- `pnpm dev:local` - Start server in local-only mode

## Quality Assurance

### Code Quality
```bash
pnpm typecheck   # TypeScript type checking
pnpm lint        # Code style and error checking
pnpm lint:fix    # Automatically fix style issues
```

### Testing
```bash
pnpm test        # Run complete test suite
pnpm test:watch  # Run tests in watch mode
pnpm test:ui     # Open Vitest UI for interactive testing
```

## Typical Workflows

### First Time Setup
```bash
git clone <repository>
cd mud
pnpm install
pnpm demo        # Verify UI works immediately
```

### Feature Development
```bash
pnpm db:init     # Setup local database
pnpm typecheck   # Verify types
pnpm start       # Test authentication flow
```

### Pre-Commit Verification
```bash
pnpm lint        # Check code style
pnpm typecheck   # Verify TypeScript
pnpm test        # Run test suite
```

All commands use `NODE_ENV=development` automatically for local development context.