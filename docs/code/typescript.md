# TypeScript Patterns

**Industry-Standard TypeScript Development Practices**

## Overview

This document outlines **industry-standard TypeScript patterns** following best practices from the TypeScript team, major frameworks, and enterprise development standards.

## Type System Best Practices

### Strict Configuration (Industry Standard)
```json
// tsconfig.json - Industry standard strict configuration
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "noImplicitAny": true,            // Disallow implicit any
    "strictNullChecks": true,         // Strict null/undefined checking
    "strictFunctionTypes": true,      // Strict function type checking
    "noImplicitReturns": true,        // No implicit returns
    "noFallthroughCasesInSwitch": true, // Switch case fallthrough
    "noUncheckedIndexedAccess": true, // Strict array/object access
    "exactOptionalPropertyTypes": true // Exact optional properties
  }
}
```

### Branded Types (Security Best Practice)
```typescript
// ✅ Industry standard: Branded types prevent ID confusion
declare const EntityIdBrand: unique symbol;
export type EntityId = string & { readonly [EntityIdBrand]: never };

declare const PlayerIdBrand: unique symbol;
export type PlayerId = string & { readonly [PlayerIdBrand]: never };

declare const RoomIdBrand: unique symbol;
export type RoomId = string & { readonly [RoomIdBrand]: never };

// Factory functions for type safety
export const createEntityId = (id: string): EntityId => id as EntityId;
export const createPlayerId = (id: string): PlayerId => id as PlayerId;
export const createRoomId = (id: string): RoomId => id as RoomId;

// ✅ Usage: Prevents accidental ID mixing
function movePlayer(playerId: PlayerId, roomId: RoomId): void {
  // Type-safe: can't accidentally pass wrong ID type
}

// ❌ This would be a compile error:
// movePlayer(roomId, playerId); // Type error!
```

### Discriminated Unions (TypeScript Best Practice)
```typescript
// ✅ Industry standard: Discriminated unions for type safety
interface GameResult<T> {
  readonly success: boolean;
}

interface Success<T> extends GameResult<T> {
  readonly success: true;
  readonly data: T;
}

interface Failure<T> extends GameResult<T> {
  readonly success: false;
  readonly error: GameError;
}

type Result<T> = Success<T> | Failure<T>;

// Type guards (industry standard pattern)
export const isSuccess = <T>(result: Result<T>): result is Success<T> => {
  return result.success;
};

export const isFailure = <T>(result: Result<T>): result is Failure<T> => {
  return !result.success;
};

// ✅ Usage with type narrowing
const result = await someOperation();
if (isSuccess(result)) {
  // TypeScript knows result.data exists here
  console.log(result.data);
} else {
  // TypeScript knows result.error exists here
  console.error(result.error.message);
}
```

### Template Literal Types (Modern TypeScript)
```typescript
// ✅ Industry standard: Template literal types for type safety
type EventType = 'player' | 'combat' | 'ability' | 'item';
type EventAction = 'started' | 'ended' | 'used' | 'moved';

// Generates all valid event combinations
type GameEventName = `${EventType}:${EventAction}`;
// Result: 'player:started' | 'player:ended' | 'combat:started' | etc.

// Event system with type safety
interface TypedEventEmitter {
  emit<T extends GameEventName>(event: T, data: EventDataFor<T>): void;
  on<T extends GameEventName>(event: T, handler: (data: EventDataFor<T>) => void): void;
}

// Map event names to their data types
type EventDataFor<T extends GameEventName> = 
  T extends 'player:moved' ? { playerId: PlayerId; from: RoomId; to: RoomId } :
  T extends 'combat:started' ? { combatId: string; participants: PlayerId[] } :
  T extends 'ability:used' ? { playerId: PlayerId; abilityId: string; targets: PlayerId[] } :
  unknown;
```

### Utility Types (TypeScript Standard Library)
```typescript
// ✅ Industry standard: Built-in utility types
interface Player {
  readonly id: PlayerId;
  name: string;
  rank: Rank;
  attributes: PlayerAttributes;
  location: Location;
  inventory: Inventory;
}

// Create related types using utilities
type PlayerUpdate = Partial<Pick<Player, 'name' | 'location'>>;
type PlayerSummary = Pick<Player, 'id' | 'name' | 'rank'>;
type PlayerWithoutId = Omit<Player, 'id'>;
type RequiredPlayer = Required<Player>;

// Advanced utility for deep readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

type ImmutablePlayer = DeepReadonly<Player>;
```

## Interface Design Patterns

### Composition Over Inheritance
```typescript
// ✅ Industry standard: Favor composition
interface Entity {
  readonly id: EntityId;
  readonly components: ReadonlyMap<string, Component>;
}

interface Component {
  readonly type: string;
}

// Composable mixins pattern
interface Movable {
  readonly location: Location;
}

interface Combatant {
  readonly combat: CombatStats;
}

interface Trader {
  readonly inventory: Inventory;
  readonly currency: Currency;
}

// Compose complex types
type Player = Entity & Movable & Combatant & Trader;
type NPC = Entity & Movable & Combatant;
type Item = Entity;
```

### Builder Pattern (Complex Object Construction)
```typescript
// ✅ Industry standard: Builder pattern for complex objects
class EntityBuilder {
  private components = new Map<string, Component>();
  
  withLocation(roomId: RoomId): this {
    this.components.set('location', {
      type: 'location',
      roomId,
      coordinates: { x: 0, y: 0, z: 0 }
    });
    return this;
  }
  
  withCombat(stats: Partial<CombatStats> = {}): this {
    this.components.set('combat', {
      type: 'combat',
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      ...stats
    });
    return this;
  }
  
  withInventory(capacity = 20): this {
    this.components.set('inventory', {
      type: 'inventory',
      items: [],
      maxSlots: capacity,
      currency: { gold: 0, silver: 0 }
    });
    return this;
  }
  
  build(): Entity {
    return {
      id: createEntityId(generateUniqueId()),
      components: new Map(this.components)
    };
  }
}

// ✅ Usage: Fluent interface
const player = new EntityBuilder()
  .withLocation(createRoomId('starting-room'))
  .withCombat({ health: 150, maxHealth: 150 })
  .withInventory(25)
  .build();
```

## Function Design Patterns

### Pure Functions (Functional Programming Best Practice)
```typescript
// ✅ Industry standard: Pure functions for calculations
export const GameCalculations = {
  calculateDamage: (
    baseDamage: number,
    powerAttribute: number,
    modifiers: DamageModifiers = {}
  ): number => {
    const { multiplier = 1, bonus = 0, resistance = 0 } = modifiers;
    return Math.max(0, (baseDamage + powerAttribute * 0.1 + bonus) * multiplier - resistance);
  },
  
  calculateExperience: (
    baseXp: number,
    levelDifference: number,
    bonusMultiplier = 1
  ): number => {
    const difficultyMultiplier = Math.max(0.1, 1 + levelDifference * 0.1);
    return Math.floor(baseXp * difficultyMultiplier * bonusMultiplier);
  },
  
  isWithinRange: (
    position1: Vector3,
    position2: Vector3,
    maxDistance: number
  ): boolean => {
    const distance = Math.sqrt(
      Math.pow(position2.x - position1.x, 2) +
      Math.pow(position2.y - position1.y, 2) +
      Math.pow(position2.z - position1.z, 2)
    );
    return distance <= maxDistance;
  }
} as const;
```

### Higher-Order Functions (Functional Pattern)
```typescript
// ✅ Industry standard: HOF for reusable logic
type Predicate<T> = (item: T) => boolean;
type Transformer<T, U> = (item: T) => U;

export const ArrayUtils = {
  // Filter with type predicate
  filterByType<T, U extends T>(
    array: T[],
    predicate: (item: T) => item is U
  ): U[] {
    return array.filter(predicate);
  },
  
  // Safe transformation with error handling
  mapSafe<T, U>(
    array: T[],
    transformer: Transformer<T, Result<U>>
  ): U[] {
    return array
      .map(transformer)
      .filter(isSuccess)
      .map(result => result.data);
  },
  
  // Grouping utility
  groupBy<T, K extends string | number | symbol>(
    array: T[],
    keySelector: (item: T) => K
  ): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const key = keySelector(item);
      (groups[key] ??= []).push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }
};

// ✅ Usage examples
const players = getActivePlayers();

// Type-safe filtering
const combatPlayers = ArrayUtils.filterByType(
  players,
  (player): player is Player & { combat: CombatStats } => 
    player.components.has('combat')
);

// Safe transformation
const playerSummaries = ArrayUtils.mapSafe(players, player => 
  success({ id: player.id, name: player.name, rank: player.rank })
);

// Grouping
const playersByRoom = ArrayUtils.groupBy(players, player => 
  player.location.roomId
);
```

## Async Patterns (Node.js Best Practices)

### Promise Handling
```typescript
// ✅ Industry standard: Proper async/await patterns
export class DatabaseService {
  async findPlayer(playerId: PlayerId): Promise<Result<Player>> {
    try {
      const player = await this.db.query.players.findFirst({
        where: eq(players.id, playerId)
      });
      
      if (!player) {
        return failure(new GameError('Player not found', 'PLAYER_NOT_FOUND'));
      }
      
      return success(player);
    } catch (error) {
      this.logger.error('Database query failed', { playerId, error });
      return failure(new GameError('Database error', 'DATABASE_ERROR'));
    }
  }
  
  // Parallel processing when possible
  async loadPlayerData(playerId: PlayerId): Promise<Result<PlayerData>> {
    try {
      const [player, inventory, quests] = await Promise.all([
        this.findPlayer(playerId),
        this.getPlayerInventory(playerId),
        this.getPlayerQuests(playerId)
      ]);
      
      // Check all results
      if (!isSuccess(player)) return player;
      if (!isSuccess(inventory)) return inventory;
      if (!isSuccess(quests)) return quests;
      
      return success({
        player: player.data,
        inventory: inventory.data,
        quests: quests.data
      });
    } catch (error) {
      return failure(new GameError('Failed to load player data', 'LOAD_ERROR'));
    }
  }
}
```

### Cancellation Patterns
```typescript
// ✅ Industry standard: AbortController for cancellation
export class NetworkService {
  async sendWithTimeout<T>(
    request: Request,
    timeoutMs = 5000
  ): Promise<Result<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(request.url, {
        ...request,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return failure(new GameError('Request failed', 'NETWORK_ERROR'));
      }
      
      const data = await response.json();
      return success(data);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return failure(new GameError('Request timeout', 'TIMEOUT'));
      }
      
      return failure(new GameError('Network error', 'NETWORK_ERROR'));
    }
  }
}
```

## Error Handling Patterns

### Result Type Implementation
```typescript
// ✅ Industry standard: Rust-inspired Result type
export type Result<T, E = GameError> = Success<T> | Failure<E>;

interface Success<T> {
  readonly success: true;
  readonly data: T;
}

interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

// Helper functions
export const success = <T>(data: T): Success<T> => ({ success: true, data });
export const failure = <E>(error: E): Failure<E> => ({ success: false, error });

// Combinators for Result chaining
export const ResultUtils = {
  map<T, U, E>(
    result: Result<T, E>,
    fn: (data: T) => U
  ): Result<U, E> {
    return isSuccess(result) 
      ? success(fn(result.data))
      : result;
  },
  
  flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (data: T) => Result<U, E>
  ): Result<U, E> {
    return isSuccess(result) 
      ? fn(result.data)
      : result;
  },
  
  mapError<T, E, F>(
    result: Result<T, E>,
    fn: (error: E) => F
  ): Result<T, F> {
    return isFailure(result)
      ? failure(fn(result.error))
      : result;
  }
};
```

## Performance Patterns

### Object Pooling
```typescript
// ✅ Industry standard: Object pooling for frequent allocations
export class ObjectPool<T> {
  private available: T[] = [];
  private readonly createFn: () => T;
  private readonly resetFn: (obj: T) => void;
  
  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    initialSize = 10
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      this.available.push(createFn());
    }
  }
  
  acquire(): T {
    return this.available.pop() ?? this.createFn();
  }
  
  release(obj: T): void {
    this.resetFn(obj);
    this.available.push(obj);
  }
}

// ✅ Usage for game objects
const messagePool = new ObjectPool(
  () => ({ content: '', playerId: '', timestamp: 0 }),
  (msg) => { msg.content = ''; msg.playerId = ''; msg.timestamp = 0; }
);
```

### Immutable Updates
```typescript
// ✅ Industry standard: Immutable update patterns
export const ImmutableUtils = {
  updateProperty<T, K extends keyof T>(
    obj: T,
    key: K,
    value: T[K]
  ): T {
    return { ...obj, [key]: value };
  },
  
  updateNested<T>(
    obj: T,
    path: string[],
    value: unknown
  ): T {
    if (path.length === 0) return value as T;
    
    const [head, ...tail] = path;
    return {
      ...obj,
      [head]: this.updateNested((obj as any)[head] ?? {}, tail, value)
    };
  },
  
  addToArray<T>(array: readonly T[], item: T): readonly T[] {
    return [...array, item];
  },
  
  removeFromArray<T>(array: readonly T[], predicate: (item: T) => boolean): readonly T[] {
    return array.filter(item => !predicate(item));
  }
};
```

These TypeScript patterns follow industry standards and provide type safety, maintainability, and performance for our MUD implementation.