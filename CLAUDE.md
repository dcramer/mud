# Claude Development Guidelines

## 🔴 CRITICAL: Game Design Verification

**ALWAYS REFERENCE THE VERIFICATION GUIDE**
- Before creating ANY new game system: Read `/docs/game-design/VERIFICATION-GUIDE.md`
- Before updating ANY existing system: Check against the verification guide
- All systems MUST pass the verification checklist
- Use standard terminology as defined in the guide

## Documentation Requirements

### Documentation Structure
The `docs/` directory is organized into subdirectories:
- `docs/game-design/` - All game design documentation
- `docs/code/` - Technical/code documentation
- `docs/wip/` - Work-in-progress documents, trackers, and temporary files
- `docs/` root - High-level documents like commands reference

### Writing Documentation
- Game design docs go in `docs/game-design/`
- Technical docs go in `docs/code/`
- All new features MUST be documented before implementation is considered complete
- Documentation files should be created/updated in the same session as the feature implementation
- Use clear, descriptive filenames

### Documentation Standards

**Size and Focus Constraints** (applies to ALL documentation):
- **Maximum 2-3 pages** (~800-1200 words) per file to respect context window limits
- **Single topic focus** - one concept per file, avoid mixing topics
- **Practical examples** - show both correct and incorrect patterns where applicable
- **Topic-specific** - tailored to the specific domain (game design vs code vs architecture)

**Content Quality**:
- Each doc should have a clear title and purpose
- Include code examples where relevant for technical docs
- Keep documentation concise but comprehensive
- Update existing docs when modifying related features

### Referencing Documentation
- Always check appropriate subdirectory for existing documentation
- Start with `docs/game-design/game-overview.md` for game understanding
- Reference relevant docs when discussing implementation details
- Cross-reference related documentation files

## 🔴 CRITICAL: Industry-Standard Coding Compliance

**MANDATORY READING**: These documents define industry-standard practices that MUST be followed:

### Core Standards (REQUIRED)
- **`/docs/code/standards.md`** - Industry-standard development requirements and testing
- **`/docs/code/typescript.md`** - TypeScript best practices and patterns
- **`/docs/code/ecs.md`** - Complete Entity Component System architecture
- **`/docs/code/implementation.md`** - Core implementation patterns (interfaces, errors, events, commands)

### Key Industry Standards We Follow
- **Interface-Driven Testing**: Write tests immediately after defining interfaces to validate them
- **TypeScript Strict Mode**: All code must use strict TypeScript configuration
- **ECS Architecture**: Industry-standard Entity Component System patterns (Unity/Unreal style)
- **Result Pattern**: Rust-inspired error handling for type safety
- **90% Test Coverage**: Industry standard minimum coverage requirement
- **Security-First**: Input validation and secure coding practices

## Code Development Process

### Planning Changes
1. Review existing documentation in `docs/`
2. **Read industry standards** in order: `standards.md`, `typescript.md`, `ecs.md`, `implementation.md`
3. **CRITICAL for Database Work**: Review `/docs/code/database-design-guide.md` for D1 scaling patterns
4. Create or update relevant documentation BEFORE implementing
5. Use the TodoWrite tool to break down complex tasks
6. Implement features following industry-standard patterns

### Mandatory Code Standards (Industry Best Practices)
- **Test-Driven Development (TDD) is MANDATORY** - Write tests FIRST for all code (except third-party integrations)
- **ALL features MUST be tested** (90% coverage minimum - industry standard)
- **TypeScript Strict Mode** - Follow patterns in `docs/code/typescript.md`
- **ECS Architecture** - Follow industry patterns in `docs/code/ecs.md`
- **Result Pattern** - Use Rust-inspired error handling from `docs/code/implementation.md`
- **Event-Driven Systems** - No direct system-to-system calls (ECS standard)
- **Security-First** - Validate all inputs, never trust user data
- Ensure all code passes linting (`pnpm run lint`)
- Run `pnpm run typecheck` before completing any task

### Testing Requirements (MANDATORY - TDD Process)
- **TDD Red-Green-Refactor Cycle**:
  1. **RED**: Write failing test that defines desired behavior
  2. **GREEN**: Write minimal code to make test pass
  3. **REFACTOR**: Improve code while keeping tests green
- **Test-First Development**: NEVER write implementation before test (except third-party integrations)
- **All code must actually run**: Tests ensure implementation correctness and prevent broken code
- **Unit tests**: Every function, method, and component MUST have tests written FIRST
- **Integration tests**: System interactions MUST be tested  
- **Command tests**: Every command MUST have comprehensive coverage
- **Error path testing**: All error conditions MUST be tested
- Run `pnpm test` to ensure tests pass
- Verify test coverage meets 90% minimum

## Repository-Specific Rules

### MUD Architecture
Based on our technical architecture (see `/docs/code/architecture.md`):
- Server code lives in `src/server/` (networking, database, security)
- Game logic lives in `src/game/` (entities, systems, commands)
- Bundle system in `src/bundles/` (modular feature sets)
- Shared types live in `src/shared/types/`
- Event-driven architecture using TypeScript EventEmitter patterns

### Before Completing Any Task
Always run:
```bash
pnpm run lint
pnpm run typecheck
pnpm run test
```