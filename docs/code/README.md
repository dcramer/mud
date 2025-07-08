# Code Documentation

**Industry-Standard Development Practices for TypeScript ECS Architecture**

## Overview

This directory contains **industry-standard coding practices** for all development. Clear hierarchy from general standards to specific implementations.

**📊 Current Progress**: See [implementation-progress.md](implementation-progress.md) for development status tracking.

## 🔴 MANDATORY READING (In Order)

### 1. Core Standards
- **[standards.md](standards.md)** - Primary development standards and requirements
- **[typescript.md](typescript.md)** - TypeScript patterns and best practices

### 2. Architecture Foundation  
- **[ecs.md](ecs.md)** - Complete Entity Component System guide
- **[implementation.md](implementation.md)** - All implementation patterns (interfaces, errors, events, commands)

### 3. Specific Systems
- **[systems/chat.md](systems/chat.md)** - Real-time communication system ⭐ **NEW**
- **[systems/combat.md](systems/combat.md)** - Combat system implementation
- **[systems/database.md](systems/database.md)** - Database and persistence patterns

## Clear Learning Path

### For New Developers
1. **Read `standards.md`** - Understand our industry standards and requirements
2. **Read `typescript.md`** - Learn our TypeScript patterns  
3. **Read `ecs.md`** - Understand our ECS architecture
4. **Read `implementation.md`** - Learn implementation patterns
5. **Browse `systems/`** - Study specific system implementations

### For Feature Development
1. **Review standards** for testing and quality requirements
2. **Check implementation patterns** for the type of feature you're building
3. **Look at similar systems** in the `systems/` directory for examples
4. **Follow the interfaces** defined in `implementation.md`

### For Bug Fixes
1. **Write test reproducing the bug** (from `standards.md`)
2. **Use established patterns** (from `implementation.md`)
3. **Ensure fix doesn't break existing tests**

## Key Industry Standards We Follow

- **Interface-Driven Testing**: Write tests immediately after defining interfaces
- **TypeScript Strict Mode**: All code uses strict TypeScript configuration  
- **ECS Architecture**: Industry-standard Entity Component System patterns
- **Result Pattern**: Rust-inspired error handling for type safety
- **90% Test Coverage**: Industry standard minimum requirement
- **Security-First**: All inputs validated, no dynamic code execution

## File Organization (Clean Hierarchy)

```
docs/code/
├── README.md              # This overview
├── standards.md           # Core development standards (MANDATORY)
├── typescript.md          # TypeScript best practices (MANDATORY)  
├── ecs.md                 # Complete ECS architecture guide
├── implementation.md      # All implementation patterns
└── systems/               # Specific system implementations
    ├── chat.md           # Real-time communication (NEW)
    ├── combat.md         # Combat system
    └── database.md       # Database patterns
```

## Quality Gates

All code must pass:
- `pnpm run typecheck` - TypeScript compilation
- `pnpm run lint` - Code style and quality
- `pnpm run test` - All tests pass
- `pnpm run test:coverage` - 90% minimum coverage

## Critical Systems

### Infrastructure Systems (Required)
- **Chat System** - Real-time player communication with channels
- **Database System** - Drizzle ORM with PostgreSQL and Redis
- **Network System** - WebSocket and Telnet connections

### Game Systems (Phase 1)
- **ECS Core** - Entity Component System foundation
- **Movement System** - Player movement and room navigation
- **Combat System** - Basic combat mechanics

**The chat system is critical infrastructure that was missing from our game design documentation.**