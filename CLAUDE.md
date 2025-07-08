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

## Code Development Process

### Planning Changes
1. Review existing documentation in `docs/`
2. Create or update relevant documentation BEFORE implementing
3. Use the TodoWrite tool to break down complex tasks
4. Implement features following the documented design

### Code Standards
- Use TypeScript's strict mode for all new code
- Follow ESM module patterns consistently
- Ensure all code passes linting (`pnpm run lint`)
- Write tests for new functionality
- Run `pnpm run typecheck` before completing any task

### Testing Requirements
- Write tests using Vitest for all new features
- Run `pnpm test` to ensure tests pass
- Maintain test coverage for critical game logic

## Repository-Specific Rules

### MUD Architecture
Based on our technical architecture (see `/docs/TECHNICAL-ARCHITECTURE.md`):
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