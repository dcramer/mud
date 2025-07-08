# Code Style Guide

## File Organization

### File Naming: `kebab-case`
```
// ✅ DO
combat-manager.ts
player-service.ts
essence-ability.ts
quest-controller.ts

// ❌ DON'T
CombatManager.ts
playerService.ts
EssenceAbility.ts
```

### Import/Export Patterns

#### Explicit imports with type separation
```typescript
// ✅ DO
import { CombatManager } from './combat-manager';
import { PlayerService } from './player-service';
import type { Player, Ability } from './types';

// Group game-specific imports logically
import { 
  CombatEvent, 
  AbilityUsedEvent, 
  PlayerMovedEvent 
} from './events';

// ❌ DON'T
import * as Combat from './combat-manager';
import { PlayerService, Player, Ability } from './player-service';
```

#### Barrel exports for clean APIs
```typescript
// src/game/entities/index.ts
export { Player } from './player';
export { NPC } from './npc';
export { Item } from './item';
export type { Entity, EntityType } from './entity';

// src/game/systems/index.ts
export { CombatSystem } from './combat-system';
export { ProgressionSystem } from './progression-system';
export { EssenceSystem } from './essence-system';
```

## Modern JavaScript Features

### Async/Await for Game Logic
```typescript
// ✅ DO - Sequential operations for dependent game logic
async function processPlayerTurn(player: Player, action: PlayerAction): Promise<TurnResult> {
  const validationResult = await validateAction(player, action);
  if (!validationResult.success) return validationResult;
  
  const executionResult = await executeAction(player, action);
  if (!executionResult.success) return executionResult;
  
  const afterEffects = await processAfterEffects(player, executionResult.data);
  return { success: true, data: { ...executionResult.data, afterEffects } };
}

// ✅ DO - Parallel operations for independent game data
async function loadPlayerDashboard(playerId: string): Promise<PlayerDashboard> {
  const [player, inventory, quests, messages] = await Promise.all([
    playerService.findById(playerId),
    inventoryService.getPlayerInventory(playerId),
    questService.getActiveQuests(playerId),
    messageService.getUnreadMessages(playerId)
  ]);
  
  return { player, inventory, quests, messages };
}
```

## Formatting Configuration

### Prettier (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### ESLint Rules for Code Style
```javascript
// eslint.config.js (style-related rules)
rules: {
  // General code quality
  'prefer-const': 'error',
  'no-var': 'error',
  'object-shorthand': 'error',
  'prefer-arrow-callback': 'error',
  'no-console': 'warn', // Use proper logging instead
  
  // TypeScript style
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/prefer-optional-chain': 'error',
  
  // Game-specific rules
  'no-magic-numbers': ['warn', { ignore: [-1, 0, 1, 2] }]
}
```

## Project Structure

```
src/
├── server/
│   ├── networking/        # WebSocket + Telnet handlers
│   ├── database/         # Drizzle + Redis connections
│   ├── security/         # Input validation, auth
│   └── core/            # Core game engine
├── game/
│   ├── entities/        # Player, NPC, Item classes
│   ├── systems/         # Combat, progression, etc.
│   ├── commands/        # All game commands
│   └── events/          # Event definitions
├── bundles/
│   ├── core-combat/     # Combat system bundle
│   ├── essence-system/  # Essence mechanics
│   └── world-content/   # Areas, NPCs, quests
├── shared/
│   ├── types/          # TypeScript definitions
│   ├── protocols/      # Network protocols
│   └── constants/      # Game constants
└── tests/
    ├── unit/           # Unit tests
    ├── integration/    # Integration tests
    └── load/           # Performance tests
```

## Code Comments

### Use JSDoc for public APIs
```typescript
/**
 * Calculates damage output for combat abilities
 * 
 * @param baseDamage - Base damage before modifiers
 * @param attributes - Player's combat attributes
 * @param modifiers - Additional damage modifiers
 * @returns Final damage amount after all calculations
 */
function calculateDamage(
  baseDamage: number,
  attributes: PlayerAttributes,
  modifiers: DamageModifiers = {}
): number {
  // Implementation
}
```

### Avoid unnecessary comments
```typescript
// ❌ DON'T - Obvious comments
const playerId = player.id; // Get the player ID

// ✅ DO - Explain complex business logic
// Apply diminishing returns to prevent damage scaling beyond game balance
const scaledDamage = baseDamage * Math.log(powerAttribute + 1) / Math.log(2);
```