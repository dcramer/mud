# Code Documentation

This directory contains focused, topic-specific coding standards and guidelines for the MUD project.

## About These Documents

Each document follows the global documentation standards defined in CLAUDE.md - focused, concise, and practical for quick reference during development.

## Quick Reference

### Core Architecture
- [ECS Architecture](ecs-architecture.md) - **Core game engine pattern** - Entity Component System
- [Event System](event-patterns.md) - Type-safe event-driven architecture
- [Database Layer](database-patterns.md) - Drizzle ORM patterns and data management

### Game Systems
- [Combat System](combat-system.md) - Ability usage, damage calculation, status effects
- [Quest System](quest-system.md) - Adventure Society contracts and progression
- [Crafting System](crafting-system.md) - Alchemy, artifice, and item creation
- [Player System](player-system.md) - Character management and progression
- [Room System](room-system.md) - World navigation and area management

### Infrastructure Services  
- [Database Service](database-patterns.md) - Data persistence layer with Drizzle ORM
- [Network Service](network-service.md) - WebSocket/Telnet connection management
- [Authentication Service](auth-service.md) - Player login and session management

### Code Standards
- [TypeScript Standards](typescript-standards.md) - Types, interfaces, naming conventions
- [Code Style Guide](code-style.md) - Formatting, imports, file organization
- [Error Handling](error-handling.md) - Result patterns, validation, safety
- [Testing Patterns](testing-patterns.md) - Vitest setup, mocking, game logic tests

Each file focuses on one system or service and can be referenced independently during development.

**Terminology Note**: We use "System" for game logic components (following ECS and game engine conventions) and "Service" for infrastructure/external concerns (database, network, auth).