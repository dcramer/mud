# TypeScript Standards

## Naming Conventions

### Variables and Functions: `camelCase`
```typescript
// ✅ DO
const playerData = await fetchPlayerData();
const isAbilityOnCooldown = true;
const calculateDamage = (power: number, modifier: number) => power * modifier;

// ❌ DON'T
const player_data = await fetch_player_data();
const IsAbilityOnCooldown = true;
```

### Classes, Interfaces, Types: `PascalCase`
```typescript
// ✅ DO
class CombatManager {
  private readonly eventEmitter: EventEmitter;
}

interface Player {
  id: string;
  name: string;
  rank: Rank;
}

type AbilityType = 'offensive' | 'defensive' | 'utility';

// ❌ DON'T
class combatManager {}
interface player {}
```

### Constants: `UPPER_SNAKE_CASE`
```typescript
// ✅ DO
const MAX_PLAYERS_PER_ROOM = 50;
const DEFAULT_HEALTH_POINTS = 100;
const ABILITY_COOLDOWN_MULTIPLIER = 1.5;
```

### Enums: `PascalCase` with descriptive values
```typescript
// ✅ DO
enum Rank {
  Normal = 'normal',
  Iron = 'iron',
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
  Diamond = 'diamond'
}

// ❌ DON'T
enum rank {
  NORMAL = 0,
  IRON = 1
}
```

## Type Definitions

### Use Interfaces for object shapes
```typescript
// ✅ DO - Game entity interfaces
interface Player {
  readonly id: string;
  name: string;
  rank: Rank;
  attributes: PlayerAttributes;
  location: Location;
}

interface PlayerAttributes {
  power: number;
  speed: number;
  spirit: number;
  recovery: number;
}

// Extensible interfaces
interface BaseEntity {
  readonly id: string;
  name: string;
  description: string;
}

interface CombatEntity extends BaseEntity {
  health: number;
  maxHealth: number;
  abilities: Ability[];
}
```

### Use Types for unions and utilities
```typescript
// ✅ DO - Game-specific types
type Rank = 'normal' | 'iron' | 'bronze' | 'silver' | 'gold' | 'diamond';
type AbilityTarget = 'self' | 'enemy' | 'ally' | 'area';
type CombatState = 'idle' | 'combat' | 'cooldown';

// Utility types for game data
type PlayerUpdate = Partial<Pick<Player, 'name' | 'location'>>;
type AbilityWithoutId = Omit<Ability, 'id'>;
type PlayerSummary = Pick<Player, 'id' | 'name' | 'rank'>;
```

## Generic Usage

```typescript
// ✅ DO - Meaningful generic names
interface Repository<TEntity extends BaseEntity> {
  findById(id: string): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
  delete(id: string): Promise<boolean>;
}

interface GameEvent<TData = unknown> {
  type: string;
  playerId: string;
  timestamp: Date;
  data: TData;
}

// Specific event types
type CombatStartEvent = GameEvent<{
  attacker: Player;
  target: Player;
  location: string;
}>;

// ❌ DON'T - Generic overuse
interface Repository<T> {
  find(id: string): Promise<T>;
}
```

## Modern TypeScript Features

### Optional Chaining
```typescript
// ✅ DO - Safe navigation through game objects
const playerLocation = player?.location?.roomId ?? 'unknown';
const abilityDamage = ability?.effects?.damage?.base ?? 0;
const guildName = player?.guild?.name ?? 'No Guild';

// ❌ DON'T - Verbose null checking
const playerLocation = player && player.location && player.location.roomId 
  ? player.location.roomId 
  : 'unknown';
```

### Template Literals
```typescript
// ✅ DO - Dynamic game message generation
const createCombatMessage = (
  attacker: string, 
  target: string, 
  ability: string, 
  damage: number
) => `${attacker} uses ${ability} on ${target} for ${damage} damage!`;

// Advanced template literal types for type safety
type EventMessageType<T extends string> = `${T}Message`;
type CombatMessages = EventMessageType<'attack' | 'defend' | 'ability'>;
// Result: 'attackMessage' | 'defendMessage' | 'abilityMessage'
```

### Destructuring
```typescript
// ✅ DO - Clean parameter destructuring
function calculateCombatOutcome({
  attacker,
  target,
  ability,
  modifiers = {}
}: {
  attacker: Player;
  target: Player;
  ability: Ability;
  modifiers?: CombatModifiers;
}): CombatResult {
  const { power, speed } = attacker.attributes;
  const { defense, evasion } = target.attributes;
  // Combat calculation logic
}

// Array destructuring for game collections
const [currentQuest, ...remainingQuests] = player.quests;
const [equippedWeapon, equippedArmor] = player.equipment;
```

## TSDoc Comments

```typescript
/**
 * Manages combat encounters between players and NPCs
 * 
 * @example
 * ```typescript
 * const combatManager = new CombatManager(eventEmitter);
 * const result = await combatManager.startCombat(player1, player2);
 * if (result.success) {
 *   console.log(`Combat started: ${result.data.id}`);
 * }
 * ```
 */
class CombatManager {
  /**
   * Initiates combat between two entities
   * 
   * @param attacker - The entity initiating combat
   * @param target - The target of the attack
   * @returns Promise resolving to combat result or error
   * @throws {GameError} When combat cannot be initiated
   */
  async startCombat(
    attacker: Player, 
    target: Player
  ): Promise<GameResult<Combat, GameError>> {
    // Implementation
  }
}
```